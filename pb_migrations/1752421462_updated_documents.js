/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3332084752")

  // update field
  collection.fields.addAt(0, new Field({
    "autogeneratePattern": "[a-z0-9]{15}",
    "hidden": false,
    "id": "text3208210256",
    "max": 0,
    "min": 0,
    "name": "id",
    "pattern": "^[a-z0-9]+$",
    "presentable": false,
    "primaryKey": true,
    "required": true,
    "system": true,
    "type": "text"
  }))

  // update field
  collection.fields.addAt(2, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text_content",
    "max": 100000,
    "min": 0,
    "name": "content",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  // update field
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "autodate_created",
    "name": "created",
    "onCreate": true,
    "onUpdate": false,
    "presentable": false,
    "system": false,
    "type": "autodate"
  }))

  // update field
  collection.fields.addAt(11, new Field({
    "hidden": false,
    "id": "autodate_updated",
    "name": "updated",
    "onCreate": true,
    "onUpdate": false,
    "presentable": false,
    "system": false,
    "type": "autodate"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3332084752")

  // update field
  collection.fields.addAt(0, new Field({
    "autogeneratePattern": "[a-z0-9]{15}",
    "hidden": false,
    "id": "text3208210256",
    "max": 0,
    "min": 0,
    "name": "id",
    "pattern": "",
    "presentable": false,
    "primaryKey": true,
    "required": true,
    "system": true,
    "type": "text"
  }))

  // update field
  collection.fields.addAt(2, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text_content",
    "max": 0,
    "min": 0,
    "name": "content",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  // update field
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "autodate_created",
    "name": "created",
    "onCreate": false,
    "onUpdate": false,
    "presentable": false,
    "system": false,
    "type": "autodate"
  }))

  // update field
  collection.fields.addAt(11, new Field({
    "hidden": false,
    "id": "autodate_updated",
    "name": "updated",
    "onCreate": false,
    "onUpdate": false,
    "presentable": false,
    "system": false,
    "type": "autodate"
  }))

  return app.save(collection)
})
