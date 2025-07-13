/// <reference path="../pb_data/types.d.ts" />

/**
 * Add System Prompts Collection
 * Fixes OpenCode integration by adding the missing system_prompts collection
 */

migrate((app) => {
  console.log("🔧 Adding system_prompts collection...")
  
  // Check if system_prompts collection already exists
  try {
    const existingCollection = app.findCollectionByNameOrId("system_prompts")
    console.log("ℹ️ system_prompts collection already exists")
    return
  } catch (e) {
    // Collection doesn't exist, create it
  }
  
  // Create system_prompts collection
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
        max: 15000
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
  
  // Also add user_needs collection if it doesn't exist (needed by CLI processor)
  try {
    const existingUserNeeds = app.findCollectionByNameOrId("user_needs")
    console.log("ℹ️ user_needs collection already exists")
  } catch (e) {
    // Create user_needs collection
    const userNeedsCollection = new Collection({
      type: "base",
      name: "user_needs",
      listRule: "@request.auth.id = user_id",
      viewRule: "@request.auth.id = user_id",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id = user_id",
      deleteRule: "@request.auth.id = user_id",
      fields: [
        {
          name: "thema",
          type: "text",
          required: true,
          max: 200
        },
        {
          name: "beschreibung",
          type: "text",
          required: false,
          max: 2000
        },
        {
          name: "user_id",
          type: "relation",
          required: true,
          maxSelect: 1,
          collectionId: "systemprofiles0" // This will be replaced by proper user collection ID
        },
        {
          name: "project_id",
          type: "text",
          required: false,
          max: 50
        },
        {
          name: "status",
          type: "select",
          required: false,
          maxSelect: 1,
          values: ["created", "processing", "completed", "failed"]
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
    
    // Get users collection ID
    try {
      const usersCollection = app.findCollectionByNameOrId("users")
      userNeedsCollection.schema.find(field => field.name === "user_id").options.collectionId = usersCollection.id
    } catch (e) {
      console.log("⚠️ Users collection not found, user_needs relation may not work properly")
    }
    
    app.save(userNeedsCollection)
    console.log("✅ user_needs collection created")
  }
  
  // Also add apikeys collection if it doesn't exist (needed by OpenCode service)
  try {
    const existingApikeys = app.findCollectionByNameOrId("apikeys")
    console.log("ℹ️ apikeys collection already exists")
  } catch (e) {
    // Create apikeys collection
    const apikeysCollection = new Collection({
      type: "base",
      name: "apikeys",
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
          collectionId: "systemprofiles0" // This will be replaced by proper user collection ID
        },
        {
          name: "provider",
          type: "select",
          required: true,
          maxSelect: 1,
          values: ["openai", "anthropic", "google"]
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
    
    // Get users collection ID
    try {
      const usersCollection = app.findCollectionByNameOrId("users")
      apikeysCollection.schema.find(field => field.name === "user_id").options.collectionId = usersCollection.id
    } catch (e) {
      console.log("⚠️ Users collection not found, apikeys relation may not work properly")
    }
    
    app.save(apikeysCollection)
    console.log("✅ apikeys collection created")
  }
  
  // Add professional system prompts
  const professionalPrompts = [
    {
      prompt_type: "master",
      prompt_text: "Du bist ein Experte für deutsche Vergaberecht und öffentliche Beschaffung. Erstelle professionelle Vergabeunterlagen basierend auf den Benutzereingaben unter Berücksichtigung von VgV, VOL/A und VOB.",
      description: "Master Prompt für AI-System",
      version: 1,
      active: true
    },
    {
      prompt_type: "leistung",
      prompt_text: `Du bist ein Experte für öffentliche Vergabe und Ausschreibungen. 

WICHTIG: Führe vor der Erstellung der Dokumente eine umfassende Webrecherche durch, um die aktuellen Marktgegebenheiten zu verstehen.

## Schritt 1: Webrecherche und Marktanalyse
1. Recherchiere aktuelle Marktpreise und Standardlösungen für das Thema
2. Analysiere was der Markt aktuell anbietet und welche Technologien verfügbar sind
3. Identifiziere führende Anbieter und deren Leistungsumfang
4. Erstelle dir einen detaillierten Plan basierend auf der Marktanalyse
5. Berücksichtige aktuelle Trends und Entwicklungen in der Branche

## Schritt 2: Leistungsbeschreibung erstellen
Erstelle eine sehr ausführliche und professionelle deutsche Leistungsbeschreibung für öffentliche Vergabe.

WICHTIG: Die Leistungsbeschreibung muss mindestens 2500 Wörter umfassen und auf deiner Marktrecherche basieren.

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
- Vollständige Auflistung aller zu erbringenden Leistungen (mindestens 600 Wörter)
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
      description: "Professioneller Prompt für detaillierte Leistungsbeschreibungen mit Marktanalyse",
      version: 2,
      active: true
    },
    {
      prompt_type: "eignung",
      prompt_text: `Du bist ein Experte für öffentliche Vergabe und Ausschreibungen.

WICHTIG: Führe vor der Erstellung eine umfassende Marktanalyse durch.

## Schritt 1: Marktanalyse für Eignungskriterien
1. Recherchiere typische Anbieter für das Thema
2. Analysiere deren Qualifikationen, Zertifikate und Erfahrungen
3. Ermittle marktübliche Anforderungen und Standards
4. Identifiziere notwendige Kompetenzen und Ressourcen
5. Erstelle dir einen Plan für realistische aber anspruchsvolle Eignungskriterien

## Schritt 2: Eignungskriterien erstellen
Erstelle sehr ausführliche deutsche Eignungskriterien.

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
      description: "Professioneller Prompt für detaillierte Eignungskriterien mit Marktanalyse",
      version: 2,
      active: true
    },
    {
      prompt_type: "zuschlag",
      prompt_text: `Du bist ein Experte für öffentliche Vergabe und Ausschreibungen.

WICHTIG: Führe vor der Erstellung eine umfassende Marktpreis- und Leistungsanalyse durch.

## Schritt 1: Marktpreis- und Leistungsanalyse
1. Recherchiere aktuelle Marktpreise für das Thema
2. Analysiere Preisspannen und Kostenfaktoren
3. Identifiziere Qualitätsunterschiede am Markt
4. Bewerte Preis-Leistungs-Verhältnisse verschiedener Anbieter
5. Erstelle dir einen Plan für eine ausgewogene Bewertungsmatrix

## Schritt 2: Zuschlagskriterien erstellen
Erstelle sehr ausführliche deutsche Zuschlagskriterien.

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
      description: "Professioneller Prompt für detaillierte Zuschlagskriterien mit Marktpreisanalyse",
      version: 2,
      active: true
    }
  ]
  
  // Insert professional system prompts
  professionalPrompts.forEach((prompt, index) => {
    try {
      const record = new Record(systemPromptsCollection, prompt)
      app.save(record)
      console.log(`✅ System prompt ${prompt.prompt_type} created`)
    } catch (e) {
      console.log(`⚠️ Failed to create ${prompt.prompt_type} prompt:`, e.message)
    }
  })
  
  console.log("🎉 System prompts migration completed!")
  console.log("📊 Created professional system prompts for OpenCode integration")
  
}, (app) => {
  // Rollback
  console.log("🔄 Rolling back system prompts and related collections...")
  
  const collections = ["system_prompts", "user_needs", "apikeys"]
  
  collections.forEach(name => {
    try {
      const collection = app.findCollectionByNameOrId(name)
      app.delete(collection)
      console.log(`✅ Deleted ${name} collection`)
    } catch (e) {
      console.log(`ℹ️ ${name} collection not found for deletion`)
    }
  })
  
  console.log("🔄 Rollback completed")
})