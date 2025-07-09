const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3001;

// CORS für alle Origins erlauben
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// PocketBase DB für Updates
const db = new sqlite3.Database('./pb_data/data.db');

app.get('/opencode/stream', async (req, res) => {
  const { prompt, model, userId, userKey, recordId } = req.query;

  if (!prompt || !userId) {
    return res.status(400).json({ error: 'Prompt und userId erforderlich' });
  }

  console.log(`🎯 OpenCode Request: User ${userId}, Prompt: "${prompt.substring(0, 50)}..."`);

  // Setup: isoliertes Verzeichnis pro User
  const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), `oc-${userId}-`));
  const env = {
    ...process.env,
    HOME: tmpHome,
    OPENAI_API_KEY: userKey || process.env.OPENAI_API_KEY || 'REPLACE_WITH_YOUR_OPENAI_API_KEY',
  };

  // Demo-Modus nur wenn kein Key verfügbar
  if (false) { // Deaktiviert da wir jetzt einen echten Key haben
    console.log(`🎮 DEMO MODE: User ${userId}, Prompt: "${prompt}"`);
    
    res.write(`🎮 DEMO MODE - OpenCode Multiuser\n`);
    res.write(`👤 User: ${userId}\n`);
    res.write(`💬 Prompt: "${prompt}"\n`);
    res.write(`🤖 Model: ${model || 'openai/gpt-4o-mini'}\n\n`);
    res.write(`📝 Simulierte Antwort:\n`);
    res.write(`Das ist eine Demo-Antwort für den Prompt "${prompt}".\n`);
    res.write(`\nIn der echten Version würde hier OpenCode mit einem`);
    res.write(` echten OpenAI API-Key antworten.\n\n`);
    res.write(`✅ Demo completed!\n`);
    
    // DB Update simulieren
    if (recordId) {
      const demoResult = `Demo: "${prompt}" -> Simulierte Antwort`;
      db.run(
        `UPDATE prompts SET result = ? WHERE id = ?`,
        [demoResult, recordId],
        (err) => {
          if (err) console.log('DB Update Error:', err);
          else console.log(`💾 Demo result saved for record ${recordId}`);
        }
      );
    }
    
    res.end(`\n[✔ Demo Mode - User ${userId} fertig!]`);
    return;
  }

  // OpenCode args für headless mode
  const args = ['run', prompt];
  if (model) args.push('--model', model);
  
  // Headless mode aktivieren
  args.push('--headless');
  
  console.log(`🚀 Starting OpenCode: opencode ${args.join(' ')}`);
  console.log(`🔑 API Key: ${env.OPENAI_API_KEY ? 'SET' : 'MISSING'}`);
  
  const proc = spawn('opencode', args, { 
    env,
    stdio: ['pipe', 'pipe', 'pipe'] // Explicit stdio setup
  });

  // Streaming Response Setup
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('Access-Control-Allow-Origin', '*');

  let fullOutput = '';

  proc.stdout.on('data', chunk => {
    const txt = chunk.toString();
    fullOutput += txt;
    res.write(txt);
    console.log(`📤 User ${userId}:`, txt.substring(0, 100));
  });

  proc.stderr.on('data', chunk => {
    const txt = chunk.toString();
    // In headless mode, stderr sollte weniger verbose sein
    if (!txt.includes('█▀▀█') && !txt.includes('█░░█') && !txt.includes('▀▀▀▀')) {
      fullOutput += '\n[ERR] ' + txt;
      res.write('[ERR] ' + txt);
      console.log(`❌ User ${userId} Error:`, txt);
    }
  });

  proc.on('close', (code) => {
    console.log(`✅ User ${userId} finished with code ${code}`);
    
    // Cleanup
    fs.rmSync(tmpHome, { recursive: true, force: true });

    // Ergebnis in PocketBase DB speichern
    if (recordId) {
      db.run(
        `UPDATE prompts SET result = ? WHERE id = ?`,
        [fullOutput.trim(), recordId],
        (err) => {
          if (err) console.log('DB Update Error:', err);
          else console.log(`💾 Saved result for record ${recordId}`);
        }
      );
    }

    res.end(`\n\n[✔ User ${userId} - Fertig!]`);
  });

  proc.on('error', (error) => {
    console.log(`💥 User ${userId} Process Error:`, error.message);
    res.write(`\n[ERROR] ${error.message}`);
    res.end();
  });
});

// Health Check mit CORS Headers
app.get('/health', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.json({ status: 'OpenCode Service läuft', port: PORT });
});

// OPTIONS für Preflight - spezifische Routes
app.options('/health', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

app.options('/opencode/stream', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`🚀 OpenCode Service läuft auf Port ${PORT}`);
  console.log(`🔗 Endpoint: http://127.0.0.1:${PORT}/opencode/stream`);
  console.log(`❤️  Health: http://127.0.0.1:${PORT}/health`);
});