/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("apikeys");

  // Only authenticated users can access their own records
  collection.listRule = "@request.auth.id != '' && user = @request.auth.id";
  collection.viewRule = "@request.auth.id != '' && user = @request.auth.id";
  collection.createRule = "@request.auth.id != '' && user = @request.auth.id";
  collection.updateRule = "@request.auth.id != '' && user = @request.auth.id";
  collection.deleteRule = "@request.auth.id != '' && user = @request.auth.id";

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("apikeys");

  // Rollback to no rules (security risk!)
  collection.listRule = null;
  collection.viewRule = null;
  collection.createRule = null;
  collection.updateRule = null;
  collection.deleteRule = null;

  return app.save(collection);
});