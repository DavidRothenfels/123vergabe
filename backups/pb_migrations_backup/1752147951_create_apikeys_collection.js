/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Check if apikeys collection already exists
  let existingCollection = null;
  try {
    existingCollection = app.findCollectionByNameOrId("apikeys");
  } catch (e) {
    // Collection doesn't exist, which is fine
  }

  if (existingCollection) {
    console.log("apikeys collection already exists, skipping creation");
    return;
  }

  const collection = new Collection({
    "name": "apikeys",
    "type": "base",
    "system": false,
    "fields": [
      {
        "name": "user",
        "type": "text",
        "required": true,
        "options": {
          "min": 1,
          "max": 50,
          "pattern": ""
        }
      },
      {
        "name": "key",
        "type": "text",
        "required": true,
        "options": {
          "min": 10,
          "max": 200,
          "pattern": ""
        }
      }
    ],
    "indexes": [],
    "listRule": "@request.auth.id != '' && user = @request.auth.id",
    "viewRule": "@request.auth.id != '' && user = @request.auth.id", 
    "createRule": "@request.auth.id != '' && user = @request.auth.id",
    "updateRule": "@request.auth.id != '' && user = @request.auth.id",
    "deleteRule": "@request.auth.id != '' && user = @request.auth.id"
  });

  return app.save(collection);
}, (app) => {
  // Rollback: delete the apikeys collection
  try {
    const collection = app.findCollectionByNameOrId("apikeys");
    return app.delete(collection);
  } catch (e) {
    console.log("apikeys collection not found during rollback");
  }
});