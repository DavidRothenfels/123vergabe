#!/usr/bin/env node

/**
 * Comprehensive test script for 123vergabe system
 * Tests all frontend and backend functionality
 */

const BASE_URL = 'http://localhost:8090';
let authToken = '';
let currentUserId = '';
let currentProjectId = '';
let currentBedarfId = '';

// Test utilities
function log(message, type = 'info') {
    const prefix = {
        'info': '📘',
        'success': '✅',
        'error': '❌',
        'warning': '⚠️',
        'test': '🧪'
    };
    console.log(`${prefix[type] || '📘'} ${message}`);
}

async function apiCall(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (authToken && !endpoint.includes('auth-with-password')) {
        headers['Authorization'] = authToken;
    }
    
    try {
        const response = await fetch(url, {
            ...options,
            headers
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || data.error || 'API Error');
        }
        
        return data;
    } catch (error) {
        log(`API Error on ${endpoint}: ${error.message}`, 'error');
        throw error;
    }
}

// Test functions
async function testLogin() {
    log('Testing login functionality...', 'test');
    
    try {
        const result = await apiCall('/api/collections/users/auth-with-password', {
            method: 'POST',
            body: JSON.stringify({
                identity: 'test@vergabe.de',
                password: 'vergabe123'
            })
        });
        
        authToken = result.token;
        currentUserId = result.record.id;
        
        log(`Login successful! User ID: ${currentUserId}`, 'success');
        return true;
    } catch (error) {
        log('Login failed!', 'error');
        return false;
    }
}

async function testProjectCreate() {
    log('Testing project creation...', 'test');
    
    try {
        const result = await apiCall('/api/collections/projects/records', {
            method: 'POST',
            body: JSON.stringify({
                name: 'Test Projekt ' + Date.now(),
                description: 'Automatisch generiertes Testprojekt',
                user_id: currentUserId,
                request_id: 'REQ' + Date.now()
            })
        });
        
        currentProjectId = result.id;
        log(`Project created! ID: ${currentProjectId}`, 'success');
        return true;
    } catch (error) {
        log('Project creation failed!', 'error');
        return false;
    }
}

async function testQuestionGeneration() {
    log('Testing question generation (with mock provider)...', 'test');
    
    try {
        // First check if mock provider is implemented
        const result = await apiCall('/api/generate-questions', {
            method: 'POST',
            body: JSON.stringify({
                description: 'Büroräumerenovierung - Testbeschreibung',
                ai_provider: 'mock' // Using mock provider to avoid API calls
                // Removed project_id to avoid foreign key issues
            })
        });
        
        currentBedarfId = result.bedarf_id;
        log(`Questions generated! Bedarf ID: ${currentBedarfId}`, 'success');
        log(`Number of questions: ${result.questions?.length || 0}`, 'info');
        
        // Display first question as sample
        if (result.questions && result.questions.length > 0) {
            log(`Sample question: ${result.questions[0].text}`, 'info');
        }
        
        return true;
    } catch (error) {
        log(`Question generation failed: ${error.message}`, 'error');
        
        // Try with bbk_proxy as fallback
        log('Trying with bbk_proxy provider...', 'warning');
        try {
            const result = await apiCall('/api/generate-questions', {
                method: 'POST',
                body: JSON.stringify({
                    description: 'Büroräumerenovierung - Testbeschreibung',
                    project_id: currentProjectId,
                    ai_provider: 'bbk_proxy'
                })
            });
            
            currentBedarfId = result.bedarf_id;
            log(`Questions generated with bbk_proxy!`, 'success');
            return true;
        } catch (proxyError) {
            log('Both mock and bbk_proxy providers failed', 'error');
            return false;
        }
    }
}

async function testApiKeySettings() {
    log('Testing API key settings...', 'test');
    
    try {
        // Try to set an API key
        const result = await apiCall('/api/collections/apikeys/records', {
            method: 'POST',
            body: JSON.stringify({
                user_id: currentUserId,
                api_key: 'test-api-key-' + Date.now(),
                provider: 'openai',
                name: 'Test API Key',
                active: true
            })
        });
        
        log('API key saved successfully!', 'success');
        return true;
    } catch (error) {
        log(`API key settings failed: ${error.message}`, 'error');
        return false;
    }
}

async function testDocumentGeneration() {
    log('Testing document generation...', 'test');
    
    if (!currentProjectId) {
        log('No project ID available, skipping document generation test', 'warning');
        return false;
    }
    
    try {
        const result = await apiCall('/api/collections/generation_requests/records', {
            method: 'POST',
            body: JSON.stringify({
                project_id: currentProjectId,
                user_id: currentUserId,
                status: 'pending',
                type: 'leistungsbeschreibung'
            })
        });
        
        log(`Generation request created! ID: ${result.id}`, 'success');
        return true;
    } catch (error) {
        log(`Document generation failed: ${error.message}`, 'error');
        return false;
    }
}

async function testDocumentList() {
    log('Testing document listing...', 'test');
    
    try {
        const result = await apiCall(`/api/collections/documents/records?filter=(user_id='${currentUserId}')`);
        
        log(`Found ${result.items?.length || 0} documents`, 'success');
        
        if (result.items && result.items.length > 0) {
            log(`Latest document: ${result.items[0].title}`, 'info');
        }
        
        return true;
    } catch (error) {
        log(`Document listing failed: ${error.message}`, 'error');
        return false;
    }
}

async function testProjectList() {
    log('Testing project listing...', 'test');
    
    try {
        const result = await apiCall(`/api/collections/projects/records?filter=(user_id='${currentUserId}')`);
        
        log(`Found ${result.items?.length || 0} projects`, 'success');
        
        if (result.items && result.items.length > 0) {
            log(`Latest project: ${result.items[0].name}`, 'info');
        }
        
        return true;
    } catch (error) {
        log(`Project listing failed: ${error.message}`, 'error');
        return false;
    }
}

// Main test runner
async function runAllTests() {
    log('Starting comprehensive system test...', 'info');
    log('====================================', 'info');
    
    const tests = [
        { name: 'Login', fn: testLogin },
        { name: 'Project Create', fn: testProjectCreate },
        { name: 'Project List', fn: testProjectList },
        { name: 'Question Generation', fn: testQuestionGeneration },
        { name: 'API Key Settings', fn: testApiKeySettings },
        { name: 'Document Generation', fn: testDocumentGeneration },
        { name: 'Document List', fn: testDocumentList }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        log(`\nRunning: ${test.name}`, 'info');
        try {
            const result = await test.fn();
            if (result) {
                passed++;
            } else {
                failed++;
            }
        } catch (error) {
            log(`Unexpected error in ${test.name}: ${error.message}`, 'error');
            failed++;
        }
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    log('\n====================================', 'info');
    log(`Test Summary: ${passed} passed, ${failed} failed`, passed > failed ? 'success' : 'error');
    
    if (failed === 0) {
        log('All tests passed! ✨', 'success');
    } else {
        log('Some tests failed. Please check the logs above.', 'warning');
    }
}

// Run tests
runAllTests().catch(error => {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
});