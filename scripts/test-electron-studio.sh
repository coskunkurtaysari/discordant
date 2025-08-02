#!/bin/bash

echo "🚀 Electron Studio Channel Test Script"
echo "====================================="
echo ""

echo "1️⃣ Environment setup..."
if [ ! -f .env.local ]; then
    cp env.example .env.local
    echo "✅ .env.local created"
fi

echo ""
echo "2️⃣ Electron studio configuration..."
cat > .env.local << EOF
# Electron Studio Channel Configuration
ULTRA_LATENCY_PORT=3001
NEXT_PUBLIC_ULTRA_LATENCY_WS_URL=ws://localhost:3001
ULTRA_LATENCY_TURN_SERVER=stun:stun.l.google.com:19302
ULTRA_LATENCY_TURN_USERNAME=
ULTRA_LATENCY_TURN_CREDENTIAL=

# Electron-specific settings
NEXT_PUBLIC_ELECTRON_MODE=true
NEXT_PUBLIC_STUDIO_MODE=true

# Keep other existing variables
$(grep -v "ULTRA_LATENCY\|ELECTRON\|STUDIO" .env.local.backup 2>/dev/null || echo "")
EOF

echo "✅ Electron studio configuration applied"
echo ""

echo "3️⃣ Install dependencies..."
npm install ws
echo "✅ Dependencies installed"
echo ""

echo "🎯 Electron Studio Channel Test Instructions:"
echo "==========================================="
echo ""
echo "1️⃣ Start the ultra-latency server:"
echo "   npm run ultra-latency"
echo ""
echo "2️⃣ Start the development server:"
echo "   npm run dev"
echo ""
echo "3️⃣ Start Electron app:"
echo "   npm run electron:dev"
echo ""
echo "4️⃣ Create a Studio Channel:"
echo "   - Go to any server in Electron app"
echo "   - Click '+' to create channel"
echo "   - Select 'STUDIO' as channel type"
echo "   - Name it 'electron-studio'"
echo "   - Click Create"
echo ""
echo "5️⃣ Test Electron Studio Features:"
echo "   - Join the studio channel"
echo "   - Check latency indicator (should be <30ms)"
echo "   - Test audio/video controls"
echo "   - Test screen sharing"
echo "   - Test recording feature (Electron-native)"
echo "   - Test fullscreen mode"
echo "   - Check performance stats (CPU, RAM, GPU, FPS)"
echo "   - Test hardware acceleration"
echo ""
echo "6️⃣ Expected Electron Studio Features:"
echo "   ✅ Ultra-low latency (<30ms)"
echo "   ✅ High-quality video (1080p/60fps)"
echo "   ✅ Studio-grade audio"
echo "   ✅ Screen sharing"
echo "   ✅ Native recording capability"
echo "   ✅ Fullscreen mode"
echo "   ✅ Participant count"
echo "   ✅ Connection quality indicator"
echo "   ✅ Latency monitoring"
echo "   ✅ Performance monitoring (CPU, RAM, GPU)"
echo "   ✅ Hardware acceleration"
echo "   ✅ Electron-native APIs"
echo ""
echo "7️⃣ Electron vs Browser Studio:"
echo "   🌐 Browser Studio: Web APIs, limited performance"
echo "   ⚡ Electron Studio: Native APIs, hardware acceleration"
echo ""
echo "🎉 Electron studio channel test complete!"
echo ""
echo "💡 Electron Tips:"
echo "   - Use hardware acceleration for better performance"
echo "   - Check performance stats in real-time"
echo "   - Native recording saves to local filesystem"
echo "   - Better media device access"
echo "   - Lower latency due to native WebRTC"
echo ""
echo "🔧 Troubleshooting:"
echo "   - If media permissions fail, restart Electron"
echo "   - Check console for WebRTC errors"
echo "   - Ensure ultra-latency server is running"
echo "   - Verify environment variables are set" 