/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  console.log("🔧 Setting simple auth rules for documents collection...")
  
  try {
    const collection = app.findCollectionByNameOrId("documents")
    
    // User-specific rules - users can only see their own documents
    collection.listRule = "@request.auth.id != \"\" && created_by = @request.auth.id"
    collection.viewRule = "@request.auth.id != \"\" && created_by = @request.auth.id"
    collection.createRule = "@request.auth.id != \"\""
    collection.updateRule = "@request.auth.id != \"\" && created_by = @request.auth.id"
    collection.deleteRule = "@request.auth.id != \"\" && created_by = @request.auth.id"
    
    app.save(collection)
    console.log("✅ Documents collection rules set to simple auth!")
    
  } catch (e) {
    console.error("❌ Error setting rules:", e)
  }
  
}, (app) => {
  // No rollback needed
})