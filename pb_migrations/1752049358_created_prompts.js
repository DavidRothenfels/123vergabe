/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Check if prompts collection already exists
  let existingCollection = null;
  try {
    existingCollection = app.findCollectionByNameOrId("prompts");
  } catch (e) {
    // Collection doesn't exist, which is fine
  }

  if (existingCollection) {
    console.log("prompts collection already exists, skipping creation");
    return;
  }

  const collection = new Collection({
    "name": "prompts",
    "type": "base",
    "system": false,
    "fields": [
      {
        "name": "text",
        "type": "text",
        "required": true,
        "options": {
          "min": 1,
          "max": 10000,
          "pattern": ""
        }
      },
      {
        "name": "result",
        "type": "text",
        "required": false,
        "options": {
          "min": null,
          "max": null,
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
        "name": "model",
        "type": "text",
        "required": false,
        "options": {
          "min": null,
          "max": null,
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

  return app.save(collection);
}, (app) => {
  // Rollback: delete the prompts collection
  try {
    const collection = app.findCollectionByNameOrId("prompts");
    return app.delete(collection);
  } catch (e) {
    console.log("prompts collection not found during rollback");
  }
})
