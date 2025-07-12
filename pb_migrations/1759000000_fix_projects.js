/// <reference path="../pb_data/types.d.ts" />

/**
 * Fix Projects Collection - Make request_id optional
 * Fix Frontend Dialog Issues
 */

migrate((app) => {
  console.log("🔧 Fixing projects collection...")
  
  try {
    // Get existing projects collection
    const projectsCollection = app.findCollectionByNameOrId("projects")
    
    // Find and update the request_id field
    const requestIdField = projectsCollection.schema.findIndex(field => field.name === "request_id")
    if (requestIdField !== -1) {
      // Make request_id optional
      projectsCollection.schema[requestIdField].required = false
      
      // Save the updated collection
      app.dao().saveCollection(projectsCollection)
      console.log("✅ Projects collection updated - request_id is now optional")
    } else {
      console.log("ℹ️ request_id field not found in projects collection")
    }
    
    // Also check if we need to update collection rules
    if (projectsCollection.listRule !== "@request.auth.id = user_id") {
      projectsCollection.listRule = "@request.auth.id = user_id"
      projectsCollection.viewRule = "@request.auth.id = user_id"
      projectsCollection.createRule = "@request.auth.id != ''"
      projectsCollection.updateRule = "@request.auth.id = user_id"
      projectsCollection.deleteRule = "@request.auth.id = user_id"
      
      app.dao().saveCollection(projectsCollection)
      console.log("✅ Projects collection rules updated")
    }
    
  } catch (error) {
    console.log("❌ Failed to fix projects collection:", error.message)
  }
  
  console.log("🎉 Projects collection fix completed")

}, (app) => {
  console.log("🔄 Rolling back projects collection fix...")
  // Rollback not needed for this fix
  console.log("🔄 Rollback completed")
})