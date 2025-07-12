#!/bin/bash

echo "🧪 Testing Document Creation with Authentication"
echo "=============================================="

# Step 1: Authenticate and get token
echo "🔐 Step 1: Getting auth token..."

AUTH_RESPONSE=$(curl -s -X POST "http://localhost:8090/api/collections/users/auth-with-password" \
  -H "Content-Type: application/json" \
  -d '{
    "identity": "test@vergabe.de",
    "password": "vergabe123"
  }')

if [[ $? -ne 0 ]] || [[ -z "$AUTH_RESPONSE" ]]; then
  echo "⚠️ Demo user auth failed, trying admin..."
  AUTH_RESPONSE=$(curl -s -X POST "http://localhost:8090/api/collections/users/auth-with-password" \
    -H "Content-Type: application/json" \
    -d '{
      "identity": "admin@vergabe.de", 
      "password": "admin123"
    }')
fi

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
echo "🔑 Token: ${TOKEN:0:20}..."

# Step 2: Create document with authentication
echo ""
echo "📄 Step 2: Creating document..."

DOC_RESPONSE=$(curl -s -X POST "http://localhost:8090/api/collections/documents/records" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"title\": \"Test Authenticated Document\",
    \"content\": \"This is a test document created with proper authentication\",
    \"project_id\": \"test-project-curl\",
    \"user_id\": \"$USER_ID\",
    \"document_type\": \"leistung\",
    \"type\": \"leistungsbeschreibung\",
    \"created_by\": \"$USER_EMAIL\",
    \"generated_by_ai\": false
  }")

echo "📄 Document creation response: $DOC_RESPONSE"

if echo "$DOC_RESPONSE" | grep -q '"id"'; then
  echo "✅ Document created successfully!"
  DOC_ID=$(echo "$DOC_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
  echo "📋 Document ID: $DOC_ID"
else
  echo "❌ Document creation failed"
fi

# Step 3: Test document loading
echo ""
echo "🔍 Step 3: Testing document loading..."

DOCS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8090/api/collections/documents/records?filter=project_id='test-project-curl'")

echo "📄 Documents response: $DOCS_RESPONSE"

DOC_COUNT=$(echo "$DOCS_RESPONSE" | grep -o '"totalItems":[0-9]*' | cut -d':' -f2)
echo "📊 Found $DOC_COUNT documents"

echo "=============================================="