#!/bin/bash

echo "=== Testing Current OpenCode Service ==="

# 1. Check if service is running
echo -e "\n1. Service Health Check:"
curl -s http://localhost:3001/health | jq .

# 2. Test with simple prompt
echo -e "\n2. Testing simple document generation:"
RESPONSE=$(curl -s "http://localhost:3001/opencode/stream?prompt=Schreibe%20einen%20Absatz%20%C3%BCber%20B%C3%BCroreinigung&userId=hmfwzq8txbc9d2w&recordId=test-$(date +%s)")

echo "Response length: ${#RESPONSE} chars"
echo "First 200 chars: ${RESPONSE:0:200}"

# 3. Check database for latest document
echo -e "\n3. Latest document in database:"
sqlite3 pb_data/data.db "SELECT id, substr(content, 1, 100) as preview, length(content) as len FROM documents ORDER BY created DESC LIMIT 3;"

# 4. Check if OpenCode works directly
echo -e "\n4. Direct OpenCode test:"
export OPENAI_API_KEY=$(sqlite3 pb_data/data.db "SELECT api_key FROM apikeys WHERE user_id = 'hmfwzq8txbc9d2w' LIMIT 1;")
echo "API Key found: ${OPENAI_API_KEY:0:10}..."

timeout 10 script -qc 'opencode run "Sage: Hallo Test" --model openai/gpt-4o-mini' /dev/null 2>&1 | grep -A5 "Text"