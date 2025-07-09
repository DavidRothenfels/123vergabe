#!/bin/bash

# OpenCode CLI simulation for Docker
# This script simulates OpenCode functionality using direct OpenAI API calls

# Parse arguments
COMMAND=""
PROMPT=""
MODEL="gpt-4o-mini"

while [[ $# -gt 0 ]]; do
    case $1 in
        run)
            COMMAND="run"
            shift
            ;;
        --model)
            MODEL="$2"
            shift 2
            ;;
        --headless)
            # Ignore headless flag
            shift
            ;;
        *)
            # Assume remaining args are the prompt
            PROMPT="$*"
            break
            ;;
    esac
done

# If no prompt provided, show help
if [[ -z "$PROMPT" ]]; then
    echo "opencode run [message..]"
    echo ""
    echo "run opencode with a message"
    echo ""
    echo "Positionals:"
    echo "  message  message to send                                 [array] [default: []]"
    echo ""
    echo "Options:"
    echo "      --help        show help                                          [boolean]"
    echo "  -v, --version     show version number                                [boolean]"
    echo "      --print-logs  print logs to stderr                               [boolean]"
    echo "  -c, --continue    continue the last session                          [boolean]"
    echo "  -s, --session     session id to continue                              [string]"
    echo "      --share       share the session                                  [boolean]"
    echo "  -m, --model       model to use in the format of provider/model        [string]"
    exit 0
fi

# Check for API key
if [[ -z "$OPENAI_API_KEY" ]]; then
    echo "🎮 DEMO MODE - OpenCode Docker"
    echo "👤 User: Docker Container"
    echo "💬 Prompt: \"$PROMPT\""
    echo "🤖 Model: $MODEL"
    echo ""
    echo "📝 Demo Response:"
    echo "Das ist eine Docker-Demo-Antwort für den Prompt \"$PROMPT\"."
    echo ""
    echo "In der echten Version würde hier OpenCode mit einem echten OpenAI API-Key antworten."
    echo ""
    echo "✅ Demo completed!"
    exit 0
fi

# Create a simple OpenAI API request
echo "🚀 OpenCode Docker - Processing: \"$PROMPT\""

# Use curl to call OpenAI API (simplified)
RESPONSE=$(curl -s -H "Authorization: Bearer $OPENAI_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"model\":\"$MODEL\",\"messages\":[{\"role\":\"user\",\"content\":\"$PROMPT\"}],\"max_tokens\":500}" \
    https://api.openai.com/v1/chat/completions)

# Extract content from response
CONTENT=$(echo "$RESPONSE" | grep -o '"content":"[^"]*"' | head -1 | sed 's/"content":"//; s/"$//')

if [[ -n "$CONTENT" ]]; then
    echo "$CONTENT"
else
    echo "🎭 Mock OpenCode Response:"
    echo "Here's a simulated AI response for: \"$PROMPT\""
    echo ""
    echo "This is a Docker container demonstration."
    echo "OpenCode would normally process this request with advanced AI capabilities."
fi

echo ""
echo "✅ OpenCode processing complete!"