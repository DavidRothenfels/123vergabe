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
RUN echo '#!/bin/bash' > start.sh && \
    echo 'set -e' >> start.sh && \
    echo '' >> start.sh && \
    echo 'echo "Starting OpenCode Multiuser System..."' >> start.sh && \
    echo '' >> start.sh && \
    echo '# Start PocketBase in background' >> start.sh && \
    echo 'echo "Starting PocketBase..."' >> start.sh && \
    echo './pocketbase serve --http=0.0.0.0:8090 &' >> start.sh && \
    echo 'POCKETBASE_PID=$!' >> start.sh && \
    echo '' >> start.sh && \
    echo '# Wait for PocketBase to be ready' >> start.sh && \
    echo 'echo "Waiting for PocketBase to start..."' >> start.sh && \
    echo 'timeout=60' >> start.sh && \
    echo 'while [ $timeout -gt 0 ]; do' >> start.sh && \
    echo '    if curl -f http://localhost:8090/api/health 2>/dev/null; then' >> start.sh && \
    echo '        echo "PocketBase is ready!"' >> start.sh && \
    echo '        break' >> start.sh && \
    echo '    fi' >> start.sh && \
    echo '    sleep 2' >> start.sh && \
    echo '    timeout=$((timeout-2))' >> start.sh && \
    echo 'done' >> start.sh && \
    echo '' >> start.sh && \
    echo 'if [ $timeout -le 0 ]; then' >> start.sh && \
    echo '    echo "PocketBase failed to start"' >> start.sh && \
    echo '    exit 1' >> start.sh && \
    echo 'fi' >> start.sh && \
    echo '' >> start.sh && \
    echo '# Start Node.js service' >> start.sh && \
    echo 'echo "Starting Node.js service..."' >> start.sh && \
    echo 'export OPENAI_API_KEY="${OPENAI_API_KEY:-your-openai-api-key-here}"' >> start.sh && \
    echo 'node opencode-service.js &' >> start.sh && \
    echo 'NODE_PID=$!' >> start.sh && \
    echo '' >> start.sh && \
    echo '# Wait for Node.js service to be ready' >> start.sh && \
    echo 'echo "Waiting for Node.js service to start..."' >> start.sh && \
    echo 'timeout=30' >> start.sh && \
    echo 'while [ $timeout -gt 0 ]; do' >> start.sh && \
    echo '    if curl -f http://localhost:3001/health 2>/dev/null; then' >> start.sh && \
    echo '        echo "Node.js service is ready!"' >> start.sh && \
    echo '        break' >> start.sh && \
    echo '    fi' >> start.sh && \
    echo '    sleep 2' >> start.sh && \
    echo '    timeout=$((timeout-2))' >> start.sh && \
    echo 'done' >> start.sh && \
    echo '' >> start.sh && \
    echo 'if [ $timeout -le 0 ]; then' >> start.sh && \
    echo '    echo "Node.js service failed to start"' >> start.sh && \
    echo '    exit 1' >> start.sh && \
    echo 'fi' >> start.sh && \
    echo '' >> start.sh && \
    echo 'echo "All services started successfully!"' >> start.sh && \
    echo 'echo "Dashboard: http://localhost:8090/_/debug.html"' >> start.sh && \
    echo 'echo "PocketBase Admin: http://localhost:8090/_/"' >> start.sh && \
    echo '' >> start.sh && \
    echo '# Function to handle shutdown' >> start.sh && \
    echo 'shutdown() {' >> start.sh && \
    echo '    echo "Shutting down services..."' >> start.sh && \
    echo '    kill $NODE_PID 2>/dev/null || true' >> start.sh && \
    echo '    kill $POCKETBASE_PID 2>/dev/null || true' >> start.sh && \
    echo '    wait' >> start.sh && \
    echo '    echo "Shutdown complete"' >> start.sh && \
    echo '    exit 0' >> start.sh && \
    echo '}' >> start.sh && \
    echo '' >> start.sh && \
    echo '# Set up signal handlers' >> start.sh && \
    echo 'trap shutdown SIGTERM SIGINT' >> start.sh && \
    echo '' >> start.sh && \
    echo '# Wait for processes' >> start.sh && \
    echo 'wait' >> start.sh

RUN chmod +x start.sh

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV POCKETBASE_URL=http://localhost:8090

# Start the application
CMD ["./start.sh"]