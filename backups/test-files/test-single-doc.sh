#!/bin/bash
echo "=== Testing Single Document Generation ==="

# 1. Start service
echo "Starting service..."
node opencode-service.js &
SERVICE_PID=$!
sleep 3

# 2. Make test request
echo -e "\nMaking test request..."
curl -v "http://localhost:3001/opencode/stream?prompt=Erstelle%20eine%20kurze%20Leistungsbeschreibung%20f%C3%BCr%20B%C3%BCroreinigung&userId=hmfwzq8txbc9d2w&recordId=test-leistung-$(date +%s)"

echo -e "\n\n3. Checking database..."
sqlite3 pb_data/data.db "SELECT id, length(content) as len, substr(content, 1, 100) FROM documents ORDER BY created DESC LIMIT 1;"

# Kill service
kill $SERVICE_PID 2>/dev/null
echo -e "\nDone."