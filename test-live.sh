#!/bin/bash

echo "🔴 Testing Live System Integration..."
echo

# Test 1: PocketBase Health
echo "1. Testing PocketBase connection..."
if curl -s "http://127.0.0.1:8090/api/health" | grep -q "healthy"; then
    echo "   ✅ PocketBase is healthy and accessible"
else
    echo "   ❌ PocketBase health check failed"
fi

# Test 2: Web interface
echo "2. Testing web interface..."
if curl -s "http://127.0.0.1:8090/" | grep -q "Vergabedokument-Generator"; then
    echo "   ✅ Web interface is serving correctly"
else
    echo "   ❌ Web interface not accessible"
fi

# Test 3: OpenCode service
echo "3. Testing OpenCode service..."
if curl -s "http://127.0.0.1:3001/health" | grep -q "OpenCode Service"; then
    echo "   ✅ OpenCode service is running"
else
    echo "   ❌ OpenCode service not accessible"
fi

# Test 4: Database file
echo "4. Testing database..."
if [ -f "pb_data/data.db" ]; then
    echo "   ✅ PocketBase database file exists"
    # Check file size
    SIZE=$(stat -c%s "pb_data/data.db" 2>/dev/null || stat -f%z "pb_data/data.db" 2>/dev/null)
    echo "   📊 Database size: ${SIZE} bytes"
else
    echo "   ❌ Database file not found"
fi

# Test 5: Migration files
echo "5. Testing migrations..."
MIGRATION_COUNT=$(ls pb_migrations/*.js 2>/dev/null | wc -l)
echo "   📁 Found ${MIGRATION_COUNT} migration files"
if [ "$MIGRATION_COUNT" -gt 0 ]; then
    echo "   ✅ Migrations are present"
else
    echo "   ❌ No migration files found"
fi

# Test 6: Required files
echo "6. Testing required files..."
REQUIRED_FILES=("pb_public/index.html" "pb_public/dashboard.html" "opencode-service.js")
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file exists"
    else
        echo "   ❌ $file missing"
    fi
done

# Test 7: Check for running processes
echo "7. Testing running processes..."
if pgrep -f "pocketbase" > /dev/null; then
    echo "   ✅ PocketBase process is running"
else
    echo "   ⚠️ PocketBase process not detected"
fi

if pgrep -f "opencode-service" > /dev/null; then
    echo "   ✅ OpenCode service process is running"
else
    echo "   ⚠️ OpenCode service process not detected (may be running via node)"
fi

echo
echo "🎯 Live system test completed!"