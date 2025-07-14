#!/bin/bash

echo "🔧 Creating default users for Vergabedokument-Generator..."

# Check if PocketBase is running
if ! curl -s http://localhost:8090/api/health >/dev/null 2>&1; then
    echo "❌ PocketBase is not running on port 8090"
    exit 1
fi

echo "✅ PocketBase is running"

# Create admin superuser
echo "👤 Creating admin superuser..."
./pocketbase superuser upsert admin@vergabe.de admin123456

# Create test user via API
echo "👤 Creating test user..."

# First, get admin token
ADMIN_TOKEN=$(curl -s -X POST "http://localhost:8090/api/collections/_superusers/auth-with-password" \
  -H "Content-Type: application/json" \
  -d '{"identity":"admin@vergabe.de","password":"admin123456"}' | jq -r '.token')

if [ "$ADMIN_TOKEN" != "null" ] && [ -n "$ADMIN_TOKEN" ]; then
    echo "✅ Admin authentication successful"
    
    # Create test user
    RESPONSE=$(curl -s -X POST "http://localhost:8090/api/collections/users/records" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -d '{
        "email": "test@vergabe.de",
        "password": "test123456",
        "passwordConfirm": "test123456",
        "verified": true,
        "name": "Test User"
      }')
    
    if echo "$RESPONSE" | jq -e '.id' >/dev/null 2>&1; then
        echo "✅ Test user created successfully: test@vergabe.de / test123456"
    else
        echo "⚠️ Test user might already exist or creation failed"
        echo "Response: $RESPONSE"
    fi
else
    echo "❌ Failed to authenticate admin user"
fi

echo ""
echo "🎉 User setup completed!"
echo ""
echo "📝 Login credentials:"
echo "Admin (PocketBase Dashboard): admin@vergabe.de / admin123456"
echo "Test User (Application): test@vergabe.de / test123456"
echo ""
echo "🌐 Access URLs:"
echo "Dashboard: http://localhost:8090/"
echo "Admin Panel: http://localhost:8090/_/"
echo "Debug Panel: http://localhost:8090/debug.html"