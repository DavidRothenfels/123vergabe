#!/usr/bin/env node

/**
 * Test autonomous hook triggering by creating CLI command manually
 */

const sqlite3 = require('sqlite3').verbose()

async function triggerGeneration() {
    console.log('🔧 Manually triggering document generation')
    console.log('=========================================')
    
    try {
        const db = new sqlite3.Database('./pb_data/data.db')
        
        // Create CLI command manually (simulating what autonomous hook should do)
        const cliCommandId = await new Promise((resolve, reject) => {
            const id = 'r' + Math.random().toString(36).substring(2, 9) + Math.random().toString(36).substring(2, 9)
            const now = new Date().toISOString()
            
            const parameters = JSON.stringify({
                request_id: 'test-request-123',
                user_need_id: 'rtw8oe6cqbzrndr', // Use the user_need created in previous test
                created_at: now
            })
            
            db.run(`
                INSERT INTO cli_commands (
                    id, command, status, parameters, retry_count, created, updated
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                id,
                'generate_documents',
                'pending',
                parameters,
                0,
                now,
                now
            ], function(err) {
                if (err) reject(err)
                else {
                    console.log(`✅ Created CLI command: ${id}`)
                    resolve(id)
                }
            })
        })
        
        db.close()
        
        console.log('⏳ Waiting 15 seconds for CLI processor to pick up the command...')
        await new Promise(resolve => setTimeout(resolve, 15000))
        
        // Check if command was processed
        const db2 = new sqlite3.Database('./pb_data/data.db')
        const commandStatus = await new Promise((resolve, reject) => {
            db2.get(`
                SELECT status, error FROM cli_commands WHERE id = ?
            `, [cliCommandId], (err, row) => {
                if (err) reject(err)
                else resolve(row)
            })
        })
        
        console.log('📊 Command status:', commandStatus)
        
        // Check for generated documents
        const documents = await new Promise((resolve, reject) => {
            db2.all(`
                SELECT id, title, project_id, document_type, length(content) as content_length
                FROM documents 
                WHERE project_id = 'test-project-789'
                ORDER BY created DESC
            `, (err, rows) => {
                db2.close()
                if (err) reject(err)
                else resolve(rows)
            })
        })
        
        console.log(`🎉 Generated ${documents.length} documents:`)
        documents.forEach(doc => {
            console.log(`  - ${doc.title} (${doc.document_type}) - ${doc.content_length} chars`)
        })
        
        if (documents.length > 0) {
            console.log('✅ SUCCESS: Document generation is working!')
        } else {
            console.log('❌ No documents generated - check CLI processor logs')
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message)
    }
    
    console.log('=========================================')
}

triggerGeneration()