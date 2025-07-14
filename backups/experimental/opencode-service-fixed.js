const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3001;

// User-Lock System: Track running processes per user
const userProcesses = new Map();

// CORS für alle Origins erlauben
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// PocketBase DB für Updates
const db = new sqlite3.Database('./pb_data/data.db');

// Function to get user's API key from PocketBase with security check
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
            console.log(`🔑 Authorized access: Found API key for user ${userId}: ${row.api_key.substring(0, 8)}...`);
            resolve(row.api_key);
          } else {
            console.log(`⚠️ No API key found for user ${userId}`);
            resolve(null);
          }
        }
      );
    });
  } catch (error) {
    console.log(`❌ getUserApiKey security error:`, error.message);
    throw error;
  }
}

app.get('/opencode/stream', async (req, res) => {
  const { prompt, model, userId, userKey, recordId, projectId } = req.query;

  if (!prompt || !userId) {
    return res.status(400).json({ error: 'Prompt und userId erforderlich' });
  }

  // Check if user has running process
  if (userProcesses.has(userId)) {
    const runningProcess = userProcesses.get(userId);
    const runtime = Date.now() - runningProcess.startTime;
    console.log(`🚫 User ${userId}: Request blocked - already running (${Math.round(runtime/1000)}s)`);
    return res.status(429).json({ 
      error: 'Request already in progress',
      action: 'cancel_or_wait',
      startTime: runningProcess.startTime,
      runtime: runtime,
      recordId: runningProcess.recordId
    });
  }

  console.log(`🎯 OpenCode Request: User ${userId}, Prompt: "${prompt.substring(0, 50)}..."`);

  // Get API key
  let apiKey = userKey;
  
  if (!apiKey && userId !== 'anonymous') {
    try {
      console.log(`🔍 Fetching API key for user ${userId}...`);
      apiKey = await getUserApiKey(userId, userId);
      console.log(`🔑 API key result: ${apiKey ? 'found' : 'not found'}`);
    } catch (error) {
      console.log(`❌ Error fetching user API key:`, error.message);
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({ 
          error: 'Forbidden: Unauthorized access to API key' 
        });
      }
    }
  }
  
  if (!apiKey) {
    apiKey = process.env.OPENAI_API_KEY;
    console.log(`🔄 Fallback to env API key: ${apiKey ? 'found' : 'not found'}`);
  }

  // Setup
  const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), `oc-${userId}-`));
  const env = {
    ...process.env,
    HOME: tmpHome,
    OPENAI_API_KEY: apiKey,
  };

  // Check for API key
  if (!env.OPENAI_API_KEY || env.OPENAI_API_KEY === 'REPLACE_WITH_YOUR_OPENAI_API_KEY' || env.OPENAI_API_KEY === 'your-openai-api-key-here' || env.OPENAI_API_KEY === 'DOCKER_PLACEHOLDER_KEY') {
    console.log(`❌ User ${userId}: No valid API key available (key: ${env.OPENAI_API_KEY || 'none'})`);
    return res.status(400).json({ 
      error: 'OpenAI API key required. Please add your API key in the dashboard or set OPENAI_API_KEY environment variable.' 
    });
  }

  // Smart prompt enhancement
  let finalPrompt = prompt;
  
  const isDocumentRequest = prompt.toLowerCase().includes('ausschreibung') || 
                          prompt.toLowerCase().includes('leistungsbeschreibung') ||
                          prompt.toLowerCase().includes('dokument') ||
                          prompt.toLowerCase().includes('beschreibung') ||
                          prompt.length > 50;
  
  if (isDocumentRequest) {
    finalPrompt = prompt + `

ABSOLUTE REQUIREMENTS - NO EXCEPTIONS:
1. START IMMEDIATELY with document content - NO introductory text, NO questions, NO clarifications
2. Generate COMPLETE document in German Markdown format
3. NEVER ask questions or request more information
4. NEVER offer additional help
5. BEGIN directly with "# [Document Title]" and continue with full content
6. WRITE THE COMPLETE DOCUMENT NOW`;
  } else {
    finalPrompt = prompt + `

Antworten Sie direkt und kurz auf Deutsch. Keine Rückfragen.`;
  }

  // OpenCode command
  const modelName = model || 'openai/gpt-4o-mini'; // Fixed model name
  const scriptCommand = `opencode run "${finalPrompt.replace(/"/g, '\\"')}" --model ${modelName}`;
  const args = ['-qc', scriptCommand, '/dev/null'];
  
  console.log(`🚀 Starting OpenCode with TTY: script ${args[0]} "${args[1].substring(0, 100)}..." ${args[2]}`);
  console.log(`🔑 API Key: ${env.OPENAI_API_KEY ? 'SET' : 'MISSING'}`);
  
  const proc = spawn('script', args, { 
    env,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Register user process
  userProcesses.set(userId, {
    proc: proc,
    res: res,
    startTime: Date.now(),
    recordId: recordId || 'unknown'
  });
  console.log(`🔒 User ${userId}: Process locked (PID: ${proc.pid})`);

  // Streaming Response Setup
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // FIXED: Initialize content capture variables
  let fullOutput = '';
  let isCapturingContent = false;
  let contentStarted = false;
  
  // FIXED: Unified data processing function
  const processData = (chunk, source) => {
    const txt = chunk.toString();
    // Handle all line endings (Windows \r\n, Unix \n, Mac \r)
    const lines = txt.split(/\r?\n|\r/);
    
    for (const line of lines) {
      // Skip empty lines
      if (!line.trim()) continue;
      
      // Debug logging
      if (userId === 'hmfwzq8txbc9d2w') {
        console.log(`🔍 ${source} Line: ${JSON.stringify(line)}`);
      }
      
      // Check for content start marker
      if (line.includes('|') && line.includes('Text')) {
        isCapturingContent = true;
        contentStarted = true;
        
        // Extract content after "Text"
        const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '');
        // Try multiple patterns to be more flexible
        const patterns = [
          /Text\s+(.+)$/,
          /\|\s*Text\s+(.+)$/,
          /Text\s*:\s*(.+)$/,
          /\|\s+\w+\s+(.+)$/
        ];
        
        let extracted = false;
        for (const pattern of patterns) {
          const match = cleanLine.match(pattern);
          if (match && match[1]) {
            const content = match[1].trim();
            if (content) {
              fullOutput += content + '\n';
              res.write(content + '\n');
              console.log(`📤 User ${userId} Output:`, content.substring(0, 100));
              extracted = true;
              break;
            }
          }
        }
        
        if (!extracted) {
          console.log(`⚠️ Could not extract content from Text line:`, cleanLine);
        }
        continue;
      }
      
      // Check if this line starts content directly (for document mode)
      const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '');
      
      // For document generation, content may start with # (markdown header)
      if (!contentStarted && cleanLine.trim().startsWith('#') && cleanLine.includes('Leistungsbeschreibung')) {
        contentStarted = true;
        isCapturingContent = true;
        fullOutput += cleanLine + '\n';
        res.write(cleanLine + '\n');
        console.log(`📤 User ${userId} Document start:`, cleanLine.substring(0, 100));
        continue;
      }
      
      // Remove ANSI codes for analysis
      const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '');
      
      // Check for end markers
      if (cleanLine.includes('[✔') || cleanLine.includes('Fertig!') || 
          (cleanLine.includes('[') && cleanLine.includes(']') && cleanLine.includes('User'))) {
        isCapturingContent = false;
        console.log(`🏁 End marker found, stopping capture`);
        break;
      }
      
      // Skip if not capturing or content hasn't started
      if (!contentStarted || !isCapturingContent) {
        continue;
      }
      
      // Skip UI elements
      if (cleanLine.includes('▄') || cleanLine.includes('█') || 
          cleanLine.includes('░') || cleanLine.startsWith('>') || 
          cleanLine.startsWith('@') || cleanLine.startsWith('|')) {
        continue;
      }
      
      // Capture content lines
      const trimmedLine = cleanLine.trim();
      if (trimmedLine) {
        // Check for errors
        if (trimmedLine.toLowerCase().includes('error:')) {
          fullOutput += '[ERR] ' + trimmedLine + '\n';
          res.write('[ERR] ' + trimmedLine + '\n');
          console.log(`❌ User ${userId} Error:`, trimmedLine);
        } else {
          fullOutput += trimmedLine + '\n';
          res.write(trimmedLine + '\n');
          console.log(`📤 User ${userId} Content:`, trimmedLine.substring(0, 100));
        }
      }
    }
  };
  
  // Process both stdout and stderr
  proc.stdout.on('data', chunk => processData(chunk, 'STDOUT'));
  proc.stderr.on('data', chunk => processData(chunk, 'STDERR'));

  proc.on('close', (code) => {
    console.log(`✅ User ${userId} finished with code ${code}`);
    console.log(`📊 Captured content length: ${fullOutput.length} chars`);
    
    // Remove user lock
    userProcesses.delete(userId);
    console.log(`🔓 User ${userId}: Process unlocked`);
    
    // Cleanup
    try {
      fs.rmSync(tmpHome, { recursive: true, force: true });
    } catch (e) {
      console.log(`⚠️ Could not clean temp dir: ${e.message}`);
    }

    // Content validation
    const isValidDocument = (content) => {
      if (!content || content.length < 10) {
        console.log('❌ Content too short:', content.length);
        return false;
      }
      
      const lowerContent = content.toLowerCase();
      
      // Check for invalid phrases
      const invalidPhrases = [
        'welche spezifischen aspekte',
        'welche informationen benötigen sie',
        'können sie weitere details',
        'möchten sie',
        'ich benötige weitere informationen',
        'gerne helfe ich',
        'what specific aspects',
        'could you provide',
        'i need more information'
      ];
      
      if (invalidPhrases.some(phrase => lowerContent.includes(phrase))) {
        console.log('❌ Content contains questioning phrases');
        return false;
      }
      
      // For document requests, check structure
      if (isDocumentRequest && content.length < 500) {
        console.log('❌ Document too short for document request');
        return false;
      }
      
      return true;
    };

    // Clean output
    const cleanedOutput = fullOutput.replace(/\n{3,}/g, '\n\n').trim();
    
    // Save to database if valid
    if (code === 0 && cleanedOutput && !cleanedOutput.includes('[ERR]') && isValidDocument(cleanedOutput)) {
      console.log(`💾 Saving document with ${cleanedOutput.length} chars...`);
      
      const saveDocument = () => {
        if (recordId && projectId) {
          // Save as project document
          const docTitle = `AI-Generiert: ${new Date().toLocaleDateString('de-DE')}`;
          
          db.run(
            `INSERT INTO documents (title, content, project_id, user_id, document_type, generated_by_ai, created, updated) 
             VALUES (?, ?, ?, ?, 'leistungsbeschreibung', 1, datetime('now'), datetime('now'))`,
            [docTitle, cleanedOutput, projectId, userId],
            (err) => {
              if (err) {
                console.log('❌ DB Document Insert Error:', err);
              } else {
                console.log(`✅ Saved document for project ${projectId}`);
              }
            }
          );
        } else if (recordId) {
          // Save as standalone document
          db.run(
            `INSERT INTO documents (id, title, content, request_id, type, created_by, created, updated) 
             VALUES (?, ?, ?, ?, 'leistung', ?, datetime('now'), datetime('now'))`,
            [recordId, `AI-Generiert: ${new Date().toLocaleDateString('de-DE')}`, cleanedOutput, recordId, userId],
            (err) => {
              if (err) {
                console.log('❌ DB Document Insert Error:', err);
              } else {
                console.log(`✅ Saved document ${recordId}`);
              }
            }
          );
        } else {
          console.log('⚠️ No recordId provided, not saving to DB');
        }
      };
      
      saveDocument();
    } else {
      console.log(`❌ User ${userId}: Not saving document`);
      console.log(`  - Exit code: ${code}`);
      console.log(`  - Has content: ${!!cleanedOutput} (${cleanedOutput.length} chars)`);
      console.log(`  - Has error: ${cleanedOutput.includes('[ERR]')}`);
      console.log(`  - Is valid: ${cleanedOutput ? isValidDocument(cleanedOutput) : false}`);
      
      if (cleanedOutput) {
        console.log(`  - Preview: "${cleanedOutput.substring(0, 200)}..."`);
      }
    }

    res.end();
  });

  proc.on('error', (error) => {
    console.log(`💥 User ${userId} Process Error:`, error.message);
    userProcesses.delete(userId);
    console.log(`🔓 User ${userId}: Process unlocked (error)`);
    res.write(`\n[ERROR] ${error.message}`);
    res.end();
  });
});

// Cancel endpoint
app.post('/opencode/cancel', (req, res) => {
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }
  
  if (!userProcesses.has(userId)) {
    return res.status(404).json({ error: 'No running process found for user' });
  }
  
  const userProcess = userProcesses.get(userId);
  const runtime = Date.now() - userProcess.startTime;
  
  console.log(`🛑 User ${userId}: Canceling process (PID: ${userProcess.proc.pid}, runtime: ${Math.round(runtime/1000)}s)`);
  
  try {
    userProcess.proc.kill('SIGTERM');
    
    if (userProcess.res && !userProcess.res.headersSent) {
      userProcess.res.write('\n[CANCELLED] Process terminated by user');
      userProcess.res.end();
    }
    
    userProcesses.delete(userId);
    console.log(`🔓 User ${userId}: Process cancelled and unlocked`);
    
    res.json({ 
      message: 'Process cancelled successfully',
      runtime: runtime,
      recordId: userProcess.recordId
    });
  } catch (error) {
    console.log(`❌ Error cancelling process for user ${userId}:`, error.message);
    res.status(500).json({ error: 'Failed to cancel process' });
  }
});

// Status endpoint
app.get('/opencode/status', (req, res) => {
  const { userId } = req.query;
  
  if (userId && userProcesses.has(userId)) {
    const process = userProcesses.get(userId);
    const runtime = Date.now() - process.startTime;
    res.json({
      running: true,
      startTime: process.startTime,
      runtime: runtime,
      recordId: process.recordId,
      pid: process.proc.pid
    });
  } else if (userId) {
    res.json({ running: false });
  } else {
    const processes = {};
    userProcesses.forEach((process, userId) => {
      processes[userId] = {
        startTime: process.startTime,
        runtime: Date.now() - process.startTime,
        recordId: process.recordId,
        pid: process.proc.pid
      };
    });
    res.json({ 
      totalRunning: userProcesses.size,
      processes: processes
    });
  }
});

// API Key Save Endpoint
app.post('/save-key', async (req, res) => {
  const { userId, apiKey } = req.query;
  
  if (!userId || !apiKey) {
    return res.status(400).json({ error: 'userId and apiKey are required' });
  }
  
  console.log(`🔑 Saving API key for user ${userId}`);
  
  try {
    const existing = await new Promise((resolve, reject) => {
      db.get(`SELECT id FROM apikeys WHERE user_id = ? LIMIT 1`, [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (existing) {
      await new Promise((resolve, reject) => {
        db.run(`UPDATE apikeys SET api_key = ?, updated = datetime('now') WHERE user_id = ?`, [apiKey, userId], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      console.log(`✅ Updated API key for user ${userId}`);
    } else {
      await new Promise((resolve, reject) => {
        db.run(`INSERT INTO apikeys (user_id, provider, api_key, name, active, created, updated) VALUES (?, 'openai', ?, 'Auto-saved', 1, datetime('now'), datetime('now'))`, [userId, apiKey], (err) => {
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
  const { userId, authenticatedUserId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  console.log(`🔍 Loading API key for user ${userId}`);
  
  try {
    const apiKey = await getUserApiKey(userId, authenticatedUserId || userId);
    
    if (apiKey) {
      console.log(`✅ Authorized: Found API key for user ${userId}`);
      res.json({ key: apiKey, userId: userId });
    } else {
      console.log(`⚠️ No API key found for user ${userId}`);
      res.json({ key: null, userId: userId });
    }
  } catch (error) {
    console.log(`❌ Error loading API key:`, error.message);
    
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ error: 'Forbidden: Unauthorized access to API key' });
    }
    
    res.status(500).json({ error: 'Failed to load API key' });
  }
});

// Health Check
app.get('/health', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.json({ status: 'OpenCode Service läuft', port: PORT });
});

// OPTIONS for CORS
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

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Error handlers
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const server = app.listen(PORT, () => {
  console.log(`🚀 OpenCode Service läuft auf Port ${PORT}`);
  console.log(`🔗 Endpoint: http://127.0.0.1:${PORT}/opencode/stream`);
  console.log(`❤️  Health: http://127.0.0.1:${PORT}/health`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} ist bereits belegt. Stoppe andere Prozesse und versuche erneut.`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
    process.exit(1);
  }
});