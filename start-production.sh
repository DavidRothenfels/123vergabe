#!/bin/bash
set -e

echo "🚀 Starting OpenCode Multiuser System (Production)"
echo "📊 Using PM2 for process management"

# Ensure log directory exists
mkdir -p pb_logs

# Export environment variables
export OPENAI_API_KEY="${OPENAI_API_KEY:-your-openai-api-key-here}"
export NODE_ENV="production"
export PORT="3001"

# Start PocketBase in background
echo "🔧 Starting PocketBase v0.28.4..."
./pocketbase serve --http=0.0.0.0:8090 &
POCKETBASE_PID=$!
echo "📍 PocketBase PID: $POCKETBASE_PID"

# Wait for PocketBase to be ready
echo "⏳ Waiting for PocketBase to start..."
timeout=60
while [ $timeout -gt 0 ]; do
    if curl -f http://localhost:8090/api/health 2>/dev/null; then
        echo "✅ PocketBase is ready!"
        break
    fi
    sleep 2
    timeout=$((timeout-2))
done

if [ $timeout -le 0 ]; then
    echo "❌ PocketBase failed to start"
    exit 1
fi

# Start Node.js service with PM2
echo "🔧 Starting Node.js service with PM2..."
pm2 start ecosystem.config.js --env production

# Wait for Node.js service to be ready
echo "⏳ Waiting for Node.js service to start..."
timeout=30
while [ $timeout -gt 0 ]; do
    if curl -f http://localhost:3001/health 2>/dev/null; then
        echo "✅ Node.js service is ready!"
        break
    fi
    sleep 2
    timeout=$((timeout-2))
done

if [ $timeout -le 0 ]; then
    echo "❌ Node.js service failed to start"
    pm2 logs --lines 20
    exit 1
fi

echo ""
echo "🎉 All services started successfully!"
echo "📊 PM2 Status:"
pm2 status
echo ""
echo "🌐 Dashboard: http://localhost:8090/debug.html"
echo "⚙️  PocketBase Admin: http://localhost:8090/_/"
echo "📊 PM2 Logs: pm2 logs"
echo ""

# Function to handle shutdown
shutdown() {
    echo "🛑 Shutting down services..."
    pm2 stop all
    pm2 delete all
    kill $POCKETBASE_PID 2>/dev/null || true
    wait
    echo "✅ Shutdown complete"
    exit 0
}

# Set up signal handlers
trap shutdown SIGTERM SIGINT

# Keep the script running and show real-time status
echo "💡 System running. Use Ctrl+C to stop."
echo "📊 Real-time status monitoring..."

# Monitor services every 30 seconds
while true; do
    sleep 30
    
    # Check if PocketBase is still running
    if ! kill -0 $POCKETBASE_PID 2>/dev/null; then
        echo "❌ PocketBase process died! Restarting..."
        ./pocketbase serve --http=0.0.0.0:8090 &
        POCKETBASE_PID=$!
    fi
    
    # Check Node.js service via PM2
    if ! pm2 describe opencode-service > /dev/null 2>&1; then
        echo "❌ Node.js service not found in PM2! Restarting..."
        pm2 start ecosystem.config.js --env production
    fi
    
    # Show status every 5 minutes (10 * 30s = 5min)
    if [ $(($(date +%s) % 300)) -lt 30 ]; then
        echo "🔄 $(date): System health check"
        pm2 status
    fi
done