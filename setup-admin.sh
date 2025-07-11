#!/bin/bash

# Admin Setup Script für PocketBase
# Erstellt den Admin-User manuell

echo "👤 PocketBase Admin Setup"
echo "========================="

# Prüfe ob PocketBase existiert
if [ ! -f "./pocketbase" ]; then
    echo "❌ PocketBase binary not found. Please run migration first."
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
fi

echo ""
echo "👤 Creating admin user..."
echo "📧 Email: admin@vergabe.de"
echo "🔑 Password: admin123"

# Erstelle Admin
./pocketbase superuser upsert admin@vergabe.de admin123

if [ $? -eq 0 ]; then
    echo "✅ Admin user created successfully!"
else
    echo "❌ Failed to create admin user"
    echo "📌 Try manually: ./pocketbase superuser upsert admin@vergabe.de admin123"
fi

# Stoppe PocketBase wenn wir es gestartet haben
if [ "$POCKETBASE_RUNNING" = false ]; then
    echo "🛑 Stopping temporary PocketBase..."
    kill $PB_PID 2>/dev/null
    wait $PB_PID 2>/dev/null
fi

echo ""
echo "🎉 Admin setup completed!"
echo "🌐 Access admin panel: http://localhost:8090/_/"
echo "📧 Login: admin@vergabe.de"
echo "🔑 Password: admin123"