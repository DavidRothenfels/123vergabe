#!/bin/bash

echo "=== Testing 123vergabe API ==="

# 1. Create test user
echo -e "\n1. Creating test user..."
USER_RESPONSE=$(curl -s -X POST http://127.0.0.1:8090/api/collections/users/records \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@123vergabe.de",
    "password": "test123456",
    "passwordConfirm": "test123456",
    "name": "Test User"
  }')
echo "Response: $USER_RESPONSE"

# 2. Authenticate
echo -e "\n2. Authenticating..."
AUTH_RESPONSE=$(curl -s -X POST http://127.0.0.1:8090/api/collections/users/auth-with-password \
  -H "Content-Type: application/json" \
  -d '{
    "identity": "test@123vergabe.de",
    "password": "test123456"
  }')
TOKEN=$(echo $AUTH_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Token: ${TOKEN:0:20}..."

# 3. Create project
echo -e "\n3. Creating project..."
PROJECT_RESPONSE=$(curl -s -X POST http://127.0.0.1:8090/api/collections/projects/records \
  -H "Content-Type: application/json" \
  -H "Authorization: $TOKEN" \
  -d '{
    "name": "Test Projekt",
    "description": "Test für 123vergabe"
  }')
PROJECT_ID=$(echo $PROJECT_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "Project ID: $PROJECT_ID"

# 4. Test question generation
echo -e "\n4. Generating questions..."
QUESTIONS_RESPONSE=$(curl -s -X POST http://127.0.0.1:8090/api/generate-questions \
  -H "Content-Type: application/json" \
  -H "Authorization: $TOKEN" \
  -d '{
    "description": "Ich benötige eine Softwarelösung für die digitale Verwaltung von Ausschreibungen.",
    "project_id": "'$PROJECT_ID'"
  }')
echo "Questions response: $QUESTIONS_RESPONSE"

# 5. Check templates
echo -e "\n5. Checking templates..."
TEMPLATES_RESPONSE=$(curl -s -X GET http://127.0.0.1:8090/api/collections/templates/records \
  -H "Authorization: $TOKEN")
echo "Templates: $TEMPLATES_RESPONSE"

echo -e "\n=== Test completed ===\n"