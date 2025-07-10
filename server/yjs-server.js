#!/usr/bin/env node

/**
 * Yjs WebSocket Server
 * 
 * This server handles real-time collaboration for BlockNote using Yjs.
 * It uses the y-websocket server implementation.
 */

const WebSocket = require('ws');
const http = require('http');
const { setupWSConnection } = require('y-websocket/bin/utils');

const port = process.env.YJS_PORT || 1234;

// Create HTTP server with CORS support
const server = http.createServer((request, response) => {
  // Enable CORS
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (request.method === 'OPTIONS') {
    response.writeHead(200);
    response.end();
    return;
  }
  
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('Yjs WebSocket Server\n');
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Handle WebSocket connections
wss.on('connection', (ws, request) => {
  // Log all headers for debugging
  console.log('[YJS] New connection');
  console.log('[YJS] URL:', request.url);
  console.log('[YJS] Headers:', JSON.stringify(request.headers, null, 2));
  
  // Check for X-Forwarded headers (from reverse proxy)
  const realIp = request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || request.socket.remoteAddress;
  console.log('[YJS] Real IP:', realIp);
  console.log('[YJS] Host:', request.headers.host);
  
  // Setup Yjs connection
  try {
    setupWSConnection(ws, request, {
      gc: true // Enable garbage collection
    });
    console.log('[YJS] WebSocket connection setup complete');
  } catch (error) {
    console.error('[YJS] Error setting up connection:', error);
  }
  
  ws.on('close', (code, reason) => {
    console.log('[YJS] Connection closed. Code:', code, 'Reason:', reason?.toString());
  });
  
  ws.on('error', (err) => {
    console.error('[YJS] WebSocket error:', err);
  });
});

// Add error handler for the WebSocket server itself
wss.on('error', (error) => {
  console.error('[YJS] WebSocket server error:', error);
});

// Start server
server.listen(port, '0.0.0.0', () => {
  console.log(`[YJS] WebSocket server running on port ${port}`);
  console.log(`[YJS] ws://localhost:${port}`);
  console.log(`[YJS] Listening on all interfaces (0.0.0.0)`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[YJS] Shutting down server...');
  wss.close(() => {
    server.close(() => {
      console.log('[YJS] Server closed');
      process.exit(0);
    });
  });
});