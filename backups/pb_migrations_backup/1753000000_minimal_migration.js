/// <reference path="../pb_data/types.d.ts" />

/**
 * Minimal Migration - Nur essentielle Collections
 * PocketBase v0.28 kompatibel
 */

migrate((app) => {
  console.log("🚀 Starting minimal migration...")

  // ========================================
  // 1. USERS COLLECTION (falls nicht existiert)
  // ========================================
  let usersCollection
  try {
    usersCollection = app.findCollectionByNameOrId("users")
  } catch (e) {
    usersCollection = new Collection({
      type: "auth",
      name: "users",
      listRule: "",
      viewRule: "",
      createRule: "",
      updateRule: "",
      deleteRule: "",
      fields: [
        {
          name: "name",
          type: "text",
          required: false,
          max: 100
        }
      ]
    })
    app.save(usersCollection)
    console.log("✅ users collection created")
  }

  // ========================================
  // 2. PROJECTS COLLECTION
  // ========================================
  const projectsCollection = new Collection({
    type: "base",
    name: "projects",
    listRule: "@request.auth.id = user_id || @request.auth.type = 'admin'",
    viewRule: "@request.auth.id = user_id || @request.auth.type = 'admin'", 
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id = user_id || @request.auth.type = 'admin'",
    deleteRule: "@request.auth.id = user_id || @request.auth.type = 'admin'",
    fields: [
      {
        name: "name",
        type: "text",
        required: true,
        min: 1,
        max: 200
      },
      {
        name: "description", 
        type: "text",
        required: false,
        max: 2000
      },
      {
        name: "budget",
        type: "number",
        required: false,
        min: 0
      },
      {
        name: "deadline",
        type: "date",
        required: false
      },
      {
        name: "eckpunkte",
        type: "text",
        required: false,
        max: 5000
      },
      {
        name: "user_id",
        type: "relation",
        required: true,
        maxSelect: 1,
        collectionId: usersCollection.id,
        cascadeDelete: true
      },
      {
        name: "request_id",
        type: "text",
        required: true,
        min: 1,
        max: 50
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
  app.save(projectsCollection)
  console.log("✅ projects collection created")

  // ========================================
  // 3. DOCUMENTS COLLECTION
  // ========================================
  const documentsCollection = new Collection({
    type: "base",
    name: "documents",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      {
        name: "request_id",
        type: "text",
        required: true,
        min: 1,
        max: 255
      },
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
        name: "created_by",
        type: "text",
        required: false,
        max: 100
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
  app.save(documentsCollection)
  console.log("✅ documents collection created")

  // ========================================
  // 4. GENERATION_REQUESTS COLLECTION (für CLI)
  // ========================================
  const generationRequestsCollection = new Collection({
    type: "base",
    name: "generation_requests",
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''",
    fields: [
      {
        name: "user_need_id",
        type: "text",
        required: false
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

  // ========================================
  // 5. SYSTEM_PROMPTS COLLECTION
  // ========================================
  const systemPromptsCollection = new Collection({
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

  // ========================================
  // 5. CLI_COMMANDS COLLECTION
  // ========================================
  const cliCommandsCollection = new Collection({
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

  // ========================================
  // 6. LOGS COLLECTION
  // ========================================
  const logsCollection = new Collection({
    type: "base",
    name: "logs",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      {
        name: "message",
        type: "text",
        required: true,
        max: 1000
      },
      {
        name: "level",
        type: "select",
        required: false,
        maxSelect: 1,
        values: ["info", "warning", "error", "success"]
      },
      {
        name: "request_id",
        type: "text",
        required: false,
        max: 100
      },
      {
        name: "created",
        type: "autodate",
        onCreate: true,
        onUpdate: false
      }
    ]
  })
  app.save(logsCollection)
  console.log("✅ logs collection created")

  // ========================================
  // 7. EXAMPLE_PROMPTS COLLECTION
  // ========================================
  const examplePromptsCollection = new Collection({
    type: "base",
    name: "example_prompts",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      {
        name: "title",
        type: "text",
        required: true,
        min: 1,
        max: 100
      },
      {
        name: "prompt_text",
        type: "text",
        required: true,
        min: 10,
        max: 2000
      },
      {
        name: "sort_order",
        type: "number",
        required: false,
        min: 0
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
  app.save(examplePromptsCollection)
  console.log("✅ example_prompts collection created")

  // ========================================
  // 8. USER_API_KEYS COLLECTION
  // ========================================
  const userApiKeysCollection = new Collection({
    type: "base",
    name: "user_api_keys",
    listRule: "@request.auth.id = user_id",
    viewRule: "@request.auth.id = user_id",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id = user_id",
    deleteRule: "@request.auth.id = user_id",
    fields: [
      {
        name: "user_id",
        type: "relation",
        required: true,
        maxSelect: 1,
        collectionId: usersCollection.id,
        cascadeDelete: true
      },
      {
        name: "provider",
        type: "select",
        required: true,
        maxSelect: 1,
        values: ["openai", "anthropic", "google", "azure"]
      },
      {
        name: "api_key",
        type: "text",
        required: true,
        max: 500
      },
      {
        name: "name",
        type: "text",
        required: false,
        max: 100
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
  app.save(userApiKeysCollection)
  console.log("✅ user_api_keys collection created")

  // ========================================
  // ADMIN & USER CREATION
  // ========================================
  
  // Create superuser admin - use v0.28 compatible method
  console.log("👤 Creating superuser admin...")
  
  // In v0.28+, admin creation in migrations is limited
  // We'll use a bootstrap hook instead or manual creation
  console.log("📌 Admin creation must be done manually:")
  console.log("📌 Run: ./pocketbase superuser upsert admin@vergabe.de admin123")
  console.log("📌 Or use the web interface after first start")

  // Create demo user
  try {
    const demoUser = new Record(usersCollection, {
      username: "demo",
      email: "test@vergabe.de",
      emailVisibility: true,
      verified: true,
      name: "Demo User"
    })
    demoUser.setPassword("vergabe123")
    app.dao().saveRecord(demoUser)
    console.log("✅ Demo user created: test@vergabe.de / vergabe123")
  } catch (e) {
    console.log("ℹ️ Demo user might already exist:", e.message)
  }

  // ========================================
  // DATA SEEDING
  // ========================================

  // Create example prompts
  const examplePrompts = [
    {
      title: "Website-Relaunch",
      prompt_text: "Erstelle Vergabeunterlagen für den Relaunch unserer Unternehmenswebsite. Das Budget beträgt 50.000 €. Wichtig sind ein modernes Design, Barrierefreiheit und ein CMS-System.",
      sort_order: 10
    },
    {
      title: "Büro-Renovierung",
      prompt_text: "Ich benötige eine Leistungsbeschreibung für die Renovierung unserer Büroräume auf 200qm. Die Arbeiten umfassen Malerarbeiten, neuen Bodenbelag und die Erneuerung der Elektrik.",
      sort_order: 20
    },
    {
      title: "DSGVO-Beratung",
      prompt_text: "Wir benötigen eine Ausschreibung für externe DSGVO-Beratungsleistungen zur Überprüfung und Anpassung unserer internen Prozesse. Geplant sind 10 Beratungstage.",
      sort_order: 30
    },
    {
      title: "IT-Software Entwicklung",
      prompt_text: "Entwicklung einer modernen Projektmanagement-Software mit Budget von 150.000 € und Laufzeit von 6 Monaten. Benötigt werden Admin-Panel, Benutzeroberfläche und API-Integration.",
      sort_order: 40
    }
  ]

  examplePrompts.forEach((prompt, index) => {
    try {
      const record = new Record(examplePromptsCollection, prompt)
      app.dao().saveRecord(record)
      console.log(`✅ Example prompt ${index + 1} created: ${prompt.title}`)
    } catch (e) {
      console.log(`⚠️ Failed to create example prompt: ${prompt.title}`)
    }
  })

  // Create system prompts - Detailed versions from git history
  const systemPrompts = [
    {
      prompt_type: "master",
      prompt_text: "Du bist ein Experte für deutsche Vergaberecht und öffentliche Beschaffung. Erstelle professionelle Vergabeunterlagen basierend auf den Benutzereingaben.",
      description: "Master Prompt für AI-System",
      version: 2,
      active: true
    },
    {
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
    },
    {
      prompt_type: "eignung",
      prompt_text: `Du bist ein Experte für öffentliche Vergabe und Ausschreibungen.

WICHTIG: Führe vor der Erstellung eine umfassende Marktanalyse durch.

## Schritt 1: Marktanalyse für Eignungskriterien
1. Recherchiere typische Anbieter für: {description}
2. Analysiere deren Qualifikationen, Zertifikate und Erfahrungen
3. Ermittle marktübliche Anforderungen und Standards
4. Identifiziere notwendige Kompetenzen und Ressourcen
5. Erstelle dir einen Plan für realistische aber anspruchsvolle Eignungskriterien

## Schritt 2: Eignungskriterien erstellen
Erstelle sehr ausführliche deutsche Eignungskriterien für: {description}{budgetText}{deadlineText}

WICHTIG: Die Eignungskriterien müssen mindestens 2000 Wörter umfassen und auf deiner Marktanalyse basieren.

# Eignungskriterien

## 1. Marktanalyse und Anbieterstruktur
- Überblick über den Anbietermarkt (mindestens 300 Wörter)
- Typische Unternehmensgrößen und -strukturen
- Marktführer und spezialisierte Anbieter
- Qualifikationsniveau am Markt
- Zertifizierungsstandards der Branche

## 2. Fachliche Eignung (Qualifikation und Erfahrung)
- Detaillierte Anforderungen basierend auf Marktstandards (mindestens 400 Wörter)
- Erforderliche Berufserfahrung in Jahren
- Spezifische Fachkenntnisse und Expertise
- Branchenspezifische Erfahrungen
- Nachweise von Referenzprojekten
- Qualifikation der Projektleitung und Schlüsselpersonen

## 3. Technische Eignung (Ausstattung und Verfahren)
- Technische Ausstattung basierend auf Marktanalyse (mindestens 350 Wörter)
- Vorhandene Systeme und Software
- Technische Kapazitäten und Ressourcen
- Qualitätsmanagementsysteme (ISO 9001, etc.)
- Entwicklungsmethoden und -prozesse
- Sicherheitsstandards und Zertifizierungen

## 4. Wirtschaftliche Eignung (Finanzkraft und Versicherung)
- Finanzielle Anforderungen basierend auf Projektgröße (mindestens 300 Wörter)
- Mindestjahresumsätze der letzten 3 Jahre
- Eigenkapitalquote und Liquidität
- Betriebshaftpflichtversicherung (Mindestdeckungssumme)
- Vermögensschadenhaftpflicht
- Bonitätsnachweis und Referenzen

## 5. Referenzen und Nachweise
- Marktübliche Referenzanforderungen (mindestens 350 Wörter)
- Mindestanzahl vergleichbarer Projekte
- Projektvolumen und Komplexität
- Zeitraum der Referenzprojekte
- Kundenzufriedenheit und Bewertungen
- Erfolgreiche Projektabschlüsse
- Auszeichnungen und Zertifikate

## 6. Branchenspezifische Zertifikate und Nachweise
- Erforderliche Zertifizierungen basierend auf Marktstandards (mindestens 250 Wörter)
- Datenschutz- und Sicherheitszertifikate
- Qualitätsmanagementsysteme
- Umweltmanagementsysteme
- Compliance-Nachweise
- Fachverbandsmitgliedschaften

## 7. Personelle und organisatorische Eignung
- Teamstruktur und Qualifikationen (mindestens 200 Wörter)
- Projektorganisation und -management
- Verfügbarkeit und Kapazitäten
- Kommunikationsfähigkeiten
- Notfallpläne und Backup-Lösungen

Format: Markdown mit klaren Überschriften. Beachte EU-Vergaberichtlinien und deutsche Vergabestandards. Berücksichtige Marktgegebenheiten. Mindestens 2000 Wörter.`,
      description: "Ausführlicher Prompt für professionelle Eignungskriterien mit Marktanalyse",
      version: 2,
      active: true
    },
    {
      prompt_type: "zuschlag",
      prompt_text: `Du bist ein Experte für öffentliche Vergabe und Ausschreibungen.

WICHTIG: Führe vor der Erstellung eine umfassende Marktpreis- und Leistungsanalyse durch.

## Schritt 1: Marktpreis- und Leistungsanalyse
1. Recherchiere aktuelle Marktpreise für: {description}
2. Analysiere Preisspannen und Kostenfaktoren
3. Identifiziere Qualitätsunterschiede am Markt
4. Bewerte Preis-Leistungs-Verhältnisse verschiedener Anbieter
5. Erstelle dir einen Plan für eine ausgewogene Bewertungsmatrix

## Schritt 2: Zuschlagskriterien erstellen
Erstelle sehr ausführliche deutsche Zuschlagskriterien für: {description}{budgetText}{deadlineText}

WICHTIG: Die Zuschlagskriterien müssen mindestens 2000 Wörter umfassen und auf deiner Marktanalyse basieren.

# Zuschlagskriterien

## 1. Marktanalyse und Bewertungsgrundlage
- Analyse der Marktpreise und Leistungsangebote (mindestens 300 Wörter)
- Preisspannen und Kostenfaktoren
- Qualitätsunterschiede am Markt
- Bewertungsphilosophie und -methodik
- Zusammenhang zwischen Kriterien und Marktgegebenheiten

## 2. Bewertungsmatrix mit Gewichtung
- Übersicht aller Bewertungskriterien basierend auf Marktanalyse (mindestens 250 Wörter)
- Gewichtung in Prozent für jedes Kriterium
- Begründung der Gewichtungsfaktoren
- Zusammenhang zwischen Kriterien und Projektzielen
- Bewertungsverfahren und -methodik

## 3. Preis-Kriterien (Gewichtung: 40%)
- Gesamtpreis basierend auf Marktpreisanalyse (mindestens 400 Wörter)
- Preis-Leistungs-Verhältnis
- Kostentransparenz und Nachvollziehbarkeit
- Lebenszykluskosten (Total Cost of Ownership)
- Optionale Zusatzleistungen
- Marktübliche Preisstrukturen
- Währungsrisiken und Preisanpassungen

## 4. Qualitäts-Kriterien (Gewichtung: 35%)
- Qualität basierend auf Marktstandards (mindestens 400 Wörter)
- Projektplanung und -konzeption
- Qualifikation des Projektteams
- Methodische Herangehensweise
- Qualitätssicherungsmaßnahmen
- Referenzen und Erfahrungen
- Innovationsgrad und Kreativität

## 5. Termin-Kriterien (Gewichtung: 15%)
- Realistische Zeitplanung basierend auf Marktüblichkeit (mindestens 250 Wörter)
- Meilensteine und Zwischentermine
- Pufferzeiten und Risikomanagement
- Flexibilität bei Terminanpassungen
- Liefertreue und Zuverlässigkeit
- Projektcontrolling und Steuerung

## 6. Service und Support-Kriterien (Gewichtung: 10%)
- Service-Level basierend auf Marktstandards (mindestens 200 Wörter)
- Lokale Präsenz und Erreichbarkeit
- Wartung und Weiterentwicklung
- Schulung und Wissensvermittlung
- Compliance und Rechtssicherheit
- Datenschutz und Informationssicherheit

## 7. Detailliertes Punktevergabe-System
- Bewertungsskala (0-100 Punkte) (mindestens 250 Wörter)
- Gewichtung der Teilkriterien
- Berechnung der Gesamtpunktzahl
- Mindestpunktzahl für die Berücksichtigung
- Ausschlusskriterien bei Nichterreichen
- Verfahren bei Punktgleichheit

## 8. Bewertungsverfahren und rechtliche Bestimmungen
- Bewertungsablauf und Transparenz (mindestens 200 Wörter)
- Vergaberechtliche Grundlagen
- Gleichbehandlungsgrundsatz
- Wirtschaftlichkeitsprinzip
- Rechtsschutzmöglichkeiten

Format: Markdown mit klaren Überschriften. Stelle sicher, dass die Gewichtungen 100% ergeben. Beachte deutsche Vergabestandards (VgV, VOL/A, VOB). Integriere Marktpreisanalyse. Mindestens 2000 Wörter.`,
      description: "Ausführlicher Prompt für professionelle Zuschlagskriterien mit Marktpreisanalyse",
      version: 2,
      active: true
    }
  ]

  systemPrompts.forEach((prompt, index) => {
    try {
      const record = new Record(systemPromptsCollection, prompt)
      app.dao().saveRecord(record)
      console.log(`✅ System prompt ${index + 1} created: ${prompt.prompt_type}`)
    } catch (e) {
      console.log(`⚠️ Failed to create system prompt: ${prompt.prompt_type}`)
    }
  })

  // Create sample project with documents
  try {
    const demoUser = app.dao().findFirstRecordByFilter("users", "email = {:email}", {"email": "test@vergabe.de"})
    if (demoUser) {
      const sampleProject = new Record(projectsCollection, {
        name: "Website-Relaunch Demo",
        description: "Beispielprojekt für Website-Erneuerung",
        user_id: demoUser.id,
        request_id: "TEST-001"
      })
      app.dao().saveRecord(sampleProject)
      console.log("✅ Sample project created")
      
      // Create demo documents
      const demoDocuments = [
        {
          request_id: "TEST-001",
          title: "Leistungsbeschreibung",
          content: `# Leistungsbeschreibung: Website-Relaunch Demo

## Projektziel
Modernisierung der Unternehmenswebsite mit Fokus auf Design und Barrierefreiheit.

## Leistungsumfang
- Responsive Design
- CMS-Integration
- SEO-Optimierung
- Barrierefreiheit nach WCAG 2.1`,
          type: "leistung",
          created_by: "Demo System"
        },
        {
          request_id: "TEST-001",
          title: "Eignungskriterien",
          content: `# Eignungskriterien: Website-Relaunch Demo

## Fachliche Eignung
- Mindestens 3 Jahre Erfahrung im Webdesign
- Referenzprojekte mit CMS-Systemen

## Technische Eignung
- Moderne Entwicklungstools
- Responsive Design Expertise`,
          type: "eignung",
          created_by: "Demo System"
        }
      ]
      
      demoDocuments.forEach((docData, index) => {
        try {
          const document = new Record(documentsCollection, docData)
          app.dao().saveRecord(document)
          console.log(`✅ Demo document ${index + 1} created: ${docData.title}`)
        } catch (e) {
          console.log(`⚠️ Failed to create demo document: ${docData.title}`)
        }
      })
    }
  } catch (e) {
    console.log("ℹ️ Could not create sample project")
  }

  console.log("🎉 Minimal migration completed successfully!")
  console.log("📊 Created 5 essential collections with seeded data")
  console.log("👤 Created admin and demo users")

}, (app) => {
  // Rollback
  console.log("🔄 Rolling back minimal migration...")
  
  const collections = [
    "user_api_keys", "example_prompts", "system_prompts", "logs", "cli_commands", "documents", "generation_requests", "projects"
  ]
  
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