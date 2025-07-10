/// <reference path="../pb_data/types.d.ts" />

// Create users via a simple HTTP endpoint that can be called once
routerAdd("GET", "/setup-users", (c) => {
  console.log("🔧 User setup endpoint called...")
  
  const results = []
  
  try {
    // Create admin superuser
    const adminResult = createAdminUser()
    results.push(adminResult)
    
    // Create test user for dashboard
    const userResult = createTestUser()
    results.push(userResult)
    
    console.log("✅ User setup completed via endpoint")
    
    return c.json(200, {
      success: true,
      message: "User setup completed",
      results: results
    })
    
  } catch (error) {
    console.error("❌ User setup failed:", error)
    return c.json(500, {
      success: false,
      error: error.message
    })
  }
})

function createAdminUser() {
  try {
    const superusers = $app.dao().findCollectionByNameOrId("_superusers")
    
    // Check if admin already exists
    try {
      const existingAdmin = $app.dao().findFirstRecordByFilter("_superusers", "email = 'admin@vergabe.de'")
      if (existingAdmin) {
        console.log("✅ Admin user already exists")
        return { type: "admin", status: "exists", email: "admin@vergabe.de" }
      }
    } catch (e) {
      // Admin doesn't exist, continue with creation
    }
    
    // Create admin user
    const admin = new Record(superusers, {
      "email": "admin@vergabe.de",
      "password": "admin123456",
      "passwordConfirm": "admin123456"
    })
    
    $app.dao().saveRecord(admin)
    console.log("✅ Created admin user: admin@vergabe.de / admin123456")
    return { type: "admin", status: "created", email: "admin@vergabe.de" }
    
  } catch (error) {
    console.error("❌ Failed to create admin user:", error)
    return { type: "admin", status: "error", error: error.message }
  }
}

function createTestUser() {
  try {
    const users = $app.dao().findCollectionByNameOrId("users")
    
    // Check if test user already exists
    try {
      const existingUser = $app.dao().findFirstRecordByFilter("users", "email = 'test@vergabe.de'")
      if (existingUser) {
        console.log("✅ Test user already exists")
        return { type: "user", status: "exists", email: "test@vergabe.de" }
      }
    } catch (e) {
      // User doesn't exist, continue with creation
    }
    
    // Create test user
    const user = new Record(users, {
      "email": "test@vergabe.de",
      "password": "test123456",
      "passwordConfirm": "test123456",
      "verified": true,
      "name": "Test User"
    })
    
    $app.dao().saveRecord(user)
    console.log("✅ Created test user: test@vergabe.de / test123456")
    return { type: "user", status: "created", email: "test@vergabe.de" }
    
  } catch (error) {
    console.error("❌ Failed to create test user:", error)
    return { type: "user", status: "error", error: error.message }
  }
}