#!/usr/bin/env node

/**
 * Test document creation with authentication
 */

const PocketBase = require('pocketbase/cjs')

async function testAuthenticatedDocumentCreation() {
    console.log('🧪 Testing Authenticated Document Creation')
    console.log('=======================================')
    
    try {
        const pb = new PocketBase('http://localhost:8090')
        
        // Try to authenticate with demo user
        console.log('🔐 Authenticating...')
        try {
            await pb.collection('users').authWithPassword('test@vergabe.de', 'vergabe123')
            console.log('✅ Authentication successful')
            console.log('👤 User:', pb.authStore.model.email)
        } catch (authError) {
            console.log('⚠️ Demo user auth failed, trying admin...')
            await pb.collection('users').authWithPassword('admin@vergabe.de', 'admin123')
            console.log('✅ Admin authentication successful')
        }
        
        // Test document creation with authentication
        console.log('📄 Creating document...')
        
        const testDoc = {
            title: "Test Auth Document",
            content: "This is a test document created with authentication",
            project_id: "test-project-auth",
            user_id: pb.authStore.model.id,
            document_type: "leistung",
            type: "leistungsbeschreibung",
            created_by: pb.authStore.model.email,
            generated_by_ai: false
        }
        
        const result = await pb.collection('documents').create(testDoc)
        console.log('✅ Document created successfully!')
        console.log('📋 Document ID:', result.id)
        console.log('📋 Title:', result.title)
        console.log('📋 Project ID:', result.project_id)
        console.log('📋 Document Type:', result.document_type)
        
        // Test loading documents
        console.log('\n🔍 Testing document loading...')
        const docs = await pb.collection('documents').getList(1, 10, {
            filter: `project_id = "test-project-auth"`
        })
        
        console.log(`✅ Found ${docs.items.length} documents`)
        docs.items.forEach(doc => {
            console.log(`  - ${doc.title} (${doc.document_type})`)
        })
        
    } catch (error) {
        console.error('❌ Test failed:', error.message)
        if (error.data) {
            console.error('📄 Error details:', JSON.stringify(error.data, null, 2))
        }
    }
    
    console.log('=======================================')
}

testAuthenticatedDocumentCreation()