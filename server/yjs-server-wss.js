#!/usr/bin/env node

/**
 * Yjs WebSocket Secure (WSS) Server
 * 
 * This server handles real-time collaboration for BlockNote using Yjs over WSS.
 */

const WebSocket = require('ws');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { setupWSConnection } = require('y-websocket/bin/utils');

const port = process.env.YJS_PORT || 1234;

// Load SSL certificates
const serverOptions = {
  cert: fs.readFileSync(path.join(__dirname, 'certs/cert.pem')),
  key: fs.readFileSync(path.join(__dirname, 'certs/key.pem'))
};

// Create HTTPS server with CORS support
const server = https.createServer(serverOptions, (request, response) => {
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
  response.end('Yjs WebSocket Secure Server\n');
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Handle WebSocket connections
wss.on('connection', (ws, request) => {
  // Log all headers for debugging
  console.log('[YJS-WSS] New connection');
  console.log('[YJS-WSS] URL:', request.url);
  console.log('[YJS-WSS] Headers:', JSON.stringify(request.headers, null, 2));
  console.log('[YJS-WSS] Remote Address:', request.socket.remoteAddress);
  
  // Check for X-Forwarded headers (from reverse proxy)
  const realIp = request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || request.socket.remoteAddress;
  console.log('[YJS-WSS] Real IP:', realIp);
  
  // Setup Yjs connection
  try {
    setupWSConnection(ws, request, {
      gc: true // Enable garbage collection
    });
    console.log('[YJS-WSS] WebSocket connection setup complete');
  } catch (error) {
    console.error('[YJS-WSS] Error setting up connection:', error);
  }
  
  ws.on('close', (code, reason) => {
    console.log('[YJS-WSS] Connection closed. Code:', code, 'Reason:', reason);
  });
  
  ws.on('error', (err) => {
    console.error('[YJS-WSS] WebSocket error:', err);
  });
});

// Start server
server.listen(port, '0.0.0.0', () => {
  console.log(`[YJS-WSS] WebSocket Secure server running on port ${port}`);
  console.log(`[YJS-WSS] wss://localhost:${port}`);
  console.log(`[YJS-WSS] Listening on all interfaces (0.0.0.0)`);
  console.log(`[YJS-WSS] Note: This uses a self-signed certificate. You may need to accept it in your browser.`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[YJS-WSS] Shutting down server...');
  wss.close(() => {
    server.close(() => {
      console.log('[YJS-WSS] Server closed');
      process.exit(0);
    });
  });
});