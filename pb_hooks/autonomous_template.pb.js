/// <reference path="../pb_data/types.d.ts" />

console.log("🔧 Loading autonomous_template.pb.js...")

// Hook for project creation to automatically create bedarf entry
onRecordCreateRequest((e) => {
    e.next() // KRITISCH - muss zuerst kommen!
    
    if (e.collection.name === "projects") {
        const startTime = Date.now()
        console.log("✅ Project created, setting up bedarf workflow:", e.record.id)
        
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
            
            // Create bedarf entry for this project
            const bedarfCollection = $app.dao().findCollectionByNameOrId("bedarf")
            if (bedarfCollection) {
                const bedarfRecord = new Record(bedarfCollection, {
                    "project_id": projectId,
                    "user_id": userId,
                    "initial_description": `${projectName}: ${description}`,
                    "status": "draft",
                    "ai_provider": "openrouter"
                })
                $app.dao().saveRecord(bedarfRecord)
                console.log("✅ Bedarf entry created for project:", bedarfRecord.id)
                
                // Create log entry
                const logsCollection = $app.dao().findCollectionByNameOrId("logs")
                const logRecord = new Record(logsCollection, {
                    "message": `Bedarf workflow initialized for project ${projectName}`,
                    "level": "info",
                    "request_id": projectId
                })
                $app.dao().saveRecord(logRecord)
            } else {
                console.log("⚠️ bedarf collection not found, skipping")
                if (typeof createLog === 'function') {
                    createLog("bedarf collection not found during project creation", LOG_LEVELS.WARN, 'pocketbase', {
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
                    source_file: 'autonomous_template.pb.js',
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

// Hook for direct template-based document generation (legacy support)
onRecordCreateRequest((e) => {
    e.next()
    
    if (e.collection.name === "generation_requests") {
        const startTime = Date.now()
        console.log("✅ Generation request created:", e.record.id)
        
        try {
            // Enhanced logging
            if (typeof createLog === 'function') {
                createLog(`Generation request received ${e.record.id}`, LOG_LEVELS.INFO, 'pocketbase', {
                    request_id: e.record.id,
                    user_id: e.auth?.id || null
                })
            }
            
            // Update status to processing
            e.record.set("status", "processing")
            $app.dao().saveRecord(e.record)
            
            // Create log entry
            const logsCollection = $app.dao().findCollectionByNameOrId("logs")
            const logRecord = new Record(logsCollection, {
                "message": `Template-based generation initiated for request ${e.record.id}`,
                "level": "info",
                "request_id": e.record.id
            })
            $app.dao().saveRecord(logRecord)
            
            // Note: Actual document generation should be handled through the bedarf workflow
            // This hook is kept for backward compatibility
            
            const duration = Date.now() - startTime
            console.log("🎉 Generation request processed")
            
            // Performance logging
            if (typeof createPerformanceLog === 'function') {
                createPerformanceLog('generation_request_hook', duration, true, {
                    request_id: e.record.id,
                    user_id: e.auth?.id || null
                })
            }
            
        } catch (error) {
            const duration = Date.now() - startTime
            console.error("❌ Error in generation request hook:", error.message)
            
            // Enhanced error logging
            if (typeof createErrorLog === 'function') {
                createErrorLog(ERROR_TYPES.POCKETBASE_ERROR, `Generation request hook error: ${error.message}`, {
                    severity: SEVERITY_LEVELS.HIGH,
                    stack_trace: error.stack,
                    request_id: e.record.id,
                    user_id: e.auth?.id || null,
                    source_file: 'autonomous_template.pb.js',
                    error_context: { collection: e.collection.name }
                })
            }
            
            // Performance logging for failed operation
            if (typeof createPerformanceLog === 'function') {
                createPerformanceLog('generation_request_hook', duration, false, {
                    request_id: e.record.id,
                    user_id: e.auth?.id || null,
                    metadata: { error: error.message }
                })
            }
        }
    }
})

console.log("✅ Autonomous template hooks registered")