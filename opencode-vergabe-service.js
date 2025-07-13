// Specialized service for Vergabeunterlagen generation with OpenCode
const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(express.json());

// Enhanced prompt template for complete Vergabeunterlagen
const VERGABE_PROMPT_TEMPLATE = `
Du bist ein Experte für öffentliche Vergabe in Deutschland.

PROJEKT: {title}
BESCHREIBUNG: {description}
BUDGET: {budget}
LAUFZEIT: {duration}

AUFGABE: Erstelle komplette Vergabeunterlagen nach VOB/VOL.

Recherchiere dazu:
1. Aktuelle rechtliche Anforderungen (2024/2025)
2. Marktübliche Preise für vergleichbare Leistungen
3. Best Practices für diese Art von Ausschreibung

Erstelle folgende Dokumente (jeweils als separate Markdown-Sections):

## 1. LEISTUNGSBESCHREIBUNG
[Mindestens 2000 Wörter, detailliert mit:]
- Projektübersicht
- Detaillierter Leistungsumfang
- Technische Spezifikationen
- Qualitätsanforderungen
- Normen und Standards
- Schnittstellen
- Abnahmekriterien

## 2. BEWERTUNGSMATRIX
[Tabellarisch mit:]
- Zuschlagskriterien (Preis, Qualität, etc.)
- Gewichtung in Prozent
- Bewertungsmethodik
- Mindestpunktzahl

## 3. VERTRAGSENTWURF
[Rechtssicher mit:]
- Vertragsparteien
- Leistungsgegenstand
- Termine und Fristen
- Vergütung
- Zahlungsbedingungen
- Gewährleistung
- Vertragsstrafen
- Kündigung

## 4. VERGABEVERMERK
[Dokumentation mit:]
- Art des Verfahrens
- Begründung der Verfahrenswahl
- Eignungskriterien
- Wertungskriterien
- Verfahrensablauf

## 5. BIETERFRAGEN (FAQ)
[20+ häufige Fragen mit Antworten zu:]
- Teilnahmebedingungen
- Technische Anforderungen
- Fristen
- Nachweise
- Submission

WICHTIG: 
- Nutze aktuelle Rechercheergebnisse
- Verwende Fachterminologie
- Stelle Rechtssicherheit sicher
- Generiere realistische, praxisnahe Inhalte
`;

// Database for storing documents
const db = new sqlite3.Database('./pb_data/data.db');

// Generate complete Vergabeunterlagen
app.post('/vergabe/generate-complete', async (req, res) => {
  const { projectId, userId, projectData } = req.body;
  
  console.log(`🏗️ Starting Vergabeunterlagen generation for project ${projectId}`);
  
  try {
    // Get user's API key
    const apiKey = await getUserApiKey(userId);
    if (!apiKey) {
      return res.status(400).json({ error: 'No API key available' });
    }
    
    // Build prompt with project data
    let prompt = VERGABE_PROMPT_TEMPLATE;
    for (const [key, value] of Object.entries(projectData)) {
      prompt = prompt.replace(`{${key}}`, value);
    }
    
    // Create response stream
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Send initial status
    res.write(`data: ${JSON.stringify({ 
      status: 'starting', 
      message: 'Initialisiere Dokumentengenerierung...' 
    })}\n\n`);
    
    // Run OpenCode with extended capabilities
    const env = {
      ...process.env,
      OPENAI_API_KEY: apiKey,
      HOME: `/tmp/vergabe-${projectId}`,
      OPENCODE_MAX_TOKENS: '16000', // Allow very long responses
      OPENCODE_TIMEOUT: '600000' // 10 minutes
    };
    
    const scriptCommand = `opencode run "${prompt.replace(/"/g, '\\"')}" --model openai/gpt-4`;
    const proc = spawn('script', ['-qc', scriptCommand, '/dev/null'], { env });
    
    let fullOutput = '';
    let documents = {
      leistungsbeschreibung: '',
      bewertungsmatrix: '',
      vertragsentwurf: '',
      vergabevermerk: '',
      faq: ''
    };
    let currentDoc = null;
    let contentStarted = false;
    
    // Process output
    const processLine = (line) => {
      const clean = line.replace(/\x1b\[[0-9;]*m/g, '');
      
      // Track web searches
      if (clean.includes('Searching') || clean.includes('🔍')) {
        res.write(`data: ${JSON.stringify({ 
          status: 'searching', 
          message: clean 
        })}\n\n`);
      }
      
      // Detect document sections
      if (clean.includes('## 1. LEISTUNGSBESCHREIBUNG')) {
        currentDoc = 'leistungsbeschreibung';
        res.write(`data: ${JSON.stringify({ 
          status: 'generating', 
          document: 'Leistungsbeschreibung' 
        })}\n\n`);
      } else if (clean.includes('## 2. BEWERTUNGSMATRIX')) {
        currentDoc = 'bewertungsmatrix';
        res.write(`data: ${JSON.stringify({ 
          status: 'generating', 
          document: 'Bewertungsmatrix' 
        })}\n\n`);
      } else if (clean.includes('## 3. VERTRAGSENTWURF')) {
        currentDoc = 'vertragsentwurf';
        res.write(`data: ${JSON.stringify({ 
          status: 'generating', 
          document: 'Vertragsentwurf' 
        })}\n\n`);
      } else if (clean.includes('## 4. VERGABEVERMERK')) {
        currentDoc = 'vergabevermerk';
        res.write(`data: ${JSON.stringify({ 
          status: 'generating', 
          document: 'Vergabevermerk' 
        })}\n\n`);
      } else if (clean.includes('## 5. BIETERFRAGEN')) {
        currentDoc = 'faq';
        res.write(`data: ${JSON.stringify({ 
          status: 'generating', 
          document: 'FAQ' 
        })}\n\n`);
      }
      
      // Capture content
      if (line.includes('|') && line.includes('Text')) {
        contentStarted = true;
        const match = clean.match(/Text\s+(.+)$/);
        if (match) {
          fullOutput += match[1] + '\n';
          if (currentDoc) {
            documents[currentDoc] += match[1] + '\n';
          }
        }
      } else if (contentStarted && !clean.includes('[✔')) {
        // Continue capturing
        if (currentDoc && clean.trim() && 
            !clean.includes('▄') && !clean.includes('█')) {
          documents[currentDoc] += clean + '\n';
          fullOutput += clean + '\n';
        }
      }
    };
    
    proc.stdout.on('data', chunk => {
      chunk.toString().split('\n').forEach(processLine);
    });
    
    proc.stderr.on('data', chunk => {
      chunk.toString().split('\n').forEach(processLine);
    });
    
    proc.on('close', async (code) => {
      console.log(`✅ OpenCode finished with code ${code}`);
      
      if (code === 0 && fullOutput.length > 1000) {
        // Save documents to database
        const savedDocs = [];
        
        for (const [docType, content] of Object.entries(documents)) {
          if (content.trim().length > 100) {
            const docId = `${projectId}_${docType}_${Date.now()}`;
            
            await new Promise((resolve, reject) => {
              db.run(
                `INSERT INTO documents (id, title, content, project_id, user_id, document_type, generated_by_ai, created, updated) 
                 VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
                [
                  docId,
                  getDocumentTitle(docType),
                  content.trim(),
                  projectId,
                  userId,
                  docType
                ],
                (err) => {
                  if (err) reject(err);
                  else {
                    savedDocs.push({ id: docId, type: docType, title: getDocumentTitle(docType) });
                    resolve();
                  }
                }
              );
            });
          }
        }
        
        // Send completion
        res.write(`data: ${JSON.stringify({ 
          status: 'complete',
          documents: savedDocs,
          totalLength: fullOutput.length
        })}\n\n`);
      } else {
        res.write(`data: ${JSON.stringify({ 
          status: 'error',
          message: 'Dokumentengenerierung fehlgeschlagen'
        })}\n\n`);
      }
      
      res.end();
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.write(`data: ${JSON.stringify({ 
      status: 'error',
      message: error.message
    })}\n\n`);
    res.end();
  }
});

// Helper functions
async function getUserApiKey(userId) {
  return new Promise((resolve) => {
    db.get(
      `SELECT api_key FROM apikeys WHERE user_id = ? AND active = 1 LIMIT 1`,
      [userId],
      (err, row) => resolve(row?.api_key)
    );
  });
}

function getDocumentTitle(docType) {
  const titles = {
    leistungsbeschreibung: 'Leistungsbeschreibung',
    bewertungsmatrix: 'Bewertungsmatrix',
    vertragsentwurf: 'Vertragsentwurf',
    vergabevermerk: 'Vergabevermerk',
    faq: 'Bieterfragen (FAQ)'
  };
  return titles[docType] || docType;
}

// Start server
const PORT = 3003;
app.listen(PORT, () => {
  console.log(`🚀 Vergabe Service running on port ${PORT}`);
  console.log(`📋 Endpoint: POST /vergabe/generate-complete`);
});