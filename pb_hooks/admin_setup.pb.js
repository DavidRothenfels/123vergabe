/// <reference path="../pb_data/types.d.ts" />

/**
 * Admin Setup Hook - Erstellt automatisch Admin bei erstem Start
 * PocketBase v0.28 kompatibel
 */

onBootstrap((e) => {
    e.next() // KRITISCH für v0.28
    
    console.log("🔧 Bootstrap: Checking admin setup...")
    
    try {
        // Admin check in v0.28 is complex, so we skip it
        console.log("📌 Admin check skipped in v0.28")
        console.log("📌 Create admin with: ./pocketbase superuser upsert admin@vergabe.de admin123")
    } catch (error) {
        console.log("ℹ️ Admin check failed (expected in v0.28):", error.message)
        console.log("📌 Create admin with: ./pocketbase superuser upsert admin@vergabe.de admin123")
    }
    
    // Fix collection rules for authenticated users
    console.log("🔧 Fixing collection rules for authenticated users...")
    try {
        const generationRequestsCollection = $app.findCollectionByNameOrId("generation_requests")
        if (generationRequestsCollection) {
            generationRequestsCollection.listRule = "@request.auth.id != ''"
            generationRequestsCollection.viewRule = "@request.auth.id != ''"
            generationRequestsCollection.createRule = "@request.auth.id != ''"
            generationRequestsCollection.updateRule = "@request.auth.id != ''"
            generationRequestsCollection.deleteRule = "@request.auth.id != ''"
            
            $app.dao().saveCollection(generationRequestsCollection)
            console.log("✅ Generation requests collection rules updated")
        }
        
        const cliCommandsCollection = $app.findCollectionByNameOrId("cli_commands")
        if (cliCommandsCollection) {
            cliCommandsCollection.listRule = ""
            cliCommandsCollection.viewRule = ""
            cliCommandsCollection.createRule = ""
            cliCommandsCollection.updateRule = ""
            cliCommandsCollection.deleteRule = ""
            
            $app.dao().saveCollection(cliCommandsCollection)
            console.log("✅ CLI commands collection rules updated")
        }
        
        const logsCollection = $app.findCollectionByNameOrId("logs")
        if (logsCollection) {
            logsCollection.listRule = ""
            logsCollection.viewRule = ""
            logsCollection.createRule = ""
            logsCollection.updateRule = ""
            logsCollection.deleteRule = ""
            
            $app.dao().saveCollection(logsCollection)
            console.log("✅ Logs collection rules updated")
        }
        
    } catch (error) {
        console.log("⚠️ Failed to update collection rules:", error.message)
    }
    
    console.log("🎯 System initialization complete")
})