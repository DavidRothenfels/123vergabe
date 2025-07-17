# Simplified Dockerfile for PocketBase only
FROM alpine:3.19

# Install minimal dependencies
RUN apk add --no-cache \
    ca-certificates \
    wget \
    && rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Copy the pre-built PocketBase binary
COPY pocketbase ./pocketbase
RUN chmod +x ./pocketbase

# Copy all PocketBase directories
COPY pb_data/ ./pb_data/
COPY pb_public/ ./pb_public/
COPY pb_hooks/ ./pb_hooks/
COPY pb_migrations/ ./pb_migrations/

# Expose PocketBase port
EXPOSE 8090

# Set environment variable for OpenRouter API
ENV OPENROUTER_API_KEY=""

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8090/api/health || exit 1

# Start PocketBase
CMD ["./pocketbase", "serve", "--http=0.0.0.0:8090"]