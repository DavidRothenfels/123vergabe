/// <reference path="../pb_data/types.d.ts" />

console.log("📄 Loading bedarf.pb.js...")

// AI Provider configuration (using var for global scope in PocketBase)
var AI_PROVIDERS = {
    openrouter: {
        url: "https://openrouter.ai/api/v1/chat/completions",
        headers: (apiKey) => ({
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": "http://localhost:8090",
            "X-Title": "123vergabe",
            "Content-Type": "application/json"
        }),
        model: "anthropic/claude-3.5-sonnet"
    }
}

// Helper function to get AI provider settings
// Note: In PocketBase hooks, sometimes function scope issues occur
// If getAIProvider is not accessible, use AI_PROVIDERS directly

// Route: Generate questions based on initial description
routerAdd("POST", "/api/generate-questions", (e) => {
    console.log("=== /api/generate-questions called ===")
    console.log("Request method:", e.request.method)
    console.log("Request URL:", e.request.url)
    console.log("Auth:", e.auth ? "authenticated" : "not authenticated")
    
    try {
        // Wrap everything to catch all errors
        console.log("Starting request processing...")
        // Parse JSON body
        let data = {}
        try {
            // Get parsed body directly (PocketBase v0.28 API)
            data = e.requestInfo().body || {}
        } catch (err) {
            console.log("Body parsing error:", err)
            throw new Error("Invalid JSON body: " + err.message)
        }
        
        const userId = e.auth?.id
        
        if (!userId) {
            throw new Error("Nicht authentifiziert")
        }

        if (!data.description) {
            throw new Error("Beschreibung fehlt")
        }

        const bedarfId = data.bedarf_id
        const aiProvider = data.ai_provider || "openrouter"
        
        console.log("AI Provider:", aiProvider)
        console.log("Bedarf ID:", bedarfId)
        
        // Get provider configuration
        const providers = {
            openrouter: {
                url: "https://openrouter.ai/api/v1/chat/completions",
                headers: (apiKey) => ({
                    "Authorization": `Bearer ${apiKey}`,
                    "HTTP-Referer": "http://localhost:8090",
                    "X-Title": "123vergabe",
                    "Content-Type": "application/json"
                }),
                model: "anthropic/claude-3.5-sonnet"
            }
        }
        const provider = providers[aiProvider] || providers.openrouter
        
        // Direct to AI provider - no mock implementation
        
        // Generate questions using AI
        const prompt = `Du bist ein erfahrener Warengruppenmanager einer öffentlichen Vergabestelle und planst eine Ausschreibung für Beratungsdienstleistungen oder Software. Deine Aufgabe ist es, den Beschaffungsbedarf sehr detailliert festzustellen und ALLE Aspekte einer vollständigen Leistungsbeschreibung systematisch zu erfassen.

Generiere 5-7 sehr spezifische Fragen, die alle 12 Bereiche einer professionellen Leistungsbeschreibung abdecken:
1. Projektrahmendaten
2. Leistungsgegenstand
3. Funktionale Anforderungen
4. Technische Spezifikationen
5. Qualitätsstandards
6. Schnittstellen & Integration
7. Sicherheitsanforderungen
8. Projektablauf & Meilensteine
9. Dokumentation & Schulung
10. Support & Wartung
11. Abnahmekriterien
12. Vergütungsmodell

Der Nutzer beschreibt sein Vorhaben wie folgt:
"${data.description}"

WICHTIG:
- Stelle konkrete, auf das beschriebene Vorhaben zugeschnittene Fragen
- Jede Frage soll einen spezifischen Aspekt der Leistungsbeschreibung abdecken
- Nutze Multiple-Choice mit Freitextfeld für ergänzende Details
- Die Fragen sollen logisch aufeinander aufbauen

Format als JSON:
{
  "questions": [
    {
      "id": "q1",
      "text": "Frage...",
      "category": "Kategoriename aus den 12 Bereichen",
      "type": "multiple_choice",
      "options": ["Option 1", "Option 2", "Option 3"],
      "allow_other": true
    }
  ]
}`

        const requestBody = {
            model: provider.model,
            messages: [
                { role: "system", content: "Du bist ein Experte für öffentliche Beschaffung." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 2000
        }

        // Get API key if needed
        let headers = provider.headers()
        if (aiProvider === "openrouter") {
            const apiKey = process.env.OPENROUTER_API_KEY || $app.settings().openrouter_api_key
            console.log("OpenRouter API Key check:")
            console.log("- From env:", process.env.OPENROUTER_API_KEY ? "present" : "missing")
            console.log("- From settings:", $app.settings().openrouter_api_key ? "present" : "missing")
            console.log("- Final API key:", apiKey ? `${apiKey.substring(0, 10)}...` : "NOT FOUND")
            
            if (!apiKey) {
                throw new Error("OpenRouter API key not configured")
            }
            headers = provider.headers(apiKey)
        }

        const response = $http.send({
            url: provider.url,
            method: "POST",
            headers: headers,
            body: JSON.stringify(requestBody),
            timeout: 120
        })

        if (response.statusCode !== 200) {
            console.error("AI API error:", response.raw)
            throw new Error(`AI API error: ${response.statusCode}`)
        }

        const result = JSON.parse(response.raw)
        const content = result.choices[0].message.content
        
        // Parse JSON response
        let questions
        try {
            // Extract JSON from response if wrapped in text
            const jsonMatch = content.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                questions = JSON.parse(jsonMatch[0])
            } else {
                questions = JSON.parse(content)
            }
        } catch (parseError) {
            console.error("Failed to parse AI response:", content)
            throw new Error("Fehler beim Parsen der AI-Antwort")
        }

        // Create or update user_needs record with questions
        let recordId = bedarfId
        if (!bedarfId) {
            // Create new record
            const collection = $app.findCollectionByNameOrId("user_needs")
            const newRecord = new Record(collection, {
                user_id: userId,
                project_id: data.project_id || null,
                thema: data.description,
                beschreibung: JSON.stringify(questions),
                status: "created"
            })
            $app.save(newRecord)
            recordId = newRecord.id
        } else {
            // Update existing record
            const bedarf = $app.findRecordById("user_needs", bedarfId)
            bedarf.set("beschreibung", JSON.stringify(questions))
            bedarf.set("status", "created")
            $app.save(bedarf)
        }

        return e.json(200, {
            bedarf_id: recordId,
            questions: questions.questions || questions
        })
        
    } catch (error) {
        console.error("Error generating questions:", error)
        return e.json(500, { error: error.message })
    }
}, $apis.requireAuth())

// Route: Generate additional questions based on existing answers
routerAdd("POST", "/api/generate-additional-questions", (e) => {
    try {
        // Parse JSON body
        let data = {}
        try {
            // Get parsed body directly (PocketBase v0.28 API)
            data = e.requestInfo().body || {}
        } catch (err) {
            console.log("Body parsing error:", err)
            throw new Error("Invalid JSON body: " + err.message)
        }
        
        const userId = e.auth?.id
        
        if (!userId) {
            throw new Error("Nicht authentifiziert")
        }

        const bedarfId = data.bedarf_id
        const currentAnswers = data.answers || {}
        const aiProvider = data.ai_provider || "openrouter"
        
        // Get provider configuration
        const providers = {
            openrouter: {
                url: "https://openrouter.ai/api/v1/chat/completions",
                headers: (apiKey) => ({
                    "Authorization": `Bearer ${apiKey}`,
                    "HTTP-Referer": "http://localhost:8090",
                    "X-Title": "123vergabe",
                    "Content-Type": "application/json"
                }),
                model: "anthropic/claude-3.5-sonnet"
            }
        }
        const provider = providers[aiProvider] || providers.openrouter
        
        // Build context from current answers
        let answersContext = "Bisherige Antworten:\n"
        for (const [qId, answer] of Object.entries(currentAnswers)) {
            if (answer.selected_options?.length > 0 || answer.other_text) {
                answersContext += `\nFrage ${qId}: ${answer.selected_options?.join(", ")} ${answer.other_text || ""}`
            }
        }

        const prompt = `Als erfahrener Warengruppenmanager analysierst du die bisherigen Antworten und identifizierst Lücken in der Bedarfsanalyse.

${answersContext}

Generiere 3-5 zusätzliche, sehr spezifische Fragen, um noch fehlende Informationen zu erfassen. Fokussiere dich auf:
- Bereiche, die noch nicht ausreichend abgedeckt sind
- Details, die für eine vollständige Leistungsbeschreibung fehlen
- Kritische Aspekte, die präzisiert werden müssen

WICHTIG: Verwende EXAKT dasselbe JSON-Format wie bei den initialen Fragen:
{
  "questions": [
    {
      "id": "q_add_1",
      "text": "Frage...",
      "category": "Kategoriename aus den 12 Bereichen",
      "type": "multiple_choice",
      "options": ["Option 1", "Option 2", "Option 3"],
      "allow_other": true
    }
  ]
}

Stelle sicher, dass JEDE Frage ein "options" Array hat, auch wenn es nur Platzhalter-Optionen sind.`

        const requestBody = {
            model: provider.model,
            messages: [
                { role: "system", content: "Du bist ein Experte für öffentliche Beschaffung." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 1500
        }

        // Get API key if needed
        let headers = provider.headers()
        if (aiProvider === "openrouter") {
            const apiKey = process.env.OPENROUTER_API_KEY || $app.settings().openrouter_api_key
            console.log("OpenRouter API Key check:")
            console.log("- From env:", process.env.OPENROUTER_API_KEY ? "present" : "missing")
            console.log("- From settings:", $app.settings().openrouter_api_key ? "present" : "missing")
            console.log("- Final API key:", apiKey ? `${apiKey.substring(0, 10)}...` : "NOT FOUND")
            
            if (!apiKey) {
                throw new Error("OpenRouter API key not configured")
            }
            headers = provider.headers(apiKey)
        }

        const response = $http.send({
            url: provider.url,
            method: "POST",
            headers: headers,
            body: JSON.stringify(requestBody),
            timeout: 120
        })

        if (response.statusCode !== 200) {
            throw new Error(`AI API error: ${response.statusCode}`)
        }

        const result = JSON.parse(response.raw)
        const content = result.choices[0].message.content
        
        // Parse JSON response
        let additionalQuestions
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                additionalQuestions = JSON.parse(jsonMatch[0])
            } else {
                additionalQuestions = JSON.parse(content)
            }
        } catch (parseError) {
            throw new Error("Fehler beim Parsen der AI-Antwort")
        }

        return e.json(200, additionalQuestions)
        
    } catch (error) {
        console.error("Error generating additional questions:", error)
        return e.json(500, { error: error.message })
    }
}, $apis.requireAuth())

// Route: Submit answers and generate document
routerAdd("POST", "/api/submit-answers", (e) => {
    try {
        // Parse JSON body
        let data = {}
        try {
            // Get parsed body directly (PocketBase v0.28 API)
            data = e.requestInfo().body || {}
        } catch (err) {
            console.log("Body parsing error:", err)
            throw new Error("Invalid JSON body: " + err.message)
        }
        
        const userId = e.auth?.id
        
        if (!userId) {
            throw new Error("Nicht authentifiziert")
        }

        const bedarfId = data.bedarf_id
        const answers = data.answers
        const aiProvider = data.ai_provider || "openrouter"
        
        if (!bedarfId || !answers) {
            throw new Error("Bedarf ID und Antworten erforderlich")
        }

        // Get bedarf record
        const bedarf = $app.findRecordById("user_needs", bedarfId)
        const questions = bedarf.questions?.questions || []
        
        // Build comprehensive context
        let qaContext = "# Bedarfsanalyse Ergebnisse\n\n"
        qaContext += `**Ursprüngliche Beschreibung:** ${bedarf.initial_description}\n\n`
        qaContext += "## Fragen und Antworten:\n\n"
        
        for (const question of questions) {
            const answer = answers[question.id]
            if (answer) {
                qaContext += `**${question.text}** (${question.category})\n`
                if (answer.selected_options?.length > 0) {
                    qaContext += `Antwort: ${answer.selected_options.join(", ")}\n`
                }
                if (answer.other_text) {
                    qaContext += `Zusätzliche Details: ${answer.other_text}\n`
                }
                qaContext += "\n"
            }
        }

        // Get provider configuration
        const providers = {
            openrouter: {
                url: "https://openrouter.ai/api/v1/chat/completions",
                headers: (apiKey) => ({
                    "Authorization": `Bearer ${apiKey}`,
                    "HTTP-Referer": "http://localhost:8090",
                    "X-Title": "123vergabe",
                    "Content-Type": "application/json"
                }),
                model: "anthropic/claude-3.5-sonnet"
            }
        }
        const provider = providers[aiProvider] || providers.openrouter
        
        const prompt = `Du bist ein Experte für öffentliche Beschaffung und erstellst professionelle Leistungsbeschreibungen. Basierend auf den folgenden Antworten aus einer Bedarfsanalyse, generiere strukturierte Inhalte für eine umfassende Leistungsbeschreibung.

${qaContext}

Erstelle nun detaillierte Inhalte für alle 12 Kapitel einer professionellen Leistungsbeschreibung. WICHTIG:
- Führe eine umfassende Webrecherche durch, um aktuelle Marktinformationen einzubeziehen
- Berücksichtige Best Practices und Standards der jeweiligen Branche
- Formuliere konkret und praxisnah
- Nutze professionelle Vergabesprache

Generiere das Ergebnis als JSON mit folgendem Format:
{
  "projektrahmendaten": "Detaillierter Text...",
  "leistungsgegenstand": "Detaillierter Text...",
  "funktionale_anforderungen": "Detaillierter Text...",
  "technische_spezifikationen": "Detaillierter Text...",
  "qualitaetsstandards": "Detaillierter Text...",
  "schnittstellen_integration": "Detaillierter Text...",
  "sicherheitsanforderungen": "Detaillierter Text...",
  "projektablauf_meilensteine": "Detaillierter Text...",
  "dokumentation_schulung": "Detaillierter Text...",
  "support_wartung": "Detaillierter Text...",
  "abnahmekriterien": "Detaillierter Text...",
  "verguetungsmodell": "Detaillierter Text..."
}`

        const requestBody = {
            model: provider.model,
            messages: [
                { role: "system", content: "Du bist ein Experte für öffentliche Beschaffung und erstellst professionelle Leistungsbeschreibungen." },
                { role: "user", content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 8000
        }

        // Get API key if needed
        let headers = provider.headers()
        if (aiProvider === "openrouter") {
            const apiKey = process.env.OPENROUTER_API_KEY || $app.settings().openrouter_api_key
            console.log("OpenRouter API Key check:")
            console.log("- From env:", process.env.OPENROUTER_API_KEY ? "present" : "missing")
            console.log("- From settings:", $app.settings().openrouter_api_key ? "present" : "missing")
            console.log("- Final API key:", apiKey ? `${apiKey.substring(0, 10)}...` : "NOT FOUND")
            
            if (!apiKey) {
                throw new Error("OpenRouter API key not configured")
            }
            headers = provider.headers(apiKey)
        }

        const response = $http.send({
            url: provider.url,
            method: "POST",
            headers: headers,
            body: JSON.stringify(requestBody),
            timeout: 300 // 5 minutes
        })

        if (response.statusCode !== 200) {
            throw new Error(`AI API error: ${response.statusCode}`)
        }

        const result = JSON.parse(response.raw)
        const content = result.choices[0].message.content
        
        // Parse JSON response
        let documentData
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                documentData = JSON.parse(jsonMatch[0])
            } else {
                documentData = JSON.parse(content)
            }
        } catch (parseError) {
            throw new Error("Fehler beim Parsen der AI-Antwort")
        }

        // Update bedarf record
        bedarf.set("answers", answers)
        bedarf.set("document_data", documentData)
        bedarf.set("status", "document_generated")
        $app.save(bedarf)

        // Get template
        const templates = $app.findRecordsByFilter("templates", "category = 'bedarf' && active = true", "", 1)
        if (templates.length === 0) {
            throw new Error("Keine aktive Vorlage gefunden")
        }
        
        const template = templates[0]
        let renderedContent = template.template_content
        
        // Replace placeholders
        for (const [key, value] of Object.entries(documentData)) {
            renderedContent = renderedContent.replace(new RegExp(`{{.${key}}}`, 'g'), value)
        }

        // Create document record
        const documentsCollection = $app.findCollectionByNameOrId("documents")
        const docRecord = new Record(documentsCollection, {
            title: `Leistungsbeschreibung: ${bedarf.initial_description.substring(0, 100)}...`,
            content: renderedContent,
            document_type: "user_needs",
            type: "user_needs",
            user_id: userId,
            project_id: bedarf.project_id || "",
            bedarf_id: bedarfId,
            generated_by_ai: true,
            created_by: userId
        })
        $app.save(docRecord)

        return e.json(200, {
            success: true,
            document_id: docRecord.id,
            rendered_content: renderedContent
        })
        
    } catch (error) {
        console.error("Error submitting answers:", error)
        return e.json(500, { error: error.message })
    }
}, $apis.requireAuth())

// Route: Generate comprehensive description from Q&A
routerAdd("POST", "/api/generate-description", (e) => {
    try {
        // Parse JSON body
        let data = {}
        try {
            // Get parsed body directly (PocketBase v0.28 API)
            data = e.requestInfo().body || {}
        } catch (err) {
            console.log("Body parsing error:", err)
            throw new Error("Invalid JSON body: " + err.message)
        }
        
        const userId = e.auth?.id
        
        if (!userId) {
            throw new Error("Nicht authentifiziert")
        }

        const { initial_description, questions, answers } = data
        
        // Build comprehensive context
        let context = `Ursprüngliche Beschreibung: ${initial_description}\n\n`
        context += "Fragen und Antworten:\n"
        
        for (const question of questions) {
            const answer = answers[question.id]
            if (answer) {
                context += `\nFrage: ${question.text}\n`
                if (answer.selected_options?.length > 0) {
                    context += `Antworten: ${answer.selected_options.join(", ")}\n`
                }
                if (answer.other_text) {
                    context += `Details: ${answer.other_text}\n`
                }
            }
        }

        // Define provider inline to avoid scope issues
        const provider = {
            url: "https://openrouter.ai/api/v1/chat/completions",
            headers: (apiKey) => ({
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": "http://localhost:8090",
                "X-Title": "123vergabe",
                "Content-Type": "application/json"
            }),
            model: "anthropic/claude-3.5-sonnet"
        }
        const apiKey = process.env.OPENROUTER_API_KEY || $app.settings().openrouter_api_key
        
        if (!apiKey) {
            throw new Error("OpenRouter API key not configured")
        }
        
        const prompt = `Erstelle eine präzise und umfassende Projektbeschreibung basierend auf den folgenden Informationen:

${context}

WICHTIG:
- Fasse alle Informationen in eine kohärente, detaillierte Beschreibung zusammen
- Strukturiere die Beschreibung klar und logisch
- Verwende professionelle Sprache
- Die Beschreibung soll alle wichtigen Aspekte abdecken
- Schreibe in einem Fließtext, keine Stichpunkte`

        const requestBody = {
            model: provider.model,
            messages: [
                { role: "system", content: "Du bist ein Experte für Projektbeschreibungen." },
                { role: "user", content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 2000
        }

        const response = $http.send({
            url: provider.url,
            method: "POST",
            headers: provider.headers(apiKey),
            body: JSON.stringify(requestBody),
            timeout: 120
        })

        if (response.statusCode !== 200) {
            throw new Error(`AI API error: ${response.statusCode}`)
        }

        const result = JSON.parse(response.raw)
        const description = result.choices[0].message.content

        return e.json(200, { description })
        
    } catch (error) {
        console.error("Error generating description:", error)
        return e.json(500, { error: error.message })
    }
}, $apis.requireAuth())

// Route: Generate document from template
routerAdd("POST", "/api/generate-from-template", (e) => {
    try {
        // Parse JSON body
        let data = {}
        try {
            // Get parsed body directly (PocketBase v0.28 API)
            data = e.requestInfo().body || {}
        } catch (err) {
            console.log("Body parsing error:", err)
            throw new Error("Invalid JSON body: " + err.message)
        }
        
        const userId = e.auth?.id
        
        if (!userId) {
            throw new Error("Nicht authentifiziert")
        }

        const { description, project_id, template_category } = data
        
        if (!description) {
            throw new Error("Beschreibung fehlt")
        }

        // Get template
        const templates = $app.findRecordsByFilter("templates", 
            `category = '${template_category}' && active = true`, "", 1)
        
        if (templates.length === 0) {
            throw new Error("Keine aktive Vorlage gefunden")
        }
        
        const template = templates[0]
        const placeholders = JSON.parse(template.placeholders || "[]")
        
        // Generate content for each placeholder
        // Define provider inline to avoid scope issues
        const provider = {
            url: "https://openrouter.ai/api/v1/chat/completions",
            headers: (apiKey) => ({
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": "http://localhost:8090",
                "X-Title": "123vergabe",
                "Content-Type": "application/json"
            }),
            model: "anthropic/claude-3.5-sonnet"
        }
        const apiKey = process.env.OPENROUTER_API_KEY || $app.settings().openrouter_api_key
        
        if (!apiKey) {
            throw new Error("OpenRouter API key not configured")
        }
        
        const prompt = `Basierend auf der folgenden Projektbeschreibung, erstelle detaillierte Inhalte für eine professionelle Leistungsbeschreibung:

${description}

Generiere strukturierte Inhalte für folgende Kapitel:
${placeholders.map(p => `- ${p}`).join('\n')}

WICHTIG:
- Führe eine umfassende Recherche durch
- Berücksichtige Best Practices
- Formuliere konkret und praxisnah
- Nutze professionelle Vergabesprache

Antworte im JSON-Format mit allen Kapiteln als Felder.`

        const requestBody = {
            model: provider.model,
            messages: [
                { role: "system", content: "Du bist ein Experte für öffentliche Beschaffung." },
                { role: "user", content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 8000
        }

        const response = $http.send({
            url: provider.url,
            method: "POST",
            headers: provider.headers(apiKey),
            body: JSON.stringify(requestBody),
            timeout: 300
        })

        if (response.statusCode !== 200) {
            throw new Error(`AI API error: ${response.statusCode}`)
        }

        const result = JSON.parse(response.raw)
        const content = result.choices[0].message.content
        
        // Parse JSON response
        let documentData
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                documentData = JSON.parse(jsonMatch[0])
            } else {
                documentData = JSON.parse(content)
            }
        } catch (parseError) {
            throw new Error("Fehler beim Parsen der AI-Antwort")
        }

        // Replace placeholders in template
        let renderedContent = template.template_content
        for (const [key, value] of Object.entries(documentData)) {
            renderedContent = renderedContent.replace(new RegExp(`{{.${key}}}`, 'g'), value)
        }

        return e.json(200, {
            success: true,
            rendered_content: renderedContent,
            document_data: documentData
        })
        
    } catch (error) {
        console.error("Error in template generation:", error)
        return e.json(500, { error: error.message })
    }
}, $apis.requireAuth())

console.log("✅ Bedarf routes registered")