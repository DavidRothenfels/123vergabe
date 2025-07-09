# OpenCode Multiuser System

Ein Multiuser-OpenCode-System mit PocketBase Backend, Node.js Service und HTML Frontend für kollaborative KI-Code-Generierung.

## 🚀 Features

- **🔐 User Authentication**: Login mit Email/Passwort über PocketBase
- **🔑 Personal API Keys**: Jeder User kann seinen eigenen OpenAI API Key setzen
- **👥 Multiuser Isolation**: Jeder User bekommt isolierte temporäre Verzeichnisse
- **📡 Streaming Responses**: Echtzeit OpenCode Output Streaming
- **🛠️ Debug Dashboard**: Umfassendes Testing und Monitoring Interface
- **🐳 Docker Ready**: Vollständig containerisiert für einfaches Deployment

## 📋 System-Anforderungen

- Node.js 18+ (für lokale Entwicklung)
- Docker & Docker Compose (für Deployment)
- OpenAI API Key

## 🏃‍♂️ Quick Start

### Mit Docker (Empfohlen)

```bash
# Repository clonen
git clone https://github.com/DavidRothenfels/cliopencode.git
cd cliopencode

# Environment Variable setzen
export OPENAI_API_KEY="sk-..."

# Container bauen und starten
docker build -t opencode-multiuser .
docker run -p 8090:8090 -p 3001:3001 -e OPENAI_API_KEY="$OPENAI_API_KEY" opencode-multiuser
```

### Lokale Entwicklung

1. **Dependencies installieren**
```bash
npm install
```

2. **Environment Variables setzen**
```bash
cp .env.example .env
# Edit .env mit deinem OpenAI API Key
echo "OPENAI_API_KEY=sk-..." > .env
```

3. **PocketBase starten**
```bash
./pocketbase serve
```

4. **Node.js Service starten**
```bash
node opencode-service.js
```

## 🎯 Erste Schritte

### 1. Admin Account erstellen

Nach dem Start navigiere zu: **http://localhost:8090/_/**

**Standard Admin Credentials** (beim ersten Start):
- **Email**: `admin@example.com`
- **Password**: `admin123456`

### 2. Test User Account

Das System kommt mit einem vorkonfigurierten Test User:
- **Email**: `test@test.com`
- **Password**: `test123456`

### 3. Dashboard öffnen

Navigiere zu: **http://localhost:8090/_/debug.html**

1. **Login** mit den Test Credentials
2. **Service Status prüfen** - beide Services sollten grün sein
3. **Live Test starten** - gib einen Prompt ein wie "Schreibe einen kurzen Witz"

## 🔧 Funktionsweise

### System-Architektur
```
Browser (Frontend) → PocketBase (Backend/Hooks) → Node.js Service → OpenCode CLI
```

### Datenfluss
1. **User Login**: Authentifizierung über PocketBase JWT
2. **Prompt Input**: User gibt Prompt im Dashboard ein
3. **Parameter Extraction**: PocketBase Hook extrahiert Prompt und User API Key
4. **Service Call**: Hook ruft Node.js Service auf
5. **Process Isolation**: Jeder User bekommt isoliertes temp Verzeichnis
6. **OpenCode Execution**: CLI wird mit User-spezifischen Settings gestartet
7. **Streaming Response**: Output wird live zurück gestreamt

### API Key Priorität
1. **User's Personal API Key** (aus Profil)
2. **System Environment Variable** (`OPENAI_API_KEY`)
3. **Fallback Key** (konfigurierbar)

## 🔑 API Key Management

### User API Keys setzen

1. Login im **PocketBase Admin** (http://localhost:8090/_/)
2. Navigiere zu **Collections → users**
3. Wähle einen User aus
4. Setze das **api_key** Feld mit dem OpenAI API Key

### System API Key

```bash
# Via Environment Variable
export OPENAI_API_KEY="sk-..."

# Via .env Datei
echo "OPENAI_API_KEY=sk-..." > .env
```

## 📡 API Endpoints

| Endpoint | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/collections/users/auth-with-password` | POST | User Login |
| `/test` | GET | Basic Health Check |
| `/opencode/health` | GET | Node.js Service Health |
| `/opencode/stream` | GET | OpenCode Streaming Endpoint |

## 🐳 Docker Deployment

### Lokaler Build & Test

```bash
# Image bauen
docker build -t opencode-multiuser .

# Container starten
docker run -d \
  --name opencode-app \
  -p 8090:8090 \
  -p 3001:3001 \
  -e OPENAI_API_KEY="sk-..." \
  opencode-multiuser

# Logs anzeigen
docker logs -f opencode-app

# Container stoppen
docker stop opencode-app && docker rm opencode-app
```

### Mit Coolify

1. **Repository URL**: `https://github.com/DavidRothenfels/cliopencode.git`
2. **Build Command**: Automatisch via Dockerfile
3. **Environment Variables**:
   - `OPENAI_API_KEY=sk-...`
4. **Ports**: `8090:8090,3001:3001`

### Environment Variables

```env
# Required
OPENAI_API_KEY=sk-...

# Optional
NODE_ENV=production
PORT=3001
MAX_CONCURRENT_PROCESSES=10
LOG_LEVEL=info
```

## 🛠️ Development

### Projekt Struktur

```
├── pb_hooks/           # PocketBase JavaScript Hooks
├── pb_public/          # Frontend (Debug Dashboard)
├── pb_migrations/      # Database Migrationen
├── pb_data/           # PocketBase Daten (SQLite)
├── opencode-service.js # Node.js Express Service
├── Dockerfile         # Container Definition
├── functions.md       # Technische Dokumentation
└── README.md          # Diese Datei
```

### Debugging

**PocketBase Logs**:
```bash
tail -f pb_data/logs.db
```

**Node.js Service Logs**:
```bash
# Console output beim Start von opencode-service.js
```

**Browser Console**:
- Öffne Developer Tools im Dashboard
- Check Network Tab für HTTP Requests
- Console für JavaScript Errors

## 🔍 Troubleshooting

### Häufige Probleme

**"Prompt ist erforderlich"**
- Check: Prompt Parameter korrekt übertragen?
- Lösung: Debug Dashboard verwenden

**"Connection refused"**
- Check: Node.js Service läuft auf Port 3001?
- Lösung: `node opencode-service.js` starten

**"API Key Error"**
- Check: OPENAI_API_KEY gesetzt?
- Lösung: Environment Variable oder User API Key setzen

**Dashboard lädt nicht**
- Check: PocketBase läuft auf Port 8090?
- Lösung: `./pocketbase serve` starten

### Service Health Checks

```bash
# PocketBase Status
curl http://localhost:8090/api/health

# Node.js Service Status  
curl http://localhost:3001/health

# Test Hook
curl http://localhost:8090/test
```

## 🤝 Contributing

1. Fork das Repository
2. Erstelle einen Feature Branch
3. Commit deine Änderungen
4. Push zum Branch
5. Erstelle einen Pull Request

## 📄 Lizenz

Siehe [LICENSE.md](LICENSE.md) für Details.

## 🎉 Demo

Das System ist produktionsreif und kann sofort verwendet werden:

1. **Starte** das System mit Docker
2. **Öffne** http://localhost:8090/_/debug.html
3. **Login** mit test@test.com / test123456
4. **Teste** mit einem Prompt wie "Erstelle eine Python-Funktion für Fibonacci"
5. **Genieße** die Live-KI-Code-Generierung!