#!/bin/bash

# This script sets up default users in the deployed Docker container
# Run this from outside the container or as a one-time job

echo "🔧 Setting up users in Docker container..."

# Check if we can reach the deployed service
if curl -s http://localhost:8090/api/health >/dev/null 2>&1; then
    POCKETBASE_URL="http://localhost:8090"
elif curl -s https://your-coolify-domain.com/api/health >/dev/null 2>&1; then
    POCKETBASE_URL="https://your-coolify-domain.com"
else
    echo "❌ Cannot reach PocketBase. Update the URL in this script."
    exit 1
fi

echo "✅ PocketBase reachable at: $POCKETBASE_URL"

# Create admin superuser via API call to the hook
echo "👤 Setting up admin user..."

# Trigger the user setup endpoint
echo "🔧 Triggering user setup..."
SETUP_RESPONSE=$(curl -s -X GET "$POCKETBASE_URL/setup-users")
echo "Setup response: $SETUP_RESPONSE"

if [ $? -eq 0 ]; then
    echo "✅ User setup endpoint called"
    
    # Test admin login
    ADMIN_TEST=$(curl -s -X POST "$POCKETBASE_URL/api/collections/_superusers/auth-with-password" \
      -H "Content-Type: application/json" \
      -d '{"identity":"admin@vergabe.de","password":"admin123456"}')
    
    if echo "$ADMIN_TEST" | grep -q "token"; then
        echo "✅ Admin user is ready: admin@vergabe.de / admin123456"
    else
        echo "⚠️ Admin user setup might need manual intervention"
    fi
    
    # Test regular user login
    USER_TEST=$(curl -s -X POST "$POCKETBASE_URL/api/collections/users/auth-with-password" \
      -H "Content-Type: application/json" \
      -d '{"identity":"test@vergabe.de","password":"test123456"}')
    
    if echo "$USER_TEST" | grep -q "token"; then
        echo "✅ Test user is ready: test@vergabe.de / test123456"
    else
        echo "⚠️ Test user setup might need manual intervention"
    fi
    
else
    echo "❌ Failed to connect to PocketBase"
fi

echo ""
echo "🎉 Setup completed!"
echo ""
echo "📝 Default credentials:"
echo "Admin: admin@vergabe.de / admin123456"
echo "User:  test@vergabe.de / test123456"
echo ""
echo "🌐 Access at: $POCKETBASE_URL"