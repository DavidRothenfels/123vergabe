#!/bin/bash

# Start OpenCode service in background
node opencode-service.js &
SERVICE_PID=$!

# Wait for service to start
sleep 3

# Make test request
echo "Making test request..."
curl -s "http://localhost:3001/opencode/stream?prompt=Sage%20Hallo%20auf%20Deutsch&userId=hmfwzq8txbc9d2w&recordId=test-direct-$(date +%s)"

echo -e "\n\nChecking database for latest document..."
sqlite3 pb_data/data.db "SELECT id, substr(content, 1, 200) as content_preview FROM documents ORDER BY created DESC LIMIT 1;"

# Kill the service
kill $SERVICE_PID