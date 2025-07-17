# Enhanced Logging System with 24h Auto-Deletion

## Übersicht

Detailliertes Logging-System für CLI und PocketBase Fehler mit automatischer 24-Stunden-Löschung zur Speicherplatzverwaltung.

## Implementierte Komponenten

### 1. Datenbank-Schema (Migration: `1752500000_enhanced_logging_system.js`)

#### Collections:
- **logs**: Allgemeine Logs mit Ablaufzeit
- **error_logs**: Detaillierte Fehlerlogs 
- **performance_logs**: Performance-Metriken

#### Felder mit 24h Expiration:
- `expires_at`: Automatische Löschung nach 24h
- `message`: Log-Nachricht (max 5000 Zeichen)
- `level`: info, warn, error, debug
- `source`: cli, pocketbase, opencode, etc.
- `request_id`: Für Request-Tracing
- `user_id`: Benutzer-Kontext
- `error_details`: JSON-Fehlerdaten
- `stack_trace`: Vollständiger Stack-Trace

### 2. PocketBase Enhanced Logging (`pb_hooks/enhanced_logging.pb.js`)

#### Funktionen:
- `createLog(message, level, source, context)` - Standard-Logging
- `createErrorLog(errorType, errorMessage, context)` - Fehler-Logging  
- `createPerformanceLog(operation, durationMs, success, context)` - Performance-Tracking
- `cleanupExpiredLogs()` - Automatische Bereinigung (stündlich)

#### Hook-Integration:
- Automatisches Logging bei Record-Operationen
- Performance-Tracking für alle CRUD-Operationen
- Globale Fehlerbehandlung

### 3. CLI Enhanced Logging (`process_cli_commands.js`)

#### Neue Features:
- Detailliertes Logging aller CLI-Operationen
- Fehler-Tracking mit Kontext
- Performance-Metriken für Dokumentenerstellung
- Database-Integration über SQLite

#### Logging-Bereiche:
- Command-Polling
- Document-Generation
- User-Need-Fetching
- OpenCode-Integration
- Database-Operationen

### 4. Autonomous Hook Updates (`pb_hooks/autonomous_fixed.pb.js`)

#### Erweiterte Fehlerbehandlung:
- Integration mit Enhanced Logging System
- Performance-Tracking für Hook-Ausführung
- Detaillierte Kontext-Informationen
- Fallback-Logging wenn Enhanced System nicht verfügbar

## Log-Kategorien

### Error Types:
- `cli_error`: CLI-Processor Fehler
- `pocketbase_error`: PocketBase Hook-Fehler
- `opencode_error`: OpenCode Service-Fehler
- `database_error`: SQLite Datenbankfehler
- `network_error`: Netzwerk-/API-Fehler
- `validation_error`: Datenvalidierungsfehler

### Severity Levels:
- `low`: Geringe Auswirkung
- `medium`: Mittlere Auswirkung
- `high`: Hohe Auswirkung
- `critical`: Kritische Systemfehler

### Log Levels:
- `debug`: Entwicklungs-Informationen
- `info`: Allgemeine Informationen
- `warn`: Warnungen
- `error`: Fehler

## Automatische Bereinigung

### Zeitplan:
- **Automatisch**: Jede Stunde via PocketBase Hook
- **Retention**: 24 Stunden ab Erstellung
- **Collections**: Alle Log-Collections (logs, error_logs, performance_logs)

### Implementierung:
```javascript
// Runs every hour in enhanced_logging.pb.js
setInterval(() => {
    cleanupExpiredLogs()
}, 3600000) // 1 hour
```

## Nutzung

### PocketBase Hooks:
```javascript
// Standard logging
createLog("Operation completed", LOG_LEVELS.INFO, "pocketbase", {
    request_id: "req123",
    user_id: "user456"
})

// Error logging
createErrorLog(ERROR_TYPES.POCKETBASE_ERROR, "Failed to process", {
    severity: SEVERITY_LEVELS.HIGH,
    stack_trace: error.stack,
    request_id: "req123"
})

// Performance logging
createPerformanceLog("document_generation", 1500, true, {
    request_id: "req123",
    metadata: { docs_generated: 3 }
})
```

### CLI Processor:
```javascript
// Logging with automatic expiration
await createLog("Starting document generation", LOG_LEVELS.INFO, "cli", {
    request_id: requestId,
    user_id: userId
})

// Error logging with context
await createErrorLog(ERROR_TYPES.CLI_ERROR, error.message, {
    severity: SEVERITY_LEVELS.HIGH,
    stack_trace: error.stack,
    error_context: { operation: "document_generation" }
})
```

## Monitoring

### Log-Zugriff:
- **Admin Interface**: http://localhost:8090/_/
- **API**: `/api/collections/logs/records`
- **SQLite Direct**: `sqlite3 pb_data/data.db`

### Performance-Tracking:
- Alle Operationen werden zeitlich gemessen
- Erfolg/Fehler-Statistiken
- Automatische Schwellenwert-Überwachung

### Fehler-Analyse:
- Vollständige Stack-Traces
- Request-Tracing via IDs
- Kontext-Informationen
- Kategorisierung nach Schweregrad

## Wartung

### Migration anwenden:
```bash
# PocketBase automatisch beim Start
./pocketbase serve --http=0.0.0.0:8090
```

### Manuelle Bereinigung:
```sql
-- Abgelaufene Logs löschen
DELETE FROM logs WHERE expires_at < datetime('now');
DELETE FROM error_logs WHERE expires_at < datetime('now');
DELETE FROM performance_logs WHERE expires_at < datetime('now');
```

### Log-Statistiken:
```sql
-- Log-Verteilung nach Level
SELECT level, COUNT(*) FROM logs GROUP BY level;

-- Fehler nach Typ
SELECT error_type, COUNT(*) FROM error_logs GROUP BY error_type;

-- Performance-Probleme
SELECT operation, AVG(duration_ms), COUNT(*) 
FROM performance_logs 
WHERE success = 0 
GROUP BY operation;
```

## Integration mit bestehenden Systemen

- **PocketBase**: Hooks automatisch geladen
- **CLI**: Läuft parallel mit Enhanced Logging
- **Frontend**: Kann Logs über API abrufen
- **Docker**: Logs persistiert in pb_data Volume

## Troubleshooting

### Logging funktioniert nicht:
1. Migration prüfen: `logs`, `error_logs`, `performance_logs` Collections existieren
2. PocketBase neu starten nach Hook-Änderungen
3. SQLite Datei-Berechtigungen prüfen

### Performance-Probleme:
1. Log-Retention auf kürzere Zeit reduzieren
2. Bereinigungsintervall erhöhen
3. Index auf `expires_at` Feld erstellen

### Speicherplatz:
- Logs werden automatisch nach 24h gelöscht
- Manuelle Bereinigung über SQL möglich
- Monitoring via `du -sh pb_data/data.db`