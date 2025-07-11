#!/bin/bash

# Debug script for PocketBase user creation issue
echo "🔍 PocketBase User Creation Debug Script"
echo "========================================"

# Check if running in production (Coolify)
if [ -n "$COOLIFY_CONTAINER_NAME" ]; then
    echo "🌐 Running in Coolify deployment"
    BASE_URL="https://cli.a-g-e-n-t.de"
else
    echo "🏠 Running locally"
    BASE_URL="http://localhost:8090"
fi

echo "🔗 Base URL: $BASE_URL"
echo ""

# 1. Check PocketBase health
echo "1. Checking PocketBase health..."
if curl -s -f "$BASE_URL/api/health" > /dev/null; then
    echo "✅ PocketBase is responding"
    health_response=$(curl -s "$BASE_URL/api/health")
    echo "📊 Health response: $health_response"
else
    echo "❌ PocketBase is not responding"
    exit 1
fi

echo ""

# 2. Test the user creation endpoint
echo "2. Testing user creation endpoint..."
setup_response=$(curl -s "$BASE_URL/setup-users")
echo "📊 Setup response: $setup_response"

if echo "$setup_response" | grep -q '"success":true'; then
    echo "✅ User creation endpoint works"
else
    echo "❌ User creation endpoint failed"
    if echo "$setup_response" | grep -q "not defined"; then
        echo "🔍 JavaScript function hoisting issue detected"
        echo "💡 Recommendation: Restart PocketBase to reload hooks"
    fi
fi

echo ""

# 3. Check if users exist via API
echo "3. Checking if users exist..."

# Try to get collections info
collections_response=$(curl -s "$BASE_URL/api/collections")
if echo "$collections_response" | grep -q '"name":"users"'; then
    echo "✅ Users collection exists"
else
    echo "❌ Users collection not found"
    echo "📊 Collections response: $collections_response"
fi

echo ""

# 4. Try to authenticate with test credentials
echo "4. Testing authentication..."

# Try to authenticate with test user
auth_response=$(curl -s -X POST "$BASE_URL/api/collections/users/auth-with-password" \
    -H "Content-Type: application/json" \
    -d '{"identity":"test@vergabe.de","password":"test123456"}')

echo "📊 Auth response: $auth_response"

if echo "$auth_response" | grep -q '"token"'; then
    echo "✅ Test user authentication successful"
else
    echo "❌ Test user authentication failed"
    if echo "$auth_response" | grep -q "not found"; then
        echo "🔍 User does not exist - bootstrap hook may not have run"
    fi
fi

echo ""

# 5. Check admin access
echo "5. Checking admin access..."

# Try to access admin endpoint
admin_response=$(curl -s "$BASE_URL/_/")
if [ $? -eq 0 ]; then
    echo "✅ Admin interface is accessible"
    if echo "$admin_response" | grep -q "Setup"; then
        echo "🔍 PocketBase needs initial setup"
        echo "💡 No superuser exists yet"
    else
        echo "🔍 PocketBase admin interface is configured"
    fi
else
    echo "❌ Admin interface is not accessible"
fi

echo ""

# 6. Summary and recommendations
echo "6. Summary and Recommendations"
echo "=============================="

if echo "$setup_response" | grep -q '"success":true'; then
    echo "✅ User creation works manually"
    echo "🔍 Bootstrap hook may not be running automatically"
    echo ""
    echo "💡 Next steps:"
    echo "   1. Restart PocketBase container in Coolify"
    echo "   2. Check container logs for bootstrap messages"
    echo "   3. Verify hook files are properly deployed"
else
    echo "❌ User creation is failing"
    echo ""
    echo "💡 Next steps:"
    echo "   1. Check if pb_hooks/init_users.pb.js is deployed"
    echo "   2. Restart PocketBase to reload hooks"
    echo "   3. Check PocketBase logs for JavaScript errors"
fi

echo ""
echo "🔧 Manual commands you can try:"
echo "   • Restart PocketBase: (in Coolify, restart the container)"
echo "   • Test endpoint: curl $BASE_URL/setup-users"
echo "   • Check health: curl $BASE_URL/api/health"
echo ""
echo "📊 To check deployment logs in Coolify:"
echo "   • Go to your application logs"
echo "   • Look for 'Bootstrap: Starting automatic user setup'"
echo "   • Check for any JavaScript errors in the logs"