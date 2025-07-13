/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  console.log("🔧 Creating documents collection (final)...")
  
  const documentsCollection = new Collection({
    type: "base",
    name: "documents", 
    listRule: "@request.auth.id != '' && user_id = @request.auth.id",
    viewRule: "@request.auth.id != '' && user_id = @request.auth.id",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != '' && user_id = @request.auth.id", 
    deleteRule: "@request.auth.id != '' && user_id = @request.auth.id",
    fields: [
      {
        name: "title",
        type: "text",
        required: true
      },
      {
        name: "content", 
        type: "text",
        required: true
      },
      {
        name: "user_id",
        type: "text",
        required: false
      },
      {
        name: "document_type",
        type: "text",
        required: false
      },
      {
        name: "type",
        type: "text", 
        required: false
      },
      {
        name: "project_id",
        type: "text",
        required: false
      },
      {
        name: "request_id",
        type: "text",
        required: false
      },
      {
        name: "created_by",
        type: "text",
        required: false
      },
      {
        name: "generated_by_ai",
        type: "bool",
        required: false
      }
    ]
  })
  
  app.save(documentsCollection)
  console.log("✅ Documents collection created successfully!")
  
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("documents")
    app.delete(collection)
  } catch (e) {}
})