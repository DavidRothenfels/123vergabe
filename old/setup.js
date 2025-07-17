const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

// PocketBase DB direkt erstellen
const db = new sqlite3.Database('./pb_data/data.db');

// Admin erstellen
db.run(`
  INSERT OR REPLACE INTO _admins (id, email, passwordHash, tokenKey, created, updated)
  VALUES (
    'admin123',
    'admin@test.com',
    '$2a$10$vI1.k9Z8qjRvELrxm/zEKOUVf7Yb7.YiTVo8XqJvSzjdN5oY2zxZm',
    'admin_token_key_123',
    datetime('now'),
    datetime('now')
  )
`);

// Collections erstellen
const collections = [
  {
    id: 'prompts123',
    name: 'prompts',
    type: 'base',
    system: false,
    schema: [
      {name: 'text', type: 'text', required: true},
      {name: 'result', type: 'text', required: false},
      {name: 'user', type: 'relation', required: true, options: {collectionId: 'users123'}},
      {name: 'model', type: 'text', required: false}
    ]
  },
  {
    id: 'apikeys123',
    name: 'apikeys',
    type: 'base',
    system: false,
    schema: [
      {name: 'user', type: 'relation', required: true, options: {collectionId: 'users123'}},
      {name: 'key', type: 'text', required: true}
    ]
  }
];

collections.forEach(col => {
  db.run(`
    INSERT OR REPLACE INTO _collections (id, name, type, system, schema, created, updated)
    VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `, [col.id, col.name, col.type, col.system, JSON.stringify(col.schema)]);
});

// Test User erstellen
db.run(`
  INSERT OR REPLACE INTO users (id, email, username, passwordHash, tokenKey, verified, created, updated)
  VALUES (
    'user123',
    'test@vergabe.de',
    'testuser',
    '$2a$10$vI1.k9Z8qjRvELrxm/zEKOUVf7Yb7.YiTVo8XqJvSzjdN5oY2zxZm',
    'user_token_key_123',
    1,
    datetime('now'),
    datetime('now')
  )
`);

// Test API Key
db.run(`
  INSERT OR REPLACE INTO apikeys (id, user, key, created, updated)
  VALUES (
    'key123',
    'user123',
    'sk-test-key-123',
    datetime('now'),
    datetime('now')
  )
`);

db.close();
console.log('✅ PocketBase DB Setup komplett!');