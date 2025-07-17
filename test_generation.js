// Test script for 123vergabe document generation
const PocketBase = require('pocketbase');

async function testGeneration() {
  const pb = new PocketBase('http://127.0.0.1:8090');
  
  try {
    // 1. Create test user
    const userData = await pb.collection('users').create({
      email: 'test@123vergabe.de',
      password: 'test123456',
      passwordConfirm: 'test123456',
      name: 'Test User'
    });
    console.log('✅ User created:', userData.email);
    
    // 2. Authenticate
    const authData = await pb.collection('users').authWithPassword(
      'test@123vergabe.de',
      'test123456'
    );
    console.log('✅ Authenticated:', authData.token ? 'Success' : 'Failed');
    
    // 3. Create a project
    const project = await pb.collection('projects').create({
      name: 'Test Projekt',
      description: 'Test Beschreibung'
    });
    console.log('✅ Project created:', project.id);
    
    // 4. Test question generation
    const questionsResponse = await fetch('http://127.0.0.1:8090/api/generate-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authData.token
      },
      body: JSON.stringify({
        description: 'Ich benötige eine Softwarelösung für die digitale Verwaltung von Ausschreibungen und Vergabeverfahren.',
        project_id: project.id
      })
    });
    
    const questionsData = await questionsResponse.json();
    console.log('✅ Questions generated:', questionsData.questions ? questionsData.questions.length : 'Failed');
    
    // 5. Simulate answers
    if (questionsData.questions) {
      const answers = {};
      questionsData.questions.forEach((q, i) => {
        answers[`q${i}`] = `Test answer for: ${q.question}`;
      });
      
      // 6. Generate description from Q&A
      const descResponse = await fetch('http://127.0.0.1:8090/api/generate-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authData.token
        },
        body: JSON.stringify({
          bedarf_id: questionsData.bedarf_id,
          answers: answers
        })
      });
      
      const descData = await descResponse.json();
      console.log('✅ Description generated:', descData.description ? 'Success' : 'Failed');
      
      // 7. Generate document from template
      const docResponse = await fetch('http://127.0.0.1:8090/api/generate-from-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authData.token
        },
        body: JSON.stringify({
          bedarf_id: questionsData.bedarf_id,
          template_id: 'default_template_1'
        })
      });
      
      const docData = await docResponse.json();
      console.log('✅ Document generated:', docData.document_id ? 'Success' : 'Failed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  testGeneration();
}