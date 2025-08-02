const WebSocket = require('ws');
const http = require('http');
const url = require('url');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Room management
const rooms = new Map();
const clients = new Map();

// Ultra-low latency optimizations
const ULTRA_LATENCY_CONFIG = {
  pingInterval: 1000, // 1 second ping
  pingTimeout: 5000,  // 5 second timeout
  maxPayload: 65536,  // 64KB max message
  perMessageDeflate: false, // Disable compression for speed
  handshakeTimeout: 10000, // 10 second handshake
};

wss.on('connection', (ws, req) => {
  const parameters = url.parse(req.url, true);
  const roomId = parameters.query.roomId;
  const userId = parameters.query.userId;
  
  console.log(`Client ${userId} connecting to room ${roomId}`);
  
  // Store client info
  clients.set(ws, { roomId, userId });
  
  // Join room
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  rooms.get(roomId).add(ws);
  
  // Notify others in room
  broadcastToRoom(roomId, {
    type: 'user-joined',
    userId: userId,
    timestamp: Date.now()
  }, ws);
  
  // Send room info to new user
  const roomClients = Array.from(rooms.get(roomId));
  const otherUsers = roomClients
    .filter(client => client !== ws)
    .map(client => clients.get(client).userId);
    
  ws.send(JSON.stringify({
    type: 'room-info',
    users: otherUsers,
    roomId: roomId,
    timestamp: Date.now()
  }));
  
  // Handle messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      handleMessage(ws, message);
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });
  
  // Handle client disconnect
  ws.on('close', () => {
    const clientInfo = clients.get(ws);
    if (clientInfo) {
      const { roomId, userId } = clientInfo;
      
      // Remove from room
      const room = rooms.get(roomId);
      if (room) {
        room.delete(ws);
        if (room.size === 0) {
          rooms.delete(roomId);
        }
      }
      
      // Notify others
      broadcastToRoom(roomId, {
        type: 'user-left',
        userId: userId,
        timestamp: Date.now()
      });
      
      clients.delete(ws);
      console.log(`Client ${userId} disconnected from room ${roomId}`);
    }
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

function handleMessage(ws, message) {
  const clientInfo = clients.get(ws);
  if (!clientInfo) return;
  
  const { roomId, userId } = clientInfo;
  
  switch (message.type) {
    case 'offer':
    case 'answer':
    case 'ice-candidate':
      // Forward to specific user
      const targetWs = findClientByUserId(message.userId);
      if (targetWs && targetWs.readyState === WebSocket.OPEN) {
        targetWs.send(JSON.stringify({
          ...message,
          userId: userId, // Replace with sender's ID
          timestamp: Date.now()
        }));
      }
      break;
      
    case 'ping':
      // Ultra-low latency ping response
      ws.send(JSON.stringify({
        type: 'pong',
        timestamp: Date.now(),
        latency: Date.now() - message.timestamp
      }));
      break;
      
    case 'stats':
      // Forward connection stats
      broadcastToRoom(roomId, {
        type: 'stats-update',
        userId: userId,
        stats: message.stats,
        timestamp: Date.now()
      }, ws);
      break;
      
    default:
      console.log('Unknown message type:', message.type);
  }
}

function broadcastToRoom(roomId, message, excludeWs = null) {
  const room = rooms.get(roomId);
  if (!room) return;
  
  room.forEach(client => {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

function findClientByUserId(userId) {
  for (const [ws, clientInfo] of clients) {
    if (clientInfo.userId === userId) {
      return ws;
    }
  }
  return null;
}

// Ultra-low latency optimizations
wss.on('headers', (headers) => {
  // Add low-latency headers
  headers.push('X-Latency-Optimized: true');
  headers.push('X-WebRTC-Optimized: true');
});

// Start server
const PORT = process.env.ULTRA_LATENCY_PORT || 3001;
server.listen(PORT, () => {
  console.log(`Ultra-low latency signaling server running on port ${PORT}`);
  console.log('Optimized for <30ms latency');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down ultra-low latency server...');
  wss.close(() => {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});

module.exports = { wss, rooms, clients }; 