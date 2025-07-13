/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  console.log("🔧 Fixing documents collection rules...")
  
  try {
    const collection = app.findCollectionByNameOrId("documents")
    
    // Set proper API rules
    collection.listRule = "@request.auth.id != \"\" && user_id = @request.auth.id"
    collection.viewRule = "@request.auth.id != \"\" && user_id = @request.auth.id"
    collection.createRule = "@request.auth.id != \"\""
    collection.updateRule = "@request.auth.id != \"\" && user_id = @request.auth.id"
    collection.deleteRule = "@request.auth.id != \"\" && user_id = @request.auth.id"
    
    app.save(collection)
    console.log("✅ Documents collection rules fixed!")
  } catch (e) {
    console.error("❌ Error fixing rules:", e)
  }
  
}, (app) => {
  // No rollback needed
})