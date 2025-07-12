#!/usr/bin/env node

/**
 * Vollautomatisierte System-Tests für das OpenCode Multiuser System
 * Testet alle Funktionen: Login, Projekt-Erstellung, API-Keys, Prompts, Dokumente
 */

const fs = require('fs');
const path = require('path');

// Test-Konfiguration
const CONFIG = {
    baseURL: 'https://cli.a-g-e-n-t.de',
    testUser: {
        email: 'test@vergabe.de',
        password: 'vergabe123'
    },
    adminUser: {
        email: 'admin@vergabe.de', 
        password: 'admin123'
    },
    testTimeout: 30000,
    logFile: path.join(__dirname, 'test_results.log')
};

// Global variables
let testResults = [];
let authToken = null;
let adminToken = null;
let currentUserId = null;
let testProjectId = null;

// Test-Utilities
class TestRunner {
    constructor() {
        this.startTime = Date.now();
        this.testCount = 0;
        this.passCount = 0;
        this.failCount = 0;
    }

    async log(message, level = 'INFO') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${level}: ${message}`;
        console.log(logEntry);
        
        // Append to log file
        fs.appendFileSync(CONFIG.logFile, logEntry + '\n');
    }

    async test(name, testFunction) {
        this.testCount++;
        this.log(`🧪 Test ${this.testCount}: ${name}`, 'TEST');
        
        try {
            const result = await testFunction();
            this.passCount++;
            this.log(`✅ PASS: ${name}`, 'PASS');
            testResults.push({ name, status: 'PASS', result });
            return result;
        } catch (error) {
            this.failCount++;
            this.log(`❌ FAIL: ${name} - ${error.message}`, 'FAIL');
            testResults.push({ name, status: 'FAIL', error: error.message });
            throw error;
        }
    }

    async apiCall(endpoint, options = {}) {
        const url = `${CONFIG.baseURL}${endpoint}`;
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'OpenCode-Test-Suite/1.0'
            }
        };

        const mergedOptions = { ...defaultOptions, ...options };
        
        if (authToken && !mergedOptions.headers.Authorization) {
            mergedOptions.headers.Authorization = `Bearer ${authToken}`;
        }

        this.log(`📡 API Call: ${mergedOptions.method} ${url}`);
        
        const response = await fetch(url, mergedOptions);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${data.message || 'Unknown error'}`);
        }
        
        return data;
    }

    generateReport() {
        const duration = Date.now() - this.startTime;
        const report = {
            summary: {
                total: this.testCount,
                passed: this.passCount,
                failed: this.failCount,
                duration: `${duration}ms`,
                timestamp: new Date().toISOString()
            },
            tests: testResults
        };

        // Save detailed report
        fs.writeFileSync(
            path.join(__dirname, 'test_report.json'),
            JSON.stringify(report, null, 2)
        );

        return report;
    }
}

// Test Suite
class SystemTests {
    constructor(runner) {
        this.runner = runner;
    }

    // 1. AUTHENTICATION TESTS
    async testUserLogin() {
        const response = await this.runner.apiCall('/api/collections/users/auth-with-password', {
            method: 'POST',
            body: JSON.stringify({
                identity: CONFIG.testUser.email,
                password: CONFIG.testUser.password
            })
        });

        if (!response.token || !response.record) {
            throw new Error('Login response missing token or record');
        }

        authToken = response.token;
        currentUserId = response.record.id;
        
        return { userId: currentUserId, token: authToken };
    }

    async testAdminLogin() {
        const response = await this.runner.apiCall('/api/collections/_superusers/auth-with-password', {
            method: 'POST',
            body: JSON.stringify({
                identity: CONFIG.adminUser.email,
                password: CONFIG.adminUser.password
            })
        });

        if (!response.token || !response.record) {
            throw new Error('Admin login response missing token or record');
        }

        adminToken = response.token;
        return { adminId: response.record.id, token: adminToken };
    }

    // 2. PROJECT MANAGEMENT TESTS
    async testProjectCreation() {
        const projectData = {
            name: `Test Project ${Date.now()}`,
            description: 'Automated test project',
            budget: 10000,
            deadline: '2024-12-31',
            eckpunkte: 'Test project specifications',
            user_id: currentUserId,
            request_id: `TEST-${Date.now()}`
        };

        const response = await this.runner.apiCall('/api/collections/projects/records', {
            method: 'POST',
            body: JSON.stringify(projectData)
        });

        if (!response.id || response.name !== projectData.name) {
            throw new Error('Project creation failed or returned invalid data');
        }

        testProjectId = response.id;
        return response;
    }

    async testProjectList() {
        const response = await this.runner.apiCall(`/api/collections/projects/records?filter=user_id="${currentUserId}"`);
        
        if (!response.items || !Array.isArray(response.items)) {
            throw new Error('Project list response invalid');
        }

        const testProject = response.items.find(p => p.id === testProjectId);
        if (!testProject) {
            throw new Error('Created test project not found in list');
        }

        return response.items;
    }

    // 3. API KEY TESTS
    async testApiKeySaving() {
        const apiKeyData = {
            user_id: currentUserId,
            provider: 'openai',
            api_key: 'sk-test-key-for-automated-testing-only',
            name: 'Test API Key',
            active: true
        };

        const response = await this.runner.apiCall('/api/collections/apikeys/records', {
            method: 'POST',
            body: JSON.stringify(apiKeyData)
        });

        if (!response.id || response.provider !== 'openai') {
            throw new Error('API key creation failed');
        }

        return response;
    }

    async testApiKeyList() {
        const response = await this.runner.apiCall(`/api/collections/apikeys/records?filter=user_id="${currentUserId}"`);
        
        if (!response.items || !Array.isArray(response.items)) {
            throw new Error('API key list response invalid');
        }

        return response.items;
    }

    // 4. PROMPTS TESTS
    async testPromptsList() {
        const response = await this.runner.apiCall('/api/collections/example_prompts/records');
        
        if (!response.items || !Array.isArray(response.items)) {
            throw new Error('Prompts list response invalid');
        }

        if (response.items.length === 0) {
            throw new Error('No example prompts found');
        }

        return response.items;
    }

    // 5. DOCUMENTS TESTS
    async testDocumentCreation() {
        const documentData = {
            title: 'Test Document',
            content: '# Test Document\n\nThis is a test document created by automated testing.',
            project_id: testProjectId,
            user_id: currentUserId,
            request_id: `DOC-${Date.now()}`
        };

        const response = await this.runner.apiCall('/api/collections/documents/records', {
            method: 'POST',
            body: JSON.stringify(documentData)
        });

        if (!response.id || response.title !== documentData.title) {
            throw new Error('Document creation failed');
        }

        return response;
    }

    // 6. COLLECTIONS STRUCTURE TESTS
    async testCollectionStructure() {
        const requiredCollections = ['users', 'projects', 'apikeys', 'example_prompts', 'documents'];
        const results = {};

        for (const collection of requiredCollections) {
            try {
                const response = await this.runner.apiCall(`/api/collections/${collection}`);
                results[collection] = {
                    exists: true,
                    fields: response.fields?.length || 0,
                    rules: {
                        list: response.listRule || null,
                        create: response.createRule || null,
                        update: response.updateRule || null,
                        delete: response.deleteRule || null
                    }
                };
            } catch (error) {
                results[collection] = {
                    exists: false,
                    error: error.message
                };
            }
        }

        return results;
    }

    // 7. PERFORMANCE TESTS
    async testResponseTimes() {
        const endpoints = [
            '/api/collections/users/auth-with-password',
            '/api/collections/projects/records',
            '/api/collections/apikeys/records',
            '/api/collections/example_prompts/records'
        ];

        const results = {};

        for (const endpoint of endpoints) {
            const startTime = Date.now();
            try {
                if (endpoint.includes('auth-with-password')) {
                    await this.runner.apiCall(endpoint, {
                        method: 'POST',
                        body: JSON.stringify({
                            identity: CONFIG.testUser.email,
                            password: CONFIG.testUser.password
                        })
                    });
                } else {
                    await this.runner.apiCall(endpoint);
                }
                const duration = Date.now() - startTime;
                results[endpoint] = { duration, status: 'success' };
            } catch (error) {
                const duration = Date.now() - startTime;
                results[endpoint] = { duration, status: 'error', error: error.message };
            }
        }

        return results;
    }

    // 8. CLEANUP TESTS
    async testCleanup() {
        const cleanupResults = {};

        // Delete test project
        if (testProjectId) {
            try {
                await this.runner.apiCall(`/api/collections/projects/records/${testProjectId}`, {
                    method: 'DELETE'
                });
                cleanupResults.project = 'deleted';
            } catch (error) {
                cleanupResults.project = `error: ${error.message}`;
            }
        }

        // Delete test API keys
        try {
            const apiKeys = await this.runner.apiCall(`/api/collections/apikeys/records?filter=user_id="${currentUserId}"`);
            for (const key of apiKeys.items) {
                if (key.name === 'Test API Key') {
                    await this.runner.apiCall(`/api/collections/apikeys/records/${key.id}`, {
                        method: 'DELETE'
                    });
                }
            }
            cleanupResults.apikeys = 'cleaned';
        } catch (error) {
            cleanupResults.apikeys = `error: ${error.message}`;
        }

        return cleanupResults;
    }
}

// Main test execution
async function runTests() {
    console.log('🚀 Starting OpenCode Multiuser System Tests...\n');
    
    // Initialize test runner
    const runner = new TestRunner();
    const tests = new SystemTests(runner);

    try {
        // Clear previous log
        if (fs.existsSync(CONFIG.logFile)) {
            fs.unlinkSync(CONFIG.logFile);
        }

        runner.log('🔧 Starting comprehensive system tests');

        // 1. Authentication Tests
        runner.log('📝 Phase 1: Authentication Tests');
        await runner.test('User Login', () => tests.testUserLogin());
        await runner.test('Admin Login', () => tests.testAdminLogin());

        // 2. Collection Structure Tests
        runner.log('📝 Phase 2: Collection Structure Tests');
        await runner.test('Collection Structure', () => tests.testCollectionStructure());

        // 3. Project Management Tests
        runner.log('📝 Phase 3: Project Management Tests');
        await runner.test('Project Creation', () => tests.testProjectCreation());
        await runner.test('Project List', () => tests.testProjectList());

        // 4. API Key Tests
        runner.log('📝 Phase 4: API Key Tests');
        await runner.test('API Key Saving', () => tests.testApiKeySaving());
        await runner.test('API Key List', () => tests.testApiKeyList());

        // 5. Prompts Tests
        runner.log('📝 Phase 5: Prompts Tests');
        await runner.test('Prompts List', () => tests.testPromptsList());

        // 6. Documents Tests
        runner.log('📝 Phase 6: Documents Tests');
        await runner.test('Document Creation', () => tests.testDocumentCreation());

        // 7. Performance Tests
        runner.log('📝 Phase 7: Performance Tests');
        await runner.test('Response Times', () => tests.testResponseTimes());

        // 8. Cleanup Tests
        runner.log('📝 Phase 8: Cleanup Tests');
        await runner.test('Cleanup', () => tests.testCleanup());

    } catch (error) {
        runner.log(`💥 Test execution failed: ${error.message}`, 'ERROR');
    }

    // Generate final report
    const report = runner.generateReport();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${report.summary.total}`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⏱️  Duration: ${report.summary.duration}`);
    console.log(`📁 Report saved to: test_report.json`);
    console.log(`📋 Logs saved to: test_results.log`);
    
    if (report.summary.failed > 0) {
        console.log('\n🔍 FAILED TESTS:');
        testResults.filter(t => t.status === 'FAIL').forEach(test => {
            console.log(`  ❌ ${test.name}: ${test.error}`);
        });
    }

    console.log('\n🎉 Test execution completed!');
    
    // Exit with appropriate code
    process.exit(report.summary.failed > 0 ? 1 : 0);
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    process.exit(1);
});

// Run tests if called directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests, SystemTests, TestRunner };