# Vergabedokument-Generator: Komplette Systemdokumentation

## Inhaltsverzeichnis

1. [Überblick](#überblick)
2. [Architektur](#architektur)
3. [PocketBase Konfiguration](#pocketbase-konfiguration)
4. [Datenbankschema](#datenbankschema)
5. [PocketBase Migrations (v0.28+)](#pocketbase-migrations-v028)
6. [Hooks und Backend-Logik](#hooks-und-backend-logik)
7. [OpenCode Integration](#opencode-integration)
8. [Frontend-Implementierung](#frontend-implementierung)
9. [Prompt-System](#prompt-system)
10. [Deployment und CI/CD](#deployment-und-cicd)
11. [Lokale Entwicklung](#lokale-entwicklung)
12. [Sicherheit und Best Practices](#sicherheit-und-best-practices)
13. [Fehlerbehebung](#fehlerbehebung)

## 1. Überblick

Der Vergabedokument-Generator ist ein KI-gestütztes System zur automatischen Erstellung deutscher Vergabeunterlagen nach VOB/VOL. Das System basiert auf:

- **Backend**: PocketBase v0.28.4 (Go-basiertes Backend-as-a-Service)
- **AI Engine**: OpenCode CLI mit GPT-4.1-mini Integration
- **Frontend**: Vanilla JavaScript mit PocketBase SDK
- **Datenbank**: SQLite (integriert in PocketBase)
- **Deployment**: Docker/Coolify mit GitHub Actions CI/CD

### Kernfunktionen

1. **Multi-User-System**: Vollständige Benutzerverwaltung mit Auth
2. **Projekt-Management**: Verwaltung von Vergabeprojekten
3. **Automatische Dokumentengenerierung**: KI-basierte Erstellung von:
   - Leistungsbeschreibungen
   - Eignungskriterien
   - Zuschlagskriterien
4. **Echtzeit-Updates**: WebSocket-basierte Live-Updates
5. **API-Key-Management**: Eigene OpenAI API-Keys pro Benutzer

## 2. Architektur

### Systemkomponenten

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Browser)                      │
│  - index.html: Hauptanwendung                                │
│  - auth.js: Authentifizierung                                │
│  - PocketBase SDK für Realtime Updates                       │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP/WebSocket
┌───────────────────────────┴─────────────────────────────────┐
│                    PocketBase (Port 8090)                    │
│  - REST API & Realtime                                      │
│  - SQLite Datenbank                                         │
│  - JavaScript Hooks                                         │
│  - Statisches File Hosting                                  │
└─────────┬──────────────────────────────────────┬────────────┘
          │ Hooks                                │ CLI Commands
┌─────────┴──────────────┐          ┌───────────┴─────────────┐
│   autonomous_fixed.pb.js│          │ process_cli_commands.js │
│   simple_bootstrap.pb.js│          │ (Background Processor)  │
└────────────────────────┘          └───────────┬─────────────┘
                                                │ HTTP
                                    ┌───────────┴─────────────┐
                                    │ opencode-service.js     │
                                    │ (OpenCode Integration)  │
                                    └───────────┬─────────────┘
                                                │ Spawn
                                    ┌───────────┴─────────────┐
                                    │    OpenCode CLI         │
                                    │  (GPT-4.1-mini Model)   │
                                    └─────────────────────────┘
```

### Datenfluss

1. **User Input** → Frontend → PocketBase API → `user_needs` Collection
2. **Trigger** → Hook erstellt `generation_requests` → Hook erstellt `cli_commands`
3. **Processing** → CLI Processor liest `cli_commands` → Ruft OpenCode Service auf
4. **AI Generation** → OpenCode generiert Dokumente → Speichert in `documents`
5. **Updates** → WebSocket sendet Echtzeit-Updates an Frontend

## 3. PocketBase Konfiguration

### Version und Setup

```bash
# PocketBase v0.28.4 - WICHTIG: Exakte Version für API-Kompatibilität
./pocketbase serve \
    --http=127.0.0.1:8090 \
    --dir=./pb_data \
    --hooksDir=./pb_hooks \
    --publicDir=./pb_public \
    --migrationsDir=./pb_migrations
```

### Kritische v0.28 API-Änderungen

```javascript
// ALTE API (v0.22)
onRecordAfterCreateRequest((e) => {
    // Code
})

// NEUE API (v0.28) - KRITISCH: e.next() erforderlich!
onRecordCreateRequest((e) => {
    e.next() // MUSS zuerst kommen!
    // Code nach Record-Erstellung
})
```

### Admin-Erstellung

```bash
# Superuser erstellen
./pocketbase superuser upsert admin@vergabe.de admin123

# Demo-User über Admin-Panel erstellen
# URL: http://localhost:8090/_/
# User: test@vergabe.de / vergabe123
```

## 4. Datenbankschema

### Kern-Collections

#### 1. `users` (Auth Collection)
```javascript
{
    name: "users",
    type: "auth",
    fields: [
        { name: "name", type: "text", max: 100 }
        // Standard Auth-Felder automatisch
    ]
}
```

#### 2. `projects`
```javascript
{
    name: "projects",
    fields: [
        { name: "name", type: "text", required: true, min: 1, max: 200 },
        { name: "description", type: "text", max: 2000 },
        { name: "budget", type: "number", min: 0 },
        { name: "deadline", type: "date" },
        { name: "eckpunkte", type: "text", max: 5000 },
        { name: "user_id", type: "relation", collectionId: "users", required: true, cascadeDelete: true },
        { name: "request_id", type: "text", required: true, min: 1, max: 50 },
        { name: "created", type: "autodate", onCreate: true },
        { name: "updated", type: "autodate", onUpdate: true }
    ],
    listRule: "@request.auth.id = user_id",
    viewRule: "@request.auth.id = user_id",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id = user_id",
    deleteRule: "@request.auth.id = user_id"
}
```

#### 3. `documents`
```javascript
{
    name: "documents",
    fields: [
        { name: "request_id", type: "text", required: true, min: 1, max: 255 },
        { name: "title", type: "text", required: true, min: 1, max: 255 },
        { name: "content", type: "text", required: true, min: 1, max: 50000 },
        { name: "type", type: "select", options: { values: ["leistung", "eignung", "zuschlag"] } },
        { name: "project_id", type: "text", max: 50 },
        { name: "user_id", type: "text", max: 50 },
        { name: "created_by", type: "text", max: 100 },
        { name: "generated_by_ai", type: "bool" },
        { name: "created", type: "autodate", onCreate: true },
        { name: "updated", type: "autodate", onUpdate: true }
    ]
}
```

#### 4. `system_prompts`
```javascript
{
    name: "system_prompts",
    fields: [
        { name: "prompt_type", type: "select", options: { values: ["leistung", "eignung", "zuschlag", "master"] } },
        { name: "prompt_text", type: "text", required: true, max: 15000 },
        { name: "description", type: "text", max: 500 },
        { name: "version", type: "number", required: true, min: 1 },
        { name: "active", type: "bool" }
    ]
}
```

#### 5. `user_needs`
```javascript
{
    name: "user_needs",
    fields: [
        { name: "thema", type: "text", required: true, max: 200 },
        { name: "beschreibung", type: "text", max: 2000 },
        { name: "user_id", type: "relation", collectionId: "users", required: true },
        { name: "project_id", type: "text", max: 50 },
        { name: "status", type: "select", options: { values: ["created", "processing", "completed", "failed"] } }
    ]
}
```

#### 6. `generation_requests`
```javascript
{
    name: "generation_requests",
    fields: [
        { name: "user_need_id", type: "text" },
        { name: "status", type: "select", options: { values: ["pending", "processing", "completed", "failed"] } }
    ]
}
```

#### 7. `cli_commands`
```javascript
{
    name: "cli_commands",
    fields: [
        { name: "command", type: "text", required: true, max: 100 },
        { name: "status", type: "select", options: { values: ["pending", "processing", "completed", "failed"] } },
        { name: "parameters", type: "text", max: 2000 },
        { name: "retry_count", type: "number", min: 0, max: 10 },
        { name: "error", type: "text", max: 2000 }
    ]
}
```

#### 8. `apikeys`
```javascript
{
    name: "apikeys",
    fields: [
        { name: "user_id", type: "relation", collectionId: "users", required: true, cascadeDelete: true },
        { name: "provider", type: "select", options: { values: ["openai", "anthropic", "google", "azure"] } },
        { name: "api_key", type: "text", required: true, max: 500 },
        { name: "name", type: "text", max: 100 },
        { name: "active", type: "bool" }
    ]
}
```

### Zugriffs-Regeln (Access Rules)

Alle benutzerspezifischen Collections folgen diesem Pattern:

```javascript
{
    listRule: "@request.auth.id = user_id",
    viewRule: "@request.auth.id = user_id",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id = user_id",
    deleteRule: "@request.auth.id = user_id"
}
```

## 5. PocketBase Migrations (v0.28+)

### Migration Grundlagen

PocketBase v0.28+ verwendet ein neues, vereinfachtes Migration-System. Migrationen werden automatisch beim Start ausgeführt und in der `_migrations` Tabelle verfolgt.

### Migration Dateistruktur

```javascript
/// <reference path="../pb_data/types.d.ts" />

// Migration-Funktion mit Up und Down
migrate(
  // UP Migration - wird beim Anwenden ausgeführt
  (app) => {
    // Deine Migration-Logik hier
  },
  
  // DOWN Migration - wird beim Rollback ausgeführt (optional)
  (app) => {
    // Rollback-Logik hier
  }
)
```

### Collection erstellen

```javascript
migrate((app) => {
  const collection = new Collection({
    name: "my_collection",
    type: "base", // "base" oder "auth"
    listRule: "@request.auth.id = user_id",
    viewRule: "@request.auth.id = user_id",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id = user_id",
    deleteRule: "@request.auth.id = user_id",
    fields: [
      {
        name: "title",
        type: "text",
        required: true,
        min: 1,
        max: 200
      },
      {
        name: "user_id",
        type: "relation",
        required: true,
        maxSelect: 1,
        collectionId: "users", // Wird automatisch zur ID aufgelöst
        cascadeDelete: true
      },
      {
        name: "created",
        type: "autodate",
        onCreate: true,
        onUpdate: false
      }
    ]
  })
  
  return app.save(collection)
}, (app) => {
  // Rollback
  const collection = app.findCollectionByNameOrId("my_collection")
  return app.delete(collection)
})
```

### Felder hinzufügen/ändern

```javascript
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3332084752")
  
  // Neues Feld hinzufügen
  collection.fields.add(new Field({
    id: "field_unique_id",
    name: "new_field",
    type: "text",
    required: false,
    max: 500
  }))
  
  // Bestehendes Feld aktualisieren
  const field = collection.fields.getByName("existing_field")
  field.required = true
  field.max = 1000
  
  // Feld entfernen
  collection.fields.removeByName("old_field")
  
  return app.save(collection)
})
```

### Feldtypen und Optionen

#### Text
```javascript
{
  name: "my_text",
  type: "text",
  required: true,
  min: 1,        // Minimale Länge
  max: 500,      // Maximale Länge
  pattern: "^[A-Za-z]+$", // Regex Pattern
  autogeneratePattern: "[a-z0-9]{15}", // Auto-generieren
  primaryKey: false // Nur für ID-Felder
}
```

#### Number
```javascript
{
  name: "price",
  type: "number",
  required: true,
  min: 0,
  max: 999999,
  noDecimal: false // true für Integer
}
```

#### Bool
```javascript
{
  name: "active",
  type: "bool"
}
```

#### Select (Single/Multiple)
```javascript
{
  name: "status",
  type: "select",
  required: true,
  maxSelect: 1, // 1 für Single, >1 für Multiple
  values: ["pending", "processing", "completed", "failed"]
}
```

#### Date
```javascript
{
  name: "deadline",
  type: "date",
  required: false,
  min: "", // Min Datum (ISO String)
  max: ""  // Max Datum (ISO String)
}
```

#### Autodate
```javascript
{
  name: "created",
  type: "autodate",
  onCreate: true,   // Setze beim Erstellen
  onUpdate: false   // Aktualisiere bei Updates
}
```

#### Relation
```javascript
{
  name: "user_id",
  type: "relation",
  required: true,
  collectionId: "users", // Target Collection
  cascadeDelete: true,   // Löscht Records wenn Relation gelöscht wird
  minSelect: 0,
  maxSelect: 1 // 1 für Single, >1 für Multiple Relations
}
```

#### File
```javascript
{
  name: "attachment",
  type: "file",
  required: false,
  maxSelect: 5,
  maxSize: 5242880, // 5MB in Bytes
  mimeTypes: ["image/jpeg", "image/png", "application/pdf"]
}
```

#### JSON
```javascript
{
  name: "metadata",
  type: "json",
  required: false,
  maxSize: 2000 // Max JSON String Länge
}
```

#### Email
```javascript
{
  name: "email",
  type: "email",
  required: true,
  exceptDomains: ["tempmail.com"], // Blockierte Domains
  onlyDomains: []  // Nur erlaubte Domains
}
```

#### URL
```javascript
{
  name: "website",
  type: "url",
  required: false,
  exceptDomains: [],
  onlyDomains: []
}
```

#### Editor (Rich Text)
```javascript
{
  name: "description",
  type: "editor",
  required: false,
  convertURLs: true // URLs in Links konvertieren
}
```

### Indexe erstellen

```javascript
migrate((app) => {
  const collection = app.findCollectionByNameOrId("my_collection")
  
  // Index hinzufügen
  collection.indexes.add("idx_user_created", {
    columns: ["user_id", "created"],
    unique: false
  })
  
  // Unique Index
  collection.indexes.add("idx_unique_email", {
    columns: ["email"],
    unique: true
  })
  
  return app.save(collection)
})
```

### Records in Migrationen erstellen

```javascript
migrate((app) => {
  // Collection finden
  const collection = app.findCollectionByNameOrId("system_prompts")
  
  // Mehrere Records erstellen
  const prompts = [
    {
      prompt_type: "leistung",
      prompt_text: "Leistungsbeschreibung Prompt...",
      description: "Prompt für Leistungsbeschreibungen",
      version: 1,
      active: true
    },
    {
      prompt_type: "eignung",
      prompt_text: "Eignungskriterien Prompt...",
      description: "Prompt für Eignungskriterien",
      version: 1,
      active: true
    }
  ]
  
  for (const promptData of prompts) {
    const record = new Record(collection, promptData)
    app.save(record)
  }
})
```

### Daten migrieren

```javascript
migrate((app) => {
  // Alle Records einer Collection abrufen
  const records = app.findRecordsByFilter(
    "old_collection",
    "status = 'active'",
    "-created", // Sortierung
    100,        // Limit
    0           // Offset
  )
  
  const newCollection = app.findCollectionByNameOrId("new_collection")
  
  for (const oldRecord of records) {
    const newRecord = new Record(newCollection, {
      title: oldRecord.get("name"),
      content: oldRecord.get("description"),
      user_id: oldRecord.get("user_id"),
      migrated_from: oldRecord.id
    })
    app.save(newRecord)
  }
})
```

### Komplexe Migration mit Fehlerbehandlung

```javascript
migrate((app) => {
  try {
    // 1. Neue Collection erstellen
    const collection = new Collection({
      name: "documents",
      type: "base",
      fields: [
        {
          name: "title",
          type: "text",
          required: true,
          min: 1,
          max: 255
        },
        {
          name: "content",
          type: "text",
          required: true,
          min: 1,
          max: 50000
        },
        {
          name: "type",
          type: "select",
          required: true,
          maxSelect: 1,
          values: ["leistung", "eignung", "zuschlag"]
        },
        {
          name: "user_id",
          type: "relation",
          required: true,
          collectionId: "users",
          cascadeDelete: true,
          maxSelect: 1
        },
        {
          name: "project_id",
          type: "relation",
          required: false,
          collectionId: "projects",
          cascadeDelete: true,
          maxSelect: 1
        },
        {
          name: "generated_by_ai",
          type: "bool"
        },
        {
          name: "created",
          type: "autodate",
          onCreate: true
        },
        {
          name: "updated",
          type: "autodate",
          onCreate: true,
          onUpdate: true
        }
      ],
      // Access Rules
      listRule: "@request.auth.id = user_id",
      viewRule: "@request.auth.id = user_id",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id = user_id",
      deleteRule: "@request.auth.id = user_id"
    })
    
    app.save(collection)
    
    // 2. Index erstellen
    collection.indexes.add("idx_user_type", {
      columns: ["user_id", "type"],
      unique: false
    })
    
    app.save(collection)
    
    // 3. Initial-Daten einfügen
    const systemUser = app.findFirstRecordByFilter("users", "email = 'system@vergabe.de'")
    if (!systemUser) {
      // System-User erstellen falls nicht vorhanden
      const usersCollection = app.findCollectionByNameOrId("users")
      systemUser = new Record(usersCollection, {
        email: "system@vergabe.de",
        name: "System",
        password: "not-used-for-login",
        verified: true
      })
      app.save(systemUser)
    }
    
    // 4. Standard-Dokumente erstellen
    const defaultDocs = [
      {
        title: "Vorlage Leistungsbeschreibung",
        content: "# Standard Leistungsbeschreibung\n\n...",
        type: "leistung",
        user_id: systemUser.id,
        generated_by_ai: false
      }
    ]
    
    for (const docData of defaultDocs) {
      const doc = new Record(collection, docData)
      app.save(doc)
    }
    
  } catch (error) {
    console.error("Migration error:", error)
    throw error
  }
}, (app) => {
  // Rollback
  try {
    // Records löschen
    const records = app.findRecordsByFilter("documents", "")
    for (const record of records) {
      app.delete(record)
    }
    
    // Collection löschen
    const collection = app.findCollectionByNameOrId("documents")
    app.delete(collection)
    
    // System-User löschen
    const systemUser = app.findFirstRecordByFilter("users", "email = 'system@vergabe.de'")
    if (systemUser) {
      app.delete(systemUser)
    }
  } catch (error) {
    console.error("Rollback error:", error)
  }
})
```

### Migration Best Practices

1. **Eindeutige IDs**: Verwende sprechende, eindeutige IDs für Felder
   ```javascript
   id: "text_field_title" // Gut
   id: "text123456"       // Schlecht
   ```

2. **Rollback implementieren**: Immer eine Down-Migration schreiben
   ```javascript
   migrate(
     (app) => { /* up */ },
     (app) => { /* down - macht up rückgängig */ }
   )
   ```

3. **Transaktional denken**: Migrationen sollten atomar sein
   ```javascript
   migrate((app) => {
     try {
       // Alle Änderungen
       app.save(collection1)
       app.save(collection2)
     } catch (e) {
       // Fehler werfen stoppt Migration
       throw new Error(`Migration failed: ${e.message}`)
     }
   })
   ```

4. **Daten-Validierung**: Prüfe Daten vor Migration
   ```javascript
   const records = app.findRecordsByFilter("collection", "field = null")
   if (records.length > 0) {
     throw new Error("Cannot migrate: null values found")
   }
   ```

5. **Versionierung**: Nutze Timestamps im Dateinamen
   ```bash
   # Format: timestamp_description.js
   1752421462_create_documents_collection.js
   1752421463_add_api_keys.js
   ```

### Migration Commands

```bash
# Migration erstellen
touch pb_migrations/$(date +%s)_description.js

# Migrationen ausführen (automatisch beim Start)
./pocketbase serve

# Migration-Status prüfen
sqlite3 pb_data/data.db "SELECT * FROM _migrations;"

# Migration manuell zurücksetzen (Vorsicht!)
sqlite3 pb_data/data.db "DELETE FROM _migrations WHERE file = '1752421462_test.js';"
```

### Häufige Fehler

1. **Field ID bereits vorhanden**
   ```javascript
   // Fehler: Duplicate field ID
   // Lösung: Eindeutige IDs verwenden
   id: `text_${fieldName}_${Date.now()}`
   ```

2. **Collection nicht gefunden**
   ```javascript
   // Fehler vermeiden
   const collection = app.findCollectionByNameOrId("maybe_exists")
   if (!collection) {
     console.log("Collection not found, skipping...")
     return
   }
   ```

3. **Relation zu nicht-existenter Collection**
   ```javascript
   // Prüfen ob Target existiert
   const targetCollection = app.findCollectionByNameOrId("users")
   if (!targetCollection) {
     throw new Error("Target collection 'users' not found")
   }
   ```

## 6. Hooks und Backend-Logik

### autonomous_fixed.pb.js - Hauptverarbeitungs-Hook

```javascript
/// <reference path="../pb_data/types.d.ts" />

console.log("🔧 Loading autonomous_fixed.pb.js...")

onRecordCreateRequest((e) => {
    e.next() // KRITISCH - muss zuerst kommen!
    
    if (e.collection.name === "generation_requests") {
        console.log("✅ Autonomous hook triggered for:", e.record.id)
        
        try {
            // Request-Details abrufen
            const requestId = e.record.id
            const userNeedId = e.record.get("user_need_id")
            const status = e.record.get("status") || "pending"
            
            // CLI-Command für Background-Processing erstellen
            const cliCollection = $app.dao().findCollectionByNameOrId("cli_commands")
            const cliRecord = new Record(cliCollection, {
                "command": "generate_documents",
                "status": "pending",
                "parameters": JSON.stringify({
                    "request_id": requestId,
                    "user_need_id": userNeedId,
                    "created_at": new Date().toISOString()
                }),
                "retry_count": 0
            })
            
            $app.dao().saveRecord(cliRecord)
            console.log("✅ CLI command created:", cliRecord.id)
            
            // Generation request status aktualisieren
            e.record.set("status", "processing")
            $app.dao().saveRecord(e.record)
            
            // Log-Eintrag erstellen
            const logsCollection = $app.dao().findCollectionByNameOrId("logs")
            const logRecord = new Record(logsCollection, {
                "message": `Autonomous generation started for request ${requestId}`,
                "level": "info",
                "request_id": requestId
            })
            $app.dao().saveRecord(logRecord)
            
        } catch (error) {
            console.error("❌ Error in autonomous hook:", error.message)
        }
    }
})

// Hook für automatische User-Need-Erstellung bei Projekt-Anlage
onRecordCreateRequest((e) => {
    e.next()
    
    if (e.collection.name === "projects") {
        console.log("✅ Project created, setting up generation workflow:", e.record.id)
        
        try {
            const projectId = e.record.id
            const projectName = e.record.get("name")
            const description = e.record.get("description") || ""
            const userId = e.record.get("user_id")
            
            // User need für dieses Projekt erstellen
            const userNeedsCollection = $app.dao().findCollectionByNameOrId("user_needs")
            if (userNeedsCollection) {
                const userNeedRecord = new Record(userNeedsCollection, {
                    "project_id": projectId,
                    "user_id": userId,
                    "thema": projectName,
                    "beschreibung": description,
                    "status": "created"
                })
                $app.dao().saveRecord(userNeedRecord)
                console.log("✅ User need created for project:", userNeedRecord.id)
            }
            
        } catch (error) {
            console.error("❌ Error in project creation hook:", error.message)
        }
    }
})
```

### process_cli_commands.js - Background Processor

Der CLI-Processor läuft als separater Node.js-Prozess und verarbeitet asynchrone Aufgaben:

```javascript
#!/usr/bin/env node

const fetch = require('node-fetch')
const sqlite3 = require('sqlite3').verbose()

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'
const POLL_INTERVAL = 3000 // 3 Sekunden

// Polling-Loop für neue CLI Commands
setInterval(async () => {
    try {
        await processCommands()
    } catch (error) {
        console.error('❌ Error processing commands:', error.message)
    }
}, POLL_INTERVAL)

async function processCommands() {
    // Hole pending Commands
    const response = await fetch(`${POCKETBASE_URL}/api/collections/cli_commands/records?filter=status='pending'&sort=created`)
    if (!response.ok) return
    
    const data = await response.json()
    
    for (const command of data.items) {
        if (command.command === 'generate_documents') {
            await processDocumentGeneration(command)
        }
    }
}

async function processDocumentGeneration(command) {
    // Mark as processing
    await updateCommandStatus(command.id, 'processing')
    
    const parameters = JSON.parse(command.parameters || '{}')
    const requestId = parameters.request_id
    const userNeedId = parameters.user_need_id
    
    // Get user need details (direkter DB-Zugriff wegen Auth)
    const userNeed = await getUserNeed(userNeedId)
    
    // Get system prompts
    const systemPrompts = await getSystemPrompts()
    
    // Generate documents for each type
    const documentTypes = ['leistung', 'eignung', 'zuschlag']
    
    for (const docType of documentTypes) {
        const prompt = systemPrompts.find(p => p.prompt_type === docType)
        if (prompt) {
            // Umfassender Prompt mit Benutzerdaten
            const userPrompt = `${prompt.prompt_text}
            
## Projektdaten für die Erstellung:

**Projekttitel:** ${userNeed.thema}
**Projektbeschreibung:** ${userNeed.beschreibung || 'Keine detaillierte Beschreibung verfügbar.'}

WICHTIG: 
1. Verwende KEINE Rückfragen - erstelle das Dokument direkt
2. Führe eine umfassende Webrecherche durch
3. Das Dokument muss vollständig und einsatzbereit sein
4. Verwende professionelle deutsche Sprache`

            // Call OpenCode service
            const response = await fetch(`http://localhost:3001/opencode/stream?prompt=${encodeURIComponent(userPrompt)}&model=openai/gpt-4.1-mini&userId=${userNeed.user_id}`)
            
            // Read streaming response
            let content = ''
            const reader = response.body.getReader()
            const decoder = new TextDecoder()

            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                content += decoder.decode(value, { stream: true })
            }

            // Dokument speichern (direkter DB-Insert)
            await saveDocument({
                title: `${docType.charAt(0).toUpperCase() + docType.slice(1)}: ${userNeed.thema}`,
                content: content,
                type: docType,
                request_id: requestId,
                user_id: userNeed.user_id,
                project_id: userNeed.project_id,
                generated_by_ai: true
            })
        }
    }
    
    // Mark as completed
    await updateCommandStatus(command.id, 'completed')
}
```

## 6. OpenCode Integration

### opencode.json Konfiguration

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "openai/gpt-4o-mini",
  "provider": {
    "openai": {
      "api_key": "{env:OPENAI_API_KEY}",
      "models": {
        "gpt-4o-mini": {},
        "gpt-4o": {},
        "gpt-3.5-turbo": {},
        "gpt-4": {},
        "gpt-4-turbo": {}
      }
    }
  }
}
```

### opencode-service.js - Express Service

```javascript
const express = require('express');
const { spawn } = require('child_process');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(express.json());

const db = new sqlite3.Database('./pb_data/data.db');

// Streaming endpoint für OpenCode
app.get('/opencode/stream', (req, res) => {
  const { prompt, model = 'openai/gpt-4o-mini', userId } = req.query;
  
  // Get user's API key from database
  db.get(
    `SELECT api_key FROM apikeys WHERE user_id = ? AND active = 1 LIMIT 1`,
    [userId],
    (err, row) => {
      if (!row || !row.api_key) {
        return res.status(401).json({ error: 'No active API key' });
      }
      
      // Setup streaming response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      // Environment mit User API Key
      const env = {
        ...process.env,
        OPENAI_API_KEY: row.api_key,
        HOME: `/tmp/opencode-${userId}`,
        NO_GUI: '1'
      };
      
      // Spawn OpenCode mit script für TTY
      const scriptCommand = `opencode run "${prompt.replace(/"/g, '\\"')}" --model ${model}`;
      const opencode = spawn('script', ['-qc', scriptCommand, '/dev/null'], { env });
      
      // Stream output to client
      opencode.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
          if (line.trim()) {
            res.write(`data: ${JSON.stringify({ type: 'output', content: line })}\n\n`);
          }
        });
      });
      
      opencode.on('close', (code) => {
        res.write(`data: ${JSON.stringify({ type: 'done', code })}\n\n`);
        res.end();
      });
    }
  );
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'opencode-service' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 OpenCode service running on port ${PORT}`);
});
```

### Kritische OpenCode-Hinweise

1. **TTY-Anforderung**: OpenCode benötigt ein TTY, daher `script` wrapper
2. **Headless Mode**: `NO_GUI=1` und `DISPLAY=` für Docker
3. **Model-Prefix**: IMMER `openai/` prefix verwenden: `openai/gpt-4.1-mini`
4. **Streaming**: Nutze Server-Sent Events für Echtzeit-Output

## 7. Frontend-Implementierung

### Hauptstruktur (index.html)

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Vergabebausteine</title>
  <script src="https://unpkg.com/feather-icons"></script>
  <script src="https://unpkg.com/pocketbase@0.26.1/dist/pocketbase.umd.js"></script>
</head>
<body>
  <div class="app-container">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="logo">
        <i data-feather="file-text"></i>
        <span>Vergabebausteine</span>
      </div>
      
      <nav class="nav-section">
        <h3>Projekte</h3>
        <div id="projectsList"></div>
      </nav>
      
      <div class="user-info">
        <span id="currentUser"></span>
        <button onclick="logout()">Logout</button>
      </div>
    </aside>
    
    <!-- Main Content -->
    <main class="main-content">
      <header class="header">
        <h1>Dokument Generator</h1>
      </header>
      
      <div class="content">
        <!-- Input Section -->
        <div class="card">
          <div class="card-header">
            <i data-feather="edit"></i>
            <h2>Eingabe</h2>
          </div>
          
          <div class="input-section">
            <div class="form-group">
              <label>Projekt auswählen</label>
              <select id="projectSelect">
                <option value="">Projekt wählen...</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Beschreibung</label>
              <textarea id="description" placeholder="Projektbeschreibung..."></textarea>
            </div>
            
            <button class="btn-ai-generate" onclick="generateDocuments()">
              <i data-feather="zap"></i>
              Dokumente generieren
            </button>
          </div>
        </div>
        
        <!-- Output Section -->
        <div class="card">
          <div class="card-header">
            <i data-feather="file-text"></i>
            <h2>Generierte Dokumente</h2>
          </div>
          
          <div class="output-section">
            <div class="document-viewer" id="documentViewer">
              <p>Wählen Sie ein Projekt und starten Sie die Generierung...</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
  
  <script>
    // PocketBase Initialisierung
    const pb = new PocketBase('http://localhost:8090');
    
    // Auto-refresh auth
    pb.authStore.onChange((token, model) => {
      console.log('Auth state changed', model);
      if (model) {
        updateUI();
      } else {
        window.location.href = '/login.html';
      }
    });
    
    // Realtime subscriptions
    async function subscribeToUpdates() {
      // Subscribe to documents
      pb.collection('documents').subscribe('*', (e) => {
        console.log('Document event:', e.action, e.record);
        if (e.action === 'create') {
          displayDocument(e.record);
        }
      });
      
      // Subscribe to generation status
      pb.collection('generation_requests').subscribe('*', (e) => {
        console.log('Generation status:', e.record.status);
        updateGenerationStatus(e.record.status);
      });
    }
    
    // Generate documents
    async function generateDocuments() {
      const projectId = document.getElementById('projectSelect').value;
      const description = document.getElementById('description').value;
      
      if (!projectId) {
        showNotification('error', 'Bitte wählen Sie ein Projekt');
        return;
      }
      
      try {
        // Create user need
        const userNeed = await pb.collection('user_needs').create({
          project_id: projectId,
          thema: currentProject.name,
          beschreibung: description,
          user_id: pb.authStore.model.id,
          status: 'created'
        });
        
        // Create generation request (triggers hook)
        const request = await pb.collection('generation_requests').create({
          user_need_id: userNeed.id,
          status: 'pending'
        });
        
        showNotification('success', 'Generierung gestartet...');
        
      } catch (error) {
        console.error('Generation error:', error);
        showNotification('error', 'Fehler beim Starten der Generierung');
      }
    }
    
    // Initialize on load
    document.addEventListener('DOMContentLoaded', async () => {
      if (!pb.authStore.isValid) {
        window.location.href = '/login.html';
        return;
      }
      
      await loadProjects();
      await subscribeToUpdates();
      updateUI();
    });
  </script>
</body>
</html>
```

### Authentifizierung (auth.js)

```javascript
// Login
async function login(email, password) {
  try {
    const authData = await pb.collection('users').authWithPassword(email, password);
    console.log('Login successful:', authData.record.email);
    window.location.href = '/';
  } catch (error) {
    console.error('Login failed:', error);
    showError('Login fehlgeschlagen: ' + error.message);
  }
}

// Logout
function logout() {
  pb.authStore.clear();
  window.location.href = '/login.html';
}

// Auto-refresh token
setInterval(() => {
  if (pb.authStore.isValid) {
    pb.collection('users').authRefresh();
  }
}, 1000 * 60 * 10); // Alle 10 Minuten
```

## 8. Prompt-System

### Master-Prompt (master.txt)

```
Du bist ein Experte für deutsche Vergaberecht und öffentliche Beschaffung. 
Erstelle professionelle Vergabeunterlagen basierend auf den Benutzereingaben.
```

### Leistungsbeschreibung (leistung.txt)

```
Du bist ein Experte für öffentliche Vergabe. WICHTIG: Nutze deine Webfetch-Funktion!

Erstelle eine detaillierte deutsche Leistungsbeschreibung für: {description}

STRUKTUR (mind. 3000 Wörter):
1. **Projektübersicht und Ausgangslage**
2. **Aktuelle Marktanalyse** (mit Webrecherche!)
3. **Detaillierter Leistungsumfang**
4. **Technische Spezifikationen**
5. **Qualitätsanforderungen**
6. **Normen und Standards**
7. **Schnittstellen**
8. **Abnahmekriterien**

Recherchiere aktuelle Standards, Preise und Marktbedingungen!
```

### Eignungskriterien (eignung.txt)

```
Du bist ein Experte für öffentliche Vergabe nach VOB/A und GWB.

Erstelle detaillierte deutsche Eignungskriterien für: {description}

STRUKTUR (mind. 2500 Wörter):
1. **Rechtliche Grundlagen** (§ 122 GWB, VOB/A)
2. **Aktuelle Marktanalyse** (mit Webrecherche!)
3. **Fachliche Eignung**
   - Qualifikationen (Meisterbrief, Studium)
   - Handwerksrolle/Handelsregister
   - Berufshaftpflicht
   - Zertifizierungen
4. **Wirtschaftliche Leistungsfähigkeit**
   - Mindestjahresumsatz
   - Eigenkapital
   - Bilanzkennzahlen
5. **Technische Leistungsfähigkeit**
   - Referenzen (3 vergleichbare Projekte)
   - Technische Ausstattung
   - Personal
   - QM-System (ISO 9001)
6. **Ausschlusskriterien**
7. **Nachweisführung**
```

### Zuschlagskriterien (zuschlag.md)

```markdown
Du bist ein Experte für öffentliche Vergabe.

Erstelle professionelle deutsche Zuschlagskriterien für: {description}

STRUKTUR (mind. 5000 Wörter):

## 1. Rechtliche Grundlagen
- Aktuelle Rechtsprechung recherchieren

## 2. Marktanalyse
- Marktübliche Preise
- Branchenbenchmarks

## 3. Bewertungsmatrix (100 Punkte)
- Preis: 40% (40 Punkte)
- Qualität: 35% (35 Punkte)
- Termin: 15% (15 Punkte)
- Service: 10% (10 Punkte)

## 4. Mathematische Formeln
- Preispunkte = (niedrigster Preis / Angebotspreis) × 40
- Terminpunkte = (kürzeste Zeit / Angebotszeit) × 15

Verwende aktuelle Marktdaten als Grundlage!
```

## 9. Deployment und CI/CD

### Docker-Konfiguration

#### Dockerfile (Produktion)

```dockerfile
FROM node:20-alpine

# System-Dependencies
RUN apk add --no-cache bash curl git sqlite jq

# PM2 und OpenCode installieren
RUN npm install -g pm2 opencode-ai@latest

WORKDIR /app

# Dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# PocketBase Binary kopieren
COPY pocketbase ./pocketbase
RUN chmod +x ./pocketbase

# Alle PocketBase-Daten kopieren
COPY pb_data/ ./pb_data/
COPY pb_hooks/ ./pb_hooks/
COPY pb_public/ ./pb_public/
COPY pb_migrations/ ./pb_migrations/

# Application Files
COPY *.js *.sh *.json ./
RUN chmod +x ./*.sh

# Environment für Headless
ENV DISPLAY=
ENV NO_GUI=1
ENV NODE_ENV=production
ENV PORT=3001
ENV POCKETBASE_URL=http://localhost:8090

EXPOSE 8090 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s \
    CMD curl -f http://localhost:8090/api/health || exit 1

CMD ["./start-production.sh"]
```

#### docker-compose.yml (Development)

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8090:8090"
      - "3001:3001"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - NODE_ENV=development
    volumes:
      - ./pb_data:/app/pb_data
      - ./pb_hooks:/app/pb_hooks
      - ./pb_public:/app/pb_public
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8090/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### GitHub Actions CI/CD

```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [ master, main ]
    tags: [ 'v*' ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: davidrothenfels/cliopencode

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
    - name: Checkout repository
      uses: actions/checkout@v4

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3

    - name: Log in to Container Registry
      uses: docker/login-action@v3
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Build and push Docker image
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
        platforms: linux/amd64,linux/arm64

  deploy-coolify:
    runs-on: ubuntu-latest
    needs: build-and-push
    if: github.ref == 'refs/heads/master'
    
    steps:
    - name: Trigger Coolify Deployment
      run: |
        curl -X GET "${{ secrets.COOLIFY_WEBHOOK_URL }}" \
          -H "Authorization: Bearer ${{ secrets.COOLIFY_WEBHOOK_TOKEN }}"
```

### Coolify Deployment

1. **Container Image**: `ghcr.io/davidrothenfels/cliopencode:latest`
2. **Ports**: 8090 (einziger exposed Port wegen Coolify-Limitation)
3. **Environment Variables**:
   - `OPENAI_API_KEY`: Vom User bereitgestellt
   - `NODE_ENV`: production
4. **Nginx Reverse Proxy** für Port-Weiterleitung (siehe nginx.conf)

## 10. Lokale Entwicklung

### Schnellstart

```bash
# 1. OpenAI API Key setzen
export OPENAI_API_KEY='your-api-key'

# 2. Dependencies installieren
npm install

# 3. PocketBase Binary herunterladen (v0.28.4)
wget https://github.com/pocketbase/pocketbase/releases/download/v0.28.4/pocketbase_0.28.4_linux_amd64.zip
unzip pocketbase_0.28.4_linux_amd64.zip

# 4. Entwicklungsumgebung starten
./run.sh

# 5. Admin-User erstellen
./pocketbase superuser upsert admin@vergabe.de admin123

# 6. Browser öffnen
# Dashboard: http://localhost:8090/
# Admin: http://localhost:8090/_/
```

### Entwicklungs-Workflow

1. **Hook-Änderungen**: IMMER PocketBase neustarten!
   ```bash
   # PocketBase neu starten nach Hook-Änderungen
   pkill -f "pocketbase serve"
   ./pocketbase serve --http=0.0.0.0:8090
   ```

2. **Frontend-Änderungen**: Direkt im Browser sichtbar (F5)

3. **OpenCode Service**: Auto-Reload bei Änderungen

4. **Datenbank-Änderungen**: 
   ```bash
   # Direkte DB-Bearbeitung
   sqlite3 pb_data/data.db
   
   # Backup erstellen
   cp pb_data/data.db pb_data/data.db.backup
   ```

### Debugging

```bash
# Logs in Echtzeit
tail -f pocketbase.log

# Prozess-Monitoring
ps aux | grep -E "pocketbase|node|opencode"

# API-Tests
curl http://localhost:8090/api/health
curl http://localhost:3001/health

# WebSocket-Test
wscat -c ws://localhost:8090/api/realtime
```

## 11. Sicherheit und Best Practices

### API-Key Management

1. **User-spezifische Keys**: Jeder User nutzt eigenen OpenAI API Key
2. **Verschlüsselte Speicherung**: Keys in DB verschlüsselt
3. **Keine Keys im Code**: Nur Environment Variables
4. **Key-Rotation**: Regelmäßige Key-Updates empfohlen

### Zugriffskontrolle

1. **Row-Level Security**: Alle Daten user-spezifisch
2. **Auth-Token**: JWT mit kurzer Lebensdauer
3. **CORS**: Nur erlaubte Origins
4. **Rate Limiting**: API-Schutz vor Überlastung

### Deployment-Sicherheit

1. **Container-Isolation**: Keine Root-Rechte
2. **Health Checks**: Automatisches Monitoring
3. **Secrets Management**: GitHub Secrets für CI/CD
4. **TLS/HTTPS**: In Produktion zwingend

## 12. Fehlerbehebung

### Häufige Probleme

#### Hook wird nicht ausgeführt
```bash
# Lösung: PocketBase neustarten
pkill -f "pocketbase serve"
./pocketbase serve --http=0.0.0.0:8090
```

#### OpenCode "TTY required" Error
```bash
# Lösung: Script wrapper verwenden
script -qc "opencode run 'prompt'" /dev/null
```

#### Datenbank-Zugriffsfehler
```bash
# Lösung: Direkter SQLite-Zugriff statt API
const db = new sqlite3.Database('./pb_data/data.db')
```

#### WebSocket-Verbindung bricht ab
```javascript
// Lösung: Auto-Reconnect implementieren
pb.collection('documents').subscribe('*', callback, {
  reconnect: true,
  reconnectInterval: 5000
});
```

### Log-Analyse

```bash
# PocketBase Logs
grep "ERROR" pocketbase.log | tail -20

# Node.js Service Logs
journalctl -u opencode-service -f

# Docker Container Logs
docker logs pb-cli-test --tail=50 -f
```

### Performance-Optimierung

1. **DB-Indizes**: Für häufige Queries
2. **Caching**: Redis für API-Responses
3. **Batch-Processing**: Mehrere Dokumente parallel
4. **CDN**: Für statische Assets

## Zusammenfassung

Dieses System bietet eine vollständige Lösung für die automatisierte Erstellung von Vergabeunterlagen mit:

- **Robuster Architektur**: PocketBase + OpenCode + Node.js
- **KI-Integration**: GPT-4 für hochwertige Dokumente
- **Multi-User-Fähigkeit**: Vollständige Benutzerverwaltung
- **Echtzeit-Updates**: WebSocket-basierte Live-Updates
- **Production-Ready**: Docker + CI/CD + Monitoring

Die Kombination aus bewährten Technologien und durchdachter Architektur ermöglicht eine skalierbare und wartbare Lösung für die Digitalisierung des Vergabeprozesses.