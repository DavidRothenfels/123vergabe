#!/bin/bash

echo "🧪 Testing Exact API Key Creation (Frontend simulation)"
echo "======================================================"

# Get auth token
AUTH_RESPONSE=$(curl -s -X POST "http://localhost:8090/api/collections/users/auth-with-password" \
  -H "Content-Type: application/json" \
  -d '{"identity": "test@vergabe.de", "password": "vergabe123"}')

TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
USER_ID=$(echo "$AUTH_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [[ -z "$TOKEN" ]]; then
  echo "❌ Authentication failed"
  exit 1
fi

echo "✅ Authenticated as user: $USER_ID"

# Test the exact same call the frontend makes
echo ""
echo "📄 Testing exact frontend API call..."

# Step 1: Deactivate existing keys (like frontend does)
echo "🔄 Step 1: Deactivating existing keys..."

EXISTING_KEYS=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8090/api/collections/apikeys/records?filter=user_id%3D%22$USER_ID%22%26%26active%3Dtrue")

echo "📋 Existing keys response: $EXISTING_KEYS"

# Step 2: Create new API key with exact frontend data
echo ""
echo "🔄 Step 2: Creating new API key..."

CURRENT_DATE=$(date '+%d.%m.%Y')
API_KEY_DATA="{
  \"user_id\": \"$USER_ID\",
  \"provider\": \"openai\",
  \"api_key\": \"sk-test123456789abcdefghijklmnopqrstuvwxyz\",
  \"name\": \"API Key $CURRENT_DATE\",
  \"active\": true
}"

echo "📋 API Key data being sent: $API_KEY_DATA"

CREATE_RESPONSE=$(curl -s -X POST "http://localhost:8090/api/collections/apikeys/records" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$API_KEY_DATA")

echo "📄 Create response: $CREATE_RESPONSE"

if echo "$CREATE_RESPONSE" | grep -q '"id"'; then
  echo "✅ API Key created successfully!"
else
  echo "❌ API Key creation failed"
  
  # Try to get more detailed error
  echo ""
  echo "🔍 Testing with individual fields..."
  
  # Test 1: Just required fields
  TEST1_DATA="{\"user_id\": \"$USER_ID\", \"provider\": \"openai\", \"api_key\": \"sk-test123\"}"
  TEST1_RESPONSE=$(curl -s -X POST "http://localhost:8090/api/collections/apikeys/records" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "$TEST1_DATA")
  echo "📄 Test 1 (minimal): $TEST1_RESPONSE"
  
  # Test 2: Check if user_id is the issue
  TEST2_DATA="{\"provider\": \"openai\", \"api_key\": \"sk-test123\"}"
  TEST2_RESPONSE=$(curl -s -X POST "http://localhost:8090/api/collections/apikeys/records" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "$TEST2_DATA")
  echo "📄 Test 2 (no user_id): $TEST2_RESPONSE"
fi

echo "======================================================"