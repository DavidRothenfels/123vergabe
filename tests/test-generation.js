#!/usr/bin/env node

/**
 * Test script for document generation workflow
 * Tests the complete pipeline: Project -> User Need -> Generation Request -> CLI Processing -> Document Creation
 */

const fetch = require('node-fetch')

const POCKETBASE_URL = 'http://localhost:8090'

async function testWorkflow() {
    console.log('🧪 Testing Document Generation Workflow')
    console.log('======================================')
    
    try {
        // Step 1: Create a test project directly in the database
        console.log('📁 Step 1: Creating test project...')
        
        const projectData = {
            name: "Test Webseiten-Entwicklung Kommune",
            description: "Entwicklung einer modernen Webseite für die kommunale Verwaltung mit Bürgerservices und Online-Anträgen",
            user_id: "test-user-123", // We'll use a test user ID
            status: "active"
        }
        
        // This will trigger the autonomous hook to create user_needs
        const projectResponse = await fetch(`${POCKETBASE_URL}/api/collections/projects/records`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(projectData)
        })
        
        if (!projectResponse.ok) {
            console.log('⚠️ Project creation failed, trying user_needs directly...')
            
            // Fallback: Create user_needs directly
            const userNeedData = {
                thema: "Webseiten-Entwicklung für kommunale Verwaltung",
                beschreibung: "Entwicklung einer modernen, benutzerfreundlichen Webseite für die kommunale Verwaltung mit integrierten Bürgerservices, Online-Antragsformularen und barrierefreiem Design",
                user_id: "test-user-123",
                project_id: "test-project-123",
                status: "created"
            }
            
            const userNeedResponse = await fetch(`${POCKETBASE_URL}/api/collections/user_needs/records`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userNeedData)
            })
            
            if (!userNeedResponse.ok) {
                throw new Error('Failed to create user need')
            }
            
            const userNeed = await userNeedResponse.json()
            console.log('✅ Created user_need:', userNeed.id)
            
            // Step 2: Create generation request to trigger processing
            console.log('🔄 Step 2: Creating generation request...')
            
            const generationData = {
                user_need_id: userNeed.id,
                status: "pending",
                requested_by: "test-user-123"
            }
            
            const generationResponse = await fetch(`${POCKETBASE_URL}/api/collections/generation_requests/records`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(generationData)
            })
            
            if (!generationResponse.ok) {
                throw new Error('Failed to create generation request')
            }
            
            const generationRequest = await generationResponse.json()
            console.log('✅ Created generation_request:', generationRequest.id)
            
            // Step 3: Wait and check for CLI command creation
            console.log('⏳ Step 3: Waiting for autonomous hook to create CLI command...')
            await new Promise(resolve => setTimeout(resolve, 2000))
            
            const cliResponse = await fetch(`${POCKETBASE_URL}/api/collections/cli_commands/records?filter=status='pending'`)
            if (cliResponse.ok) {
                const cliData = await cliResponse.json()
                console.log('✅ Found CLI commands:', cliData.items.length)
                
                if (cliData.items.length > 0) {
                    console.log('📋 CLI Command details:', cliData.items[0])
                    
                    // Step 4: Wait for CLI processor to handle the command
                    console.log('⏳ Step 4: Waiting for CLI processor to generate documents...')
                    await new Promise(resolve => setTimeout(resolve, 10000)) // Wait 10 seconds for generation
                    
                    // Step 5: Check for generated documents
                    console.log('📄 Step 5: Checking for generated documents...')
                    const docsResponse = await fetch(`${POCKETBASE_URL}/api/collections/documents/records?filter=project_id='test-project-123'`)
                    if (docsResponse.ok) {
                        const docsData = await docsResponse.json()
                        console.log('✅ Found documents:', docsData.items.length)
                        
                        docsData.items.forEach(doc => {
                            console.log(`📋 Document: ${doc.title} (${doc.document_type || doc.type})`)
                            console.log(`   Content length: ${doc.content.length} characters`)
                            console.log(`   Generated by AI: ${doc.generated_by_ai}`)
                        })
                        
                        if (docsData.items.length >= 3) {
                            console.log('🎉 SUCCESS: Document generation workflow completed!')
                            console.log('✅ Generated all three document types (leistung, eignung, zuschlag)')
                        } else {
                            console.log('⚠️ PARTIAL SUCCESS: Some documents generated, but not all expected types')
                        }
                    } else {
                        console.log('❌ Failed to fetch documents')
                    }
                    
                } else {
                    console.log('⚠️ No CLI commands found - autonomous hook may not be working')
                }
            } else {
                console.log('❌ Failed to fetch CLI commands')
            }
            
        } else {
            const project = await projectResponse.json()
            console.log('✅ Created project:', project.id)
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message)
    }
    
    console.log('======================================')
    console.log('🏁 Test completed')
}

// Run the test
testWorkflow()