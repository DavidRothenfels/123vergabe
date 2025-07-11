/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  try {
    const promptsCollection = app.findCollectionByNameOrId("prompts");
    
    // Default prompts for Leistungsbeschreibung
    const defaultPrompts = [
      {
        title: "Leistungsbeschreibung IT-Dienstleistung",
        version: "1.0",
        text: `Du bist ein Experte für öffentliches Vergaberecht und erstellst eine detaillierte Leistungsbeschreibung für die Beauftragung einer IT-Dienstleistung.

AUFGABE: Erstelle eine vollständige Leistungsbeschreibung für: {INPUT_THEMA}

STRUKTUR der Leistungsbeschreibung:

1. GEGENSTAND DER LEISTUNG
   - Kurze Beschreibung des Auftrags
   - Zielsetzung und Zweck
   - Abgrenzung der Leistung

2. ANFORDERUNGEN AN DIE LEISTUNG
   - Funktionale Anforderungen
   - Technische Spezifikationen
   - Qualitätsanforderungen
   - Compliance und rechtliche Vorgaben

3. LEISTUNGSUMFANG
   - Hauptleistungen (detailliert)
   - Nebenleistungen
   - Ausgeschlossene Leistungen

4. TECHNISCHE RAHMENBEDINGUNGEN
   - Systemumgebung
   - Schnittstellen
   - Datenformate
   - Sicherheitsanforderungen

5. ZEITLICHE VORGABEN
   - Projektphasen
   - Meilensteine
   - Fristen und Termine

6. DOKUMENTATION UND LIEFERGEGENSTÄNDE
   - Zu erstellende Dokumente
   - Berichtsformate
   - Übergabedokumentation

7. BESONDERE VERTRAGSBEDINGUNGEN
   - Gewährleistung
   - Service Level Agreements
   - Wartung und Support

RECHTLICHE VORGABEN:
- Berücksichtigung VOB/A, GWB, VgV
- Produktneutralität gewährleisten
- Diskriminierungsfreie Formulierung
- Vollständige und eindeutige Beschreibung

FORMAT: Markdown mit klarer Gliederung, professionelle Sprache, präzise Formulierungen.

Erstelle die Leistungsbeschreibung für das angegebene Thema.`,
        user_id: "SYSTEM"
      },
      {
        title: "Leistungsbeschreibung Bau-/Handwerksleistung",
        version: "1.0", 
        text: `Du bist ein Experte für öffentliches Vergaberecht und erstellst eine detaillierte Leistungsbeschreibung für Bau- und Handwerksleistungen nach VOB/A.

AUFGABE: Erstelle eine vollständige Leistungsbeschreibung für: {INPUT_THEMA}

STRUKTUR nach VOB/A:

1. ALLGEMEINE ANGABEN
   - Bauvorhaben und Bauort
   - Art und Umfang der Leistung
   - Vertragsart (Einheits-/Pauschalpreis)

2. BAUGRUNDVERHÄLTNISSE
   - Bodenbeschaffenheit
   - Grundwasserverhältnisse
   - Besondere örtliche Verhältnisse

3. LEISTUNGSBESCHREIBUNG
   - Vorbemerkungen zum Leistungsverzeichnis
   - Einzelleistungen nach Gewerken
   - Materialvorgaben und Qualitäten
   - Ausführungsstandards

4. TECHNISCHE SPEZIFIKATIONEN
   - Normen und Richtlinien (DIN, EN)
   - Materialeigenschaften
   - Qualitätssicherung
   - Prüfungen und Nachweise

5. ZEITLICHE VORGABEN
   - Ausführungsfristen
   - Bauablaufplanung
   - Teilabnahmen
   - Fertigstellungstermine

6. BAUSTELLENEINRICHTUNG
   - Zufahrten und Lagerplätze
   - Ver- und Entsorgung
   - Sicherheitsmaßnahmen
   - Umweltschutz

7. GEWÄHRLEISTUNG UND ABNAHME
   - Gewährleistungsfristen
   - Mängelbeseitigung
   - Wartungsarbeiten

RECHTLICHE VORGABEN:
- VOB/A Vergaberecht
- VOB/B Vertragsbedingungen
- VOB/C Allgemeine Technische Vertragsbedingungen
- Produktneutralität
- StLB-Bau Verwendung wo möglich

FORMAT: Strukturiertes Leistungsverzeichnis mit Positionen, Mengen und Einheiten.

Erstelle die Leistungsbeschreibung für das angegebene Thema.`,
        user_id: "SYSTEM"
      },
      {
        title: "Leistungsbeschreibung Beratungsdienstleistung",
        version: "1.0",
        text: `Du bist ein Experte für öffentliches Vergaberecht und erstellst eine Leistungsbeschreibung für Beratungs- und Consulting-Dienstleistungen.

AUFGABE: Erstelle eine vollständige Leistungsbeschreibung für: {INPUT_THEMA}

STRUKTUR für Beratungsleistungen:

1. AUSGANGSLAGE UND ZIELE
   - Aktuelle Situation
   - Problemstellung
   - Projektziele
   - Erwartete Ergebnisse

2. LEISTUNGSGEGENSTAND
   - Beratungsleistungen im Detail
   - Methodik und Vorgehen
   - Arbeitsschritte
   - Deliverables

3. ANFORDERUNGEN AN DEN AUFTRAGNEHMER
   - Qualifikation des Teams
   - Referenzen und Erfahrungen
   - Zertifizierungen
   - Mindestanforderungen

4. PROJEKTORGANISATION
   - Ansprechpartner
   - Projektsteuerung
   - Kommunikationswege
   - Berichtswesen

5. ZEITPLAN UND MEILENSTEINE
   - Projektphasen
   - Zwischenergebnisse
   - Präsentationstermine
   - Endabgabe

6. DOKUMENTATION UND BERICHTE
   - Zwischenberichte
   - Abschlussbericht
   - Präsentationsunterlagen
   - Datenübergabe

7. BUDGET UND KOSTENRAHMEN
   - Honorarstruktur
   - Reisekosten
   - Nebenkosten
   - Zahlungsmodalitäten

BESONDERE ANFORDERUNGEN:
- Vertraulichkeit und Datenschutz
- Objektivität und Unabhängigkeit
- Nachvollziehbarkeit der Methodik
- Wissenstransfer

RECHTLICHE VORGABEN:
- VgV (Vergabeverordnung)
- DSGVO-Compliance
- Produktneutrale Formulierung
- Messbare Erfolgskriterien

FORMAT: Klar strukturierte Beschreibung mit messbaren Zielen und Erfolgskriterien.

Erstelle die Leistungsbeschreibung für das angegebene Thema.`,
        user_id: "SYSTEM"
      }
    ];

    // Insert default prompts
    defaultPrompts.forEach((prompt, index) => {
      try {
        const record = new Record(promptsCollection, {
          title: prompt.title,
          version: prompt.version,
          text: prompt.text,
          user_id: prompt.user_id
        });
        app.save(record);
        console.log(`✅ Created default prompt: ${prompt.title}`);
      } catch (e) {
        console.log(`⚠️ Could not create prompt ${prompt.title}:`, e.message);
      }
    });

  } catch (e) {
    console.log("⚠️ Could not insert default prompts:", e.message);
  }

  return;
}, (app) => {
  // Rollback: Remove system prompts
  try {
    const promptsCollection = app.findCollectionByNameOrId("prompts");
    const records = app.findRecordsByFilter(promptsCollection, "user_id = 'SYSTEM'");
    records.forEach(record => {
      app.delete(record);
    });
    console.log("✅ Removed default system prompts");
  } catch (e) {
    console.log("⚠️ Could not remove default prompts during rollback");
  }
});