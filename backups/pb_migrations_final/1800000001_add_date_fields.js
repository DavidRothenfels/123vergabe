/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  console.log("🔧 Adding created/updated fields to documents collection...")
  
  try {
    const collection = app.findCollectionByNameOrId("documents")
    
    // Check if fields already exist
    const hasCreated = collection.fields.find(f => f.name === "created")
    const hasUpdated = collection.fields.find(f => f.name === "updated")
    
    if (!hasCreated) {
      collection.fields.push({
        name: "created",
        type: "autodate",
        onCreate: true,
        onUpdate: false
      })
      console.log("✅ Added created field")
    }
    
    if (!hasUpdated) {
      collection.fields.push({
        name: "updated",
        type: "autodate",
        onCreate: true,
        onUpdate: true
      })
      console.log("✅ Added updated field")
    }
    
    app.save(collection)
    console.log("✅ Documents collection updated with date fields!")
    
  } catch (e) {
    console.error("❌ Error adding date fields:", e)
  }
  
}, (app) => {
  // No rollback needed
})