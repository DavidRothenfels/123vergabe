// Fixed version of stdout/stderr processing for opencode-service.js
// This replaces lines 202-330 in opencode-service.js

  let fullOutput = '';
  let isCapturingContent = false;
  let contentStarted = false;
  
  // Helper function to process data chunks
  const processDataChunk = (chunk, source) => {
    const txt = chunk.toString();
    const lines = txt.split('\n');
    
    for (const line of lines) {
      // Debug log for troubleshooting
      if (line.includes('Text') && line.includes('|')) {
        console.log(`🔍 ${source} potential content line:`, JSON.stringify(line));
      }
      
      // First check raw line for the Text marker (before removing ANSI codes)
      if (line.includes('|') && line.includes('Text')) {
        isCapturingContent = true;
        contentStarted = true;
        
        // Remove ANSI codes and extract content after "Text"
        const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '');
        // More flexible pattern to catch various formats
        const patterns = [
          /Text\s+(.+)$/,           // "Text     content"
          /\|\s*Text\s+(.+)$/,      // "|  Text     content"
          /\|\s+\w+\s+(.+)$/        // "|  anything  content"
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
      
      // Remove ANSI codes for further processing
      const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '');
      
      // Stop capturing at end markers
      if (cleanLine.includes('[✔') || cleanLine.includes('Fertig!') || cleanLine.includes('User') && cleanLine.includes('-')) {
        isCapturingContent = false;
        break;
      }
      
      // Skip everything before content starts
      if (!contentStarted) {
        continue;
      }
      
      // Skip UI elements even after content started
      if (cleanLine.includes('▄') || cleanLine.includes('█') || 
          cleanLine.includes('░') || cleanLine.startsWith('>') || 
          cleanLine.startsWith('@') || cleanLine.startsWith('|')) {
        continue;
      }
      
      // Process content lines
      if (isCapturingContent) {
        const trimmedLine = cleanLine.trim();
        
        // Check for errors
        if (trimmedLine.toLowerCase().includes('error:')) {
          fullOutput += '[ERR] ' + trimmedLine + '\n';
          res.write('[ERR] ' + trimmedLine + '\n');
          console.log(`❌ User ${userId} Error:`, trimmedLine);
        } else {
          // Add content line (preserve formatting)
          if (trimmedLine) {
            fullOutput += trimmedLine + '\n';
            res.write(trimmedLine + '\n');
            console.log(`📤 User ${userId} Output:`, trimmedLine.substring(0, 100));
          } else if (cleanLine === '') {
            // Preserve empty lines for formatting
            fullOutput += '\n';
            res.write('\n');
          }
        }
      }
    }
  };
  
  // Process both stdout and stderr with same logic
  proc.stdout.on('data', chunk => processDataChunk(chunk, 'STDOUT'));
  proc.stderr.on('data', chunk => processDataChunk(chunk, 'STDERR'));