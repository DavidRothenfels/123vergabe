# Bedarf Analysis Setup

## OpenRouter API Key Configuration

The Bedarf Analysis feature requires an OpenRouter API key for AI-powered question generation.

### Setting up the API Key

1. Get an API key from [OpenRouter](https://openrouter.ai/)

2. Configure the key in PocketBase:
   - Option A: Set as environment variable:
     ```bash
     export OPENROUTER_API_KEY="your-api-key-here"
     ```
   
   - Option B: Configure in PocketBase Admin:
     1. Go to PocketBase Admin (http://localhost:8090/_/)
     2. Navigate to Settings
     3. Add a new setting: `openrouter_api_key`
     4. Save your API key

### Alternative AI Providers

The system also supports:
- **BBK Proxy**: Local proxy on port 8000
- **OpenRouter Proxy**: Local proxy on port 8001

These can be selected in the UI settings if available.

## Usage

1. Click on "Bedarfsanalyse" button in the main interface
2. Describe your procurement needs
3. Answer the generated questions
4. Review and use the generated document

## Troubleshooting

If you get an API error:
1. Check that your OpenRouter API key is properly configured
2. Ensure you have API credits available
3. Check the PocketBase logs for detailed error messages