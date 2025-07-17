#!/bin/bash

# Production Start Script für OpenCode Multiuser System
# Robustes Startup mit Health Checks und Monitoring

set -e

echo "🚀 Starting OpenCode Multiuser System - Production Mode"
echo "============================================="

# Logging setup
LOG_DIR="/app/pb_logs"
mkdir -p "$LOG_DIR"
exec > >(tee -a "$LOG_DIR/startup.log")
exec 2> >(tee -a "$LOG_DIR/startup.log" >&2)

# Environment validation
if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "DOCKER_PLACEHOLDER_KEY" ]; then
    echo "❌ OPENAI_API_KEY not properly configured"
    echo "💡 Set environment variable: OPENAI_API_KEY='your-api-key'"
    exit 1
fi

echo "✅ OPENAI_API_KEY configured: ${OPENAI_API_KEY:0:8}..."

# Create necessary directories
mkdir -p pb_data pb_logs temp /var/log

# Start health check daemon in background (reduced frequency to avoid conflicts)
echo "🏥 Starting health check daemon..."
./healthcheck.sh --daemon &
HEALTHCHECK_PID=$!
echo "📍 Health Check PID: $HEALTHCHECK_PID"

# Cleanup function for graceful shutdown
cleanup() {
    echo ""
    echo "🛑 Production shutdown initiated..."
    
    # Stop health check daemon
    if [ ! -z "$HEALTHCHECK_PID" ]; then
        kill $HEALTHCHECK_PID 2>/dev/null || true
    fi
    
    # Stop all services
    pkill -f "node opencode-service.js" 2>/dev/null || true
    pkill -f "pocketbase" 2>/dev/null || true
    
    echo "✅ Production services stopped"
    exit 0
}

# Signal handlers
trap cleanup SIGINT SIGTERM

# Start PocketBase with production settings
echo "🔧 Starting PocketBase v0.28.4 (Production)..."
./pocketbase serve \
    --http=0.0.0.0:8090 \
    --dir=/app/pb_data \
    --hooksDir=/app/pb_hooks \
    --publicDir=/app/pb_public \
    --migrationsDir=/app/pb_migrations &
POCKETBASE_PID=$!

echo "📍 PocketBase PID: $POCKETBASE_PID"

# Wait for PocketBase with optimized timeout
echo "⏳ Waiting for PocketBase to start (timeout: 30s)..."
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
    echo "❌ PocketBase failed to start within 30 seconds"
    cleanup
    exit 1
fi

# Start OpenCode Service with restart capability
echo "🔧 Starting OpenCode Service (Production)..."
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
    cleanup
    exit 1
fi

echo ""
echo "🎉 Production system started successfully!"
echo "============================================="
echo ""
echo "🌐 Production URLs:"
echo "   • Dashboard: http://localhost:8090/debug.html"
echo "   • PocketBase Admin: http://localhost:8090/_/"
echo "   • OpenCode Service: http://localhost:3001"
echo ""
echo "📊 Process IDs:"
echo "   • PocketBase: $POCKETBASE_PID"
echo "   • OpenCode Service: $NODEJS_PID"
echo "   • Health Check: $HEALTHCHECK_PID"
echo ""
echo "📋 Production Features:"
echo "   • Health monitoring every 5 minutes (detailed)"
echo "   • Process monitoring every 2 minutes (lightweight)"
echo "   • Automatic restart on failure"
echo "   • Disk space and memory monitoring"
echo "   • Graceful shutdown handling"
echo ""
echo "🔄 Production system running... Monitoring active"

# Production monitoring loop with coordinated intervals
while true; do
    sleep 120  # Coordinated with healthcheck.sh (300s) to avoid conflicts
    
    # Check PocketBase
    if ! kill -0 $POCKETBASE_PID 2>/dev/null; then
        echo "❌ PocketBase process died! Attempting restart..."
        ./pocketbase serve --http=0.0.0.0:8090 &
        POCKETBASE_PID=$!
        echo "🔄 PocketBase restarted with PID: $POCKETBASE_PID"
    fi
    
    # Check OpenCode Service
    if ! kill -0 $NODEJS_PID 2>/dev/null; then
        echo "❌ OpenCode Service died! Attempting restart..."
        node opencode-service.js &
        NODEJS_PID=$!
        echo "🔄 OpenCode Service restarted with PID: $NODEJS_PID"
    fi
    
    # Check Health Check Daemon
    if ! kill -0 $HEALTHCHECK_PID 2>/dev/null; then
        echo "❌ Health Check daemon died! Restarting..."
        ./healthcheck.sh --daemon &
        HEALTHCHECK_PID=$!
        echo "🔄 Health Check restarted with PID: $HEALTHCHECK_PID"
    fi
done