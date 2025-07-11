#!/bin/bash

# Local Development Start Script für OpenCode Multiuser System
# Startet PocketBase und Node.js Service für lokale Entwicklung

set -e

echo "🚀 Starting OpenCode Multiuser System - Local Development"
echo "============================================="

# Überprüfe ob alle erforderlichen Dateien vorhanden sind
if [ ! -f "./pocketbase" ]; then
    echo "❌ PocketBase binary not found. Please run: ./docker-opencode.sh"
    exit 1
fi

if [ ! -f "./opencode-service.js" ]; then
    echo "❌ opencode-service.js not found"
    exit 1
fi

# Überprüfe OPENAI_API_KEY
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ OPENAI_API_KEY environment variable not set"
    echo "💡 Please set your OpenAI API key:"
    echo "   export OPENAI_API_KEY='your-api-key'"
    exit 1
fi

echo "✅ OPENAI_API_KEY configured: ${OPENAI_API_KEY:0:8}..."

# Erstelle notwendige Verzeichnisse
mkdir -p pb_data pb_logs temp

# Funktion für sauberes Herunterfahren
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    
    # Stoppe PocketBase
    if [ ! -z "$POCKETBASE_PID" ]; then
        kill $POCKETBASE_PID 2>/dev/null || true
    fi
    
    # Stoppe Node.js Service
    if [ ! -z "$NODEJS_PID" ]; then
        kill $NODEJS_PID 2>/dev/null || true
    fi
    
    echo "✅ Services stopped"
    exit 0
}

# Signal Handler für sauberes Herunterfahren
trap cleanup SIGINT SIGTERM

echo ""
echo "🔧 Starting PocketBase v0.28.4..."
echo "📂 Working directory: $(pwd)"

# Starte PocketBase
./pocketbase serve --http=127.0.0.1:8090 &
POCKETBASE_PID=$!

echo "📍 PocketBase PID: $POCKETBASE_PID"

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
    cleanup
    exit 1
fi

echo ""
echo "🔧 Starting Node.js OpenCode Service..."

# Starte Node.js Service
node opencode-service.js &
NODEJS_PID=$!

echo "📍 Node.js Service PID: $NODEJS_PID"

# Warte auf Node.js Service Start
echo "⏳ Waiting for Node.js service to start..."
timeout=15
while [ $timeout -gt 0 ]; do
    if curl -f http://localhost:3001/health 2>/dev/null; then
        echo "✅ Node.js service is ready!"
        break
    fi
    sleep 1
    timeout=$((timeout-1))
done

if [ $timeout -le 0 ]; then
    echo "❌ Node.js service failed to start"
    cleanup
    exit 1
fi

echo ""
echo "🎉 All services started successfully!"
echo "============================================="
echo ""
echo "🌐 URLs:"
echo "   • Dashboard: http://localhost:8090/debug.html"
echo "   • PocketBase Admin: http://localhost:8090/_/"
echo "   • Node.js Service: http://localhost:3001"
echo ""
echo "📊 Process IDs:"
echo "   • PocketBase: $POCKETBASE_PID"
echo "   • Node.js Service: $NODEJS_PID"
echo ""
echo "💡 Development Tips:"
echo "   • Edit hooks in pb_hooks/ (restart required)"
echo "   • Edit frontend in pb_public/"
echo "   • Edit Node.js service in opencode-service.js"
echo "   • Use Ctrl+C to stop all services"
echo ""
echo "🔄 System running... Press Ctrl+C to stop"

# Monitoring Loop
while true; do
    sleep 5
    
    # Überprüfe PocketBase
    if ! kill -0 $POCKETBASE_PID 2>/dev/null; then
        echo "❌ PocketBase process died!"
        cleanup
        exit 1
    fi
    
    # Überprüfe Node.js Service
    if ! kill -0 $NODEJS_PID 2>/dev/null; then
        echo "❌ Node.js service died!"
        cleanup
        exit 1
    fi
done