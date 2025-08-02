#!/bin/bash

# Quick Ultra-Low Latency Setup Script
# This script sets up the environment for testing ultra-low latency WebRTC

echo "🚀 Quick Ultra-Low Latency Setup..."

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cp env.example .env.local
fi

# Update .env.local with free TURN server
echo "⚙️ Configuring free TURN server..."
sed -i 's/# ULTRA_LATENCY_TURN_SERVER=stun:stun.l.google.com:19302/ULTRA_LATENCY_TURN_SERVER=stun:stun.l.google.com:19302/' .env.local
sed -i 's/# ULTRA_LATENCY_TURN_USERNAME=/ULTRA_LATENCY_TURN_USERNAME=/' .env.local
sed -i 's/# ULTRA_LATENCY_TURN_CREDENTIAL=/ULTRA_LATENCY_TURN_CREDENTIAL=/' .env.local

# Install ws package if not installed
if ! npm list ws > /dev/null 2>&1; then
    echo "📦 Installing WebSocket package..."
    npm install ws
fi

# Make the ultra-latency server executable
chmod +x server/ultra-low-latency-server.js

echo "✅ Quick setup complete!"
echo ""
echo "🔧 To start ultra-low latency testing:"
echo "1. Terminal 1: npm run ultra-latency"
echo "2. Terminal 2: npm run dev"
echo "3. Visit: http://localhost:3000/ultra-latency/[roomId]"
echo ""
echo "📋 Current configuration:"
echo "   TURN Server: stun:stun.l.google.com:19302 (Free)"
echo "   WebSocket: ws://localhost:3001"
echo "   Port: 3001"
echo ""
echo "💡 For production, consider:"
echo "   - Twilio TURN server (paid, reliable)"
echo "   - Your own TURN server (run setup-turn-server.sh)"
echo "   - Agora TURN server (paid, low latency)" 