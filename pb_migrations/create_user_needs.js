/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
    // Check if user_needs collection exists
    let userNeedsCollection = null
    try {
        userNeedsCollection = app.findCollectionByNameOrId("user_needs")
    } catch (e) {
        // Collection doesn't exist
    }

    if (!userNeedsCollection) {
        // Create user_needs collection
        const collection = new Collection({
            name: "user_needs",
            type: "base",
            listRule: "@request.auth.id = user_id",
            viewRule: "@request.auth.id = user_id",
            createRule: "@request.auth.id != ''",
            updateRule: "@request.auth.id = user_id",
            deleteRule: "@request.auth.id = user_id",
            fields: [
                {
                    name: "user_id",
                    type: "relation",
                    required: true,
                    options: {
                        collectionId: "_pb_users_auth_",
                        cascadeDelete: true,
                        maxSelect: 1
                    }
                },
                {
                    name: "project_id",
                    type: "relation",
                    required: false,
                    options: {
                        collectionId: app.findCollectionByNameOrId("projects").id,
                        cascadeDelete: false,
                        maxSelect: 1
                    }
                },
                {
                    name: "thema",
                    type: "text",
                    required: true,
                    options: {
                        min: 1,
                        max: 500
                    }
                },
                {
                    name: "beschreibung",
                    type: "text",
                    required: false,
                    options: {
                        max: 5000
                    }
                },
                {
                    name: "status",
                    type: "select",
                    required: false,
                    options: {
                        maxSelect: 1,
                        values: ["created", "processing", "completed", "error", "draft", "questions_generated"]
                    }
                }
            ]
        })
        
        app.save(collection)
        console.log("Created user_needs collection")
    } else {
        console.log("user_needs collection already exists")
    }

}, (app) => {
    // Rollback
    try {
        const collection = app.findCollectionByNameOrId("user_needs")
        app.delete(collection)
    } catch (e) {
        // Collection doesn't exist
    }
})