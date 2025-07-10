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

// Function to get user's API key from PocketBase
async function getUserApiKey(userId) {
  return new Promise((resolve, reject) => {
    // Query apikeys collection for user's key (get the latest one)
    db.get(
      `SELECT key FROM apikeys WHERE user = ? ORDER BY updated DESC LIMIT 1`,
      [userId],
      (err, row) => {
        if (err) {
          console.log(`❌ DB Error getting API key for user ${userId}:`, err);
          reject(err);
        } else if (row && row.key) {
          console.log(`🔑 Found API key for user ${userId}: ${row.key.substring(0, 8)}...`);
          resolve(row.key);
        } else {
          console.log(`⚠️ No API key found for user ${userId}`);
          resolve(null);
        }
      }
    );
  });
}

app.get('/opencode/stream', async (req, res) => {
  const { prompt, model, userId, userKey, recordId } = req.query;

  if (!prompt || !userId) {
    return res.status(400).json({ error: 'Prompt und userId erforderlich' });
  }

  console.log(`🎯 OpenCode Request: User ${userId}, Prompt: "${prompt.substring(0, 50)}..."`);

  // Get API key: userKey > PocketBase > Environment
  let apiKey = userKey;
  
  if (!apiKey && userId !== 'anonymous') {
    try {
      apiKey = await getUserApiKey(userId);
    } catch (error) {
      console.log(`❌ Error fetching user API key:`, error);
    }
  }
  
  if (!apiKey) {
    apiKey = process.env.OPENAI_API_KEY;
  }

  // Setup: isoliertes Verzeichnis pro User
  const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), `oc-${userId}-`));
  const env = {
    ...process.env,
    HOME: tmpHome,
    OPENAI_API_KEY: apiKey,
  };

  // Check for API key
  if (!env.OPENAI_API_KEY || env.OPENAI_API_KEY === 'REPLACE_WITH_YOUR_OPENAI_API_KEY' || env.OPENAI_API_KEY === 'your-openai-api-key-here') {
    console.log(`❌ User ${userId}: No valid API key available`);
    return res.status(400).json({ 
      error: 'OpenAI API key required. Please add your API key in the dashboard or set OPENAI_API_KEY environment variable.' 
    });
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

// API Key Save Endpoint
app.post('/save-key', async (req, res) => {
  const { userId, apiKey } = req.query;
  
  if (!userId || !apiKey) {
    return res.status(400).json({ error: 'userId and apiKey are required' });
  }
  
  console.log(`🔑 Saving API key for user ${userId}`);
  
  try {
    // Check if user already has an API key
    const existing = await new Promise((resolve, reject) => {
      db.get(`SELECT id FROM apikeys WHERE user = ? LIMIT 1`, [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (existing) {
      // Update existing
      await new Promise((resolve, reject) => {
        db.run(`UPDATE apikeys SET key = ?, updated = datetime('now') WHERE user = ?`, [apiKey, userId], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      console.log(`✅ Updated API key for user ${userId}`);
    } else {
      // Insert new
      await new Promise((resolve, reject) => {
        db.run(`INSERT INTO apikeys (user, key, created, updated) VALUES (?, ?, datetime('now'), datetime('now'))`, [userId, apiKey], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      console.log(`✅ Inserted new API key for user ${userId}`);
    }
    
    res.json({ message: 'API key saved successfully', userId: userId });
  } catch (error) {
    console.log(`❌ Error saving API key:`, error);
    res.status(500).json({ error: 'Failed to save API key' });
  }
});

// API Key Load Endpoint
app.get('/load-key', async (req, res) => {
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  console.log(`🔍 Loading API key for user ${userId}`);
  
  try {
    const apiKey = await getUserApiKey(userId);
    
    if (apiKey) {
      console.log(`✅ Found API key for user ${userId}`);
      res.json({ key: apiKey, userId: userId });
    } else {
      console.log(`⚠️ No API key found for user ${userId}`);
      res.json({ key: null, userId: userId });
    }
  } catch (error) {
    console.log(`❌ Error loading API key:`, error);
    res.status(500).json({ error: 'Failed to load API key' });
  }
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