# 🎵 MusicMu - Self-Hosted Installation

MusicMu is now installed as a **system service** that automatically starts on boot!

## 🚀 Quick Access

### Desktop
- **Double-click** the "MusicMu" icon on your desktop
- Or find "MusicMu" in your applications menu
- Or open browser and go to: **http://musicmu.local:5173**

### From Terminal
```bash
xdg-open http://musicmu.local:5173
```

---

## 📋 Service Management

MusicMu runs as a systemd service in the background.

### Check Status
```bash
sudo systemctl status musicmu
```

### Stop Service
```bash
sudo systemctl stop musicmu
```

### Start Service
```bash
sudo systemctl start musicmu
```

### Restart Service
```bash
sudo systemctl restart musicmu
```

### Disable Auto-Start (won't start on boot)
```bash
sudo systemctl disable musicmu
```

### Enable Auto-Start (starts on boot)
```bash
sudo systemctl enable musicmu
```

---

## 📝 Viewing Logs

### Real-time Logs (Live)
```bash
journalctl -u musicmu -f
```

### Last 50 Lines
```bash
journalctl -u musicmu -n 50
```

### Log Files
- **Output:** `~/Videos/musicplayer/musicmu/musicmu.log`
- **Errors:** `~/Videos/musicplayer/musicmu/musicmu-error.log`

View with:
```bash
tail -f ~/Videos/musicplayer/musicmu/musicmu.log
tail -f ~/Videos/musicplayer/musicmu/musicmu-error.log
```

---

## 🔄 Updating MusicMu

When you update the code:

1. **Pull latest changes:**
   ```bash
   cd ~/Videos/musicplayer/musicmu
   git pull
   ```

2. **Rebuild:**
   ```bash
   cd server && npm run build
   cd ../client && npm run build
   ```

3. **Restart service:**
   ```bash
   sudo systemctl restart musicmu
   ```

Or simply re-run the installer:
```bash
cd ~/Videos/musicplayer/musicmu
./install-service.sh
```

---

## 🌐 Network Access

### From This Computer
- **URL:** http://musicmu.local:5173
- **Status:** ✅ Works with YouTube playback

### From Phone/Tablet (Same WiFi Network)

#### Method 1: Add Hostname to Phone
1. Install "Virtual Hosts" app (Android) or "DNSOverride" (iOS)
2. Add entry: `192.168.213.222  musicmu.local`
3. Open: http://musicmu.local:5173

#### Method 2: Direct IP (Limited)
- Open: http://192.168.213.222:5173
- ⚠️ **Note:** YouTube playback won't work (IP address restriction)
- Search and queue management will work
- Use Method 1 for full functionality

---

## 🔧 Troubleshooting

### Service Won't Start
```bash
# Check for errors
journalctl -u musicmu -n 50 --no-pager

# Check if ports are already in use
ss -tlnp | grep -E "3001|5173"

# Restart service
sudo systemctl restart musicmu
```

### Can't Access from Browser
```bash
# Verify hostname resolves
ping musicmu.local

# Should show: 192.168.213.222

# Check if service is running
sudo systemctl status musicmu

# Check if ports are listening
curl http://musicmu.local:3001/health
```

### Desktop Icon Not Working
```bash
# Recreate desktop file
cat > ~/.local/share/applications/musicmu.desktop <<'EOF'
[Desktop Entry]
Version=1.0
Type=Application
Name=MusicMu
Comment=Ad-free Music Streaming Platform
Exec=xdg-open http://musicmu.local:5173
Icon=/home/akshayka/Videos/musicplayer/musicmu/client/public/icon.svg
Terminal=false
Categories=AudioVideo;Audio;Player;
EOF

chmod +x ~/.local/share/applications/musicmu.desktop
cp ~/.local/share/applications/musicmu.desktop ~/Desktop/
```

---

## 🗑️ Uninstalling

To completely remove MusicMu service:

```bash
# Stop and disable service
sudo systemctl stop musicmu
sudo systemctl disable musicmu

# Remove service file
sudo rm /etc/systemd/system/musicmu.service

# Reload systemd
sudo systemctl daemon-reload

# Remove desktop icons
rm ~/.local/share/applications/musicmu.desktop
rm ~/Desktop/MusicMu.desktop

# Remove hostname (optional)
sudo sed -i '/musicmu.local/d' /etc/hosts
```

The code will remain in `~/Videos/musicplayer/musicmu` - delete manually if needed.

---

## 📊 System Resources

MusicMu uses approximately:
- **Memory:** ~200 MB
- **CPU:** <5% idle, ~20% during streaming
- **Disk:** ~500 MB (code + dependencies)
- **Network:** Varies based on usage

---

## 🎯 Features

- ✅ Auto-starts on system boot
- ✅ Runs in background
- ✅ Desktop shortcut for easy access
- ✅ System service management
- ✅ Automatic restarts on crashes
- ✅ Persistent logs
- ✅ Local hostname support
- ✅ Network access capable
- ✅ YouTube playback (via musicmu.local)
- ✅ Search, queue, favorites, playlists

---

## 🆘 Support

If you encounter issues:

1. Check logs: `journalctl -u musicmu -f`
2. Verify service status: `sudo systemctl status musicmu`
3. Test backend: `curl http://musicmu.local:3001/health`
4. Test frontend: Open `http://musicmu.local:5173` in browser

---

**Enjoy your self-hosted ad-free music streaming! 🎵**
