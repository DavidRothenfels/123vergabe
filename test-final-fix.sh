#!/bin/bash

echo "Testing OpenCode with actual API key from database..."

# Get API key from database
API_KEY=$(sqlite3 pb_data/data.db "SELECT api_key FROM apikeys WHERE user_id = 'hmfwzq8txbc9d2w' LIMIT 1;")
echo "API Key: ${API_KEY:0:10}..."

# Test 1: Direct OpenCode call
echo -e "\n=== Test 1: Direct OpenCode Call ==="
export OPENAI_API_KEY="$API_KEY"
timeout 20 script -qc 'opencode run "Sage einfach: Hallo Welt" --model openai/gpt-4o-mini' /dev/null 2>&1 | tee direct-test.log

# Test 2: Through service
echo -e "\n\n=== Test 2: Through Service ==="
node opencode-service.js > service-test.log 2>&1 &
SERVICE_PID=$!
sleep 3

# Make request
curl -s "http://localhost:3001/opencode/stream?prompt=Sage%20Hallo%20Welt&userId=hmfwzq8txbc9d2w&recordId=final-test-$(date +%s)" | tee service-response.txt

echo -e "\n\n=== Service Logs ==="
tail -20 service-test.log

echo -e "\n\n=== Latest Document in DB ==="
sqlite3 pb_data/data.db "SELECT id, substr(content, 1, 200) FROM documents ORDER BY created DESC LIMIT 1;"

# Cleanup
kill $SERVICE_PID 2>/dev/null