# Vergabedokument-Generator Project

deployment: pocketbase file  und datenbank aus pb_data über github container build (action) an coolify
kopiere immer pb file und pb datenbank direkt aus dem codebase
fixe die db immer local per sqlite nicht per migration
wenn create record feler in pb dann sage dem nutzer er soll in pb logs schauen

## Versionen
nutze opencode, docs hier https://opencode.ai/docs/config/, repo hier https://github.com/sst/opencode
nutze pocketbase v0.28.4 //
PocketBase v0.28.4 korrekte APIs:

  1. ✅ $app.dao() - Datenbankzugriff
  2. ✅ onRecordCreate((e) => { ... e.next() }) - Event Hooks
  3. ✅ Collection Rules - Migration-basierte Authentifizierung
Problem: token.split('.')[1] lieferte nicht die User ID, Lösung: Korrektes JWT Parsing:
const tokenPayload = JSON.parse(atob(token.split('.')[1]));
const userId = tokenPayload.id;
  - user field: relation to users collection with maxSelect=1
  - key field: text field, required
  - (user) Collection rules: @request.auth.id != '' && user = @request.auth.id und nicht als type: "base".
PocketBase JavaScript-Hooks haben keine Browser/Node.js APIs: setTimeout/setInterval, fetch, Promise/async-await, DOM APIs, Node.js modules - ES5-Grundfunktionen und PocketBase-spezifische APIs sind verfügbar
Hinweis zur Filter-Syntax keine Leerzeichen um die Operatoren, Filter ohne Leerzeichen
unter /pb_data kann die datenbank mit sqlite2 pb_data geändert werden

## opencode hinweise
nutze openai gpt-4.1-mini als modell
OpenCode requires a TTY to output properly

## Project Overview
Automated German procurement document generation using AI integration with PocketBase backend and real-time frontend.

### Architecture
- **Backend**: PocketBase (Go-based BaaS) with JavaScript hooks
- **Database**: SQLite with collections 
- **AI Engine**: Opencode
- **Frontend**: Vanilla JavaScript with real-time updates via WebSocket
- **Deployment**: Docker/Coolify with automated CI/CD

## Technology Stack
- **Backend**: PocketBase + JavaScript hooks (`/ausschreibung-generator/pb_hooks/`)
- **Frontend**: Vanilla JS + PocketBase SDK (`/pb_public/`)
- **AI Processing**: Gemini CLI with master prompt system
- **Database**: SQLite with automated migrations
- **Deployment**: Docker, Coolify, GitHub Actions

## Development Workflow

### Local Development
```bash
# Start complete development stack
./run.sh

# Access admin interface
http://localhost:8090/_/

# Test connectivity
http://localhost:8090/test-connection.html
```

### Core Components
- **Autonomous Hook**: `pb_hooks/autonomous.pb.js` - Main processing trigger
- **Master Prompt**: `pb_hooks/views/prompts/system/master_prompt.txt` - AI instructions
- **CLI Processor**: `process_cli_commands.js` - Background task handler
- **Frontend**: `pb_public/app.js` - Real-time UI with progress tracking

### Database Collections
- **user_needs**: User requirements and specifications
- **generation_requests**: Processing triggers and status
- **documents**: Generated procurement documents
- **logs**: System activity and debugging
- **example_prompts**: User interface examples
- **cli_commands**: Asynchronous processing queue

## PocketBase Development Notes

### Migration Structure
Moderne PocketBase-Migrationen verwenden vereinfachte API:

```javascript
migrate((app) => {
  // Collection erstellen
  const collection = new Collection({
    type: "base",
    name: "collection_name",
    listRule: "@request.auth.id = user_id",    // Nur eigene Records
    viewRule: "@request.auth.id = user_id",    // Nur eigene Records
    createRule: "@request.auth.id != ''",      // Authentifizierte User
    updateRule: "@request.auth.id = user_id",  // Nur eigene Records
    deleteRule: "@request.auth.id = user_id",  // Nur eigene Records
    fields: [
      {
        name: "field_name",
        type: "text",        // text, number, date, select, json, relation, etc.
        required: true,
        max: 255
      },
      {
        name: "user_id",
        type: "relation",
        required: true,
        maxSelect: 1,
        collectionId: usersCollection.id,
        cascadeDelete: true  // Löscht Records beim User-Delete
      },
      {
        name: "created",
        type: "autodate",
        onCreate: true,
        onUpdate: false
      }
    ]
  })
  
  app.save(collection)
  
  // Records erstellen
  const record = new Record(collection, {
    field_name: "value",
    user_id: userId
  })
  app.save(record)
  
}, (app) => {
  // Rollback-Funktion
  const collections = ["collection_name"]
  collections.forEach(name => {
    try {
      const collection = app.findCollectionByNameOrId(name)
      app.delete(collection)
    } catch (e) {
      // Collection existiert nicht
    }
  })
})
```

### Hook-Struktur (v0.28 API)
**WICHTIG**: PocketBase v0.23+ hat Breaking Changes in Hook-API:

```javascript
// Record-Erstellung (v0.28)
onRecordCreate((e) => {
  if (e.collection.name === "target_collection") {
    console.log("Hook triggered for:", e.record.id)
    
    // Neue Records in anderen Collections erstellen
    const collection = $app.dao().findCollectionByNameOrId("other_collection")
    const record = new Record(collection, {
      "field_name": "value",
      "reference_id": e.record.id
    })
    $app.dao().saveRecord(record)
  }
}, "target_collection")

// Request-Hooks (für HTTP-Requests)
onRecordCreateRequest((e) => {
  e.next() // KRITISCH: Muss aufgerufen werden
  
  // Code nach Record-Erstellung
  console.log("Record created:", e.record.id)
})

// Bootstrap-Hook
onBootstrap((e) => {
  e.next() // KRITISCH: Muss aufgerufen werden
  
  // Initialisierung nach Bootstrap
  console.log("App initialized")
})

// Weitere Hook-Typen:
// onRecordCreate(), onRecordUpdate(), onRecordDelete()
// onRecordCreateRequest(), onRecordUpdateRequest()
// onMailerSend(), onRealtimeConnectRequest()
```

### Datenbankzugriff in Hooks
```javascript
// Record finden
const record = $app.dao().findRecordById("collection_name", "record_id")

// Records abfragen
const records = $app.dao().findRecordsByExpr("collection_name", $dbx.exp("field = 'value'"))

// Record speichern
const collection = $app.dao().findCollectionByNameOrId("collection_name")
const newRecord = new Record(collection, {
  "field": "value"
})
$app.dao().saveRecord(newRecord)

// Record aktualisieren
record.set("field", "new_value")
$app.dao().saveRecord(record)
```

### Migration Guidelines
- **KRITISCH**: Alle Felder müssen definiert sein (kein leerer `options` ohne Inhalt)
- Verwende null statt leerer Strings für optionale Felder
- IDs müssen eindeutig sein (`collection_name_id`, `field_name_field`)
- Teste Migrationen erst in Development
- Rollback-Funktion immer implementieren
- Referenz: `pb_migrations/1751600000_autonomous_setup.js`

### Development Workflow
- **KRITISCH**: PocketBase nach Hook-Änderungen IMMER neustarten
- Hooks werden ohne Neustart nicht erkannt
- Monitor logs: `tail -f ausschreibung-generator/pocketbase.log`
- Admin-Interface: `http://localhost:8090/_/`

### Key Commands
```bash
# PocketBase neustarten (nach Hook-Änderungen)
cd ausschreibung-generator && ./pocketbase serve --http=0.0.0.0:8090

# Logs in Echtzeit anzeigen
tail -f ausschreibung-generator/pocketbase.log

# Admin-Dashboard
http://localhost:8090/_/

# Migration erstellen
touch pb_migrations/$(date +%s)_description.js
```

### Fehlerbehandlung in Hooks
```javascript
const createLog = (message, level = "info") => {
  try {
    const collection = $app.dao().findCollectionByNameOrId("logs")
    const record = new Record(collection, {
      "message": message,
      "level": level,
      "request_id": request_id
    })
    $app.dao().saveRecord(record)
  } catch (error) {
    console.error("Failed to create log:", error)
  }
}
```

### Feldtypen und Optionen
- **text**: `min`, `max`, `pattern`
- **number**: `min`, `max`
- **select**: `maxSelect`, `values: ["opt1", "opt2"]`
- **date**: keine besonderen Optionen
- **json**: für komplexe Datenstrukturen
- **editor**: HTML-Editor für Rich Text
- **file**: `maxSelect`, `maxSize`, `mimeTypes`
- **relation**: `collectionId`, `cascadeDelete`, `minSelect`, `maxSelect`
- **autodate**: `onCreate`, `onUpdate` (automatische Zeitstempel)

### Wichtige Migration-Regeln
- **API-Änderung**: Verwende `app.save()` statt `dao.saveCollection()`
- **Vereinfachte Syntax**: `fields: []` statt `schema: []`
- **Authentifizierung**: Rules verwenden `@request.auth.id`
- **Relationen**: Referenziere andere Collections via `collectionId`
- **Rollback**: Verwende `app.delete()` für Collections
- **Records**: Erstelle mit `new Record(collection, data)`

### Hook-Migration v0.22 → v0.28
**BREAKING CHANGES** bei PocketBase v0.23+:

| Alt (v0.22) | Neu (v0.28) | Notizen |
|-------------|-------------|---------|
| `onRecordAfterCreateRequest` | `onRecordCreateRequest` | `e.next()` erforderlich |
| `onBeforeBootstrap` | `onBootstrap` | `e.next()` erforderlich |
| `e.httpContext` | `e` (direkter Event) | Context nicht mehr verfügbar |

**Migrationssteps:**
1. Backup pb_data vor Update
2. Hooks auf neue API umstellen
3. `e.next()` in Request-Hooks hinzufügen
4. `e.httpContext` entfernen

## Document Generation Process
1. User input → user_needs collection
2. Trigger creation → generation_requests collection
3. Hook activation → autonomous.pb.js executes
4. AI processing → master_prompt.txt + Gemini CLI
5. Results stored → documents collection
6. Real-time updates → frontend via WebSocket

## Deployment & Infrastructure
- **Local**: `./run.sh` starts complete stack
- **Production**: Docker container with Coolify orchestration
- **CI/CD**: GitHub Actions with automated builds
- **Monitoring**: Built-in health checks and logging

## Security & Best Practices
- API keys via environment variables
- Built-in PocketBase authentication
- Secure PDF processing with size limits
- Rate limiting for Gemini API protection
- PB migrations in einer Datei/soll die Datenbasis zum start selbst etablieren
- cli_processor: WICHTIG: Das Modell ist openai/gpt-4.1-mini - MIT dem openai/ Prefix!
- nutze keine svg sombole sondern schwarz weis simple symbole

## Troubleshooting
- **Hook not triggering**: Restart PocketBase
- **CLI commands stuck**: Check process_cli_commands.js logs
- **Frontend not updating**: Verify WebSocket connection
- **PDF processing fails**: Check file size limits and format

