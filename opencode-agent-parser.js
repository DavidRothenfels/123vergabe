// Improved parser for OpenCode agent output
// Handles multi-step agent responses, web research results, and file generation

function parseOpenCodeAgentOutput(rawOutput) {
  const lines = rawOutput.split(/\r?\n/);
  let output = {
    content: '',
    webSearches: [],
    filesCreated: [],
    agentSteps: []
  };
  
  let isCapturingContent = false;
  let currentSection = null;
  
  for (const line of lines) {
    const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '');
    
    // Detect different output sections
    if (cleanLine.includes('🔍 Searching:') || cleanLine.includes('Searching the web')) {
      output.webSearches.push(cleanLine);
      currentSection = 'search';
    } else if (cleanLine.includes('📄 Created:') || cleanLine.includes('File created:')) {
      output.filesCreated.push(cleanLine);
      currentSection = 'file';
    } else if (cleanLine.includes('Step') && cleanLine.includes(':')) {
      output.agentSteps.push(cleanLine);
      currentSection = 'step';
    } else if (line.includes('|') && line.includes('Text')) {
      // Main content starts
      isCapturingContent = true;
      currentSection = 'content';
      
      const contentMatch = cleanLine.match(/Text\s+(.+)$/);
      if (contentMatch && contentMatch[1]) {
        output.content += contentMatch[1].trim() + '\n';
      }
    } else if (cleanLine.includes('[✔') || cleanLine.includes('Fertig!')) {
      // End of output
      break;
    } else if (isCapturingContent && currentSection === 'content') {
      // Continue capturing content
      if (!cleanLine.includes('▄') && !cleanLine.includes('█') && 
          !cleanLine.startsWith('>') && !cleanLine.startsWith('@')) {
        const trimmed = cleanLine.trim();
        if (trimmed) {
          output.content += trimmed + '\n';
        } else if (cleanLine === '') {
          output.content += '\n';
        }
      }
    }
  }
  
  return output;
}

// Enhanced prompt for batch document generation
function createBatchDocumentPrompt(project) {
  return `
Du bist ein Experte für öffentliche Vergabe und Ausschreibungen.

PROJEKT: ${project.title}
BESCHREIBUNG: ${project.description}

AUFGABE: Erstelle komplette Vergabeunterlagen mit folgenden Dokumenten:

1. **Leistungsbeschreibung** (leistungsbeschreibung.md)
   - Detaillierte Beschreibung aller Leistungen
   - Technische Anforderungen
   - Qualitätsstandards
   - Zeitrahmen und Meilensteine

2. **Bewertungsmatrix** (bewertungsmatrix.md)
   - Zuschlagskriterien mit Gewichtung
   - Bewertungsmethodik
   - Mindestanforderungen

3. **Vertragsentwurf** (vertragsentwurf.md)
   - Vertragsgegenstand
   - Leistungspflichten
   - Vergütung und Zahlungsbedingungen
   - Gewährleistung

4. **Vergabevermerk** (vergabevermerk.md)
   - Dokumentation des Vergabeverfahrens
   - Begründung der Vergabeentscheidung

5. **Bieterfragen-Katalog** (faq.md)
   - Häufige Fragen mit Antworten
   - Klarstellungen

WICHTIG:
- Recherchiere aktuelle rechtliche Anforderungen (VOB/VOL)
- Nutze realistische Marktpreise
- Erstelle vollständige, rechtssichere Dokumente
- Verwende durchgängig professionelle Fachsprache

Beginne mit der Erstellung aller Dokumente.
`;
}

// Service endpoint for batch generation
async function generateBatchDocuments(req, res) {
  const { projectId, userId } = req.body;
  
  // Get project details
  const project = await getProjectFromDB(projectId);
  
  // Create enhanced prompt
  const prompt = createBatchDocumentPrompt(project);
  
  // Run OpenCode with extended timeout
  const scriptCommand = `opencode run "${prompt.replace(/"/g, '\\"')}" --model openai/gpt-4o-mini`;
  const args = ['-qc', scriptCommand, '/dev/null'];
  
  const proc = spawn('script', args, {
    env: {
      ...process.env,
      OPENAI_API_KEY: apiKey,
      OPENCODE_MAX_TOKENS: '8000' // Allow longer responses
    },
    timeout: 300000 // 5 minutes for complex generation
  });
  
  let rawOutput = '';
  
  proc.stdout.on('data', chunk => rawOutput += chunk.toString());
  proc.stderr.on('data', chunk => rawOutput += chunk.toString());
  
  proc.on('close', async (code) => {
    if (code === 0) {
      const parsed = parseOpenCodeAgentOutput(rawOutput);
      
      // Save main content
      if (parsed.content) {
        await saveDocument(projectId, 'main', parsed.content);
      }
      
      // Log agent activity
      console.log('Web searches:', parsed.webSearches.length);
      console.log('Files created:', parsed.filesCreated.length);
      console.log('Agent steps:', parsed.agentSteps.length);
      
      res.json({
        success: true,
        documents: parsed.filesCreated,
        searches: parsed.webSearches.length,
        contentLength: parsed.content.length
      });
    }
  });
}

module.exports = {
  parseOpenCodeAgentOutput,
  createBatchDocumentPrompt,
  generateBatchDocuments
};