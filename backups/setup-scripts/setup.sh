#!/bin/bash

# Setup Script für OpenCode Multiuser System
# Initialisiert PocketBase und erstellt Admin-User

echo "🔧 OpenCode Multiuser System Setup"
echo "===================================="

# Prüfe ob PocketBase existiert
if [ ! -f "./pocketbase" ]; then
    echo "❌ PocketBase binary not found. Please run: ./docker-opencode.sh"
    exit 1
fi

# Erstelle notwendige Verzeichnisse
mkdir -p pb_data pb_logs temp

echo ""
echo "🚀 Starting PocketBase for initial setup..."

# Starte PocketBase temporär
./pocketbase serve --http=127.0.0.1:8090 &
PB_PID=$!

echo "📍 PocketBase PID: $PB_PID"

# Warte auf PocketBase Start
echo "⏳ Waiting for PocketBase to start..."
timeout=30
while [ $timeout -gt 0 ]; do
    if curl -f http://localhost:8090/api/health 2>/dev/null; then
        echo "✅ PocketBase is ready!"
        break
    fi
    sleep 1
    timeout=$((timeout-1))
done

if [ $timeout -le 0 ]; then
    echo "❌ PocketBase failed to start"
    kill $PB_PID 2>/dev/null
    exit 1
fi

echo ""
echo "📋 Database migrations will run automatically"
echo "⏳ Waiting for migrations to complete..."
sleep 5

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

echo ""
echo "🛑 Stopping setup PocketBase..."
kill $PB_PID 2>/dev/null
wait $PB_PID 2>/dev/null

echo ""
echo "🎉 Setup completed successfully!"
echo "===================================="
echo ""
echo "👤 Admin Credentials:"
echo "📧 Email: admin@vergabe.de"
echo "🔑 Password: admin123"
echo "🌐 Admin Panel: http://localhost:8090/_/"
echo ""
echo "👤 Test User Credentials:"
echo "📧 Email: test@vergabe.de"
echo "🔑 Password: vergabe123"
echo "🌐 Dashboard: http://localhost:8090/debug.html"
echo ""
echo "🚀 Ready to start development:"
echo "   ./run.sh"