/// <reference path="../pb_data/types.d.ts" />

console.log("🔧 Loading autonomous_fixed.pb.js...")

onRecordCreateRequest((e) => {
    e.next() // KRITISCH - muss zuerst kommen!
    
    if (e.collection.name === "generation_requests") {
        const startTime = Date.now()
        console.log("✅ Autonomous hook triggered for:", e.record.id)
        
        try {
            // Enhanced logging using global functions
            if (typeof createLog === 'function') {
                createLog(`Autonomous hook triggered for generation request ${e.record.id}`, LOG_LEVELS.INFO, 'pocketbase', {
                    request_id: e.record.id,
                    user_id: e.auth?.id || null
                })
            }
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
            
            const duration = Date.now() - startTime
            console.log("🎉 Autonomous processing initialized successfully")
            
            // Performance logging
            if (typeof createPerformanceLog === 'function') {
                createPerformanceLog('autonomous_hook_processing', duration, true, {
                    request_id: e.record.id,
                    user_id: e.auth?.id || null,
                    metadata: { user_need_id: userNeedId }
                })
            }
            
        } catch (error) {
            const duration = Date.now() - startTime
            console.error("❌ Error in autonomous hook:", error.message)
            
            // Enhanced error logging
            if (typeof createErrorLog === 'function') {
                createErrorLog(ERROR_TYPES.POCKETBASE_ERROR, `Autonomous hook error: ${error.message}`, {
                    severity: SEVERITY_LEVELS.HIGH,
                    stack_trace: error.stack,
                    request_id: e.record.id,
                    user_id: e.auth?.id || null,
                    source_file: 'autonomous_fixed.pb.js',
                    error_context: { collection: e.collection.name }
                })
            }
            
            // Performance logging for failed operation
            if (typeof createPerformanceLog === 'function') {
                createPerformanceLog('autonomous_hook_processing', duration, false, {
                    request_id: e.record.id,
                    user_id: e.auth?.id || null,
                    metadata: { error: error.message }
                })
            }
            
            // Fallback logging if enhanced logging not available
            try {
                const logsCollection = $app.dao().findCollectionByNameOrId("logs")
                const expiresAt = new Date()
                expiresAt.setHours(expiresAt.getHours() + 24)
                
                const errorRecord = new Record(logsCollection, {
                    "message": `Autonomous hook error: ${error.message}`,
                    "level": "error",
                    "source": "pocketbase",
                    "request_id": e.record.id,
                    "stack_trace": error.stack,
                    "expires_at": expiresAt.toISOString()
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
        const startTime = Date.now()
        console.log("✅ Project created, setting up generation workflow:", e.record.id)
        
        try {
            // Enhanced logging
            if (typeof createLog === 'function') {
                createLog(`Project creation hook triggered for ${e.record.id}`, LOG_LEVELS.INFO, 'pocketbase', {
                    request_id: e.record.id,
                    user_id: e.auth?.id || null
                })
            }
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
                if (typeof createLog === 'function') {
                    createLog("user_needs collection not found during project creation", LOG_LEVELS.WARN, 'pocketbase', {
                        request_id: e.record.id,
                        user_id: e.auth?.id || null
                    })
                }
            }
            
            const duration = Date.now() - startTime
            if (typeof createPerformanceLog === 'function') {
                createPerformanceLog('project_creation_hook', duration, true, {
                    request_id: e.record.id,
                    user_id: e.auth?.id || null,
                    metadata: { project_name: projectName }
                })
            }
            
        } catch (error) {
            const duration = Date.now() - startTime
            console.error("❌ Error in project creation hook:", error.message)
            
            // Enhanced error logging
            if (typeof createErrorLog === 'function') {
                createErrorLog(ERROR_TYPES.POCKETBASE_ERROR, `Project creation hook error: ${error.message}`, {
                    severity: SEVERITY_LEVELS.MEDIUM,
                    stack_trace: error.stack,
                    request_id: e.record.id,
                    user_id: e.auth?.id || null,
                    source_file: 'autonomous_fixed.pb.js',
                    error_context: { collection: e.collection.name, operation: 'project_creation' }
                })
            }
            
            if (typeof createPerformanceLog === 'function') {
                createPerformanceLog('project_creation_hook', duration, false, {
                    request_id: e.record.id,
                    user_id: e.auth?.id || null,
                    metadata: { error: error.message }
                })
            }
        }
    }
})

console.log("✅ Autonomous hooks registered")