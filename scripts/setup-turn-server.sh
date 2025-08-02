#!/bin/bash

# TURN Server Setup Script for Ultra-Low Latency WebRTC
# This script installs and configures a TURN server

echo "🚀 Setting up TURN Server for Ultra-Low Latency WebRTC..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root (sudo)"
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install dependencies
echo "📦 Installing dependencies..."
apt install -y coturn nginx certbot python3-certbot-nginx

# Configure TURN server
echo "⚙️ Configuring TURN server..."

# Create TURN configuration
cat > /etc/turnserver.conf << EOF
# TURN Server Configuration for Ultra-Low Latency
listening-port=3478
tls-listening-port=5349
listening-ip=0.0.0.0
external-ip=$(curl -s ifconfig.me)
realm=your-domain.com
server-name=your-domain.com
user-quota=12
total-quota=1200
authentication-method=long-term
user=your_username:your_password
cert=/etc/letsencrypt/live/your-domain.com/fullchain.pem
pkey=/etc/letsencrypt/live/your-domain.com/privkey.pem
no-tls
no-dtls
log-file=/var/log/turnserver.log
verbose
fingerprint
lt-cred-mech
no-multicast-peers
no-cli
no-tlsv1
no-tlsv1_1
no-tlsv1_2
no-tlsv1_3
EOF

# Enable TURN server
echo "🔧 Enabling TURN server..."
systemctl enable coturn
systemctl start coturn

# Configure firewall
echo "🔥 Configuring firewall..."
ufw allow 3478/tcp
ufw allow 3478/udp
ufw allow 5349/tcp
ufw allow 5349/udp
ufw allow 49152:65535/udp

# Create environment variables file
echo "📝 Creating environment variables..."
cat > /root/turn-env.txt << EOF
# TURN Server Environment Variables
ULTRA_LATENCY_TURN_SERVER=turn:your-domain.com:3478
ULTRA_LATENCY_TURN_USERNAME=your_username
ULTRA_LATENCY_TURN_CREDENTIAL=your_password
ULTRA_LATENCY_PORT=3001
NEXT_PUBLIC_ULTRA_LATENCY_WS_URL=ws://localhost:3001
EOF

echo "✅ TURN Server setup complete!"
echo "📋 Your TURN server credentials:"
echo "   Server: turn:your-domain.com:3478"
echo "   Username: your_username"
echo "   Password: your_password"
echo ""
echo "🔧 Next steps:"
echo "1. Replace 'your-domain.com' with your actual domain"
echo "2. Replace 'your_username' and 'your_password' with secure credentials"
echo "3. Update your .env.local file with these values"
echo "4. Test the connection with: npm run ultra-latency" 