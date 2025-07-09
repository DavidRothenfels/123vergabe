// Test Hook
routerAdd("GET", "/test", (e) => {
  return e.json(200, { 
    message: "Hook funktioniert!",
    timestamp: new Date().toISOString()
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

// OpenCode Stream - verbesserte Parameter-Parsing
routerAdd("GET", "/opencode/stream", (e) => {
  console.log("🎯 Hook called");
  
  // Parameter aus Query String extrahieren
  let prompt = null;
  let model = null;
  let userId = "anonymous";
  
  try {
    // Bessere URL-Parsing
    const urlString = String(e.request.url || '');
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
    
    // User ID extrahieren (falls vorhanden)
    const userMatch = urlString.match(/[?&]userId=([^&]*)/);
    if (userMatch && userMatch[1]) {
      userId = decodeURIComponent(userMatch[1]);
      console.log("👤 Extracted userId:", userId);
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