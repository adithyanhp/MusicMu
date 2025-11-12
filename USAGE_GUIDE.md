# 🎵 MusicMu - Quick Start Guide

## Installation & Setup

### 1. Install Dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Configure Environment

```bash
# In server directory
cp .env.example .env

# Edit .env (optional for MVP)
# PORT=3001
# HOST=0.0.0.0
```

### 3. Start the Application

#### Option A: Use Start Script (Recommended)
```bash
# From project root
./start.sh
```

#### Option B: Manual Start
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend  
cd client
npm run dev
```

### 4. Access the App

Open your browser to:
**http://localhost:5173**

---

## 🎮 User Guide

### Searching for Music

1. Click **"Search"** in the navigation
2. Type song name, artist, or keywords
3. Click **"Search"** button
4. Results appear with thumbnails and info
5. Click any result to play immediately

**Example searches:**
- "lofi hip hop beats"
- "jazz piano"
- "classical music"
- "acoustic guitar"

### Playing Music

1. Search for a track
2. Click on any result
3. Audio loads and plays automatically
4. Use player controls:
   - ⏯️ Play/Pause
   - ⏮️ Previous track
   - ⏭️ Next track
   - 🔊 Volume slider
   - 📊 Progress bar (click to seek)

### Managing Your Library

#### Like Songs
1. While playing a track, click ❤️ heart icon
2. Track is saved to "Liked Songs"
3. Access via **"Liked"** in navigation

#### Unlike Songs
1. Go to "Liked Songs" page
2. Click 🗑️ trash icon on any track
3. Removed from favorites

### Queue Management

Tracks are automatically added to queue when you play them from search.

**Controls:**
- Next track: ⏭️ button
- Previous: ⏮️ button (or restarts current if > 3 seconds in)

---

## 🎹 Keyboard Shortcuts

Currently manual controls only. Future versions will include:
- Space: Play/Pause
- Arrow Left/Right: Previous/Next
- Arrow Up/Down: Volume

---

## 💡 Tips & Tricks

### Better Search Results
- Use specific artist names
- Include genre keywords
- Try official channel names
- Search in English for best results

### Audio Quality
The app automatically selects the highest quality audio-only stream available.

### Offline Usage
All liked songs and playlists are cached locally. However, streaming still requires internet.

### Browser Compatibility
- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ⚠️ Some features may vary by browser

---

## 🛠️ Developer Tools

### Backend Logs
```bash
# Check server logs
cd server
npm run dev
# Watch terminal output for stream fallback attempts
```

### Frontend Debugging
```bash
# Open browser DevTools (F12)
# Check Console for errors
# Network tab shows API calls
# Application tab shows IndexedDB data
```

### Testing API Directly

```bash
# Search
curl "http://localhost:3001/api/search?q=lofi"

# Get track metadata
curl "http://localhost:3001/api/track/dQw4w9WgXcQ"

# Get stream URL
curl "http://localhost:3001/api/track/dQw4w9WgXcQ/stream"

# Health check
curl "http://localhost:3001/health"
```

---

## 🔍 Inspecting Cache

### Using Browser DevTools

1. Open DevTools (F12)
2. Go to **Application** tab
3. Expand **IndexedDB** → **musicmu**
4. View stored data:
   - `guest_data` - Main cache
   - `data` - Playlists, liked, queue
   - `timestamp` - Cache creation time

### Cache Structure

```json
{
  "playlists": [],
  "liked": [
    {
      "videoId": "abc123",
      "title": "Song Title",
      "artist": "Artist Name",
      "duration": 180,
      "thumbnail": "https://..."
    }
  ],
  "queue": [...],
  "lastPlayed": {...},
  "version": 1
}
```

---

## 🎨 Customization

### Changing Theme Colors

Edit `client/tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Change these values
        500: '#d946ef',
        600: '#c026d3',
        // etc.
      },
    },
  },
}
```

### Modifying Player UI

Edit `client/src/components/MusicPlayerCard.tsx`

### Adding New Pages

1. Create component in `client/src/pages/`
2. Add route in `client/src/App.tsx`
3. Add navigation link

---

## 📊 Performance Optimization

### Reduce API Calls
The app caches:
- Search results (in memory)
- Track metadata (IndexedDB)
- Stream URLs (short-lived)

### Improve Load Times
```bash
# Production build
cd client
npm run build

# Preview production build
npm run preview
```

---

## 🐛 Common Issues & Solutions

### "Failed to load audio"
**Cause:** Stream URL expired or video unavailable
**Solution:** Click play again to retry with fallbacks

### "Search returns no results"
**Cause:** YouTube rate limiting
**Solution:** Wait a few minutes, try different query

### "Cannot connect to backend"
**Cause:** Backend not running or port conflict
**Solution:**
```bash
# Check if backend is running
curl http://localhost:3001/health

# Restart backend
cd server
npm run dev
```

### Audio choppy/buffering
**Cause:** Slow internet connection
**Solution:** Try lower quality or wait for full buffer

### Liked songs disappeared
**Cause:** Cache cleared or version changed
**Solution:** Unfortunately guest data is local only. Future versions will have cloud sync.

---

## 🔐 Security & Privacy

### Guest Mode Privacy
- All data stored **locally** in your browser
- No account required
- No tracking
- No data sent to our servers (except API calls)

### What Data is Sent?
- Search queries (to backend → YouTube)
- Video IDs for metadata/streams
- That's it!

### Clear Your Data
```javascript
// In browser console
localStorage.clear();
indexedDB.deleteDatabase('musicmu');
```

---

## 🚀 Production Deployment

### Backend
```bash
cd server
npm run build
npm start
```

### Frontend
```bash
cd client
npm run build
# Serve dist/ folder with any static host
```

### Environment Variables (Production)
```bash
# Server
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://yourdomain.com

# Add YouTube API key if needed
YT_API_KEY=your_actual_key
```

---

## 📞 Support

For issues:
1. Check this guide
2. Review PROJECT_SUMMARY.md
3. Check GitHub issues
4. Create new issue with:
   - Error message
   - Browser/OS
   - Steps to reproduce

---

## 🎉 Enjoy Your Music!

Remember:
- 🎧 Guest mode = local storage only
- 🔄 Refresh preserves your data
- ❤️ Like songs to save them
- 🔎 Search for anything on YouTube
- 🎵 Audio-only, no video

**Happy listening! 🎶**
