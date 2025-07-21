#!/bin/bash

# Development Start Script für 123vergabe
# PocketBase mit integrierten Hooks

set -e

echo "🚀 Starting 123vergabe - Development Mode"
echo "========================================="

# Check PocketBase Binary
if [ ! -f "./pocketbase" ]; then
    echo "❌ PocketBase binary not found."
    echo "💡 Please download PocketBase v0.28.4 or run: ./docker-opencode.sh"
    exit 1
fi

# Kill any existing PocketBase processes first
if pgrep -f "pocketbase serve" > /dev/null; then
    echo "⚠️  Found existing PocketBase process, stopping it..."
    pkill -f "pocketbase serve"
    sleep 2
fi

# Double-check the port is free
if lsof -Pi :8090 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Port 8090 is still in use, force killing..."
    lsof -Pi :8090 -sTCP:LISTEN -t | xargs kill -9 2>/dev/null
    sleep 1
fi

# Check if OpenRouter API key is set
if [ -z "$OPENROUTER_API_KEY" ]; then
    echo "⚠️  Warning: OPENROUTER_API_KEY not set. AI features will not work."
    echo "   Set it with: export OPENROUTER_API_KEY='your-key'"
    echo ""
fi

# Create necessary directories (same as Docker)
mkdir -p pb_data pb_logs temp

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Shutting down PocketBase..."
    
    # Stop PocketBase
    pkill -f "pocketbase serve" 2>/dev/null || true
    
    # Wait for process to stop
    sleep 2
    
    echo "✅ PocketBase stopped"
    exit 0
}

# Signal handlers
trap cleanup SIGINT SIGTERM EXIT

# Start PocketBase (same configuration as production)
echo ""
echo "🔧 Starting PocketBase v0.28.4..."
./pocketbase serve \
    --http=127.0.0.1:8090 \
    --dir=./pb_data \
    --hooksDir=./pb_hooks \
    --publicDir=./pb_public \
    --migrationsDir=./pb_migrations &
POCKETBASE_PID=$!

echo "📍 PocketBase PID: $POCKETBASE_PID"

# Wait for PocketBase
echo "⏳ Waiting for PocketBase to start..."
timeout=30
while [ $timeout -gt 0 ]; do
    if curl -f -s http://localhost:8090/api/health > /dev/null 2>&1; then
        echo "✅ PocketBase is ready!"
        break
    fi
    sleep 1
    timeout=$((timeout-1))
done

if [ $timeout -le 0 ]; then
    echo "❌ PocketBase failed to start"
    exit 1
fi


echo ""
echo "🎉 All services started successfully!"
echo "============================================="
echo ""
echo "🌐 Development URLs:"
echo "   • Dashboard: http://localhost:8090/"
echo "   • PocketBase Admin: http://localhost:8090/_/"
echo ""
echo "📊 Process ID:"
echo "   • PocketBase: $POCKETBASE_PID"
echo ""
echo "💡 Development Tips:"
echo "   • PocketBase hooks in pb_hooks/ (restart required)"
echo "   • Frontend files in pb_public/"
echo "   • Database in pb_data/data.db"
echo "   • Press Ctrl+C to stop PocketBase"
echo ""
echo "🔄 Development system running... Press Ctrl+C to stop"

# Simple monitoring loop
while true; do
    sleep 5
    
    # Check if processes are still running
    if ! kill -0 $POCKETBASE_PID 2>/dev/null; then
        echo "❌ PocketBase process died!"
        exit 1
    fi
    
done