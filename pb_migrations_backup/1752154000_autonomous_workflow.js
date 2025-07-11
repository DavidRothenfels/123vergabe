/// <reference path="../pb_data/types.d.ts" />

/**
 * Autonomous Workflow Migration - Inspired by cli_frontend
 * Adds CLI command queue and generation request system
 */

migrate((app) => {
  console.log("🚀 Adding autonomous workflow collections...")

  // ========================================
  // 1. GENERATION_REQUESTS COLLECTION
  // ========================================
  let generationRequestsCollection = null
  try {
    generationRequestsCollection = app.findCollectionByNameOrId("generation_requests")
    console.log("generation_requests collection already exists")
  } catch (e) {
    generationRequestsCollection = new Collection({
      type: "base",
      name: "generation_requests",
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''", 
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: "project_id",
          type: "text",
          required: true,
          max: 50
        },
        {
          name: "user_id", 
          type: "text",
          required: true,
          max: 50
        },
        {
          name: "prompt_text",
          type: "text",
          required: true,
          max: 5000
        },
        {
          name: "status",
          type: "select",
          required: false,
          maxSelect: 1,
          values: ["pending", "processing", "completed", "failed"]
        },
        {
          name: "created",
          type: "autodate",
          onCreate: true,
          onUpdate: false
        },
        {
          name: "updated",
          type: "autodate",
          onCreate: true,
          onUpdate: true
        }
      ]
    })
    app.save(generationRequestsCollection)
    console.log("✅ generation_requests collection created")
  }

  // ========================================
  // 2. CLI_COMMANDS COLLECTION  
  // ========================================
  let cliCommandsCollection = null
  try {
    cliCommandsCollection = app.findCollectionByNameOrId("cli_commands")
    console.log("cli_commands collection already exists")
  } catch (e) {
    cliCommandsCollection = new Collection({
      type: "base",
      name: "cli_commands",
      listRule: "",
      viewRule: "",
      createRule: "",
      updateRule: "",
      deleteRule: "",
      fields: [
        {
          name: "command",
          type: "text",
          required: true,
          max: 100
        },
        {
          name: "status",
          type: "select",
          required: true,
          maxSelect: 1,
          values: ["pending", "processing", "completed", "failed"]
        },
        {
          name: "parameters",
          type: "text",
          required: false,
          max: 2000
        },
        {
          name: "retry_count",
          type: "number",
          required: false,
          min: 0,
          max: 10
        },
        {
          name: "error",
          type: "text",
          required: false,
          max: 2000
        },
        {
          name: "created",
          type: "autodate",
          onCreate: true,
          onUpdate: false
        },
        {
          name: "updated",
          type: "autodate",
          onCreate: true,
          onUpdate: true
        }
      ]
    })
    app.save(cliCommandsCollection)
    console.log("✅ cli_commands collection created")
  }

  // ========================================
  // 3. SYSTEM_PROMPTS COLLECTION
  // ========================================
  let systemPromptsCollection = null
  try {
    systemPromptsCollection = app.findCollectionByNameOrId("system_prompts")
    console.log("system_prompts collection already exists")
  } catch (e) {
    systemPromptsCollection = new Collection({
      type: "base",
      name: "system_prompts",
      listRule: "",
      viewRule: "",
      createRule: "",
      updateRule: "",
      deleteRule: "",
      fields: [
        {
          name: "prompt_type",
          type: "select",
          required: true,
          maxSelect: 1,
          values: ["leistung", "eignung", "zuschlag", "master"]
        },
        {
          name: "prompt_text",
          type: "text",
          required: true,
          max: 10000
        },
        {
          name: "description",
          type: "text",
          required: false,
          max: 500
        },
        {
          name: "version",
          type: "number",
          required: true,
          min: 1
        },
        {
          name: "active",
          type: "bool",
          required: false
        },
        {
          name: "created",
          type: "autodate",
          onCreate: true,
          onUpdate: false
        },
        {
          name: "updated",
          type: "autodate",
          onCreate: true,
          onUpdate: true
        }
      ]
    })
    app.save(systemPromptsCollection)
    console.log("✅ system_prompts collection created")
  }

  // ========================================
  // 4. INSERT PROFESSIONAL PROMPTS FROM CLI_FRONTEND
  // ========================================
  
  // Master prompt for Leistungsbeschreibung with market analysis
  const leistungPrompt = {
    prompt_type: "leistung",
    prompt_text: `Du bist ein Experte für öffentliche Vergabe und Ausschreibungen. 

WICHTIG: Führe vor der Erstellung der Dokumente eine umfassende Webrecherche durch, um die aktuellen Marktgegebenheiten zu verstehen.

## Schritt 1: Webrecherche und Marktanalyse
1. Recherchiere aktuelle Marktpreise und Standardlösungen für: {description}
2. Analysiere was der Markt aktuell anbietet und welche Technologien verfügbar sind
3. Identifiziere führende Anbieter und deren Leistungsumfang
4. Erstelle dir einen detaillierten Plan basierend auf der Marktanalyse
5. Berücksichtige aktuelle Trends und Entwicklungen in der Branche

## Schritt 2: Leistungsbeschreibung erstellen
Erstelle eine sehr ausführliche und professionelle deutsche Leistungsbeschreibung für öffentliche Vergabe für: {description}{budgetText}{deadlineText}

WICHTIG: Die Leistungsbeschreibung muss mindestens 2500 Wörter umfassen und auf deiner Marktrecherche basieren.

Verwende folgende detaillierte Struktur:

# Leistungsbeschreibung

## 1. Projektziel und Zweck
- Ausführliche Beschreibung des Projektziels basierend auf Marktanalyse (mindestens 300 Wörter)
- Strategische Bedeutung für die Organisation
- Erwartete Nutzen und Mehrwerte
- Projektkontext und Hintergrund
- Abgrenzung zu bestehenden Lösungen am Markt

## 2. Marktanalyse und Ausgangslage
- Aktuelle Marktlage und verfügbare Lösungen (mindestens 400 Wörter)
- Führende Anbieter und deren Leistungsumfang
- Marktübliche Preise und Konditionen
- Technologische Standards und Trends
- Benchmarking mit vergleichbaren Projekten

## 3. Detaillierter Leistungsumfang
- Vollständige Auflistung aller zu erbringenden Leistungen basierend auf Marktstandards (mindestens 600 Wörter)
- Arbeitsschritte mit detaillierten Beschreibungen
- Teilleistungen und Meilensteine
- Lieferumfang und Ergebnisse
- Abgrenzung zu optionalen Leistungen

## 4. Technische Anforderungen
- Detaillierte technische Spezifikationen basierend auf Marktstandards (mindestens 400 Wörter)
- Systemanforderungen und Schnittstellen
- Kompatibilitätsanforderungen
- Sicherheitsanforderungen
- Performance- und Skalierungsanforderungen

## 5. Qualitätsstandards und Normen
- Anzuwendende Standards und Normen (mindestens 300 Wörter)
- Qualitätssicherungsmaßnahmen
- Prüfverfahren und Abnahmekriterien
- Dokumentationsanforderungen
- Compliance-Anforderungen

## 6. Projektmanagement und Kommunikation
- Projektorganisation und Ansprechpartner (mindestens 200 Wörter)
- Kommunikationswege und Reporting
- Projektcontrolling und Steuerung
- Risikomanagement
- Change-Management-Prozesse

## 7. Lieferung und Abnahme
- Detaillierte Lieferbedingungen (mindestens 250 Wörter)
- Abnahmeverfahren und -kriterien
- Übergabe und Einführung
- Schulung und Wissensvermittlung
- Go-Live-Unterstützung

## 8. Gewährleistung und Support
- Gewährleistungsumfang und -dauer basierend auf Marktstandards (mindestens 200 Wörter)
- Supportleistungen und Service Level
- Wartung und Pflege
- Weiterentwicklung und Updates
- Reaktionszeiten und Verfügbarkeit

## 9. Rechtliche und vertragliche Bestimmungen
- Geltende Gesetze und Vorschriften (mindestens 200 Wörter)
- Vergaberechtliche Bestimmungen
- Haftung und Versicherung
- Datenschutz und Compliance
- Urheberrechte und Lizenzen

Format: Markdown mit klaren Überschriften. Beachte deutsche Vergabestandards (VgV, VOL/A, VOB). Integriere die Ergebnisse deiner Marktrecherche in alle Abschnitte. Mindestens 2500 Wörter Gesamtlänge.`,
    description: "Ausführlicher Prompt für professionelle Leistungsbeschreibungen mit Marktanalyse",
    version: 2,
    active: true
  }

  try {
    const record = new Record(systemPromptsCollection, leistungPrompt)
    app.save(record)
    console.log("✅ Professional Leistungsbeschreibung prompt created")
  } catch (e) {
    console.log("⚠️ Failed to create leistung prompt:", e.message)
  }

  console.log("🎉 Autonomous workflow migration completed!")

}, (app) => {
  // Rollback
  console.log("🔄 Rolling back autonomous workflow...")
  
  const collections = ["generation_requests", "cli_commands", "system_prompts"]
  
  collections.forEach(name => {
    try {
      const collection = app.findCollectionByNameOrId(name)
      app.delete(collection)
      console.log(`✅ Deleted collection: ${name}`)
    } catch (e) {
      console.log(`ℹ️ Collection ${name} not found for deletion`)
    }
  })

  console.log("🔄 Rollback completed")
})