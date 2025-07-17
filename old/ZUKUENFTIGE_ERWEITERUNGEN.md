# Zukünftige Erweiterungen - Vergabedokument-Generator

## 1. Prompts in PocketBase speichern
- Collection `prompts` für wiederverwendbare Prompt-Templates
- Kategorien: vergabe_komplett, leistungsbeschreibung, bewertungsmatrix, etc.
- Variablen-System für dynamische Werte ({{title}}, {{budget}}, etc.)
- Public/Private Prompts für Team-Sharing

## 2. Erweiterte Dokumentenverwaltung
- Dokumente einzeln speichern (nicht als Gesamtdokument)
- Kategorisierung: leistungsbeschreibung, vertragsentwurf, etc.
- Versionierung von Dokumenten
- Parent-Child Beziehungen für zusammengehörige Dokumente

## 3. Batch-Generierung
- Collection `generation_batches` für Tracking
- Ein Aufruf → Mehrere einzelne Dokumente
- Status-Tracking: pending, processing, completed, failed

## 4. OpenCode Agentische Features optimal nutzen
- Web-Recherche für aktuelle Preise/Rechtslage
- Komplette Vergabeunterlagen in einem Durchgang
- Intelligente Dokumententrennung basierend auf Markdown-Headers

## 5. Frontend-Erweiterungen
- Prompt-Editor mit Variablen-Highlighting
- Batch-Status Dashboard
- Dokumenten-Preview mit Kategorien
- Export als ZIP mit allen Vergabedokumenten

## Migration bereits vorbereitet in:
`pb_migrations/1752500000_prompts_and_documents.js`