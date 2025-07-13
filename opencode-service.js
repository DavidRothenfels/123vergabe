const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3001;

// User-Lock System
const userProcesses = new Map();

// CORS with explicit settings
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type']
}));

app.use(express.json());

// Database
const db = new sqlite3.Database('./pb_data/data.db');

// Get user's API key
async function getUserApiKey(userId, authenticatedUserId = null) {
  try {
    if (authenticatedUserId && userId !== authenticatedUserId) {
      console.log(`🚨 Security violation: User ${authenticatedUserId} tried to access API key for user ${userId}`);
      throw new Error('Unauthorized: Cannot access API key for different user');
    }
    
    if (!userId || userId === 'anonymous') {
      console.log(`⚠️ Invalid userId: ${userId}`);
      return null;
    }
    
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT api_key FROM apikeys WHERE user_id = ? AND active = 1 ORDER BY updated DESC LIMIT 1`,
        [userId],
        (err, row) => {
          if (err) {
            console.log(`❌ DB Error getting API key for user ${userId}:`, err);
            reject(err);
          } else if (row && row.api_key) {
            console.log(`🔑 Found API key for user ${userId}: ${row.api_key.substring(0, 8)}...`);
            resolve(row.api_key);
          } else {
            console.log(`⚠️ No API key found for user ${userId}`);
            resolve(null);
          }
        }
      );
    });
  } catch (error) {
    console.log(`❌ getUserApiKey error:`, error.message);
    throw error;
  }
}

// Main endpoint
app.get('/opencode/stream', async (req, res) => {
  const { prompt, model, userId, userKey, recordId, projectId } = req.query;

  if (!prompt || !userId) {
    return res.status(400).json({ error: 'Prompt und userId erforderlich' });
  }

  // Check user lock
  if (userProcesses.has(userId)) {
    const runningProcess = userProcesses.get(userId);
    const runtime = Date.now() - runningProcess.startTime;
    console.log(`🚫 User ${userId}: Request blocked - already running (${Math.round(runtime/1000)}s)`);
    return res.status(429).json({ 
      error: 'Request already in progress',
      runtime: runtime,
      recordId: runningProcess.recordId
    });
  }

  console.log(`🎯 OpenCode Request: User ${userId}, Prompt: "${prompt.substring(0, 50)}..."`);

  // Get API key
  let apiKey = userKey;
  
  if (!apiKey && userId !== 'anonymous') {
    try {
      apiKey = await getUserApiKey(userId, userId);
    } catch (error) {
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }
  }
  
  if (!apiKey) {
    apiKey = process.env.OPENAI_API_KEY;
  }

  if (!apiKey) {
    return res.status(400).json({ 
      error: 'OpenAI API key required' 
    });
  }

  // Setup environment
  const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), `oc-${userId}-`));
  const env = {
    ...process.env,
    HOME: tmpHome,
    OPENAI_API_KEY: apiKey,
  };

  // Enhance prompt
  const isDocumentRequest = prompt.toLowerCase().includes('leistungsbeschreibung') || 
                          prompt.toLowerCase().includes('dokument') ||
                          prompt.length > 50;
  
  let finalPrompt = prompt;
  if (isDocumentRequest) {
    finalPrompt += `\n\nERSTELLE DAS DOKUMENT DIREKT. Keine Einleitung, keine Fragen. Beginne mit dem Inhalt.`;
  } else {
    finalPrompt += `\n\nAntworte direkt auf Deutsch.`;
  }

  // Start OpenCode
  const modelName = model || 'openai/gpt-4o-mini';
  const scriptCommand = `/usr/local/bin/opencode run "${finalPrompt.replace(/"/g, '\\"')}" --model ${modelName}`;
  const args = ['-qc', scriptCommand, '/dev/null'];
  
  console.log(`🚀 Starting OpenCode...`);
  console.log(`📋 Command: script ${args.join(' ')}`);
  
  const proc = spawn('script', args, { 
    env: {
      ...env,
      PATH: '/usr/local/bin:/usr/bin:/bin'
    },
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Register process
  userProcesses.set(userId, {
    proc: proc,
    res: res,
    startTime: Date.now(),
    recordId: recordId || 'unknown'
  });

  // Setup streaming
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('Access-Control-Allow-Origin', '*');

  let fullOutput = '';
  let captureMode = 'waiting'; // waiting, text-marker, direct-content, finished
  
  const processLine = (line, source) => {
    // Remove ANSI codes for analysis
    const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '').trim();
    
    if (!cleanLine) return;
    
    // Debug log
    console.log(`📝 ${source}: ${cleanLine.substring(0, 100)}`);
    
    // Check for different content patterns
    if (captureMode === 'waiting') {
      // Pattern 1: Text marker (for simple responses)
      if (line.includes('|') && line.includes('Text')) {
        captureMode = 'text-marker';
        const match = cleanLine.match(/Text\s+(.+)$/);
        if (match && match[1]) {
          const content = match[1].trim();
          fullOutput += content + '\n';
          res.write(content + '\n');
          console.log(`✅ Captured via Text marker: ${content.substring(0, 50)}`);
        }
        return;
      }
      
      // Pattern 2: Direct markdown (for documents)
      if (cleanLine.startsWith('#') || cleanLine.startsWith('##')) {
        captureMode = 'direct-content';
        fullOutput += cleanLine + '\n';
        res.write(cleanLine + '\n');
        console.log(`✅ Captured markdown header: ${cleanLine.substring(0, 50)}`);
        return;
      }
      
      // Pattern 3: Could be part of prompt echo, skip common UI elements
      if (cleanLine.includes('▄') || cleanLine.includes('█') || 
          cleanLine.startsWith('>') || cleanLine.startsWith('@') ||
          cleanLine.includes('ABSOLUTE REQUIREMENTS')) {
        return;
      }
    }
    
    // In capture mode
    if (captureMode === 'text-marker' || captureMode === 'direct-content') {
      // Check for end markers
      if (cleanLine.includes('[✔') || cleanLine.includes('Fertig!') || 
          cleanLine.includes('User') && cleanLine.includes('-')) {
        captureMode = 'finished';
        console.log(`🏁 End marker found`);
        return;
      }
      
      // Skip UI elements
      if (cleanLine.includes('▄') || cleanLine.includes('█') || 
          cleanLine.includes('░') || cleanLine.startsWith('|')) {
        return;
      }
      
      // Capture content
      if (cleanLine) {
        fullOutput += cleanLine + '\n';
        res.write(cleanLine + '\n');
        console.log(`✅ Captured content: ${cleanLine.substring(0, 50)}`);
      }
    }
  };
  
  // Process streams
  proc.stdout.on('data', chunk => {
    const lines = chunk.toString().split(/\r?\n|\r/);
    lines.forEach(line => processLine(line, 'STDOUT'));
  });
  
  proc.stderr.on('data', chunk => {
    const lines = chunk.toString().split(/\r?\n|\r/);
    lines.forEach(line => processLine(line, 'STDERR'));
  });

  // Handle process end
  proc.on('close', (code) => {
    console.log(`🏁 Process finished with code ${code}`);
    console.log(`📊 Total captured: ${fullOutput.length} chars`);
    
    // Cleanup
    userProcesses.delete(userId);
    try {
      fs.rmSync(tmpHome, { recursive: true, force: true });
    } catch (e) {}

    // Don't save to database - let frontend handle it
    const cleanedOutput = fullOutput.trim();
    
    if (code === 0 && cleanedOutput.length > 20) {
      console.log(`✅ Generation completed successfully (${cleanedOutput.length} chars)`);
    } else {
      console.log(`⚠️ Generation issue: code=${code}, length=${cleanedOutput.length}`);
    }

    res.end();
  });

  proc.on('error', (error) => {
    console.log(`💥 Process Error:`, error.message);
    userProcesses.delete(userId);
    res.write(`\n[ERROR] ${error.message}`);
    res.end();
  });
});

// Other endpoints
app.post('/opencode/cancel', (req, res) => {
  const { userId } = req.query;
  
  if (!userId || !userProcesses.has(userId)) {
    return res.status(404).json({ error: 'No running process' });
  }
  
  const userProcess = userProcesses.get(userId);
  try {
    userProcess.proc.kill('SIGTERM');
    userProcesses.delete(userId);
    res.json({ message: 'Cancelled' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', port: PORT });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 OpenCode Service on port ${PORT}`);
  console.log(`🔗 http://localhost:${PORT}/opencode/stream`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('Shutting down...');
  server.close(() => process.exit(0));
});