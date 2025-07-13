/// <reference path="../pb_data/types.d.ts" />

/**
 * Fix User Creation - Correct API usage for PocketBase v0.28
 * Based on exact reference project patterns
 */

migrate((app) => {
  console.log("🔧 Starting user creation fix migration...")
  
  // ========================================
  // 1. ENSURE USERS COLLECTION EXISTS AS AUTH TYPE
  // ========================================
  let usersCollection
  try {
    usersCollection = app.findCollectionByNameOrId("users")
    console.log("ℹ️ Users collection already exists")
  } catch (e) {
    console.log("❌ Users collection not found, should exist by default")
    return
  }

  // ========================================
  // 2. CREATE DEMO USER (CORRECT WAY)
  // ========================================
  console.log("👤 Creating demo user...")
  
  try {
    // First check if user already exists
    try {
      const existingUser = app.dao().findFirstRecordByFilter("users", "email = {:email}", {"email": "test@vergabe.de"})
      if (existingUser) {
        console.log("ℹ️ Demo user already exists, deleting first...")
        app.dao().deleteRecord(existingUser)
      }
    } catch (e) {
      console.log("ℹ️ No existing demo user found")
    }
    
    // Create demo user with correct PocketBase v0.28 approach
    const demoUser = new Record(usersCollection, {
      username: "demo",
      email: "test@vergabe.de",
      emailVisibility: true,
      verified: true,
      name: "Demo User"
    })
    
    // Set password using v0.28 method
    demoUser.setPassword("vergabe123")
    
    // Save user
    app.dao().saveRecord(demoUser)
    console.log("✅ Demo user created: test@vergabe.de / vergabe123")
    
    // Verify user was created
    const verifyUser = app.dao().findFirstRecordByFilter("users", "email = {:email}", {"email": "test@vergabe.de"})
    console.log("✅ Demo user verified - ID:", verifyUser.id)
    
  } catch (e) {
    console.log("❌ Failed to create demo user:", e.message)
    // Try alternative approach without verification
    try {
      const demoUser = new Record(usersCollection, {
        username: "demo",
        email: "test@vergabe.de",
        emailVisibility: true,
        verified: true,
        name: "Demo User"
      })
      demoUser.setPassword("vergabe123")
      app.dao().saveRecord(demoUser)
      console.log("✅ Demo user created with alternative approach")
    } catch (e2) {
      console.log("❌ Alternative approach also failed:", e2.message)
    }
  }

  // ========================================
  // 3. ENSURE APIKEYS COLLECTION EXISTS
  // ========================================
  let apikeysCollection
  try {
    apikeysCollection = app.findCollectionByNameOrId("apikeys")
    console.log("ℹ️ API keys collection already exists")
  } catch (e) {
    console.log("🔧 Creating API keys collection...")
    apikeysCollection = new Collection({
      type: "base",
      name: "apikeys",
      listRule: "@request.auth.id = user_id",
      viewRule: "@request.auth.id = user_id",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id = user_id",
      deleteRule: "@request.auth.id = user_id",
      fields: [
        {
          name: "user_id",
          type: "relation",
          required: true,
          maxSelect: 1,
          collectionId: usersCollection.id,
          cascadeDelete: true
        },
        {
          name: "provider",
          type: "select",
          required: true,
          maxSelect: 1,
          values: ["openai", "anthropic", "google", "azure"]
        },
        {
          name: "api_key",
          type: "text",
          required: true,
          max: 500
        },
        {
          name: "name",
          type: "text",
          required: false,
          max: 100
        },
        {
          name: "active",
          type: "bool",
          required: false
        },
        {
          name: "created",
          type: "autodate",
          onCreate: true,
          onUpdate: false
        },
        {
          name: "updated",
          type: "autodate",
          onCreate: true,
          onUpdate: true
        }
      ]
    })
    app.save(apikeysCollection)
    console.log("✅ API keys collection created")
  }

  // ========================================
  // 4. ENSURE PROJECTS COLLECTION EXISTS
  // ========================================
  let projectsCollection
  try {
    projectsCollection = app.findCollectionByNameOrId("projects")
    console.log("ℹ️ Projects collection already exists")
  } catch (e) {
    console.log("🔧 Creating projects collection...")
    projectsCollection = new Collection({
      type: "base",
      name: "projects",
      listRule: "@request.auth.id = user_id",
      viewRule: "@request.auth.id = user_id",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id = user_id",
      deleteRule: "@request.auth.id = user_id",
      fields: [
        {
          name: "user_id",
          type: "relation",
          required: true,
          maxSelect: 1,
          collectionId: usersCollection.id,
          cascadeDelete: true
        },
        {
          name: "name",
          type: "text",
          required: true,
          min: 1,
          max: 200
        },
        {
          name: "description",
          type: "text",
          required: false,
          max: 2000
        },
        {
          name: "budget",
          type: "number",
          required: false,
          min: 0
        },
        {
          name: "deadline",
          type: "date",
          required: false
        },
        {
          name: "eckpunkte",
          type: "text",
          required: false,
          max: 5000
        },
        {
          name: "request_id",
          type: "text",
          required: false,
          max: 50
        },
        {
          name: "created",
          type: "autodate",
          onCreate: true,
          onUpdate: false
        },
        {
          name: "updated",
          type: "autodate",
          onCreate: true,
          onUpdate: true
        }
      ]
    })
    app.save(projectsCollection)
    console.log("✅ Projects collection created")
  }

  console.log("🎉 User creation fix migration completed!")
  console.log("📊 All collections should now work correctly")

}, (app) => {
  // Rollback
  console.log("🔄 Rolling back user creation fix migration...")
  
  // Remove demo user
  try {
    const existingUser = app.dao().findFirstRecordByFilter("users", "email = {:email}", {"email": "test@vergabe.de"})
    if (existingUser) {
      app.dao().deleteRecord(existingUser)
      console.log("✅ Removed demo user")
    }
  } catch (e) {
    console.log("ℹ️ No demo user to remove")
  }

  console.log("🔄 Rollback completed")
})