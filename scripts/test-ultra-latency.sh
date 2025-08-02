#!/bin/bash

# Ultra-Low Latency Test Script
# This script helps you test the ultra-low latency WebRTC system

echo "🧪 Ultra-Low Latency WebRTC Test Script"
echo "========================================"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from template..."
    cp env.example .env.local
    echo "✅ .env.local created"
else
    echo "✅ .env.local already exists"
fi

# Update .env.local with test configuration
echo "⚙️ Configuring test environment..."

# Backup original .env.local
cp .env.local .env.local.backup

# Update with test configuration
cat > .env.local << EOF
# Test Configuration for Ultra-Low Latency
ULTRA_LATENCY_PORT=3001
NEXT_PUBLIC_ULTRA_LATENCY_WS_URL=ws://localhost:3001

# Free STUN server for testing
ULTRA_LATENCY_TURN_SERVER=stun:stun.l.google.com:19302
ULTRA_LATENCY_TURN_USERNAME=
ULTRA_LATENCY_TURN_CREDENTIAL=

# Other required variables (keep existing ones)
$(grep -v "ULTRA_LATENCY" .env.local.backup | grep -v "^#" | grep -v "^$")
EOF

echo "✅ Test configuration applied"

# Check if ws package is installed
if ! npm list ws > /dev/null 2>&1; then
    echo "📦 Installing WebSocket package..."
    npm install ws
fi

# Check if server directory exists
if [ ! -d "server" ]; then
    echo "📁 Creating server directory..."
    mkdir -p server
fi

echo ""
echo "🎯 Test Setup Complete!"
echo ""
echo "📋 Test Instructions:"
echo "===================="
echo ""
echo "1️⃣ Start the ultra-latency server:"
echo "   npm run ultra-latency"
echo ""
echo "2️⃣ In another terminal, start the dev server:"
echo "   npm run dev"
echo ""
echo "3️⃣ Open two browser windows:"
echo "   http://localhost:3000/ultra-latency/test-room-1"
echo "   http://localhost:3000/ultra-latency/test-room-2"
echo ""
echo "4️⃣ Test scenarios:"
echo "   ✅ Same network (should be <30ms)"
echo "   ✅ Different networks (should be <100ms)"
echo "   ✅ Mobile to desktop"
echo "   ✅ Different browsers"
echo ""
echo "5️⃣ Check latency indicators:"
echo "   🟢 Green: <30ms (Excellent)"
echo "   🟡 Yellow: 30-100ms (Good)"
echo "   🔴 Red: >100ms (Needs TURN)"
echo ""
echo "🔧 Troubleshooting:"
echo "   - Check browser console for errors"
echo "   - Ensure camera/microphone permissions"
echo "   - Try different browsers (Chrome recommended)"
echo "   - Check network connectivity"
echo ""
echo "📊 Expected Results:"
echo "   - Local network: 5-15ms"
echo "   - Same city: 10-30ms"
echo "   - Different cities: 30-100ms"
echo "   - International: 100-300ms" 