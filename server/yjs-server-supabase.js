#!/usr/bin/env node

/**
 * Yjs WebSocket Server with Supabase Persistence
 * 
 * This server handles real-time collaboration and persists documents to Supabase.
 */

const WebSocket = require('ws');
const http = require('http');
const { setupWSConnection } = require('y-websocket/bin/utils');
const Y = require('yjs');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const port = process.env.YJS_PORT || 1234;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  // [REMOVED_CONSOLE]
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Store for active documents
const docs = new Map();

// Persistence functions
const persistence = {
  bindState: async (docName, ydoc) => {
    // [REMOVED_CONSOLE]
    
    try {
      // Extract noteId from docName (format: "notesflow-{noteId}")
      const noteId = docName.replace('notesflow-', '');
      
      // Load document from Supabase
      const { data, error } = await supabase
        .from('notes')
        .select('content')
        .eq('id', noteId)
        .single();
      
      if (error) {
        // [REMOVED_CONSOLE]
        return;
      }
      
      if (data && data.content) {
        // Apply the saved state to the Y.Doc
        const update = Buffer.from(data.content, 'base64');
        Y.applyUpdate(ydoc, update);
        // [REMOVED_CONSOLE]
      }
    } catch (err) {
      // [REMOVED_CONSOLE]
    }
  },
  
  writeState: async (docName, ydoc) => {
    // [REMOVED_CONSOLE]
    
    try {
      // Extract noteId from docName
      const noteId = docName.replace('notesflow-', '');
      
      // Encode the Y.Doc state
      const update = Y.encodeStateAsUpdate(ydoc);
      const content = Buffer.from(update).toString('base64');
      
      // Save to Supabase
      const { error } = await supabase
        .from('notes')
        .update({ 
          content,
          updated_at: new Date().toISOString()
        })
        .eq('id', noteId);
      
      if (error) {
        // [REMOVED_CONSOLE]
      } else {
        // [REMOVED_CONSOLE]
      }
    } catch (err) {
      // [REMOVED_CONSOLE]
    }
  }
};

// Create HTTP server
const server = http.createServer((request, response) => {
  // Enable CORS for health checks
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (request.method === 'OPTIONS') {
    response.writeHead(200);
    response.end();
    return;
  }
  
  response.writeHead(200, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify({
    status: 'ok',
    server: 'yjs-websocket',
    connections: wss.clients.size
  }));
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Handle WebSocket connections
wss.on('connection', (ws, request) => {
  // [REMOVED_CONSOLE]
  
  // Setup Yjs connection with persistence
  setupWSConnection(ws, request, {
    gc: true,
    persistence
  });
  
  ws.on('close', () => {
    // [REMOVED_CONSOLE]
  });
  
  ws.on('error', (err) => {
    // [REMOVED_CONSOLE]
  });
});

// Periodic save (every 30 seconds)
setInterval(() => {
  docs.forEach((ydoc, docName) => {
    persistence.writeState(docName, ydoc);
  });
}, 30000);

// Start server
server.listen(port, () => {
  // [REMOVED_CONSOLE]
  // [REMOVED_CONSOLE]
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  // [REMOVED_CONSOLE]
  
  // Save all documents before shutdown
  const savePromises = [];
  docs.forEach((ydoc, docName) => {
    savePromises.push(persistence.writeState(docName, ydoc));
  });
  
  Promise.all(savePromises).then(() => {
    wss.close(() => {
      server.close(() => {
        // [REMOVED_CONSOLE]
        process.exit(0);
      });
    });
  });
});