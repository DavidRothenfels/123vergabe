# Simplified Dockerfile that copies all PocketBase data and files
FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache \
    bash \
    curl \
    git \
    sqlite \
    jq \
    && rm -rf /var/cache/apk/*

# Install PM2 for process management
RUN npm install -g pm2

# Create app directory
WORKDIR /app

# Copy package files for dependencies
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy the pre-built PocketBase binary directly
COPY pocketbase ./pocketbase
RUN chmod +x ./pocketbase

# Copy all PocketBase data (databases, storage, etc.)
COPY pb_data/ ./pb_data/
COPY pb_hooks/ ./pb_hooks/
COPY pb_public/ ./pb_public/
COPY pb_migrations/ ./pb_migrations/

# Copy application files
COPY *.js ./
COPY *.sh ./
COPY *.json ./
COPY docker-opencode.sh /usr/local/bin/opencode
RUN chmod +x /usr/local/bin/opencode
RUN chmod +x ./*.sh

# Create necessary directories
RUN mkdir -p pb_data pb_logs temp

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV POCKETBASE_URL=http://localhost:8090
ENV PATH="/usr/local/bin:${PATH}"

# Expose ports
EXPOSE 8090 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8090/api/health || exit 1

# Start the application
CMD ["./start-production.sh"]