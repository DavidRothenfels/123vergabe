#!/bin/bash

echo "🧪 Testing API Key Creation via PocketBase API"
echo "============================================="

# Step 1: Authenticate and get token
echo "🔐 Step 1: Getting auth token..."

AUTH_RESPONSE=$(curl -s -X POST "http://localhost:8090/api/collections/users/auth-with-password" \
  -H "Content-Type: application/json" \
  -d '{
    "identity": "test@vergabe.de",
    "password": "vergabe123"
  }')

echo "📄 Auth response: $AUTH_RESPONSE"

# Extract token and user info
TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
USER_ID=$(echo "$AUTH_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
USER_EMAIL=$(echo "$AUTH_RESPONSE" | grep -o '"email":"[^"]*"' | cut -d'"' -f4)

if [[ -z "$TOKEN" ]]; then
  echo "❌ Authentication failed"
  exit 1
fi

echo "✅ Authentication successful"
echo "👤 User: $USER_EMAIL"
echo "🆔 User ID: $USER_ID"
echo "🔑 Token: ${TOKEN:0:20}..."

# Step 2: Try to create API key
echo ""
echo "📄 Step 2: Creating API key..."

API_KEY_DATA="{
  \"user_id\": \"$USER_ID\",
  \"provider\": \"openai\", 
  \"api_key\": \"sk-test123456789abcdef\",
  \"name\": \"Test API Key\",
  \"active\": true
}"

echo "📋 API Key data: $API_KEY_DATA"

API_KEY_RESPONSE=$(curl -s -X POST "http://localhost:8090/api/collections/apikeys/records" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$API_KEY_DATA")

echo "📄 API Key creation response: $API_KEY_RESPONSE"

if echo "$API_KEY_RESPONSE" | grep -q '"id"'; then
  echo "✅ API Key created successfully!"
  API_KEY_ID=$(echo "$API_KEY_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
  echo "📋 API Key ID: $API_KEY_ID"
else
  echo "❌ API Key creation failed"
  
  # Step 3: Try with minimal data to identify the issue
  echo ""
  echo "🔍 Step 3: Testing with minimal required fields..."
  
  MINIMAL_API_KEY_DATA="{
    \"user_id\": \"$USER_ID\",
    \"provider\": \"openai\",
    \"api_key\": \"sk-minimal123\"
  }"
  
  echo "📋 Minimal data: $MINIMAL_API_KEY_DATA"
  
  MINIMAL_RESPONSE=$(curl -s -X POST "http://localhost:8090/api/collections/apikeys/records" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "$MINIMAL_API_KEY_DATA")
  
  echo "📄 Minimal response: $MINIMAL_RESPONSE"
fi

# Step 4: Check existing API keys
echo ""
echo "🔍 Step 4: Checking existing API keys..."

EXISTING_KEYS=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8090/api/collections/apikeys/records")

echo "📄 Existing keys: $EXISTING_KEYS"

echo "============================================="