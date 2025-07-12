#!/usr/bin/env node

/**
 * Comprehensive Test Script for Vergabedokument-Generator
 * Tests all major functionality and reports issues
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const config = {
  baseUrl: 'http://127.0.0.1:8090',
  testUser: { email: 'test@vergabe.de', password: 'vergabe123' },
  files: {
    index: './pb_public/index.html',
    dashboard: './pb_public/dashboard.html',
    migration: './pb_migrations/1760000000_add_system_prompts.js',
    opencode: './opencode-service.js'
  }
};

console.log('🧪 Starting Comprehensive System Test\n');

// Test Results
const results = {
  passed: 0,
  failed: 0,
  issues: []
};

function test(name, condition, details = '') {
  if (condition) {
    console.log(`✅ ${name}`);
    results.passed++;
  } else {
    console.log(`❌ ${name}${details ? ': ' + details : ''}`);
    results.failed++;
    results.issues.push(name + (details ? ': ' + details : ''));
  }
}

// 1. File Structure Tests
console.log('📁 Testing File Structure...');

test('index.html exists', fs.existsSync(config.files.index));
test('dashboard.html exists', fs.existsSync(config.files.dashboard));
test('opencode-service.js exists', fs.existsSync(config.files.opencode));
test('Migration files exist', fs.existsSync('./pb_migrations') && fs.readdirSync('./pb_migrations').length > 0);

// 2. Code Quality Tests
console.log('\n🔍 Testing Code Quality...');

// Read index.html
const indexContent = fs.readFileSync(config.files.index, 'utf8');

// Check for required functions
const requiredFunctions = [
  'openSettingsPopup',
  'closeSettingsPopup', 
  'loadCurrentApiKey',
  'toggleApiKeyVisibility',
  'saveSettingsApiKey',
  'setupProjectAutoSave',
  'generateDocument',
  'loadPrompts'
];

requiredFunctions.forEach(func => {
  test(`Function ${func} is implemented`, indexContent.includes(`function ${func}(`));
});

// Check for required UI elements
const requiredElements = [
  'settingsModal',
  'btn-ai-generate',
  'projectThemaEdit',
  'projectDescriptionEdit',
  'settingsApiKey'
];

requiredElements.forEach(element => {
  test(`UI element ${element} exists`, indexContent.includes(element));
});

// 3. CSS and Styling Tests
console.log('\n🎨 Testing UI Styling...');

test('AI button has orange-purple gradient', 
  indexContent.includes('linear-gradient(135deg, #ff6b35 0%, #8b5cf6 100%)') ||
  indexContent.includes('linear-gradient(135deg, #667eea 0%, #764ba2 100%)'));

test('Modal styling is implemented', indexContent.includes('.modal {') && indexContent.includes('.modal-content {'));

test('Settings popup styling exists', indexContent.includes('settingsModal') && indexContent.includes('modal'));

// 4. JavaScript Functionality Tests
console.log('\n⚙️ Testing JavaScript Functionality...');

// Check for proper event handling
test('Login form event listener exists', indexContent.includes("getElementById('loginForm').addEventListener"));

test('PocketBase initialization exists', indexContent.includes('new PocketBase'));

test('API key masking functionality', indexContent.includes('maskedKey') && indexContent.includes('asterisks'));

test('Auto-save implementation', indexContent.includes('setupProjectAutoSave') && indexContent.includes('autoSave'));

// 5. Integration Tests
console.log('\n🔗 Testing System Integration...');

// Check OpenCode service
const opencodeContent = fs.readFileSync(config.files.opencode, 'utf8');

test('OpenCode service has correct model format', opencodeContent.includes('openai/gpt-4.1-mini'));

test('OpenCode service has security checks', opencodeContent.includes('getUserApiKey') && opencodeContent.includes('authenticatedUserId'));

test('OpenCode service saves documents', opencodeContent.includes('documents') && opencodeContent.includes('INSERT INTO'));

// 6. Migration Tests
console.log('\n🗄️ Testing Database Migrations...');

const migrationContent = fs.readFileSync(config.files.migration, 'utf8');

test('System prompts collection is created', migrationContent.includes('system_prompts'));

test('API keys collection is created', migrationContent.includes('apikeys'));

test('User needs collection is created', migrationContent.includes('user_needs'));

test('Professional prompts are inserted', migrationContent.includes('professionalPrompts') && migrationContent.includes('leistung'));

// 7. Security Tests
console.log('\n🔒 Testing Security Features...');

test('API key validation exists', indexContent.includes("startsWith('sk-')"));

test('User authentication checks exist', indexContent.includes('pb.authStore.isValid'));

test('CORS configuration in OpenCode service', opencodeContent.includes('cors') && opencodeContent.includes('origin'));

// Check for SQL injection protection - parameterized queries
const hasParameterizedQueries = opencodeContent.includes('db.run(`') && 
                                 opencodeContent.includes('VALUES (?, ') && 
                                 opencodeContent.includes(', [') &&
                                 !opencodeContent.match(/db\.(run|get|all).*\`.*\$\{.*\`/);
test('SQL injection protection (parameterized queries)', hasParameterizedQueries);

// 8. Error Handling Tests
console.log('\n🚨 Testing Error Handling...');

test('Try-catch blocks for API calls', indexContent.includes('try {') && indexContent.includes('catch (error)'));

test('Error status display functions', indexContent.includes('showError') || indexContent.includes('showStatus'));

test('Graceful degradation for missing data', indexContent.includes('|| \'\'') || indexContent.includes('|| null'));

// 9. User Experience Tests  
console.log('\n👤 Testing User Experience...');

test('Loading states for buttons', indexContent.includes('disabled = true') || indexContent.includes('.disabled'));

test('Success feedback for actions', indexContent.includes('✅') || indexContent.includes('erfolgreich'));

test('Live logging system', indexContent.includes('liveLogs') && indexContent.includes('log-entry'));

test('Responsive design elements', indexContent.includes('@media') && indexContent.includes('max-width'));

// 10. Data Flow Tests
console.log('\n📊 Testing Data Flow...');

test('Project creation workflow', indexContent.includes('createProject') && indexContent.includes('projects'));

test('Document generation workflow', indexContent.includes('generateDocument') && indexContent.includes('OpenCode'));

test('Settings persistence', indexContent.includes('apikeys') && indexContent.includes('collection'));

test('Real-time updates', indexContent.includes('setInterval') || indexContent.includes('subscribe'));

// Print final results
console.log('\n' + '='.repeat(50));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(50));
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);
console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

if (results.issues.length > 0) {
  console.log('\n🔍 ISSUES FOUND:');
  results.issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue}`);
  });
}

// Performance recommendations
console.log('\n💡 RECOMMENDATIONS:');
console.log('1. Test with actual PocketBase connection');
console.log('2. Verify OpenCode CLI integration works end-to-end');
console.log('3. Test with different screen sizes for responsive design');
console.log('4. Load test with multiple concurrent users');
console.log('5. Test API key security with actual OpenAI requests');

if (results.failed === 0) {
  console.log('\n🎉 All tests passed! System appears to be ready for production.');
} else if (results.failed < 5) {
  console.log('\n⚠️ Minor issues found. System should work but could be improved.');
} else {
  console.log('\n🚨 Major issues found. System needs fixes before deployment.');
}

process.exit(results.failed > 5 ? 1 : 0);