# OpenCode Multiuser System - Technische Dokumentation

## 1. System-Architektur

Das System besteht aus vier Hauptkomponenten:

```
Browser (Frontend) → PocketBase (Backend/Hooks) → Node.js Service → OpenCode CLI
```

### 1.1 Datenfluss

1. **User Interaction**: Benutzer gibt Prompt im Browser ein
2. **Authentication**: PocketBase validiert JWT Token
3. **Hook Processing**: PocketBase Hook extrahiert Parameter und User API Key
4. **Service Call**: Hook ruft Node.js Service auf
5. **OpenCode Execution**: Node.js Service startet OpenCode CLI mit User-spezifischen Einstellungen
6. **Streaming Response**: OpenCode Output wird über alle Schichten zurück gestreamt

## 2. Komponenten-Details

### 2.1 PocketBase Backend

**Datei**: `pb_hooks/fixed.pb.js`

**Funktionalität**:
- REST API für User Management
- JWT Authentication
- JavaScript Hooks für Custom Logic
- SQLite Datenbank

**Routes**:
- `GET /test` - Basic Health Check
- `GET /opencode/health` - Node.js Service Health Check  
- `GET /opencode/stream` - Hauptendpunkt für OpenCode Anfragen

**Hook Verarbeitung**:
```javascript
// 1. Parameter Extraktion
const prompt = e.queryParam("prompt");
const model = e.queryParam("model");

// 2. User API Key Extraktion
const authRecord = e.auth;
const userApiKey = authRecord?.api_key;

// 3. Service Aufruf
const serviceUrl = `http://127.0.0.1:3001/opencode/stream?prompt=${encodeURIComponent(prompt)}&userKey=${encodeURIComponent(userApiKey)}`;
```

### 2.2 Node.js Service

**Datei**: `opencode-service.js`

**Funktionalität**:
- Express.js HTTP Server
- OpenCode CLI Process Management
- User Isolation mit temporären Verzeichnissen
- Streaming Response Handling
- API Key Priorität: User Key > Environment > Fallback

**Key Features**:
```javascript
// User Isolation
const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), `oc-${userId}-`));

// API Key Priorität
const env = {
  ...process.env,
  HOME: tmpHome,
  OPENAI_API_KEY: userKey || process.env.OPENAI_API_KEY || 'fallback-key'
};

// OpenCode Process
const proc = spawn('opencode', ['run', prompt], { env });
```

### 2.3 Frontend Dashboard

**Datei**: `pb_public/debug.html`

**Funktionalität**:
- User Login/Logout
- Service Status Monitoring
- Live OpenCode Testing
- Streaming Response Display
- Error Handling

**Streaming Implementation**:
```javascript
const reader = res.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  output.innerHTML += chunk;
}
```

### 2.4 Database Schema

**Users Collection**:
- `id` (string) - Unique User ID
- `email` (string) - User Email
- `password` (string) - Hashed Password
- `api_key` (string) - User's OpenAI API Key

**Migration**: `pb_migrations/1752070800_add_user_api_key.js`

## 3. Security Features

### 3.1 Authentication
- JWT Token-based Authentication
- Session Management via PocketBase
- API Key Isolation per User

### 3.2 User Isolation
- Temporäre Verzeichnisse pro User
- Process Isolation
- Cleanup nach Completion

### 3.3 API Key Management
- User-spezifische API Keys in Database
- Environment Variable Fallbacks
- Keine Hardcoded Keys im Code

## 4. Error Handling

### 4.1 PocketBase Hooks
```javascript
try {
  // Hook Logic
} catch (error) {
  console.log("💥 Error:", error.message);
  return e.json(500, { error: error.message });
}
```

### 4.2 Node.js Service
```javascript
proc.on('error', (error) => {
  console.log(`💥 User ${userId} Process Error:`, error.message);
  res.write(`\n[ERROR] ${error.message}`);
  res.end();
});
```

### 4.3 Frontend
```javascript
if (!res.ok) {
  const errorData = await res.json();
  output.innerHTML += JSON.stringify(errorData, null, 2);
  return;
}
```

## 5. Deployment Architektur

### 5.1 Container Setup
- Multi-stage Docker Build
- Node.js + OpenCode CLI in einem Container
- PocketBase als separater Service
- Environment Variables für Konfiguration

### 5.2 Service Communication
- Internal Network Communication
- Health Check Endpoints
- Graceful Shutdown Handling

### 5.3 Data Persistence
- SQLite Database für PocketBase
- Persistent Volumes für Data
- Backup Strategien

## 6. Performance Optimierungen

### 6.1 Process Management
- Spawn OpenCode Processes on Demand
- Automatic Cleanup
- Resource Limits

### 6.2 Streaming
- Chunked Transfer Encoding
- Real-time Output Streaming
- Memory Efficient Processing

### 6.3 Caching
- Static File Serving
- Connection Pooling
- Request Debouncing

## 7. Monitoring & Logging

### 7.1 PocketBase Logs
- Request Logging
- Error Tracking
- Performance Metrics

### 7.2 Node.js Service Logs
- Process Lifecycle
- User Activity
- API Key Usage

### 7.3 Health Checks
- Service Availability
- Database Connectivity
- OpenCode CLI Status

## 8. Environment Configuration

### 8.1 Required Environment Variables
```bash
OPENAI_API_KEY=your-openai-api-key
NODE_ENV=production
PORT=3001
POCKETBASE_URL=http://pocketbase:8090
```

### 8.2 Optional Configuration
```bash
MAX_CONCURRENT_PROCESSES=10
TEMP_DIR_PREFIX=opencode-
LOG_LEVEL=info
```

## 9. API Specification

### 9.1 Authentication Endpoint
```
POST /api/collections/users/auth-with-password
Content-Type: application/json

{
  "identity": "user@example.com",
  "password": "password123"
}
```

### 9.2 OpenCode Stream Endpoint
```
GET /opencode/stream?prompt=YOUR_PROMPT&model=MODEL_NAME
Authorization: Bearer JWT_TOKEN
```

### 9.3 Response Format
```
HTTP/1.1 200 OK
Content-Type: text/plain; charset=utf-8
Transfer-Encoding: chunked

[OpenCode output streaming in real-time]
[✔ User anonymous - Fertig!]
```

## 10. Troubleshooting

### 10.1 Common Issues
- **"Prompt ist erforderlich"**: Missing prompt parameter
- **"Connection refused"**: Node.js Service not running
- **"API Key Error"**: Invalid or missing OpenAI API Key

### 10.2 Debug Steps
1. Check Service Status via `/health` endpoints
2. Verify Authentication Token validity
3. Examine console logs in browser
4. Review server logs for errors

### 10.3 Service Recovery
- Automatic process cleanup on error
- Service restart capabilities
- Database connection recovery