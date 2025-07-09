# OpenCode Multiuser System

A multiuser OpenCode system with PocketBase backend, Node.js service, and HTML frontend.

## Features

- **User Authentication**: Login with email/password via PocketBase
- **Personal API Keys**: Each user can set their own OpenAI API key
- **Multiuser Isolation**: Each user gets isolated temporary directories
- **Streaming Responses**: Real-time OpenCode output streaming
- **Debug Dashboard**: Comprehensive testing and monitoring interface

## Setup

1. **Install Dependencies**
```bash
npm install
```

2. **Set Environment Variables**
```bash
cp .env.example .env
# Edit .env with your OpenAI API key
```

3. **Start PocketBase**
```bash
./pocketbase serve
```

4. **Start Node.js Service**
```bash
node opencode-service.js
```

5. **Open Dashboard**
Navigate to http://127.0.0.1:8090/_/debug.html

## User API Keys

Users can set their personal OpenAI API keys in their profile. The system will:
1. Use the user's personal API key if available
2. Fall back to the system environment variable
3. Use the default fallback key

## API Endpoints

- `GET /test` - Basic hook test
- `GET /opencode/health` - Health check for Node.js service
- `GET /opencode/stream` - OpenCode streaming endpoint

## Authentication

Login with test credentials:
- Email: test@test.com
- Password: test123456

## Architecture

```
Frontend (HTML) -> PocketBase (Hooks) -> Node.js Service -> OpenCode CLI
```

## Development

The system supports both development and production modes with comprehensive logging and error handling.