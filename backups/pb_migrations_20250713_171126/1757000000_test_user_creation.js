/// <reference path="../pb_data/types.d.ts" />

/**
 * Test User Creation - Complete fresh setup with user creation
 * Based on working reference project
 */

migrate((app) => {
  console.log("🔄 Starting test user creation migration...")
  
  // ========================================
  // 1. ENSURE USERS COLLECTION EXISTS
  // ========================================
  let usersCollection
  try {
    usersCollection = app.findCollectionByNameOrId("users")
    console.log("ℹ️ Users collection already exists")
  } catch (e) {
    usersCollection = new Collection({
      type: "auth",
      name: "users",
      listRule: "",
      viewRule: "",
      createRule: "",
      updateRule: "",
      deleteRule: "",
      fields: [
        {
          name: "name",
          type: "text",
          required: false,
          max: 100
        }
      ]
    })
    app.save(usersCollection)
    console.log("✅ users collection created")
  }

  // ========================================
  // 2. CREATE DEMO USER (MAIN GOAL)
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
    
    // Create demo user with exact same approach as reference
    const demoUser = new Record(usersCollection, {
      username: "demo",
      email: "test@vergabe.de",
      emailVisibility: true,
      verified: true,
      name: "Demo User"
    })
    demoUser.setPassword("vergabe123")
    app.dao().saveRecord(demoUser)
    console.log("✅ Demo user created: test@vergabe.de / vergabe123")
    
    // Verify user was created
    const verifyUser = app.dao().findFirstRecordByFilter("users", "email = {:email}", {"email": "test@vergabe.de"})
    console.log("✅ Demo user verified - ID:", verifyUser.id)
    
  } catch (e) {
    console.log("❌ Failed to create demo user:", e.message)
    console.log("Error details:", e)
  }

  // ========================================
  // 3. CREATE ESSENTIAL COLLECTIONS
  // ========================================
  
  // Generation requests for autonomous workflow
  try {
    const generationRequestsCollection = new Collection({
      type: "base",
      name: "generation_requests",
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: "user_need_id",
          type: "text",
          required: false
        },
        {
          name: "status",
          type: "select",
          required: false,
          maxSelect: 1,
          values: ["pending", "processing", "completed", "failed"]
        },
        {
          name: "created",
          type: "autodate",
          onCreate: true,
          onUpdate: false
        }
      ]
    })
    app.save(generationRequestsCollection)
    console.log("✅ generation_requests collection created")
  } catch (e) {
    console.log("ℹ️ generation_requests collection might already exist")
  }

  // CLI commands for background processing
  try {
    const cliCommandsCollection = new Collection({
      type: "base",
      name: "cli_commands",
      listRule: "",
      viewRule: "",
      createRule: "",
      updateRule: "",
      deleteRule: "",
      fields: [
        {
          name: "command",
          type: "text",
          required: true,
          max: 100
        },
        {
          name: "status",
          type: "select",
          required: true,
          maxSelect: 1,
          values: ["pending", "processing", "completed", "failed"]
        },
        {
          name: "created",
          type: "autodate",
          onCreate: true,
          onUpdate: false
        }
      ]
    })
    app.save(cliCommandsCollection)
    console.log("✅ cli_commands collection created")
  } catch (e) {
    console.log("ℹ️ cli_commands collection might already exist")
  }

  // Logs for debugging
  try {
    const logsCollection = new Collection({
      type: "base",
      name: "logs",
      listRule: "",
      viewRule: "",
      createRule: "",
      updateRule: "",
      deleteRule: "",
      fields: [
        {
          name: "message",
          type: "text",
          required: true,
          max: 1000
        },
        {
          name: "level",
          type: "select",
          required: false,
          maxSelect: 1,
          values: ["info", "warning", "error", "success"]
        },
        {
          name: "created",
          type: "autodate",
          onCreate: true,
          onUpdate: false
        }
      ]
    })
    app.save(logsCollection)
    console.log("✅ logs collection created")
  } catch (e) {
    console.log("ℹ️ logs collection might already exist")
  }

  console.log("🎉 Test user creation migration completed!")
  console.log("📊 Demo user should now be available for login")

}, (app) => {
  // Rollback
  console.log("🔄 Rolling back test user creation migration...")
  
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
  
  // Remove collections
  const collections = ["logs", "cli_commands", "generation_requests"]
  collections.forEach(name => {
    try {
      const collection = app.findCollectionByNameOrId(name)
      app.delete(collection)
      console.log(`✅ Deleted collection: ${name}`)
    } catch (e) {
      console.log(`ℹ️ Collection ${name} not found for deletion`)
    }
  })

  console.log("🔄 Rollback completed")
})