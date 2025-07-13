/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  console.log("🔧 Simplifying documents collection rules...")
  
  try {
    const collection = app.findCollectionByNameOrId("documents")
    
    // Simplified rules - users can only see their own documents
    collection.listRule = "@request.auth.id != \"\" && created_by = @request.auth.id"
    collection.viewRule = "@request.auth.id != \"\" && created_by = @request.auth.id"
    collection.createRule = "@request.auth.id != \"\""
    collection.updateRule = "@request.auth.id != \"\" && created_by = @request.auth.id"
    collection.deleteRule = "@request.auth.id != \"\" && created_by = @request.auth.id"
    
    app.save(collection)
    console.log("✅ Documents collection rules simplified!")
  } catch (e) {
    console.error("❌ Error simplifying rules:", e)
  }
  
}, (app) => {
  // No rollback needed
})