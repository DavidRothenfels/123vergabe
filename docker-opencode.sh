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
            # Extract just the model name if it's in provider/model format
            if [[ "$MODEL" == *"/"* ]]; then
                MODEL="${MODEL#*/}"
            fi
            # Map gpt-4.1-mini to gpt-4o-mini (correct API model name)
            if [[ "$MODEL" == "gpt-4.1-mini" ]]; then
                MODEL="gpt-4o-mini"
            fi
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
if [[ -z "$OPENAI_API_KEY" || "$OPENAI_API_KEY" == "DOCKER_PLACEHOLDER_KEY" || "$OPENAI_API_KEY" == "your-openai-api-key-here" ]]; then
    echo "❌ Error: No valid OPENAI_API_KEY available"
    echo "Please set your OpenAI API key via environment variable or through the dashboard"
    echo "This is a demo response for Docker deployment without valid API key."
    echo ""
    echo "Demo response for prompt: '$PROMPT'"
    echo "This would normally be processed by OpenAI's API with a valid API key."
    exit 0
fi

# Create OpenAI API request
echo "🚀 OpenCode Docker - Processing: \"$PROMPT\""
echo "📋 Using model: $MODEL"

# Use curl to call OpenAI API
# Create JSON payload using jq to ensure proper escaping
JSON_PAYLOAD=$(jq -n \
    --arg model "$MODEL" \
    --arg prompt "$PROMPT" \
    '{
        model: $model,
        messages: [{role: "user", content: $prompt}],
        max_tokens: 4000,
        temperature: 0.7
    }')

RESPONSE=$(curl -s -H "Authorization: Bearer $OPENAI_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$JSON_PAYLOAD" \
    https://api.openai.com/v1/chat/completions)

# Check for API errors
if echo "$RESPONSE" | grep -q '"error"'; then
    echo "❌ OpenAI API Error:"
    ERROR_MSG=$(echo "$RESPONSE" | jq -r '.error.message // .error // "Unknown error"' 2>/dev/null)
    echo "Error details: $ERROR_MSG"
    echo "Full response: $RESPONSE"
    exit 1
fi

# Extract content from response
CONTENT=$(echo "$RESPONSE" | jq -r '.choices[0].message.content // empty' 2>/dev/null)

if [[ -n "$CONTENT" ]]; then
    echo "$CONTENT"
else
    echo "❌ Error: Failed to extract content from OpenAI response"
    echo "Response: $RESPONSE"
    exit 1
fi

echo ""
echo "✅ OpenCode processing complete!"