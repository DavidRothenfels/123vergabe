/// <reference path="../pb_data/types.d.ts" />

// Setup script that runs on bootstrap to create admin and test users
onBootstrap((e) => {
  e.next() // CRITICAL: Must be called
  
  // Wait a moment for the system to be fully ready
  setTimeout(() => {
    setupUsers()
  }, 2000)
})

function setupUsers() {
  console.log("🔧 Setting up default users...")
  
  try {
    // Create admin superuser
    createAdminUser()
    
    // Create test user for dashboard
    createTestUser()
    
    console.log("✅ User setup completed")
  } catch (error) {
    console.error("❌ User setup failed:", error)
  }
}

function createAdminUser() {
  try {
    const superusers = $app.dao().findCollectionByNameOrId("_superusers")
    
    // Check if admin already exists
    try {
      const existingAdmin = $app.dao().findFirstRecordByFilter("_superusers", "email = 'admin@vergabe.de'")
      if (existingAdmin) {
        console.log("✅ Admin user already exists")
        return
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
    
  } catch (error) {
    console.error("❌ Failed to create admin user:", error)
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
        return
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
    
  } catch (error) {
    console.error("❌ Failed to create test user:", error)
  }
}