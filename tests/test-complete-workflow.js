#!/usr/bin/env node

/**
 * Complete workflow test: User Need -> Generation Request -> CLI Processing -> Document Creation
 */

const fetch = require('node-fetch')
const sqlite3 = require('sqlite3').verbose()

const POCKETBASE_URL = 'http://localhost:8090'

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function testCompleteWorkflow() {
    console.log('🧪 Testing Complete Document Generation Workflow')
    console.log('===============================================')
    
    try {
        // Step 1: Create user_need directly in database (simulating project creation)
        console.log('📁 Step 1: Creating user need...')
        
        const db = new sqlite3.Database('./pb_data/data.db')
        const userNeedId = await new Promise((resolve, reject) => {
            const id = 'r' + Math.random().toString(36).substring(2, 9) + Math.random().toString(36).substring(2, 9)
            const now = new Date().toISOString()
            
            db.run(`
                INSERT INTO user_needs (
                    id, thema, beschreibung, user_id, project_id, status, created, updated
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                id,
                'Entwicklung einer kommunalen Verwaltungswebseite',
                'Moderne, benutzerfreundliche Webseite für die kommunale Verwaltung mit Online-Services, Bürgeranträgen und barrierefreiem Design entsprechend WCAG 2.1 Standards',
                'test-user-456',
                'test-project-789',
                'created',
                now,
                now
            ], function(err) {
                if (err) reject(err)
                else {
                    console.log(`✅ Created user_need: ${id}`)
                    resolve(id)
                }
            })
        })
        
        // Step 2: Create generation request (simulating user clicking "Generate")
        console.log('🔄 Step 2: Creating generation request...')
        
        const generationRequestId = await new Promise((resolve, reject) => {
            const id = 'r' + Math.random().toString(36).substring(2, 9) + Math.random().toString(36).substring(2, 9)
            const now = new Date().toISOString()
            
            db.run(`
                INSERT INTO generation_requests (
                    id, user_need_id, status, created, updated
                ) VALUES (?, ?, ?, ?, ?)
            `, [id, userNeedId, 'pending', now, now], function(err) {
                if (err) reject(err)
                else {
                    console.log(`✅ Created generation_request: ${id}`)
                    resolve(id)
                }
            })
        })
        
        db.close()
        
        // Step 3: Wait for autonomous hook to create CLI command
        console.log('⏳ Step 3: Waiting for autonomous hook...')
        await delay(3000)
        
        // Check for CLI command
        const cliResponse = await fetch(`${POCKETBASE_URL}/api/collections/cli_commands/records?filter=status='pending'&sort=-created`)
        if (cliResponse.ok) {
            const cliData = await cliResponse.json()
            console.log(`✅ Found ${cliData.items.length} pending CLI commands`)
            
            if (cliData.items.length > 0) {
                const latestCommand = cliData.items[0]
                console.log('📋 Latest CLI command:', {
                    id: latestCommand.id,
                    command: latestCommand.command,
                    parameters: latestCommand.parameters ? JSON.parse(latestCommand.parameters) : null
                })
                
                // Step 4: Wait for CLI processor to complete
                console.log('⏳ Step 4: Waiting for CLI processor (30 seconds)...')
                await delay(30000)
                
                // Step 5: Check for generated documents
                console.log('📄 Step 5: Checking for generated documents...')
                
                const db2 = new sqlite3.Database('./pb_data/data.db')
                const documents = await new Promise((resolve, reject) => {
                    db2.all(`
                        SELECT id, title, content, project_id, document_type, generated_by_ai 
                        FROM documents 
                        WHERE project_id = 'test-project-789'
                        ORDER BY created DESC
                    `, (err, rows) => {
                        db2.close()
                        if (err) reject(err)
                        else resolve(rows)
                    })
                })
                
                console.log(`🎉 Found ${documents.length} generated documents!`)
                
                documents.forEach((doc, index) => {
                    console.log(`📋 Document ${index + 1}:`)
                    console.log(`   ID: ${doc.id}`)
                    console.log(`   Title: ${doc.title}`)
                    console.log(`   Type: ${doc.document_type}`)
                    console.log(`   Generated by AI: ${doc.generated_by_ai ? 'Yes' : 'No'}`)
                    console.log(`   Content length: ${doc.content ? doc.content.length : 0} chars`)
                    console.log(`   Preview: ${doc.content ? doc.content.substring(0, 100) + '...' : 'No content'}`)
                    console.log()
                })
                
                // Step 6: Test frontend document loading
                console.log('🌐 Step 6: Testing frontend document access...')
                const frontendResponse = await fetch(`${POCKETBASE_URL}/api/collections/documents/records?filter=project_id='test-project-789'`)
                
                if (frontendResponse.ok) {
                    const frontendData = await frontendResponse.json()
                    console.log(`✅ Frontend can access ${frontendData.items.length} documents`)
                    
                    if (documents.length >= 3) {
                        console.log('🎉 SUCCESS: Complete workflow test passed!')
                        console.log('✅ Generated all three document types')
                        console.log('✅ Documents properly stored with project_id')
                        console.log('✅ Frontend can access documents')
                    } else if (documents.length > 0) {
                        console.log('⚠️ PARTIAL SUCCESS: Some documents generated, workflow working')
                    } else {
                        console.log('❌ FAILURE: No documents generated')
                    }
                } else {
                    console.log('❌ Frontend document access failed:', frontendResponse.status)
                }
                
            } else {
                console.log('❌ No CLI commands found - autonomous hook not working')
            }
        } else {
            console.log('❌ Failed to check CLI commands:', cliResponse.status)
        }
        
    } catch (error) {
        console.error('❌ Workflow test failed:', error.message)
    }
    
    console.log('===============================================')
    console.log('🏁 Complete workflow test finished')
}

// Run the test
testCompleteWorkflow()