#!/bin/bash

# MusicMu Self-Hosted Setup Script
# This installs MusicMu as a system service that auto-starts on boot

set -e

echo "🎵 Installing MusicMu as a self-hosted service..."

# Get the absolute path to the musicmu directory
MUSICMU_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
USER=$(whoami)

echo "📁 MusicMu directory: $MUSICMU_DIR"
echo "👤 User: $USER"

# 1. Build both frontend and backend
echo ""
echo "🔨 Building backend..."
cd "$MUSICMU_DIR/server"
npm run build

echo ""
echo "🔨 Building frontend..."
cd "$MUSICMU_DIR/client"
npm run build

# 2. Create systemd service file
echo ""
echo "📝 Creating systemd service..."

sudo tee /etc/systemd/system/musicmu.service > /dev/null <<EOF
[Unit]
Description=MusicMu - Ad-free Music Streaming Platform
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$MUSICMU_DIR
ExecStart=/bin/bash $MUSICMU_DIR/start.sh
Restart=always
RestartSec=10
StandardOutput=append:$MUSICMU_DIR/musicmu.log
StandardError=append:$MUSICMU_DIR/musicmu-error.log

# Environment variables
Environment="NODE_ENV=production"
Environment="PATH=/usr/local/bin:/usr/bin:/bin"

[Install]
WantedBy=multi-user.target
EOF

# 3. Create desktop shortcut
echo ""
echo "🖥️  Creating desktop shortcut..."

DESKTOP_FILE="$HOME/.local/share/applications/musicmu.desktop"
mkdir -p "$HOME/.local/share/applications"

cat > "$DESKTOP_FILE" <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=MusicMu
Comment=Ad-free Music Streaming Platform
Exec=xdg-open http://musicmu.local:5173
Icon=$MUSICMU_DIR/client/public/favicon.ico
Terminal=false
Categories=AudioVideo;Audio;Player;
Keywords=music;audio;streaming;youtube;
EOF

chmod +x "$DESKTOP_FILE"

# Also create desktop icon
if [ -d "$HOME/Desktop" ]; then
    cp "$DESKTOP_FILE" "$HOME/Desktop/MusicMu.desktop"
    chmod +x "$HOME/Desktop/MusicMu.desktop"
    echo "✅ Desktop icon created at ~/Desktop/MusicMu.desktop"
fi

# 4. Ensure hostname is in /etc/hosts
echo ""
echo "🌐 Checking hostname configuration..."

if ! grep -q "musicmu.local" /etc/hosts; then
    echo "Adding musicmu.local to /etc/hosts..."
    LOCAL_IP=$(hostname -I | awk '{print $1}')
    echo "$LOCAL_IP  musicmu.local" | sudo tee -a /etc/hosts > /dev/null
    echo "✅ Added musicmu.local → $LOCAL_IP"
else
    echo "✅ musicmu.local already configured"
fi

# 5. Enable and start the service
echo ""
echo "🚀 Enabling and starting MusicMu service..."

sudo systemctl daemon-reload
sudo systemctl enable musicmu.service
sudo systemctl start musicmu.service

# 6. Wait a moment and check status
sleep 3
echo ""
echo "📊 Service Status:"
sudo systemctl status musicmu.service --no-pager -l

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ MusicMu Installation Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎵 Access MusicMu at: http://musicmu.local:5173"
echo ""
echo "📱 Desktop Icon: Look for 'MusicMu' in your applications menu"
echo "   or on your desktop"
echo ""
echo "📝 Service Commands:"
echo "   • Check status:  sudo systemctl status musicmu"
echo "   • Stop service:  sudo systemctl stop musicmu"
echo "   • Start service: sudo systemctl start musicmu"
echo "   • Restart:       sudo systemctl restart musicmu"
echo "   • Disable:       sudo systemctl disable musicmu"
echo "   • View logs:     journalctl -u musicmu -f"
echo ""
echo "📂 Log Files:"
echo "   • Output: $MUSICMU_DIR/musicmu.log"
echo "   • Errors: $MUSICMU_DIR/musicmu-error.log"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
