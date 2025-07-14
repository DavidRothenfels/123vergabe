#!/bin/bash

# User Setup Script für PocketBase OpenCode System
# Erstellt Admin und Test-User automatisch

echo "👤 PocketBase User Setup"
echo "========================"

# Prüfe ob PocketBase existiert
if [ ! -f "./pocketbase" ]; then
    echo "❌ PocketBase binary not found. Please run setup first."
    exit 1
fi

# Prüfe ob PocketBase läuft
if curl -s http://localhost:8090/api/health > /dev/null 2>&1; then
    echo "✅ PocketBase is running"
    POCKETBASE_RUNNING=true
else
    echo "🚀 Starting PocketBase..."
    ./pocketbase serve --http=0.0.0.0:8090 > /dev/null 2>&1 &
    PB_PID=$!
    POCKETBASE_RUNNING=false
    
    # Warte bis bereit
    echo "⏳ Waiting for PocketBase..."
    timeout=30
    counter=0
    while ! curl -s http://localhost:8090/api/health > /dev/null 2>&1; do
        sleep 1
        counter=$((counter + 1))
        if [ $counter -ge $timeout ]; then
            echo "❌ PocketBase failed to start"
            kill $PB_PID 2>/dev/null
            exit 1
        fi
    done
    
    echo "✅ PocketBase started successfully"
fi

echo ""
echo "👤 Creating users..."

# Erstelle Admin via PocketBase Superuser Command
echo "🔧 Creating admin user..."
echo "📧 Email: admin@vergabe.de"
echo "🔑 Password: admin123456"

./pocketbase superuser upsert admin@vergabe.de admin123456

if [ $? -eq 0 ]; then
    echo "✅ Admin user created successfully!"
else
    echo "❌ Failed to create admin user"
    echo "📌 Try manually: ./pocketbase superuser upsert admin@vergabe.de admin123456"
fi

echo ""
echo "🔧 Creating test user via API..."

# Warte kurz um sicherzustellen, dass System bereit ist
sleep 2

# Erstelle Test-User via HTTP-Endpoint
response=$(curl -s -X GET http://localhost:8090/setup-users)
echo "📊 API Response: $response"

if echo "$response" | grep -q '"success":true'; then
    echo "✅ Test user created via API endpoint"
else
    echo "⚠️  API endpoint response was not successful"
    echo "📌 Users might already exist or creation failed"
fi

# Stoppe PocketBase wenn wir es gestartet haben
if [ "$POCKETBASE_RUNNING" = false ]; then
    echo ""
    echo "🛑 Stopping temporary PocketBase..."
    kill $PB_PID 2>/dev/null
    wait $PB_PID 2>/dev/null
fi

echo ""
echo "🎉 User setup completed!"
echo "========================"
echo ""
echo "👤 Admin Credentials:"
echo "📧 Email: admin@vergabe.de"
echo "🔑 Password: admin123456"
echo "🌐 Admin Panel: http://localhost:8090/_/"
echo ""
echo "👤 Test User Credentials:"
echo "📧 Email: test@vergabe.de"
echo "🔑 Password: test123456"
echo "🌐 Dashboard: http://localhost:8090/debug.html"
echo ""
echo "💡 Note: Users are also created automatically when PocketBase starts"