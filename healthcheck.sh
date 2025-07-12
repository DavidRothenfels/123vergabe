#!/bin/bash

# Production Health Check Script for Vergabedokument-Generator
# Überwacht PocketBase und OpenCode Service auf Verfügbarkeit und Performance

set -e

LOG_FILE="/var/log/pb-healthcheck.log"
RESTART_THRESHOLD=3
FAILED_CHECKS=0

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

check_service() {
    local service_name="$1"
    local url="$2"
    local timeout="${3:-10}"
    
    if curl -f -s --max-time "$timeout" "$url" > /dev/null 2>&1; then
        log "✅ $service_name: OK"
        return 0
    else
        log "❌ $service_name: FAILED"
        return 1
    fi
}

restart_service() {
    local service_name="$1"
    log "🔄 Restarting $service_name..."
    
    case "$service_name" in
        "pocketbase")
            pkill -f "pocketbase" || true
            sleep 5
            cd /app && ./pocketbase serve --http=0.0.0.0:8090 &
            ;;
        "opencode-service")
            pkill -f "node opencode-service.js" || true
            sleep 5
            cd /app && node opencode-service.js &
            ;;
    esac
    
    log "🎯 $service_name restart initiated"
}

check_disk_space() {
    local usage=$(df /app/pb_data | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$usage" -gt 90 ]; then
        log "⚠️  Disk space critical: ${usage}% used"
        # Cleanup old logs and temp files
        find /app/pb_logs -name "*.log" -mtime +7 -delete 2>/dev/null || true
        find /tmp -name "oc-*" -mtime +1 -delete 2>/dev/null || true
    fi
}

main() {
    log "🔍 Starting health check cycle..."
    
    # Check disk space
    check_disk_space
    
    # Check PocketBase
    if ! check_service "PocketBase" "http://localhost:8090/api/health" 15; then
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        if [ $FAILED_CHECKS -ge $RESTART_THRESHOLD ]; then
            restart_service "pocketbase"
            FAILED_CHECKS=0
        fi
    fi
    
    # Check OpenCode Service
    if ! check_service "OpenCode Service" "http://localhost:3001/health" 10; then
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        if [ $FAILED_CHECKS -ge $RESTART_THRESHOLD ]; then
            restart_service "opencode-service"
            FAILED_CHECKS=0
        fi
    fi
    
    # Check for zombie processes
    local zombie_count=$(ps aux | awk '$8 ~ /^Z/ {count++} END {print count+0}')
    if [ "$zombie_count" -gt 0 ]; then
        log "⚠️  Found $zombie_count zombie processes, cleaning up..."
        pkill -f "opencode" || true
    fi
    
    # Check memory usage
    local memory_usage=$(free | awk 'NR==2{printf "%.0f", $3/$2*100}')
    if [ "$memory_usage" -gt 90 ]; then
        log "⚠️  High memory usage: ${memory_usage}%"
    fi
    
    log "✅ Health check cycle completed"
}

# Run continuously in production
if [ "$1" = "--daemon" ]; then
    log "🚀 Starting health check daemon..."
    while true; do
        main
        sleep 300  # Check every 5 minutes
    done
else
    main
fi