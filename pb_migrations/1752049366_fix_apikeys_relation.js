/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("apikeys");
  
  // Fix the relation field to have maxSelect = 1
  const userField = collection.findFieldByName("user");
  if (userField) {
    userField.options.maxSelect = 1;
    userField.options.minSelect = 1;
  }
  
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("apikeys");
  
  // Rollback: restore original maxSelect value
  const userField = collection.findFieldByName("user");
  if (userField) {
    userField.options.maxSelect = 2147483647;
    userField.options.minSelect = 0;
  }
  
  return app.save(collection);
});