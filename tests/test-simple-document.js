#!/usr/bin/env node

const fetch = require('node-fetch')

async function testSimpleDocument() {
    console.log('🧪 Testing Simple Document Creation')
    
    // Test with minimal required fields
    const minimalDoc = {
        title: "Test",
        content: "Test content"
    }
    
    try {
        console.log('📤 Creating minimal document...')
        const response = await fetch('http://localhost:8090/api/collections/documents/records', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(minimalDoc)
        })
        
        if (response.ok) {
            const result = await response.json()
            console.log('✅ Minimal document created:', result.id)
        } else {
            console.log('❌ Failed:', response.status, await response.text())
        }
        
        // Test with additional fields one by one
        const testFields = {
            project_id: "test-project",
            user_id: "test-user", 
            document_type: "leistung",
            generated_by_ai: true
        }
        
        for (const [key, value] of Object.entries(testFields)) {
            const testDoc = { ...minimalDoc, [key]: value }
            console.log(`\n📤 Testing with ${key}:`, value)
            
            const testResponse = await fetch('http://localhost:8090/api/collections/documents/records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testDoc)
            })
            
            if (testResponse.ok) {
                const result = await testResponse.json()
                console.log(`✅ ${key} test passed:`, result.id)
            } else {
                console.log(`❌ ${key} test failed:`, testResponse.status, await testResponse.text())
            }
        }
        
    } catch (error) {
        console.log('❌ Error:', error.message)
    }
}

testSimpleDocument()