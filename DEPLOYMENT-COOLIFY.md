# Coolify Deployment Guide - Vergabedokument Generator

## Übersicht

Diese Anwendung besteht aus zwei Services, die zusammenarbeiten:
- **PocketBase**: Backend, Datenbank und Frontend-Hosting
- **OpenCode Service**: Node.js Service für AI-Textgenerierung mit OpenAI

## Architektur

```
┌─────────────────────────────────────────┐
│         Coolify (Traefik Proxy)         │
├─────────────────┬───────────────────────┤
│   example.com/  │ example.com/opencode-api/
│        ↓        │           ↓            │
│   PocketBase    │    OpenCode Service    │
│   (Port 8090)   │      (Port 3001)       │
└─────────────────┴───────────────────────┘
```

## Voraussetzungen

- Coolify Installation
- GitHub Repository
- OpenAI API Key
- Domain (optional, Coolify kann auch Subdomains bereitstellen)

## Deployment Schritt-für-Schritt

### 1. Repository vorbereiten

Stellen Sie sicher, dass folgende Dateien im Repository vorhanden sind:
- `docker-compose.yml` - Multi-Service Konfiguration
- `Dockerfile` - PocketBase Container
- `Dockerfile.opencode` - OpenCode Service Container
- `.dockerignore` - Optimiert Build-Größe
- Alle Anwendungsdateien

### 2. Coolify Projekt erstellen

1. Loggen Sie sich in Coolify ein
2. Klicken Sie auf "New Project"
3. Wählen Sie "Docker Compose" als Source
4. Verbinden Sie Ihr GitHub Repository

### 3. Umgebungsvariablen konfigurieren

In Coolify's Environment Variables Section:

```bash
# Pflichtfelder
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Wird von Coolify automatisch gesetzt
SERVICE_FQDN=ihre-domain.coolify.app
```

### 4. Docker Compose anpassen (falls nötig)

Die mitgelieferte `docker-compose.yml` ist bereits für Coolify optimiert:

```yaml
version: '3.8'

services:
  pocketbase:
    build: .
    expose:
      - "8090"
    volumes:
      - ./pb_data:/pb_data
      - ./pb_public:/pb_public
      - ./pb_hooks:/pb_hooks
      - ./pb_migrations:/pb_migrations
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.pocketbase.rule=Host(`${SERVICE_FQDN}`) && PathPrefix(`/`)"
      - "traefik.http.services.pocketbase.loadbalancer.server.port=8090"

  opencode-service:
    build: 
      context: .
      dockerfile: Dockerfile.opencode
    expose:
      - "3001"
    volumes:
      - ./pb_data:/app/pb_data:ro
    environment:
      - NODE_ENV=production
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.opencode.rule=Host(`${SERVICE_FQDN}`) && PathPrefix(`/opencode-api`)"
      - "traefik.http.services.opencode.loadbalancer.server.port=3001"
      - "traefik.http.middlewares.opencode-stripprefix.stripprefix.prefixes=/opencode-api"
      - "traefik.http.routers.opencode.middlewares=opencode-stripprefix"
```

### 5. Persistente Volumes

In Coolify's Storage Section, fügen Sie persistente Volumes hinzu:

```
Source: ./pb_data
Target: /pb_data
```

Dies stellt sicher, dass Ihre Datenbank bei Updates erhalten bleibt.

### 6. Deployment starten

1. Klicken Sie auf "Deploy"
2. Coolify baut die Container und startet sie
3. Warten Sie, bis beide Services grün (healthy) sind

### 7. Erste Einrichtung

Nach erfolgreichem Deployment:

1. **PocketBase Admin einrichten**:
   ```
   https://ihre-domain.com/_/
   ```
   - Erstellen Sie einen Admin-Account
   - Die Datenbank wird automatisch initialisiert

2. **Anwendung testen**:
   ```
   https://ihre-domain.com/
   ```
   - Registrieren Sie einen Test-User
   - Fügen Sie Ihren OpenAI API Key hinzu

3. **Debug Dashboard**:
   ```
   https://ihre-domain.com/pb_public/debug.html
   ```
   - Prüft alle Services
   - Zeigt Verbindungsstatus

## URL-Schema in Production

| Service | URL |
|---------|-----|
| PocketBase API | `https://ihre-domain.com/api/` |
| PocketBase Admin | `https://ihre-domain.com/_/` |
| Frontend | `https://ihre-domain.com/` |
| OpenCode API | `https://ihre-domain.com/opencode-api/` |
| Debug Dashboard | `https://ihre-domain.com/pb_public/debug.html` |

## Wichtige Konfigurationsdetails

### Frontend URL-Handling

Die Anwendung erkennt automatisch die Umgebung:

```javascript
// Lokale Entwicklung
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  opencodeUrl = `http://${window.location.hostname}:3001/opencode/stream`;
} else {
  // Production mit Coolify
  opencodeUrl = `/opencode-api/opencode/stream`;
}
```

### CORS Konfiguration

Der OpenCode Service erlaubt alle Origins:
```javascript
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Health Checks

Beide Services haben Health Check Endpoints:
- PocketBase: `/api/health`
- OpenCode: `/health` (erreichbar unter `/opencode-api/health`)

## Troubleshooting

### Problem: Services starten nicht

1. **Logs prüfen** in Coolify's Log Viewer
2. **Umgebungsvariablen** prüfen (besonders OPENAI_API_KEY)
3. **Build Logs** auf Fehler untersuchen

### Problem: "NetworkError" im Frontend

**Ursache**: Frontend kann OpenCode Service nicht erreichen

**Lösung**: 
- Prüfen Sie, ob beide Services laufen
- Verwenden Sie das Debug Dashboard
- Überprüfen Sie Traefik Labels in docker-compose.yml

### Problem: 429 "Request already in progress"

**Ursache**: User-Lock System verhindert parallele Anfragen

**Lösung**: 
- Warten Sie, bis der aktuelle Prozess fertig ist
- Nutzen Sie den "Abbrechen" Button
- Prüfen Sie im Debug Dashboard laufende Prozesse

### Problem: OpenCode hängt

**Ursache**: OpenCode benötigt TTY für Output

**Lösung**: Bereits gelöst durch `script` Wrapper:
```javascript
const args = ['-qc', `opencode run "${escapedPrompt}" --model ${modelName}`, '/dev/null'];
const proc = spawn('script', args, { env, stdio: ['pipe', 'pipe', 'pipe'] });
```

## Lokale Entwicklung

Für lokale Tests:

### Option 1: Single Container (empfohlen)

```bash
# Beide Services in einem Container
docker-compose -f docker-compose.single.yml up --build -d

# Logs anzeigen
docker-compose -f docker-compose.single.yml logs -f
```

### Option 2: Separate Services

```bash
# Backend starten
./pocketbase serve

# OpenCode Service starten (in neuem Terminal)
node opencode-service.js
```

### Option 3: Multi-Container

```bash
# Beide Services in separaten Containern
docker-compose up --build -d
```

URLs für lokale Entwicklung:
- PocketBase: http://localhost:8090
- OpenCode Service: http://localhost:3001

## Sicherheitshinweise

1. **API Keys**: 
   - Niemals im Repository committen
   - Immer über Umgebungsvariablen
   - User-spezifische Keys in DB verschlüsselt

2. **Admin Zugang**:
   - Ändern Sie das Standard-Passwort
   - Verwenden Sie starke Passwörter
   - Aktivieren Sie 2FA wenn möglich

3. **HTTPS**:
   - Coolify aktiviert automatisch HTTPS
   - Verwenden Sie nur HTTPS in Production

## Updates und Wartung

### Anwendung updaten

1. Code-Änderungen in Repository pushen
2. In Coolify auf "Redeploy" klicken
3. Coolify pulled automatisch die neueste Version

### Datenbank-Backup

```bash
# Manuelles Backup
docker exec <container-id> sqlite3 /pb_data/data.db ".backup /pb_data/backup.db"
```

Oder konfigurieren Sie automatische Backups in Coolify.

## Monitoring

### Verfügbare Metriken

- Container CPU/Memory Usage (Coolify Dashboard)
- Health Check Status
- Application Logs
- Error Tracking im Debug Dashboard

### Empfohlene Überwachung

1. Richten Sie Uptime-Monitoring ein
2. Überwachen Sie API Response Times
3. Setzen Sie Alerts für fehlgeschlagene Health Checks

## Support und Debugging

Bei Problemen:

1. **Debug Dashboard** öffnen: `/pb_public/debug.html`
2. **Service Status** prüfen
3. **Logs** in Coolify einsehen
4. **Test-Anfragen** über Debug Dashboard senden

## Bekannte Einschränkungen

- OpenCode CLI benötigt `script` Command (in Alpine Linux enthalten)
- Große Dokumente können die Generierung verlangsamen
- User-Lock verhindert parallele Anfragen pro User (by design)