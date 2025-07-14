# Multi-stage build for OpenCode Multiuser System
FROM node:20-alpine AS base

# Install system dependencies including process manager
RUN apk add --no-cache \
    bash \
    curl \
    git \
    python3 \
    make \
    g++ \
    sqlite \
    jq \
    && rm -rf /var/cache/apk/*

# Install PM2 for process management
RUN npm install -g pm2

# Install OpenCode CLI - use our working local version approach
RUN npm install -g typescript ts-node

# Create app directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy all application files first
COPY . .

# Download and replace with PocketBase v0.28.4
RUN curl -L -o pocketbase_0.28.4_linux_amd64.zip \
    https://github.com/pocketbase/pocketbase/releases/download/v0.28.4/pocketbase_0.28.4_linux_amd64.zip && \
    unzip -o pocketbase_0.28.4_linux_amd64.zip && \
    chmod +x pocketbase && \
    rm pocketbase_0.28.4_linux_amd64.zip

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

# Create production startup script with PM2
COPY start-production.sh ./start.sh

RUN chmod +x start.sh

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV POCKETBASE_URL=http://localhost:8090

# Start the application
CMD ["./start.sh"]