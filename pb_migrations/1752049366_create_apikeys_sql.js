/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Create the apikeys table directly
  const query = `
    CREATE TABLE IF NOT EXISTS apikeys (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
      user TEXT NOT NULL,
      key TEXT NOT NULL,
      created DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user) REFERENCES _pb_users_auth_(id) ON DELETE CASCADE
    )
  `;
  
  app.dao().db().newQuery(query).execute();
  
  // Add to collections table
  const collection = new Collection({
    "id": "6ljjj6g5wydjx6f",
    "name": "apikeys",
    "type": "base",
    "system": false,
    "fields": [
      {
        "system": false,
        "id": "qo1chczg",
        "name": "user",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": false,
          "minSelect": 1,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "g3uy7xed",
        "name": "key",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      }
    ],
    "indexes": [],
    "listRule": "@request.auth.id != '' && user = @request.auth.id",
    "viewRule": "@request.auth.id != '' && user = @request.auth.id",
    "createRule": "@request.auth.id != '' && user = @request.auth.id",
    "updateRule": "@request.auth.id != '' && user = @request.auth.id",
    "deleteRule": "@request.auth.id != '' && user = @request.auth.id",
    "options": {}
  });

  return app.save(collection);
}, (app) => {
  // Drop the table
  app.dao().db().newQuery("DROP TABLE IF EXISTS apikeys").execute();
  
  // Remove from collections
  const collection = app.findCollectionByNameOrId("6ljjj6g5wydjx6f");
  if (collection) {
    return app.delete(collection);
  }
});