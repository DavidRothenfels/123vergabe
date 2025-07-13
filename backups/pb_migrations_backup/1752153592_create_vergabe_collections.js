/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // 1. Create projects collection
  let projectsCollection = null;
  try {
    projectsCollection = app.findCollectionByNameOrId("projects");
    console.log("projects collection already exists, skipping creation");
  } catch (e) {
    projectsCollection = new Collection({
      "name": "projects",
      "type": "base",
      "system": false,
      "fields": [
        {
          "name": "title",
          "type": "text",
          "required": true,
          "options": {
            "min": 1,
            "max": 200,
            "pattern": ""
          }
        },
        {
          "name": "description",
          "type": "text",
          "required": false,
          "options": {
            "min": null,
            "max": 2000,
            "pattern": ""
          }
        },
        {
          "name": "user_id",
          "type": "text",
          "required": true,
          "options": {
            "min": 1,
            "max": 50,
            "pattern": ""
          }
        },
        {
          "name": "status",
          "type": "text",
          "required": false,
          "options": {
            "min": null,
            "max": 20,
            "pattern": ""
          }
        }
      ],
      "indexes": [],
      "listRule": "@request.auth.id != '' && user_id = @request.auth.id",
      "viewRule": "@request.auth.id != '' && user_id = @request.auth.id",
      "createRule": "@request.auth.id != '' && user_id = @request.auth.id",
      "updateRule": "@request.auth.id != '' && user_id = @request.auth.id",
      "deleteRule": "@request.auth.id != '' && user_id = @request.auth.id"
    });
    app.save(projectsCollection);
    console.log("✅ Created projects collection");
  }

  // 2. Create documents collection  
  let documentsCollection = null;
  try {
    documentsCollection = app.findCollectionByNameOrId("documents");
    console.log("documents collection already exists, skipping creation");
  } catch (e) {
    documentsCollection = new Collection({
      "name": "documents",
      "type": "base",
      "system": false,
      "fields": [
        {
          "name": "title",
          "type": "text",
          "required": true,
          "options": {
            "min": 1,
            "max": 200,
            "pattern": ""
          }
        },
        {
          "name": "content",
          "type": "text",
          "required": false,
          "options": {
            "min": null,
            "max": null,
            "pattern": ""
          }
        },
        {
          "name": "project_id",
          "type": "text",
          "required": true,
          "options": {
            "min": 1,
            "max": 50,
            "pattern": ""
          }
        },
        {
          "name": "user_id",
          "type": "text",
          "required": true,
          "options": {
            "min": 1,
            "max": 50,
            "pattern": ""
          }
        },
        {
          "name": "document_type",
          "type": "text",
          "required": false,
          "options": {
            "min": null,
            "max": 50,
            "pattern": ""
          }
        },
        {
          "name": "generated_by_ai",
          "type": "bool",
          "required": false
        }
      ],
      "indexes": [],
      "listRule": "@request.auth.id != '' && user_id = @request.auth.id",
      "viewRule": "@request.auth.id != '' && user_id = @request.auth.id",
      "createRule": "@request.auth.id != '' && user_id = @request.auth.id",
      "updateRule": "@request.auth.id != '' && user_id = @request.auth.id",
      "deleteRule": "@request.auth.id != '' && user_id = @request.auth.id"
    });
    app.save(documentsCollection);
    console.log("✅ Created documents collection");
  }

  // 3. Create context collection
  let contextCollection = null;
  try {
    contextCollection = app.findCollectionByNameOrId("context");
    console.log("context collection already exists, skipping creation");
  } catch (e) {
    contextCollection = new Collection({
      "name": "context",
      "type": "base",
      "system": false,
      "fields": [
        {
          "name": "title",
          "type": "text",
          "required": true,
          "options": {
            "min": 1,
            "max": 200,
            "pattern": ""
          }
        },
        {
          "name": "content",
          "type": "text",
          "required": true,
          "options": {
            "min": 1,
            "max": null,
            "pattern": ""
          }
        },
        {
          "name": "project_id",
          "type": "text",
          "required": true,
          "options": {
            "min": 1,
            "max": 50,
            "pattern": ""
          }
        },
        {
          "name": "user_id",
          "type": "text",
          "required": true,
          "options": {
            "min": 1,
            "max": 50,
            "pattern": ""
          }
        }
      ],
      "indexes": [],
      "listRule": "@request.auth.id != '' && user_id = @request.auth.id",
      "viewRule": "@request.auth.id != '' && user_id = @request.auth.id",
      "createRule": "@request.auth.id != '' && user_id = @request.auth.id",
      "updateRule": "@request.auth.id != '' && user_id = @request.auth.id",
      "deleteRule": "@request.auth.id != '' && user_id = @request.auth.id"
    });
    app.save(contextCollection);
    console.log("✅ Created context collection");
  }

  // 4. Update existing prompts collection with new fields
  try {
    const promptsCollection = app.findCollectionByNameOrId("prompts");
    
    // Add version field if it doesn't exist
    let hasVersion = false;
    let hasTitle = false;
    
    promptsCollection.fields.forEach(field => {
      if (field.name === "version") hasVersion = true;
      if (field.name === "title") hasTitle = true;
    });

    if (!hasVersion) {
      promptsCollection.fields.push({
        "name": "version",
        "type": "text",
        "required": false,
        "options": {
          "min": null,
          "max": 20,
          "pattern": ""
        }
      });
    }

    if (!hasTitle) {
      promptsCollection.fields.push({
        "name": "title",
        "type": "text",
        "required": true,
        "options": {
          "min": 1,
          "max": 100,
          "pattern": ""
        }
      });
    }

    app.save(promptsCollection);
    console.log("✅ Updated prompts collection with title and version fields");
  } catch (e) {
    console.log("⚠️ Could not update prompts collection:", e.message);
  }

  return;
}, (app) => {
  // Rollback: delete the created collections
  const collections = ["projects", "documents", "context"];
  collections.forEach(name => {
    try {
      const collection = app.findCollectionByNameOrId(name);
      app.delete(collection);
      console.log(`✅ Deleted ${name} collection`);
    } catch (e) {
      console.log(`⚠️ Could not delete ${name} collection`);
    }
  });
});