# Test Scripts

This directory contains all test scripts for the Vergabedokument-Generator project.

## Test Categories

### API Tests
- `test-apikey-api.sh` - Test API key creation via PocketBase API
- `test-auth-document.js` - Test document creation with authentication
- `test-curl-auth.sh` - Test authentication using curl

### Document Generation Tests
- `test-complete-workflow.js` - End-to-end document generation workflow
- `test-document-creation.js` - Test document creation functionality
- `test-generation.js` - Test document generation process
- `test-opencode-simple.js` - Test OpenCode service integration
- `test-trigger-generation.js` - Test manual generation triggering

### System Tests
- `test-system.js` - Comprehensive system testing
- `test_system.js` - Alternative system test script
- `test-live.js` - Live system testing
- `test-live.sh` - Live system shell tests
- `test-dashboard.js` - Dashboard functionality tests

### Minimal/Debug Tests
- `test-minimal-doc.sh` - Test minimal document creation
- `test-simple-document.js` - Simple document creation test
- `test-exact-apikey.sh` - Exact API key creation debugging
- `test-apikey-creation.js` - API key creation testing

### Frontend Tests
- `test_frontend.html` - Frontend functionality testing
- `test-user-creation.js` - User creation testing

## Usage

Make sure PocketBase and OpenCode service are running before executing tests:

```bash
# Start services
./pocketbase serve --http=0.0.0.0:8090 &
node opencode-service.js &

# Run individual tests
cd tests
./test-complete-workflow.js
./test-apikey-api.sh
```

## Notes

- Shell scripts (`.sh`) are executable test files
- JavaScript files (`.js`) should be run with `node`
- HTML files can be opened in browser for manual testing
- Most tests require authentication and active services