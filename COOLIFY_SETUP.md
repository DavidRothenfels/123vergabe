# Coolify Setup Guide

## Option 1: Docker Compose (Empfohlen)

1. **Build Pack ändern**: 
   - Von "Dockerfile" zu "Docker Compose"

2. **Docker Compose Location**: 
   - `/docker-compose.coolify.yml`

3. **Environment Variables**:
   ```
   OPENAI_API_KEY=sk-...
   ```

## Option 2: Dockerfile mit Nginx Proxy

Falls Docker Compose nicht verfügbar ist, können wir einen internen Nginx Proxy einbauen.

### Aktuelle Probleme:
- Nur Port 8090 ist exposed
- OpenCode Service auf Port 3001 ist nicht erreichbar
- `/opencode-api` Requests gehen an PocketBase statt OpenCode

### Lösungsansätze:

1. **Nginx als Reverse Proxy einbauen**:
   - Nginx auf Port 80
   - Proxy `/` → localhost:8090 (PocketBase)
   - Proxy `/opencode-api` → localhost:3001 (OpenCode)

2. **Oder in Coolify UI**:
   - Zusätzliche Domain für Port 3001 hinzufügen
   - z.B. `opencode.cli.a-g-e-n-t.de:3001`

## Temporäre Lösung

Bis die Proxy-Konfiguration funktioniert, kann der OpenCode Service direkt über Port 3001 erreicht werden:
- PocketBase: https://cli.a-g-e-n-t.de/
- OpenCode: https://cli.a-g-e-n-t.de:3001/

Dafür muss in Coolify der Port 3001 auch exposed werden.