/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  console.log("👤 Creating users...")
  
  // Get users collection
  let usersCollection
  try {
    usersCollection = app.findCollectionByNameOrId("users")
  } catch (e) {
    console.log("❌ Users collection not found")
    return
  }

  // Create demo user
  try {
    const demoUser = new Record(usersCollection, {
      username: "testuser",
      email: "test@vergabe.de",
      emailVisibility: true,
      verified: true,
      name: "Test User"
    })
    demoUser.setPassword("test123456")
    app.dao().saveRecord(demoUser)
    console.log("✅ Demo user created: test@vergabe.de / test123456")
  } catch (e) {
    console.log("ℹ️ Demo user might already exist:", e.message)
  }

  // Admin creation must be done manually
  console.log("📌 Admin creation must be done manually:")
  console.log("📌 Run: ./pocketbase superuser upsert admin@vergabe.de admin123456")
  console.log("📌 Or use the web interface after first start")

  console.log("🎉 User creation migration completed!")

}, (app) => {
  // Rollback - remove demo user
  try {
    const usersCollection = app.findCollectionByNameOrId("users")
    const demoUser = app.dao().findFirstRecordByFilter("users", "email = {:email}", {"email": "test@vergabe.de"})
    if (demoUser) {
      app.dao().deleteRecord(demoUser)
      console.log("✅ Demo user removed")
    }
  } catch (e) {
    console.log("ℹ️ Could not remove demo user:", e.message)
  }
})