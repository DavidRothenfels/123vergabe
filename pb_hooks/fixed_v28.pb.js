/// <reference path="../pb_data/types.d.ts" />

// Test Hook
routerAdd("GET", "/test", (e) => {
  return e.json(200, { 
    message: "Hook funktioniert!",
    timestamp: new Date().toISOString()
  })
})

// API Key save endpoint
routerAdd("POST", "/save-api-key", (e) => {
  console.log("🔑 API Key save hook called")
  
  const userId = e.queryParam("userId")
  const apiKey = e.queryParam("apiKey")
  
  if (!userId || !apiKey) {
    return e.json(400, { error: "userId and apiKey required" })
  }
  
  try {
    // Use PocketBase DAO methods instead of direct SQL
    const apikeysCollection = $app.dao().findCollectionByNameOrId("apikeys")
    
    // Check if user already has an API key
    let existingRecord = null
    try {
      existingRecord = $app.dao().findFirstRecordByFilter(
        "apikeys",
        "user = {:userId}",
        { userId: userId }
      )
    } catch (err) {
      // No existing record found, that's OK
    }
    
    if (existingRecord) {
      // Update existing
      existingRecord.set("key", apiKey)
      $app.dao().saveRecord(existingRecord)
      console.log("✅ Updated existing API key for user:", userId)
    } else {
      // Insert new
      const newRecord = new Record(apikeysCollection, {
        "user": userId,
        "key": apiKey
      })
      $app.dao().saveRecord(newRecord)
      console.log("✅ Inserted new API key for user:", userId)
    }
    
    return e.json(200, { message: "API key saved successfully", userId: userId })
  } catch (error) {
    console.error("❌ API key save error:", error)
    return e.json(500, { error: "Failed to save API key: " + error.message })
  }
})

// API Key load endpoint
routerAdd("GET", "/load-api-key", (e) => {
  console.log("🔑 API Key load hook called")
  
  const userId = e.queryParam("userId")
  
  if (!userId) {
    return e.json(400, { error: "userId required" })
  }
  
  try {
    // Use PocketBase DAO methods
    let apiKey = null
    try {
      const record = $app.dao().findFirstRecordByFilter(
        "apikeys",
        "user = {:userId}",
        { userId: userId }
      )
      apiKey = record.get("key")
    } catch (err) {
      // No API key found
      console.log("ℹ️ No API key found for user:", userId)
    }
    
    if (apiKey) {
      console.log("✅ API key found for user:", userId)
      return e.json(200, { apiKey: apiKey })
    } else {
      console.log("ℹ️ No API key for user:", userId)
      return e.json(404, { error: "No API key found" })
    }
  } catch (error) {
    console.error("❌ API key load error:", error)
    return e.json(500, { error: "Failed to load API key: " + error.message })
  }
})