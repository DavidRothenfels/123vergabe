const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = 3002;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Output directory for OpenCode
const OUTPUT_DIR = path.join(__dirname, 'opencode-output');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Database connection
const db = new sqlite3.Database('./pb_data/data.db');

// Watch for new files in output directory
const watcher = chokidar.watch(OUTPUT_DIR, {
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 2000,
    pollInterval: 100
  }
});

// Process new files
watcher.on('add', async (filePath) => {
  console.log(`📄 New file detected: ${filePath}`);
  
  try {
    // Extract metadata from filename (format: userId_recordId_timestamp.md)
    const filename = path.basename(filePath);
    const match = filename.match(/^(.+?)_(.+?)_(\d+)\.md$/);
    
    if (!match) {
      console.log('⚠️ Invalid filename format:', filename);
      return;
    }
    
    const [, userId, recordId, timestamp] = match;
    
    // Read file content
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Save to database
    const docTitle = `AI-Generiert: ${new Date().toLocaleDateString('de-DE')}`;
    
    db.run(
      `INSERT INTO documents (id, title, content, request_id, type, created_by, created, updated) 
       VALUES (?, ?, ?, ?, 'leistung', ?, datetime('now'), datetime('now'))`,
      [recordId, docTitle, content, recordId, userId],
      (err) => {
        if (err) {
          console.log('❌ DB Insert Error:', err);
        } else {
          console.log(`✅ Imported document ${recordId} for user ${userId}`);
          
          // Delete processed file
          fs.unlinkSync(filePath);
          console.log(`🗑️ Deleted processed file: ${filename}`);
        }
      }
    );
  } catch (error) {
    console.error('❌ Error processing file:', error);
  }
});

// Endpoint to trigger OpenCode with file output
app.get('/opencode/generate', async (req, res) => {
  const { prompt, userId, recordId } = req.query;
  
  if (!prompt || !userId || !recordId) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  
  console.log(`🎯 OpenCode File Generation: User ${userId}, Record ${recordId}`);
  
  // Get user's API key
  const apiKey = await new Promise((resolve) => {
    db.get(
      `SELECT api_key FROM apikeys WHERE user_id = ? AND active = 1 LIMIT 1`,
      [userId],
      (err, row) => resolve(row?.api_key || process.env.OPENAI_API_KEY)
    );
  });
  
  if (!apiKey) {
    return res.status(400).json({ error: 'No API key available' });
  }
  
  // Create output filename
  const outputFile = path.join(OUTPUT_DIR, `${userId}_${recordId}_${Date.now()}.md`);
  
  // Build OpenCode command with file output
  const enhancedPrompt = `${prompt}

WICHTIG: Erstelle ein vollständiges deutsches Dokument im Markdown-Format.
Beginne direkt mit dem Inhalt, keine Einleitung oder Rückfragen.`;
  
  const openCodeCmd = `
Erstelle eine Datei '${outputFile}' mit folgendem Inhalt:

${enhancedPrompt}

Die Datei soll NUR das generierte Dokument enthalten, keine zusätzlichen Kommentare.
`;
  
  // Set up environment
  const env = {
    ...process.env,
    OPENAI_API_KEY: apiKey
  };
  
  // Run OpenCode
  const scriptCommand = `opencode run "${openCodeCmd.replace(/"/g, '\\"')}" --model openai/gpt-4o-mini`;
  const args = ['-qc', scriptCommand, '/dev/null'];
  
  console.log(`🚀 Starting OpenCode with file output: ${outputFile}`);
  
  const proc = spawn('script', args, { env });
  
  let output = '';
  
  proc.stdout.on('data', chunk => {
    output += chunk.toString();
  });
  
  proc.stderr.on('data', chunk => {
    output += chunk.toString();
  });
  
  proc.on('close', (code) => {
    if (code === 0) {
      console.log(`✅ OpenCode completed successfully`);
      
      // Check if file was created
      if (fs.existsSync(outputFile)) {
        res.json({ 
          success: true, 
          message: 'Document generation started. File will be imported automatically.',
          outputFile: path.basename(outputFile)
        });
      } else {
        // Fallback: try to extract content from output
        const contentMatch = output.match(/Text\s+(.+?)(?=\[✔|$)/s);
        if (contentMatch) {
          // Save content directly to file
          fs.writeFileSync(outputFile, contentMatch[1].trim());
          res.json({ 
            success: true, 
            message: 'Document extracted and saved for import.',
            outputFile: path.basename(outputFile)
          });
        } else {
          res.status(500).json({ 
            error: 'OpenCode did not create expected file',
            output: output.substring(0, 500)
          });
        }
      }
    } else {
      console.log(`❌ OpenCode failed with code ${code}`);
      res.status(500).json({ 
        error: 'OpenCode execution failed',
        code: code,
        output: output.substring(0, 500)
      });
    }
  });
  
  proc.on('error', (error) => {
    console.error('💥 Process error:', error);
    res.status(500).json({ error: error.message });
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OpenCode File Service running',
    outputDir: OUTPUT_DIR,
    watching: true
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 OpenCode File Service running on port ${PORT}`);
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);
  console.log(`👁️ Watching for new files...`);
});