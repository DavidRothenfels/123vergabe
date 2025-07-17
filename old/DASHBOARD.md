# 🏛️ Vergabedokument-Generator Dashboard

Ein vollständiges Dashboard-System zur automatisierten Erstellung von Leistungsbeschreibungen für öffentliche Vergabe gemäß deutschem Vergaberecht.

## 🚀 Features

### 🔐 Benutzer-Management
- Sichere Anmeldung mit E-Mail/Passwort
- JWT-basierte Authentifizierung
- Benutzerspezifische Datenisolation
- API-Schlüssel-Verwaltung pro Benutzer

### 📁 Projekt-Management
- Erstellen und Verwalten von Projekten
- Projekt-spezifische Dokumentenorganisation
- Status-Tracking (aktiv, archiviert, abgeschlossen)
- Übersichtliche Projektauswahl

### 🤖 AI-Dokumentengenerierung
- Vorgefertigte Prompt-Vorlagen für verschiedene Vergabearten
- Echtzeit-Generierung mit OpenAI GPT-4
- Live-Streaming der Generierung im Dashboard
- Automatische Speicherung in der Datenbank

### 📄 Dokumenten-Management
- Anzeige aller generierten Dokumente
- Markdown-zu-Text Konvertierung
- Copy-to-Clipboard Funktionalität
- Versionshistorie und Metadaten

## 🎯 Prompt-Vorlagen

### 1. IT-Dienstleistung Leistungsbeschreibung
- Funktionale und technische Anforderungen
- Compliance und rechtliche Vorgaben
- SLA und Wartungsvereinbarungen
- Vollständig nach VgV strukturiert

### 2. Bau-/Handwerksleistung nach VOB/A
- Baugrundverhältnisse und örtliche Gegebenheiten
- Leistungsverzeichnis nach Gewerken
- Technische Spezifikationen (DIN, EN)
- Gewährleistung und Abnahmekriterien

### 3. Beratungsdienstleistung
- Ausgangslage und Projektziele
- Qualifikationsanforderungen
- Projektorganisation und Zeitplan
- Dokumentation und Wissenstransfer

## 🏗️ Technische Architektur

### Frontend
- **Framework**: Vanilla JavaScript mit Feather Icons
- **Design**: Lovable-inspiriertes, responsives UI
- **Layout**: Sidebar-Navigation mit Hauptarbeitsbereich
- **Komponenten**: Modal-basierte Workflows

### Backend
- **Database**: PocketBase mit SQLite
- **API**: RESTful Endpoints für CRUD-Operationen
- **AI Integration**: OpenCode CLI mit OpenAI GPT-4
- **Streaming**: Echtzeit-Dokumentengenerierung

### Datenbank-Schema
```
users (PocketBase Standard)
├── projects
│   ├── title, description
│   ├── user_id (Relation)
│   └── status
├── documents
│   ├── title, content (Markdown)
│   ├── project_id, user_id
│   ├── document_type
│   └── generated_by_ai (Boolean)
├── context
│   ├── title, content
│   ├── project_id, user_id
│   └── Zusatzinformationen pro Projekt
├── prompts
│   ├── title, version
│   ├── text (Template)
│   └── user_id (SYSTEM für Standard-Prompts)
└── apikeys
    ├── user, key
    └── Sichere API-Schlüssel-Speicherung
```

## 🔄 Workflow

### 1. Anmeldung und Setup
1. Dashboard unter `/dashboard.html` aufrufen
2. Mit E-Mail/Passwort anmelden
3. In Einstellungen OpenAI API-Schlüssel hinterlegen

### 2. Projekt erstellen
1. "Neues Projekt" in der Projektübersicht
2. Titel und Beschreibung eingeben
3. Projekt auswählen und zum Dashboard wechseln

### 3. Dokument generieren
1. Prompt-Vorlage aus Dropdown wählen
2. Thema/Beschreibung eingeben
3. "Leistungsbeschreibung generieren" klicken
4. Live-Logs verfolgen
5. Generiertes Dokument anzeigen und kopieren

### 4. Dokumente verwalten
- Alle Dokumente im rechten Dropdown
- Automatische Speicherung mit Metadaten
- Copy-to-Clipboard für unformatierten Text
- Projektspezifische Organisation

## 🔒 Sicherheit und Compliance

### Rechtliche Konformität
- **VOB/A**: Vergabe- und Vertragsordnung für Bauleistungen
- **GWB**: Gesetz gegen Wettbewerbsbeschränkungen
- **VgV**: Vergabeverordnung
- **Produktneutralität**: Diskriminierungsfreie Formulierungen
- **DSGVO**: Datenschutz-konforme Speicherung

### Technische Sicherheit
- JWT-Token-basierte Authentifizierung
- Benutzerspezifische Datenisolation
- Sichere API-Schlüssel-Verschlüsselung
- Input-Validierung und Sanitization

## 🚀 Deployment

Das Dashboard ist bereits in das bestehende System integriert:

```bash
# Lokale Entwicklung
./pocketbase serve --http=0.0.0.0:8090 &
node opencode-service.js &

# Dashboard aufrufen
http://localhost:8090/dashboard.html
```

### Docker-Deployment
Das Dashboard ist vollständig in das bestehende Docker-Image integriert und wird automatisch mit dem PocketBase-Server bereitgestellt.

### Coolify-Deployment
Das System ist für Coolify-Deployment optimiert und wird automatisch über GitHub Actions erstellt und bereitgestellt.

## 📊 Live-Features

### Echtzeit-Updates
- **Live-Logs**: Streaming der OpenCode-Ausgabe
- **Auto-Refresh**: Dokumente werden automatisch aktualisiert
- **Status-Tracking**: Verarbeitungsstand in Echtzeit

### Benutzerfreundlichkeit
- **Responsive Design**: Mobile und Desktop optimiert
- **Lovable-UI**: Moderne, intuitive Benutzeroberfläche
- **Keyboard Shortcuts**: Effizienter Workflow
- **Auto-Save**: Automatische Speicherung aller Eingaben

## 🎯 Anwendungsbeispiel

**Szenario**: Ausschreibung einer IT-Modernisierung

1. **Projekt erstellen**: "Rathaus IT-Modernisierung 2025"
2. **Prompt wählen**: "Leistungsbeschreibung IT-Dienstleistung"
3. **Thema eingeben**: "Migration der Rathaus-IT auf Cloud-basierte Lösung mit Microsoft 365 Integration"
4. **Generieren**: AI erstellt vollständige Leistungsbeschreibung
5. **Ergebnis**: Rechtskonform strukturiertes Dokument mit:
   - Gegenstand der Leistung
   - Technische Anforderungen
   - Migrationsstrategie
   - SLA-Definitionen
   - Compliance-Vorgaben
   - Dokumentationsanforderungen

Das generierte Dokument ist direkt verwendbar für öffentliche Ausschreibungen nach deutschem Vergaberecht.

## 📈 Erweiterungsmöglichkeiten

- **Real-time Collaboration**: Mehrbenutzer-Editing
- **Template-Management**: Benutzer-definierte Prompt-Vorlagen
- **Export-Funktionen**: PDF, Word, strukturierte Formate
- **Workflow-Integration**: Freigabeprozesse und Approval-Workflows
- **Analytics**: Nutzungsstatistiken und Erfolgsmetriken
- **API-Integration**: Anbindung an bestehende Vergabe-Systeme