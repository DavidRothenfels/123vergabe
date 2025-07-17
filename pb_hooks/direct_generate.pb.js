/// <reference path="../pb_data/types.d.ts" />

console.log("📄 Loading direct_generate.pb.js...")

// Route: Direct document generation (legacy compatibility)
routerAdd("POST", "/api/generate-direct", (e) => {
    try {
        const data = e.requestInfo.data
        const userId = e.auth?.id
        
        if (!userId) {
            throw new Error("Nicht authentifiziert")
        }

        const prompt = data.prompt
        const projectId = data.project_id
        
        if (!prompt) {
            throw new Error("Prompt fehlt")
        }

        // Use OpenRouter for direct generation
        const apiKey = process.env.OPENROUTER_API_KEY || $app.settings().get("openrouter_api_key")
        if (!apiKey) {
            throw new Error("OpenRouter API key not configured")
        }

        const requestBody = {
            model: "openai/gpt-4o-mini", // Use the model from CLAUDE.md
            messages: [
                { role: "system", content: "Du bist ein Experte für öffentliche Beschaffung und erstellst professionelle Vergabedokumente." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 8000
        }

        const response = $http.send({
            url: "https://openrouter.ai/api/v1/chat/completions",
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": "http://localhost:8090",
                "X-Title": "123vergabe",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody),
            timeout: 300 // 5 minutes
        })

        if (response.statusCode !== 200) {
            console.error("AI API error:", response.raw)
            throw new Error(`AI API error: ${response.statusCode}`)
        }

        const result = JSON.parse(response.raw)
        const content = result.choices[0].message.content

        return e.json(200, {
            success: true,
            content: content
        })
        
    } catch (error) {
        console.error("Error in direct generation:", error)
        return e.json(500, { error: error.message })
    }
}, $apis.requireAuth())

console.log("✅ Direct generation route registered")