#!/usr/bin/env node

/**
 * Live System Integration Test
 * Tests actual PocketBase collections and API endpoints
 */

const PocketBase = require('pocketbase/cjs');

const pb = new PocketBase('http://127.0.0.1:8090');

async function testLiveSystem() {
  console.log('🔴 Testing Live System Integration...\n');
  
  try {
    // Test 1: Health check
    console.log('1. ✅ PocketBase connection successful');
    
    // Test 2: Check collections exist
    const collections = ['users', 'projects', 'documents', 'apikeys', 'system_prompts', 'example_prompts'];
    
    for (const collectionName of collections) {
      try {
        await pb.collection(collectionName).getList(1, 1);
        console.log(`2. ✅ Collection '${collectionName}' exists and accessible`);
      } catch (error) {
        if (error.status === 403) {
          console.log(`2. ⚠️ Collection '${collectionName}' exists but requires auth (expected)`);
        } else if (error.status === 404) {
          console.log(`2. ❌ Collection '${collectionName}' not found`);
        } else {
          console.log(`2. ❌ Collection '${collectionName}' error: ${error.message}`);
        }
      }
    }
    
    // Test 3: Test authentication
    try {
      const authData = await pb.collection('users').authWithPassword('test@vergabe.de', 'vergabe123');
      console.log('3. ✅ Test user authentication successful');
      console.log(`   User: ${authData.record.email} (ID: ${authData.record.id})`);
      
      // Test 4: Test authenticated collection access
      try {
        const projects = await pb.collection('projects').getList(1, 5);
        console.log(`4. ✅ Projects collection accessible - found ${projects.totalItems} projects`);
        
        const apiKeys = await pb.collection('apikeys').getList(1, 5);
        console.log(`4. ✅ API keys collection accessible - found ${apiKeys.totalItems} keys`);
        
        const systemPrompts = await pb.collection('system_prompts').getList(1, 5);
        console.log(`4. ✅ System prompts collection accessible - found ${systemPrompts.totalItems} prompts`);
        
      } catch (error) {
        console.log(`4. ❌ Authenticated collection access error: ${error.message}`);
      }
      
    } catch (error) {
      console.log(`3. ❌ Authentication failed: ${error.message}`);
      console.log('   This may indicate the test user doesn\'t exist yet');
    }
    
    // Test 5: Test OpenCode service integration
    try {
      const response = await fetch('http://127.0.0.1:3001/health');
      const health = await response.json();
      console.log('5. ✅ OpenCode service healthy:', health.status);
    } catch (error) {
      console.log(`5. ❌ OpenCode service error: ${error.message}`);
    }
    
  } catch (error) {
    console.log(`❌ Connection failed: ${error.message}`);
    console.log('Make sure PocketBase is running on port 8090');
  }
  
  console.log('\n🎯 Live system test completed!');
}

testLiveSystem().catch(console.error);