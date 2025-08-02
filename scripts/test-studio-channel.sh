#!/bin/bash

echo "🎬 Studio Channel Test Script"
echo "============================"
echo ""

echo "1️⃣ Environment setup..."
if [ ! -f .env.local ]; then
    cp env.example .env.local
    echo "✅ .env.local created"
fi

echo ""
echo "2️⃣ Studio configuration..."
cat > .env.local << EOF
# Studio Channel Configuration
ULTRA_LATENCY_PORT=3001
NEXT_PUBLIC_ULTRA_LATENCY_WS_URL=ws://localhost:3001
ULTRA_LATENCY_TURN_SERVER=stun:stun.l.google.com:19302
ULTRA_LATENCY_TURN_USERNAME=
ULTRA_LATENCY_TURN_CREDENTIAL=

# Keep other existing variables
$(grep -v "ULTRA_LATENCY" .env.local.backup 2>/dev/null || echo "")
EOF

echo "✅ Studio configuration applied"
echo ""

echo "🎯 Studio Channel Test Instructions:"
echo "==================================="
echo ""
echo "1️⃣ Start the ultra-latency server:"
echo "   npm run ultra-latency"
echo ""
echo "2️⃣ Start the development server:"
echo "   npm run dev"
echo ""
echo "3️⃣ Create a Studio Channel:"
echo "   - Go to any server"
echo "   - Click '+' to create channel"
echo "   - Select 'STUDIO' as channel type"
echo "   - Name it 'test-studio'"
echo "   - Click Create"
echo ""
echo "4️⃣ Test Studio Features:"
echo "   - Join the studio channel"
echo "   - Check latency indicator (should be <30ms)"
echo "   - Test audio/video controls"
echo "   - Test screen sharing"
echo "   - Test recording feature"
echo "   - Test fullscreen mode"
echo ""
echo "5️⃣ Expected Studio Features:"
echo "   ✅ Ultra-low latency (<30ms)"
echo "   ✅ High-quality video (1080p/60fps)"
echo "   ✅ Studio-grade audio"
echo "   ✅ Screen sharing"
echo "   ✅ Recording capability"
echo "   ✅ Fullscreen mode"
echo "   ✅ Participant count"
echo "   ✅ Connection quality indicator"
echo "   ✅ Latency monitoring"
echo ""
echo "6️⃣ Studio vs Regular Channels:"
echo "   📹 Regular Video: Standard quality, normal latency"
echo "   🎬 Studio Channel: Ultra-low latency, high quality"
echo ""
echo "🎉 Studio channel test complete!"
echo ""
echo "💡 Tips:"
echo "   - Use Chrome for best performance"
echo "   - Ensure good internet connection"
echo "   - Test with multiple participants"
echo "   - Check browser console for errors" 