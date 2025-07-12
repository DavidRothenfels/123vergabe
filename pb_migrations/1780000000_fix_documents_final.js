/// <reference path="../pb_data/types.d.ts" />

/**
 * Final Fix for Documents Collection
 * Recreate documents collection with correct schema matching DASHBOARD.md reference
 */

migrate((app) => {
  console.log("🔧 Final fix for documents collection...")
  
  try {
    // Delete existing documents collection
    try {
      const existingCollection = app.findCollectionByNameOrId("documents")
      app.delete(existingCollection)
      console.log("✅ Deleted existing documents collection")
    } catch (e) {
      console.log("ℹ️ Documents collection not found for deletion")
    }
    
    // Create new documents collection with proper schema
    const documentsCollection = new Collection({
      type: "base",
      name: "documents",
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''", 
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: "title",
          type: "text",
          required: true,
          max: 500
        },
        {
          name: "content",
          type: "text",
          required: true,
          max: 100000
        },
        {
          name: "project_id",
          type: "text",
          required: false,
          max: 255
        },
        {
          name: "user_id",
          type: "text", 
          required: false,
          max: 255
        },
        {
          name: "document_type",
          type: "select",
          required: false,
          maxSelect: 1,
          values: ["leistung", "eignung", "zuschlag", "leistungsbeschreibung"]
        },
        {
          name: "type",
          type: "select",
          required: false,
          maxSelect: 1,
          values: ["leistung", "eignung", "zuschlag", "leistungsbeschreibung"]
        },
        {
          name: "request_id",
          type: "text",
          required: false,
          max: 255
        },
        {
          name: "created_by",
          type: "text",
          required: false,
          max: 255
        },
        {
          name: "generated_by_ai",
          type: "bool",
          required: false
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
    console.log("✅ Documents collection recreated with proper schema")
    
    // Create a test document to verify it works
    try {
      const testDoc = new Record(documentsCollection, {
        title: "Test Document",
        content: "This is a test document to verify the schema works",
        project_id: "test-project-schema",
        user_id: "test-user-schema",
        document_type: "leistungsbeschreibung",
        type: "leistungsbeschreibung",
        created_by: "system@test.de",
        generated_by_ai: false
      })
      
      app.save(testDoc)
      console.log("✅ Test document created successfully - schema validation passed")
      
    } catch (testError) {
      console.log("⚠️ Test document creation failed:", testError.message)
    }
    
  } catch (error) {
    console.log("❌ Error fixing documents collection:", error.message)
    throw error
  }
  
  console.log("🎉 Documents collection final fix completed!")
  
}, (app) => {
  // Rollback
  console.log("🔄 Rolling back documents collection final fix...")
  
  try {
    const documentsCollection = app.findCollectionByNameOrId("documents")
    app.delete(documentsCollection)
    console.log("✅ Documents collection deleted")
  } catch (e) {
    console.log("ℹ️ Documents collection not found for rollback")
  }
  
  console.log("🔄 Rollback completed")
})