/// <reference path="../pb_data/types.d.ts" />

/**
 * Fix Documents Collection Schema
 * Add missing fields that are required by the frontend and CLI processor
 */

migrate((app) => {
  console.log("🔧 Fixing documents collection schema...")
  
  try {
    const documentsCollection = app.findCollectionByNameOrId("documents")
    console.log("✅ Found documents collection")
    
    // Add missing fields
    const newFields = [
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
        name: "generated_by_ai",
        type: "bool",
        required: false
      }
    ]
    
    // Add each new field using PocketBase v0.28 API
    newFields.forEach(field => {
      try {
        // Check if field already exists in the fields array
        const existingField = documentsCollection.fields.find(f => f.name === field.name)
        if (!existingField) {
          documentsCollection.fields.push(field)
          console.log(`✅ Added field: ${field.name}`)
        } else {
          console.log(`ℹ️ Field ${field.name} already exists`)
        }
      } catch (e) {
        console.log(`⚠️ Failed to add field ${field.name}:`, e.message)
      }
    })
    
    // Update collection rules to allow user access
    documentsCollection.listRule = "@request.auth.id != ''"
    documentsCollection.viewRule = "@request.auth.id != ''"
    documentsCollection.createRule = "@request.auth.id != ''"
    documentsCollection.updateRule = "@request.auth.id != ''"
    documentsCollection.deleteRule = "@request.auth.id != ''"
    
    // Save the updated collection
    app.save(documentsCollection)
    console.log("✅ Documents collection schema updated successfully")
    
  } catch (error) {
    console.log("❌ Error updating documents collection:", error.message)
    throw error
  }
  
  console.log("🎉 Documents schema fix completed!")
  
}, (app) => {
  // Rollback - remove the added fields
  console.log("🔄 Rolling back documents schema fix...")
  
  try {
    const documentsCollection = app.findCollectionByNameOrId("documents")
    
    // Remove the fields we added
    const fieldsToRemove = ["project_id", "user_id", "document_type", "generated_by_ai"]
    
    fieldsToRemove.forEach(fieldName => {
      try {
        const fieldIndex = documentsCollection.fields.findIndex(f => f.name === fieldName)
        if (fieldIndex > -1) {
          documentsCollection.fields.splice(fieldIndex, 1)
          console.log(`✅ Removed field: ${fieldName}`)
        }
      } catch (e) {
        console.log(`⚠️ Failed to remove field ${fieldName}:`, e.message)
      }
    })
    
    // Reset rules to original state
    documentsCollection.listRule = ""
    documentsCollection.viewRule = ""
    documentsCollection.createRule = ""
    documentsCollection.updateRule = ""
    documentsCollection.deleteRule = ""
    
    app.save(documentsCollection)
    console.log("✅ Documents collection rollback completed")
    
  } catch (error) {
    console.log("❌ Error rolling back documents collection:", error.message)
  }
  
  console.log("🔄 Rollback completed")
})