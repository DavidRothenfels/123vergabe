#!/usr/bin/env node

/**
 * Test API key creation directly in database
 */

const sqlite3 = require('sqlite3').verbose()

async function testApiKeyCreation() {
    console.log('🧪 Testing API Key Creation')
    console.log('===========================')
    
    try {
        const db = new sqlite3.Database('./pb_data/data.db')
        
        // Test user ID from the error message
        const userId = 'hmfwzq8txbc9d2w'
        const testApiKey = 'sk-test123456789abcdef'
        
        console.log('👤 User ID:', userId)
        console.log('🔑 Test API Key:', testApiKey.substring(0, 10) + '...')
        
        // Create API key record directly
        const apiKeyId = await new Promise((resolve, reject) => {
            const id = 'r' + Math.random().toString(36).substring(2, 9) + Math.random().toString(36).substring(2, 9)
            const now = new Date().toISOString()
            
            db.run(`
                INSERT INTO apikeys (
                    id, user_id, provider, api_key, name, active, created, updated
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                id,
                userId,
                'openai',
                testApiKey,
                'Test API Key ' + new Date().toLocaleDateString('de-DE'),
                1, // true
                now,
                now
            ], function(err) {
                if (err) reject(err)
                else {
                    console.log('✅ API key created directly in DB:', id)
                    resolve(id)
                }
            })
        })
        
        // Verify the record was created
        const savedRecord = await new Promise((resolve, reject) => {
            db.get(`
                SELECT id, user_id, provider, api_key, name, active 
                FROM apikeys 
                WHERE id = ?
            `, [apiKeyId], (err, row) => {
                if (err) reject(err)
                else resolve(row)
            })
        })
        
        console.log('📋 Saved record:', {
            id: savedRecord.id,
            user_id: savedRecord.user_id,
            provider: savedRecord.provider,
            name: savedRecord.name,
            active: savedRecord.active,
            api_key_preview: savedRecord.api_key.substring(0, 10) + '...'
        })
        
        db.close()
        
        console.log('🎉 Direct database creation successful!')
        console.log('💡 The issue is likely with PocketBase API validation, not the database')
        
    } catch (error) {
        console.error('❌ Test failed:', error.message)
    }
    
    console.log('===========================')
}

testApiKeyCreation()