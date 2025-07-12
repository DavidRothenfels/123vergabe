#!/bin/bash

echo "🧪 Testing Minimal Document Creation"
echo "===================================="

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

echo "✅ Authenticated as: $USER_ID"

# Test with only required fields
echo ""
echo "📄 Testing with minimal required fields..."

MINIMAL_DOC=$(curl -s -X POST "http://localhost:8090/api/collections/documents/records" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Test Title",
    "content": "Test Content"
  }')

echo "📄 Minimal doc response: $MINIMAL_DOC"

# Test with all fields
echo ""
echo "📄 Testing with all fields..."

FULL_DOC=$(curl -s -X POST "http://localhost:8090/api/collections/documents/records" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"title\": \"Full Test Document\",
    \"content\": \"This is a full test document with all fields\",
    \"project_id\": \"test-project\",
    \"user_id\": \"$USER_ID\",
    \"document_type\": \"leistungsbeschreibung\",
    \"type\": \"leistungsbeschreibung\",
    \"request_id\": \"test-request\",
    \"created_by\": \"test@vergabe.de\",
    \"generated_by_ai\": false
  }")

echo "📄 Full doc response: $FULL_DOC"

echo "===================================="