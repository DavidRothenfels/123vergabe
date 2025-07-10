// Test Hook
routerAdd("GET", "/test", (e) => {
  return e.json(200, { 
    message: "Hook funktioniert!",
    timestamp: new Date().toISOString()
  });
});

// Health Check for PocketBase
routerAdd("GET", "/api/health", (e) => {
  return e.json(200, { 
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "PocketBase"
  });
});

// Health Check
routerAdd("GET", "/opencode/health", (e) => {
  try {
    const response = $http.send({
      url: "http://127.0.0.1:3001/health",
      method: "GET",
      timeout: 5
    });
    
    return e.json(200, {
      service: "ok",
      details: JSON.parse(response.raw)
    });
  } catch (err) {
    return e.json(500, {
      service: "error", 
      error: err.message
    });
  }
});

// API Key save endpoint
routerAdd("POST", "/save-api-key", (e) => {
  console.log("🔑 API Key save hook called");
  
  const userId = e.queryParam("userId");
  const apiKey = e.queryParam("apiKey");
  
  if (!userId || !apiKey) {
    return e.json(400, { error: "userId and apiKey required" });
  }
  
  try {
    // Direct database insert/update
    const db = $app.dao().db();
    
    // Check if user already has an API key
    let existing = null;
    try {
      existing = db.newQuery("SELECT id FROM apikeys WHERE user = ?")
        .bind(userId)
        .one();
    } catch (err) {
      // No existing record found, that's OK
    }
    
    if (existing) {
      // Update existing
      db.newQuery("UPDATE apikeys SET key = ?, updated = datetime('now') WHERE user = ?")
        .bind(apiKey, userId)
        .execute();
      console.log("✅ Updated existing API key for user:", userId);
    } else {
      // Insert new
      db.newQuery("INSERT INTO apikeys (user, key, created, updated) VALUES (?, ?, datetime('now'), datetime('now'))")
        .bind(userId, apiKey)
        .execute();
      console.log("✅ Inserted new API key for user:", userId);
    }
    
    return e.json(200, { message: "API key saved successfully", userId: userId });
  } catch (error) {
    console.error("❌ API key save error:", error);
    return e.json(500, { error: "Failed to save API key: " + error.message });
  }
});

// API Key load endpoint
routerAdd("GET", "/load-api-key", (e) => {
  console.log("🔑 API Key load hook called");
  
  const userId = e.queryParam("userId");
  
  if (!userId) {
    return e.json(400, { error: "userId required" });
  }
  
  try {
    // Direct database query
    const db = $app.dao().db();
    
    let apiKey = null;
    try {
      const result = db.newQuery("SELECT key FROM apikeys WHERE user = ?")
        .bind(userId)
        .one();
      apiKey = result.key;
    } catch (err) {
      // No API key found
    }
    
    if (apiKey) {
      console.log("✅ Found API key for user:", userId);
      return e.json(200, { key: apiKey, userId: userId });
    } else {
      console.log("⚠️ No API key found for user:", userId);
      return e.json(200, { key: null, userId: userId });
    }
  } catch (error) {
    console.error("❌ API key load error:", error);
    return e.json(500, { error: "Failed to load API key: " + error.message });
  }
});

// OpenCode API Key Save - via Node.js service
routerAdd("POST", "/opencode/save-key", (e) => {
  console.log("🔑 OpenCode API Key save hook called");
  
  const userId = e.queryParam("userId");
  const apiKey = e.queryParam("apiKey");
  
  if (!userId || !apiKey) {
    return e.json(400, { error: "userId and apiKey required" });
  }
  
  try {
    const serviceUrl = `http://127.0.0.1:3001/save-key?userId=${encodeURIComponent(userId)}&apiKey=${encodeURIComponent(apiKey)}`;
    
    const response = $http.send({
      url: serviceUrl,
      method: "POST",
      timeout: 10
    });

    console.log("✅ API key saved via Node.js service");
    return e.json(200, { message: "API key saved successfully", userId: userId });
    
  } catch (error) {
    console.log("💥 API key save error:", error.message);
    return e.json(500, { error: error.message });
  }
});

// OpenCode API Key Load - via Node.js service  
routerAdd("GET", "/opencode/load-key", (e) => {
  console.log("🔍 OpenCode API Key load hook called");
  
  const userId = e.queryParam("userId");
  
  if (!userId) {
    return e.json(400, { error: "userId required" });
  }
  
  try {
    const serviceUrl = `http://127.0.0.1:3001/load-key?userId=${encodeURIComponent(userId)}`;
    
    const response = $http.send({
      url: serviceUrl,
      method: "GET",
      timeout: 10
    });

    const result = JSON.parse(response.raw);
    console.log("✅ API key loaded via Node.js service");
    return e.json(200, result);
    
  } catch (error) {
    console.log("💥 API key load error:", error.message);
    return e.json(500, { error: error.message });
  }
});

// OpenCode Stream - verbesserte Parameter-Parsing
routerAdd("GET", "/opencode/stream", (e) => {
  console.log("🎯 Hook called");
  
  // Parameter aus Query String extrahieren
  let prompt = null;
  let model = null;
  let userId = "anonymous";
  
  try {
    // Bessere URL-Parsing für PocketBase v0.28.4
    const urlString = String(e.request.requestURI || e.request.url || '');
    console.log("📍 Full URL:", urlString);
    
    // Prompt extrahieren
    const promptMatch = urlString.match(/[?&]prompt=([^&]*)/);
    if (promptMatch && promptMatch[1]) {
      prompt = decodeURIComponent(promptMatch[1].replace(/\+/g, ' '));
      console.log("📝 Extracted prompt:", prompt);
    }
    
    // Model extrahieren
    const modelMatch = urlString.match(/[?&]model=([^&]*)/);
    if (modelMatch && modelMatch[1]) {
      model = decodeURIComponent(modelMatch[1]);
      console.log("🤖 Extracted model:", model);
    }
    
    // User ID aus authentifiziertem User extrahieren
    try {
      // PocketBase bietet direkten Zugriff auf authentifizierten User
      if (e.auth && e.auth.id) {
        userId = e.auth.id;
        console.log("👤 Extracted userId from auth context:", userId);
      } else {
        console.log("⚠️ No authenticated user found");
      }
    } catch (authError) {
      console.log("⚠️ Could not extract user from auth context:", authError.message);
    }
    
    // Fallback: User ID extrahieren (falls vorhanden)
    const userMatch = urlString.match(/[?&]userId=([^&]*)/);
    if (userMatch && userMatch[1]) {
      userId = decodeURIComponent(userMatch[1]);
      console.log("👤 Fallback extracted userId:", userId);
    }
    
  } catch (parseError) {
    console.log("⚠️ Parameter parsing failed:", parseError.message);
  }
  
  // Validierung
  if (!prompt || !prompt.trim()) {
    console.log("❌ No prompt provided");
    return e.json(400, { error: "Prompt ist erforderlich" });
  }
  
  try {
    console.log("🔄 Calling OpenCode service...");
    
    const serviceUrl = `http://127.0.0.1:3001/opencode/stream?prompt=${encodeURIComponent(prompt)}&model=${encodeURIComponent(model || '')}&userId=${encodeURIComponent(userId)}&recordId=${encodeURIComponent('rec-' + Date.now())}`;
    
    const response = $http.send({
      url: serviceUrl,
      method: "GET",
      timeout: 60
    });

    console.log("✅ Got response from service");
    return e.string(200, response.raw);
    
  } catch (error) {
    console.log("💥 Error:", error.message);
    return e.json(500, { error: error.message });
  }
});