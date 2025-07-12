#!/usr/bin/env node

/**
 * Simple test for OpenCode service integration
 */

const fetch = require('node-fetch')

async function testOpenCode() {
    console.log('🧪 Testing OpenCode Service Integration')
    console.log('=====================================')
    
    try {
        // Test 1: Health check
        console.log('❤️ Step 1: Health check...')
        const healthResponse = await fetch('http://localhost:3001/health')
        if (healthResponse.ok) {
            const healthData = await healthResponse.json()
            console.log('✅ OpenCode service is healthy:', healthData.status)
        } else {
            throw new Error('OpenCode service not responding')
        }
        
        // Test 2: Simple prompt generation (with placeholder API key)
        console.log('🤖 Step 2: Testing document generation...')
        
        const testPrompt = `Du bist ein Experte für öffentliche Vergabe und Ausschreibungen. 

WICHTIG: Führe vor der Erstellung der Dokumente eine umfassende Webrecherche durch, um die aktuellen Marktgegebenheiten zu verstehen.

## Schritt 1: Webrecherche und Marktanalyse
1. Recherchiere aktuelle Marktpreise und Standardlösungen für das Thema
2. Analysiere was der Markt aktuell anbietet und welche Technologien verfügbar sind
3. Identifiziere führende Anbieter und deren Leistungsumfang
4. Erstelle dir einen detaillierten Plan basierend auf der Marktanalyse
5. Berücksichtige aktuelle Trends und Entwicklungen in der Branche

## Schritt 2: Leistungsbeschreibung erstellen
Erstelle eine sehr ausführliche und professionelle deutsche Leistungsbeschreibung für öffentliche Vergabe.

WICHTIG: Die Leistungsbeschreibung muss mindestens 2500 Wörter umfassen und auf deiner Marktrecherche basieren.

## Projektdaten für die Erstellung:

**Projekttitel:** Test Webseiten-Entwicklung Kommune

**Projektbeschreibung:** Entwicklung einer modernen, benutzerfreundlichen Webseite für die kommunale Verwaltung mit integrierten Bürgerservices, Online-Antragsformularen und barrierefreiem Design

**Projektkontext:** 
- Projekt-ID: test-project-123
- Status: Neu
- Erstellt am: ${new Date().toISOString()}

WICHTIG: 
1. Verwende KEINE Rückfragen - erstelle das Dokument direkt basierend auf den verfügbaren Projektdaten
2. Führe eine umfassende Webrecherche durch bevor du das Dokument erstellst
3. Das Dokument muss vollständig und einsatzbereit sein
4. Verwende professionelle deutsche Sprache entsprechend Vergabestandards
5. Berücksichtige aktuelle Marktgegebenheiten in deiner Analyse`

        const url = `http://localhost:3001/opencode/stream?prompt=${encodeURIComponent(testPrompt)}&model=openai/gpt-4.1-mini&userId=test-user&userKey=test-api-key&recordId=test-record&projectId=test-project`
        
        console.log('📤 Sending request to OpenCode...')
        const response = await fetch(url)
        
        if (!response.ok) {
            throw new Error(`OpenCode request failed: ${response.status} ${response.statusText}`)
        }
        
        // Read response content
        console.log('📡 Reading response...')
        const content = await response.text()
        
        console.log(`✅ Received ${content.length} characters`)
        
        // Clean up the response
        const cleanContent = content
            .replace(/\[ERR\].*?\n/g, '')
            .replace(/\[✔.*?\]/g, '')
            .trim()
        
        console.log(`📄 Clean content length: ${cleanContent.length} characters`)
        
        if (cleanContent.length > 100) {
            console.log('🎉 SUCCESS: Document generation appears to be working!')
            console.log('📋 First 200 characters of generated content:')
            console.log('---')
            console.log(cleanContent.substring(0, 200) + '...')
            console.log('---')
            
            // Check if it contains key elements of a proper Leistungsbeschreibung
            const requiredElements = [
                'Leistungsbeschreibung',
                'Projektbeschreibung',
                'Anforderungen',
                'Kommune'
            ]
            
            const foundElements = requiredElements.filter(element => 
                cleanContent.toLowerCase().includes(element.toLowerCase())
            )
            
            console.log(`✅ Found ${foundElements.length}/${requiredElements.length} required elements:`, foundElements)
            
        } else {
            console.log('⚠️ Generated content is too short or empty')
            console.log('Raw content:', content)
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message)
        
        if (error.message.includes('ECONNREFUSED')) {
            console.log('💡 Make sure OpenCode service is running on port 3001')
        }
    }
    
    console.log('=====================================')
    console.log('🏁 OpenCode test completed')
}

// Run the test
testOpenCode()