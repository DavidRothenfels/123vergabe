#!/bin/bash

# Development Start Script für OpenCode Multiuser System
# Optimiert für Docker/Coolify-kompatibles lokales Development

set -e

echo "🚀 Starting OpenCode Multiuser System - Development Mode"
echo "============================================="

# Environment Check
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ OPENAI_API_KEY environment variable not set"
    echo "💡 Please set your OpenAI API key:"
    echo "   export OPENAI_API_KEY='your-api-key'"
    exit 1
fi

echo "✅ OPENAI_API_KEY configured: ${OPENAI_API_KEY:0:8}..."

# Check OpenCode Installation
if ! command -v opencode &> /dev/null; then
    echo "⚠️  OpenCode not found. Installing globally..."
    npm install -g opencode-ai@latest
fi

# Check PocketBase Binary
if [ ! -f "./pocketbase" ]; then
    echo "❌ PocketBase binary not found."
    echo "💡 Please download PocketBase v0.28.4 or run: ./docker-opencode.sh"
    exit 1
fi

# Create necessary directories (same as Docker)
mkdir -p pb_data pb_logs temp

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    
    # Stop all processes
    pkill -f "node opencode-service.js" 2>/dev/null || true
    pkill -f "pocketbase serve" 2>/dev/null || true
    
    # Wait for processes to stop
    sleep 2
    
    echo "✅ Services stopped"
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

# Start OpenCode Service
echo ""
echo "🔧 Starting OpenCode Service..."

# Set development environment
export NODE_ENV=development
export PORT=3001
export POCKETBASE_URL=http://localhost:8090

# Kill any existing opencode-service processes
pkill -f "node opencode-service.js" 2>/dev/null || true
sleep 1

# Start the service
node opencode-service.js &
NODEJS_PID=$!

echo "📍 OpenCode Service PID: $NODEJS_PID"

# Wait for OpenCode Service
echo "⏳ Waiting for OpenCode Service to start..."
timeout=20
while [ $timeout -gt 0 ]; do
    if curl -f -s http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ OpenCode Service is ready!"
        break
    fi
    sleep 1
    timeout=$((timeout-1))
done

if [ $timeout -le 0 ]; then
    echo "❌ OpenCode Service failed to start"
    exit 1
fi

echo ""
echo "🎉 All services started successfully!"
echo "============================================="
echo ""
echo "🌐 Development URLs:"
echo "   • Dashboard: http://localhost:8090/debug.html"
echo "   • PocketBase Admin: http://localhost:8090/_/"
echo "   • OpenCode API: http://localhost:3001"
echo ""
echo "📊 Process IDs:"
echo "   • PocketBase: $POCKETBASE_PID"
echo "   • OpenCode Service: $NODEJS_PID"
echo ""
echo "💡 Development Tips:"
echo "   • PocketBase hooks in pb_hooks/ (restart required)"
echo "   • Frontend files in pb_public/"
echo "   • OpenCode service in opencode-service.js"
echo "   • Database in pb_data/data.db"
echo "   • Press Ctrl+C to stop all services"
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
    
    if ! kill -0 $NODEJS_PID 2>/dev/null; then
        echo "❌ OpenCode Service died!"
        exit 1
    fi
done