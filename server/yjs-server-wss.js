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
  // [REMOVED_CONSOLE]
  // [REMOVED_CONSOLE]
  // [REMOVED_CONSOLE]);
  // [REMOVED_CONSOLE]
  
  // Check for X-Forwarded headers (from reverse proxy)
  const realIp = request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || request.socket.remoteAddress;
  // [REMOVED_CONSOLE]
  
  // Setup Yjs connection
  try {
    setupWSConnection(ws, request, {
      gc: true // Enable garbage collection
    });
    // [REMOVED_CONSOLE]
  } catch (error) {
    // [REMOVED_CONSOLE]
  }
  
  ws.on('close', (code, reason) => {
    // [REMOVED_CONSOLE]
  });
  
  ws.on('error', (err) => {
    // [REMOVED_CONSOLE]
  });
});

// Start server
server.listen(port, '0.0.0.0', () => {
  // [REMOVED_CONSOLE]
  // [REMOVED_CONSOLE]
  // [REMOVED_CONSOLE]`);
  // [REMOVED_CONSOLE]
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  // [REMOVED_CONSOLE]
  wss.close(() => {
    server.close(() => {
      // [REMOVED_CONSOLE]
      process.exit(0);
    });
  });
});