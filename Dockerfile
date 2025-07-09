# Multi-stage build for OpenCode Multiuser System
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    bash \
    curl \
    git \
    python3 \
    make \
    g++ \
    sqlite \
    && rm -rf /var/cache/apk/*

# Install OpenCode CLI - use our working local version approach
RUN npm install -g typescript ts-node

# Create app directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy all application files including PocketBase binary and data
COPY . .

# Ensure PocketBase binary is executable
RUN chmod +x pocketbase

# Create necessary directories
RUN mkdir -p pb_data pb_logs temp

# Set up OpenCode CLI environment
ENV PATH="/root/.local/bin:${PATH}"
RUN mkdir -p /root/.local/bin

# Create OpenCode mock that calls OpenAI API directly for Docker demo
COPY docker-opencode.sh /root/.local/bin/opencode
RUN chmod +x /root/.local/bin/opencode

# Expose ports
EXPOSE 8090 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8090/api/health || exit 1

# Create startup script
RUN cat > start.sh << 'EOF'
#!/bin/bash
set -e

echo "Starting OpenCode Multiuser System..."

# Start PocketBase in background
echo "Starting PocketBase..."
./pocketbase serve --http=0.0.0.0:8090 &
POCKETBASE_PID=$!

# Wait for PocketBase to be ready
echo "Waiting for PocketBase to start..."
timeout=60
while [ $timeout -gt 0 ]; do
    if curl -f http://localhost:8090/api/health 2>/dev/null; then
        echo "PocketBase is ready!"
        break
    fi
    sleep 2
    timeout=$((timeout-2))
done

if [ $timeout -le 0 ]; then
    echo "PocketBase failed to start"
    exit 1
fi

# Start Node.js service
echo "Starting Node.js service..."
export OPENAI_API_KEY="${OPENAI_API_KEY:-your-openai-api-key-here}"
node opencode-service.js &
NODE_PID=$!

# Wait for Node.js service to be ready
echo "Waiting for Node.js service to start..."
timeout=30
while [ $timeout -gt 0 ]; do
    if curl -f http://localhost:3001/health 2>/dev/null; then
        echo "Node.js service is ready!"
        break
    fi
    sleep 2
    timeout=$((timeout-2))
done

if [ $timeout -le 0 ]; then
    echo "Node.js service failed to start"
    exit 1
fi

echo "All services started successfully!"
echo "Dashboard: http://localhost:8090/_/debug.html"
echo "PocketBase Admin: http://localhost:8090/_/"

# Function to handle shutdown
shutdown() {
    echo "Shutting down services..."
    kill $NODE_PID 2>/dev/null || true
    kill $POCKETBASE_PID 2>/dev/null || true
    wait
    echo "Shutdown complete"
    exit 0
}

# Set up signal handlers
trap shutdown SIGTERM SIGINT

# Wait for processes
wait
EOF

RUN chmod +x start.sh

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV POCKETBASE_URL=http://localhost:8090

# Start the application
CMD ["./start.sh"]