/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  console.log("🔧 Creating clean documents collection...")
  
  try {
    // First check if collection exists and delete it
    try {
      const existing = app.findCollectionByNameOrId("documents")
      app.delete(existing)
      console.log("✅ Deleted existing documents collection")
    } catch (e) {
      // Collection doesn't exist, that's fine
    }
    
    // Find users collection for the relation - use the system users collection
    const usersCollection = app.findCollectionByNameOrId("_pb_users_auth_") || app.findCollectionByNameOrId("users")
    
    // Create documents collection with all fields
    const documentsCollection = new Collection({
      type: "base",
      name: "documents",
      listRule: "@request.auth.id != \"\" && created_by = @request.auth.id",
      viewRule: "@request.auth.id != \"\" && created_by = @request.auth.id",
      createRule: "@request.auth.id != \"\"",
      updateRule: "@request.auth.id != \"\" && created_by = @request.auth.id",
      deleteRule: "@request.auth.id != \"\" && created_by = @request.auth.id",
      fields: [
        {
          name: "title",
          type: "text",
          required: true,
          min: 1,
          max: 500
        },
        {
          name: "content",
          type: "text",
          required: true,
          min: 1,
          max: 100000
        },
        {
          name: "created_by",
          type: "text",
          required: true,
          max: 100
        },
        {
          name: "document_type",
          type: "text",
          required: false,
          max: 100
        },
        {
          name: "type",
          type: "text",
          required: false,
          max: 100
        },
        {
          name: "project_id",
          type: "text",
          required: false,
          max: 100
        },
        {
          name: "request_id",
          type: "text",
          required: false,
          max: 100
        },
        {
          name: "generated_by_ai",
          type: "bool",
          required: false
        },
        {
          name: "user_id",
          type: "text",
          required: false,
          max: 100
        },
        {
          name: "created",
          type: "autodate",
          onCreate: true,
          onUpdate: false
        },
        {
          name: "updated",
          type: "autodate",
          onCreate: true,
          onUpdate: true
        }
      ]
    })
    
    app.save(documentsCollection)
    console.log("✅ Documents collection created with all fields!")
    
  } catch (e) {
    console.error("❌ Error creating documents collection:", e)
    throw e
  }
  
}, (app) => {
  // Rollback
  try {
    const collection = app.findCollectionByNameOrId("documents")
    app.delete(collection)
  } catch (e) {
    // Already deleted
  }
})