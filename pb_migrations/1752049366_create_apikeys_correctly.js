/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
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
  const collection = app.findCollectionByNameOrId("6ljjj6g5wydjx6f");
  return app.delete(collection);
});