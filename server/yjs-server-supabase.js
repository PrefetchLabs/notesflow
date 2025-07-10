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
  console.error('[YJS] Missing Supabase credentials');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Store for active documents
const docs = new Map();

// Persistence functions
const persistence = {
  bindState: async (docName, ydoc) => {
    console.log(`[YJS] Loading document: ${docName}`);
    
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
        console.error('[YJS] Error loading document:', error);
        return;
      }
      
      if (data && data.content) {
        // Apply the saved state to the Y.Doc
        const update = Buffer.from(data.content, 'base64');
        Y.applyUpdate(ydoc, update);
        console.log(`[YJS] Document loaded: ${docName}`);
      }
    } catch (err) {
      console.error('[YJS] Failed to load document:', err);
    }
  },
  
  writeState: async (docName, ydoc) => {
    console.log(`[YJS] Saving document: ${docName}`);
    
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
        console.error('[YJS] Error saving document:', error);
      } else {
        console.log(`[YJS] Document saved: ${docName}`);
      }
    } catch (err) {
      console.error('[YJS] Failed to save document:', err);
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
  console.log('[YJS] New connection from:', request.socket.remoteAddress);
  
  // Setup Yjs connection with persistence
  setupWSConnection(ws, request, {
    gc: true,
    persistence
  });
  
  ws.on('close', () => {
    console.log('[YJS] Connection closed');
  });
  
  ws.on('error', (err) => {
    console.error('[YJS] WebSocket error:', err);
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
  console.log(`[YJS] WebSocket server with Supabase persistence running on port ${port}`);
  console.log(`[YJS] ws://localhost:${port}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[YJS] Shutting down server...');
  
  // Save all documents before shutdown
  const savePromises = [];
  docs.forEach((ydoc, docName) => {
    savePromises.push(persistence.writeState(docName, ydoc));
  });
  
  Promise.all(savePromises).then(() => {
    wss.close(() => {
      server.close(() => {
        console.log('[YJS] Server closed');
        process.exit(0);
      });
    });
  });
});