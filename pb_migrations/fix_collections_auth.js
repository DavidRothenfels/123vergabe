/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
    // Fix projects collection rules
    const projectsCollection = app.findCollectionByNameOrId("projects")
    if (projectsCollection) {
        // Allow authenticated users to create projects
        projectsCollection.createRule = "@request.auth.id != ''"
        // Users can only see/edit their own projects
        projectsCollection.listRule = "@request.auth.id = user_id"
        projectsCollection.viewRule = "@request.auth.id = user_id"
        projectsCollection.updateRule = "@request.auth.id = user_id"
        projectsCollection.deleteRule = "@request.auth.id = user_id"
        app.save(projectsCollection)
        console.log("Fixed projects collection rules")
    }

    // Fix apikeys collection
    const apikeysCollection = app.findCollectionByNameOrId("apikeys")
    if (apikeysCollection) {
        // Allow authenticated users to create API keys
        apikeysCollection.createRule = "@request.auth.id != ''"
        // Users can only see/edit their own API keys
        apikeysCollection.listRule = "@request.auth.id = user_id"
        apikeysCollection.viewRule = "@request.auth.id = user_id"
        apikeysCollection.updateRule = "@request.auth.id = user_id"
        apikeysCollection.deleteRule = "@request.auth.id = user_id"
        app.save(apikeysCollection)
        console.log("Fixed apikeys collection rules")
    }

    // Ensure user_needs collection has correct field definition
    const userNeedsCollection = app.findCollectionByNameOrId("user_needs")
    if (userNeedsCollection) {
        // Find status field and update if needed
        const statusField = userNeedsCollection.fields.find(f => f.name === "status")
        if (statusField && statusField.options?.values) {
            // Ensure all needed status values are included
            const requiredStatuses = ["created", "processing", "completed", "error", "draft", "questions_generated"]
            const currentStatuses = statusField.options.values || []
            const missingStatuses = requiredStatuses.filter(s => !currentStatuses.includes(s))
            
            if (missingStatuses.length > 0) {
                statusField.options.values = [...currentStatuses, ...missingStatuses]
                app.save(userNeedsCollection)
                console.log("Added missing status values to user_needs collection")
            }
        }
    }

}, (app) => {
    // Rollback not needed for rule changes
    console.log("Rollback: fix_collections_auth")
})