/// <reference path="../pb_data/types.d.ts" />

console.log("🔧 Loading autonomous_fixed.pb.js...")

onRecordCreateRequest((e) => {
    e.next() // KRITISCH - muss zuerst kommen!
    
    if (e.collection.name === "generation_requests") {
        console.log("✅ Autonomous hook triggered for:", e.record.id)
        
        try {
            // Get the request details
            const requestId = e.record.id
            const userNeedId = e.record.get("user_need_id")
            const status = e.record.get("status") || "pending"
            
            console.log("📝 Processing generation request:", {
                id: requestId,
                user_need_id: userNeedId,
                status: status
            })
            
            // Create a CLI command for background processing
            const cliCollection = $app.dao().findCollectionByNameOrId("cli_commands")
            const cliRecord = new Record(cliCollection, {
                "command": "generate_documents",
                "status": "pending",
                "parameters": JSON.stringify({
                    "request_id": requestId,
                    "user_need_id": userNeedId,
                    "created_at": new Date().toISOString()
                }),
                "retry_count": 0
            })
            
            $app.dao().saveRecord(cliRecord)
            console.log("✅ CLI command created:", cliRecord.id)
            
            // Update generation request status
            e.record.set("status", "processing")
            $app.dao().saveRecord(e.record)
            
            // Create a log entry
            const logsCollection = $app.dao().findCollectionByNameOrId("logs")
            const logRecord = new Record(logsCollection, {
                "message": `Autonomous generation started for request ${requestId}`,
                "level": "info",
                "request_id": requestId
            })
            $app.dao().saveRecord(logRecord)
            
            console.log("🎉 Autonomous processing initialized successfully")
            
        } catch (error) {
            console.error("❌ Error in autonomous hook:", error.message)
            
            // Log the error
            try {
                const logsCollection = $app.dao().findCollectionByNameOrId("logs")
                const errorRecord = new Record(logsCollection, {
                    "message": `Autonomous hook error: ${error.message}`,
                    "level": "error",
                    "request_id": e.record.id
                })
                $app.dao().saveRecord(errorRecord)
            } catch (logError) {
                console.error("❌ Failed to log error:", logError.message)
            }
        }
    }
})

// Hook for project creation to automatically create user needs
onRecordCreateRequest((e) => {
    e.next() // KRITISCH - muss zuerst kommen!
    
    if (e.collection.name === "projects") {
        console.log("✅ Project created, setting up generation workflow:", e.record.id)
        
        try {
            const projectId = e.record.id
            const projectName = e.record.get("name")
            const description = e.record.get("description") || ""
            const userId = e.record.get("user_id")
            
            // Create user need entry for this project
            const userNeedsCollection = $app.dao().findCollectionByNameOrId("user_needs")
            if (userNeedsCollection) {
                const userNeedRecord = new Record(userNeedsCollection, {
                    "project_id": projectId,
                    "user_id": userId,
                    "thema": projectName,
                    "beschreibung": description,
                    "status": "created"
                })
                $app.dao().saveRecord(userNeedRecord)
                console.log("✅ User need created for project:", userNeedRecord.id)
            } else {
                console.log("⚠️ user_needs collection not found, skipping")
            }
            
        } catch (error) {
            console.error("❌ Error in project creation hook:", error.message)
        }
    }
})

console.log("✅ Autonomous hooks registered")