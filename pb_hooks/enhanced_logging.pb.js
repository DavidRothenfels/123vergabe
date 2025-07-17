/// <reference path="../pb_data/types.d.ts" />

console.log("🔧 Loading enhanced logging system...")

// Log levels
const LOG_LEVELS = {
    DEBUG: 'debug',
    INFO: 'info', 
    WARN: 'warn',
    ERROR: 'error'
}

// Error types
const ERROR_TYPES = {
    CLI_ERROR: 'cli_error',
    POCKETBASE_ERROR: 'pocketbase_error',
    OPENCODE_ERROR: 'opencode_error',
    DATABASE_ERROR: 'database_error',
    NETWORK_ERROR: 'network_error',
    VALIDATION_ERROR: 'validation_error'
}

// Severity levels
const SEVERITY_LEVELS = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
}

/**
 * Enhanced logging function with 24h auto-deletion
 */
function createLog(message, level = LOG_LEVELS.INFO, source = 'pocketbase', context = {}) {
    try {
        const collection = $app.dao().findCollectionByNameOrId("logs")
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + 24) // 24 hours from now
        
        const record = new Record(collection, {
            "message": message,
            "level": level,
            "source": source,
            "request_id": context.request_id || null,
            "user_id": context.user_id || null,
            "error_details": context.error_details ? JSON.stringify(context.error_details) : null,
            "stack_trace": context.stack_trace || null,
            "expires_at": expiresAt.toISOString()
        })
        
        $app.dao().saveRecord(record)
        
        // Also log to console with emoji for visibility
        const emoji = level === LOG_LEVELS.ERROR ? '❌' : 
                     level === LOG_LEVELS.WARN ? '⚠️' : 
                     level === LOG_LEVELS.DEBUG ? '🔍' : '📝'
        console.log(`${emoji} [${level.toUpperCase()}] [${source}] ${message}`)
        
        return record.id
    } catch (error) {
        console.error("❌ Failed to create log:", error.message)
        return null
    }
}

/**
 * Create detailed error log with context
 */
function createErrorLog(errorType, errorMessage, context = {}) {
    try {
        const collection = $app.dao().findCollectionByNameOrId("error_logs")
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + 24) // 24 hours from now
        
        const record = new Record(collection, {
            "error_type": errorType,
            "error_message": errorMessage,
            "error_context": context.error_context ? JSON.stringify(context.error_context) : null,
            "stack_trace": context.stack_trace || null,
            "source_file": context.source_file || null,
            "line_number": context.line_number || null,
            "request_id": context.request_id || null,
            "user_id": context.user_id || null,
            "severity": context.severity || SEVERITY_LEVELS.MEDIUM,
            "resolved": false,
            "expires_at": expiresAt.toISOString()
        })
        
        $app.dao().saveRecord(record)
        
        // Also create regular log entry
        createLog(`ERROR: ${errorMessage}`, LOG_LEVELS.ERROR, context.source || 'pocketbase', {
            request_id: context.request_id,
            user_id: context.user_id,
            error_details: { type: errorType, severity: context.severity }
        })
        
        console.error(`🚨 [ERROR LOG] ${errorType}: ${errorMessage}`)
        
        return record.id
    } catch (error) {
        console.error("❌ Failed to create error log:", error.message)
        return null
    }
}

/**
 * Create performance log entry
 */
function createPerformanceLog(operation, durationMs, source, success = true, context = {}) {
    try {
        const collection = $app.dao().findCollectionByNameOrId("performance_logs")
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + 24) // 24 hours from now
        
        const record = new Record(collection, {
            "operation": operation,
            "duration_ms": durationMs,
            "source": source,
            "metadata": context.metadata ? JSON.stringify(context.metadata) : null,
            "request_id": context.request_id || null,
            "user_id": context.user_id || null,
            "success": success,
            "expires_at": expiresAt.toISOString()
        })
        
        $app.dao().saveRecord(record)
        
        const emoji = success ? '⚡' : '🐌'
        console.log(`${emoji} [PERF] ${operation}: ${durationMs}ms (${success ? 'success' : 'failed'})`)
        
        return record.id
    } catch (error) {
        console.error("❌ Failed to create performance log:", error.message)
        return null
    }
}

/**
 * Clean up expired logs (runs every hour)
 */
function cleanupExpiredLogs() {
    try {
        const now = new Date().toISOString()
        const collections = ['logs', 'error_logs', 'performance_logs']
        let totalDeleted = 0
        
        collections.forEach(collectionName => {
            try {
                const collection = $app.dao().findCollectionByNameOrId(collectionName)
                const expiredRecords = $app.dao().findRecordsByExpr(
                    collectionName, 
                    $dbx.exp("expires_at < {:now}", { now })
                )
                
                expiredRecords.forEach(record => {
                    try {
                        $app.dao().deleteRecord(record)
                        totalDeleted++
                    } catch (deleteError) {
                        console.error(`❌ Failed to delete expired log ${record.id}:`, deleteError.message)
                    }
                })
                
                if (expiredRecords.length > 0) {
                    console.log(`🗑️ Deleted ${expiredRecords.length} expired logs from ${collectionName}`)
                }
            } catch (collectionError) {
                console.error(`❌ Error cleaning up ${collectionName}:`, collectionError.message)
            }
        })
        
        if (totalDeleted > 0) {
            createLog(`Cleaned up ${totalDeleted} expired log entries`, LOG_LEVELS.INFO, 'log_cleanup')
        }
        
        return totalDeleted
    } catch (error) {
        console.error("❌ Error in log cleanup:", error.message)
        createErrorLog(ERROR_TYPES.POCKETBASE_ERROR, `Log cleanup failed: ${error.message}`, {
            severity: SEVERITY_LEVELS.HIGH,
            source: 'log_cleanup',
            stack_trace: error.stack
        })
        return 0
    }
}

// Enhanced error handling for all record operations
onRecordCreateRequest((e) => {
    const startTime = Date.now()
    
    e.next()
    
    const duration = Date.now() - startTime
    
    // Log successful record creation
    createLog(`Record created in ${e.collection.name}`, LOG_LEVELS.INFO, 'pocketbase', {
        request_id: e.record.id,
        user_id: e.auth?.id || null
    })
    
    // Log performance
    createPerformanceLog(`create_${e.collection.name}`, duration, 'pocketbase', true, {
        request_id: e.record.id,
        user_id: e.auth?.id || null,
        metadata: { collection: e.collection.name }
    })
})

onRecordUpdateRequest((e) => {
    const startTime = Date.now()
    
    e.next()
    
    const duration = Date.now() - startTime
    
    // Log successful record update
    createLog(`Record updated in ${e.collection.name}`, LOG_LEVELS.INFO, 'pocketbase', {
        request_id: e.record.id,
        user_id: e.auth?.id || null
    })
    
    // Log performance
    createPerformanceLog(`update_${e.collection.name}`, duration, 'pocketbase', true, {
        request_id: e.record.id,
        user_id: e.auth?.id || null,
        metadata: { collection: e.collection.name }
    })
})

onRecordDeleteRequest((e) => {
    const startTime = Date.now()
    
    e.next()
    
    const duration = Date.now() - startTime
    
    // Log successful record deletion
    createLog(`Record deleted from ${e.collection.name}`, LOG_LEVELS.INFO, 'pocketbase', {
        request_id: e.record.id,
        user_id: e.auth?.id || null
    })
    
    // Log performance
    createPerformanceLog(`delete_${e.collection.name}`, duration, 'pocketbase', true, {
        request_id: e.record.id,
        user_id: e.auth?.id || null,
        metadata: { collection: e.collection.name }
    })
})

// Global error handler for PocketBase operations
function handlePocketBaseError(error, operation, context = {}) {
    createErrorLog(ERROR_TYPES.POCKETBASE_ERROR, `${operation}: ${error.message}`, {
        severity: SEVERITY_LEVELS.HIGH,
        source: 'pocketbase',
        stack_trace: error.stack,
        error_context: context,
        request_id: context.request_id,
        user_id: context.user_id
    })
}

// Set up log cleanup job (runs every hour)
let logCleanupInterval
onBootstrap((e) => {
    e.next()
    
    createLog("Enhanced logging system initialized", LOG_LEVELS.INFO, 'pocketbase')
    
    // Set up periodic log cleanup (every hour)
    if (logCleanupInterval) {
        clearInterval(logCleanupInterval)
    }
    
    logCleanupInterval = setInterval(() => {
        cleanupExpiredLogs()
    }, 3600000) // 1 hour = 3600000 ms
    
    console.log("✅ Log cleanup job scheduled (every hour)")
})

// Export logging functions for use in other hooks
globalThis.createLog = createLog
globalThis.createErrorLog = createErrorLog
globalThis.createPerformanceLog = createPerformanceLog
globalThis.handlePocketBaseError = handlePocketBaseError
globalThis.LOG_LEVELS = LOG_LEVELS
globalThis.ERROR_TYPES = ERROR_TYPES
globalThis.SEVERITY_LEVELS = SEVERITY_LEVELS

console.log("✅ Enhanced logging system loaded")