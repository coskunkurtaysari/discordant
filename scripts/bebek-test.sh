#!/bin/bash

echo "🍼 Ultra-Low Latency Test (Bebek Seviyesi)"
echo "============================================"
echo ""

echo "1️⃣ Dosyaları hazırlıyoruz..."
if [ ! -f .env.local ]; then
    cp env.example .env.local
    echo "✅ .env.local dosyası oluşturuldu"
fi

echo ""
echo "2️⃣ Test ayarlarını yapıyoruz..."
cat > .env.local << EOF
# Test Ayarları
ULTRA_LATENCY_PORT=3001
NEXT_PUBLIC_ULTRA_LATENCY_WS_URL=ws://localhost:3001
ULTRA_LATENCY_TURN_SERVER=stun:stun.l.google.com:19302
ULTRA_LATENCY_TURN_USERNAME=
ULTRA_LATENCY_TURN_CREDENTIAL=
EOF

echo "✅ Test ayarları tamamlandı"
echo ""

echo "🎯 Şimdi Test Edelim!"
echo "====================="
echo ""
echo "📋 Adım 1: İlk terminal'i açın ve şunu yazın:"
echo "   npm run ultra-latency"
echo ""
echo "📋 Adım 2: İkinci terminal'i açın ve şunu yazın:"
echo "   npm run dev"
echo ""
echo "📋 Adım 3: İki farklı tarayıcı penceresi açın:"
echo "   http://localhost:3000/ultra-latency/test1"
echo "   http://localhost:3000/ultra-latency/test2"
echo ""
echo "📋 Adım 4: Her iki pencerede de kamera izni verin"
echo ""
echo "📋 Adım 5: Latency göstergesini kontrol edin:"
echo "   🟢 Yeşil = Çok hızlı (<30ms)"
echo "   🟡 Sarı = Hızlı (30-100ms)"
echo "   🔴 Kırmızı = Yavaş (>100ms)"
echo ""
echo "🎉 Test tamamlandı!"
echo ""
echo "💡 İpuçları:"
echo "   - Chrome tarayıcısı kullanın"
echo "   - Kamera/mikrofon izni verin"
echo "   - İki farklı cihaz deneyin (telefon + bilgisayar)" 