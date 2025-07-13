# Vergabedokument-Generator

Eine KI-gestützte Anwendung zur automatischen Generierung von Vergabedokumenten (Leistungsbeschreibungen, Eignungskriterien, etc.) mit PocketBase Backend und OpenAI Integration.

## Features

- 🤖 **KI-gestützte Dokumentengenerierung** mit OpenAI GPT-4
- 📝 **Verschiedene Dokumenttypen**: Leistungsbeschreibungen, Eignungskriterien, Bewertungsmatrizen
- 👥 **Multi-User System** mit individuellen API Keys
- 🔒 **Sichere API Key Verwaltung** pro Benutzer
- 📊 **Projekt-Management** für verschiedene Ausschreibungen
- 🚀 **Echtzeit-Streaming** der generierten Inhalte
- 🛡️ **User-Lock System** verhindert parallele Anfragen
- 🎯 **Debug Dashboard** für Diagnose und Tests

## Technologie-Stack

- **Backend**: PocketBase (Go-basiertes Backend-as-a-Service)
- **AI Service**: Node.js mit OpenCode CLI
- **Frontend**: Vanilla JavaScript mit PocketBase SDK
- **Deployment**: Docker Compose, optimiert für Coolify

## Installation

### Voraussetzungen

- Node.js 18+
- Go 1.21+ (für PocketBase)
- OpenAI API Key

### Lokale Entwicklung

1. **Repository klonen**:
   ```bash
   git clone <repository-url>
   cd pb-cli-test
   ```

2. **Dependencies installieren**:
   ```bash
   npm install
   ```

3. **PocketBase starten**:
   ```bash
   ./pocketbase serve
   ```

4. **OpenCode Service starten** (in neuem Terminal):
   ```bash
   node opencode-service.js
   ```

5. **Anwendung öffnen**:
   - Frontend: http://localhost:8090
   - Admin: http://localhost:8090/_/
   - Debug: http://localhost:8090/pb_public/debug.html

### Docker Deployment

```bash
docker-compose up
```

## Deployment mit Coolify

Siehe [DEPLOYMENT-COOLIFY.md](DEPLOYMENT-COOLIFY.md) für eine detaillierte Anleitung.

## Verwendung

1. **Registrierung/Login** über die Weboberfläche
2. **API Key hinzufügen** in den Einstellungen
3. **Projekt erstellen** für Ihre Ausschreibung
4. **Dokumenttyp wählen** und Beschreibung eingeben
5. **Generieren** klicken und warten

## API Endpoints

### PocketBase (Port 8090)
- `/api/collections/*/records` - CRUD Operationen
- `/api/health` - Health Check

### OpenCode Service (Port 3001)
- `/opencode/stream` - Dokument generieren (Streaming)
- `/opencode/cancel` - Laufenden Prozess abbrechen
- `/opencode/status` - Prozessstatus abfragen
- `/health` - Service Health Check

## Sicherheit

- API Keys werden verschlüsselt in der Datenbank gespeichert
- Jeder Benutzer hat isolierte Daten
- CORS ist für alle Origins aktiviert (für Entwicklung)
- In Production: HTTPS über Coolify/Traefik

## Entwicklung

### Projekt-Struktur

```
├── pb_data/          # PocketBase Datenbank
├── pb_public/        # Frontend-Dateien
├── pb_hooks/         # PocketBase JavaScript Hooks
├── pb_migrations/    # Datenbank-Migrationen
├── opencode-service.js  # Node.js AI Service
├── docker-compose.yml   # Multi-Container Setup
└── Dockerfile*          # Container Definitionen
```

### Wichtige Dateien

- `CLAUDE.md` - Technische Dokumentation für AI-Assistenten
- `DEPLOYMENT-COOLIFY.md` - Production Deployment Guide
- `pb_public/debug.html` - Debug Dashboard

## Troubleshooting

### OpenCode hängt
- Wurde durch TTY-Wrapper gelöst (`script` command)

### NetworkError im Frontend
- Prüfen Sie, ob beide Services laufen
- CORS-Header überprüfen
- Debug Dashboard verwenden

### 429 Error "Request already in progress"
- User-Lock System verhindert parallele Anfragen
- Nutzen Sie den Abbrechen-Button

## Lizenz

[MIT License](LICENSE.md)

## Support

Bei Fragen oder Problemen:
1. Debug Dashboard öffnen: `/pb_public/debug.html`
2. Logs überprüfen
3. Issue im Repository erstellen