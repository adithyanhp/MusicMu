# MusicMu - Technical Architecture

**An open-source music player — not affiliated with or endorsed by Google LLC.**

## System Overview

MusicMu is a full-stack ad-free music streaming platform with unlimited skips, no forced recommendations, and complete listener control. The application streams audio-only content directly without storing files, using a client-server architecture with intelligent stream resolution and caching strategies.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │   UI Layer   │  │ State Mgmt   │  │   Player Logic      │  │
│  │  (Pages +    │→ │  (Zustand)   │→ │ (Audio/IFrame API)  │  │
│  │  Components) │  │              │  │                     │  │
│  └──────────────┘  └──────────────┘  └─────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST API (HTTP)
┌────────────────────────────▼────────────────────────────────────┐
│                      Backend (Node.js)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │ Fastify API  │→ │Stream Resolver│→ │  YouTube Libraries  │  │
│  │   Routes     │  │ (youtube.ts)  │  │  (Multi-fallback)   │  │
│  └──────────────┘  └──────────────┘  └─────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  YouTube APIs   │
                    │   (External)    │
                    └─────────────────┘
```

---

## Backend Architecture

### Technology Stack
- **Runtime**: Node.js (v20+)
- **Framework**: Fastify (v4.25+) - High-performance web framework
- **Language**: TypeScript (v5.3+)
- **Build Tool**: tsx (development), tsc (production)

### Core Components

#### 1. **API Server** (`src/index.ts`)
- **Port**: 3001
- **Features**:
  - CORS enabled for frontend communication
  - Logging with Pino (pretty formatting in dev)
  - Health check endpoint
  - RESTful API design

**Key Endpoints**:
```typescript
GET  /health              // Server health check
GET  /api/search?q=query  // Search YouTube videos
GET  /api/track/:id       // Get track metadata
GET  /api/track/:id/stream // Get audio stream URL
```

#### 2. **Stream Resolution Engine** (`src/lib/youtube.ts`)

The core of the application - intelligently resolves YouTube audio streams using multiple fallback methods.

**Architecture**:
```
┌─────────────────────────────────────────────────────────────┐
│                    getAudioStream(videoId)                  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Session-Based Method Caching                │  │
│  │  "Find once, stick to it until it fails 3 times"    │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                 │
│                           ▼                                 │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              Fallback Chain (Priority Order)          │ │
│  │                                                        │ │
│  │  1. ytdl-core     ─────► Fast, reliable (5s timeout)  │ │
│  │         │                                              │ │
│  │         ├──FAIL──► 2. play-dl (5s timeout)            │ │
│  │                           │                            │ │
│  │                           ├──FAIL──► 3. youtubei.js   │ │
│  │                                          (7s timeout)  │ │
│  │                                            │           │ │
│  │                                            ├──FAIL──►  │ │
│  │                                                        │ │
│  │                           4. Invidious API             │ │
│  │                              (8s timeout, multi-inst)  │ │
│  │                                     │                  │ │
│  │                                     ├──FAIL──►         │ │
│  │                                                        │ │
│  │                           5. IFrame Embed              │ │
│  │                              (Last resort, instant)    │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Individual Methods**:

**Method 1: @distube/ytdl-core** (Primary)
```typescript
async function tryYTDL(videoId: string): Promise<AudioStream>
```
- Most reliable method
- Direct audio-only format extraction
- Signature deciphering built-in
- 5-second timeout
- Selects highest bitrate audio format

**Method 2: play-dl** (Fallback 1)
```typescript
async function tryPlayDL(videoId: string): Promise<AudioStream>
```
- Fast validation and extraction
- Good for recent videos
- Audio format filtering
- 5-second timeout

**Method 3: youtubei.js** (Fallback 2)
```typescript
async function tryInnertube(videoId: string): Promise<AudioStream>
```
- Uses YouTube's internal API (Innertube)
- Handles signature deciphering
- More complex but robust
- 7-second timeout
- Creates player script cache files (auto-cleaned)

**Method 4: Invidious API** (Fallback 3)
```typescript
async function tryInvidiousAPI(videoId: string): Promise<AudioStream>
```
- Multiple instance fallback (4 instances)
- Privacy-focused alternative
- 8-second total timeout (3s per instance)
- Instances:
  - yewtu.be
  - invidious.kavin.rocks
  - vid.puffyan.us
  - invidious.snopyta.org

**Method 5: IFrame Embed** (Last Resort)
```typescript
async function tryIframeAudio(videoId: string): Promise<AudioStream>
```
- Returns YouTube embed URL for frontend
- Instant (no timeout)
- Uses YouTube IFrame Player API
- Session-locked once used (prevents tracking)
- Only used when all else fails

#### 3. **Session-Based Caching Strategy**

```typescript
let successfulMethod: string | null = null;
let methodFailCount: Record<string, number> = {};
const MAX_FAILS_BEFORE_RESET = 3;
```

**How it works**:
1. **First request**: Try all methods in order until one succeeds
2. **Lock to winner**: Cache the successful method name
3. **Subsequent requests**: Use only the cached method (fast!)
4. **Failure handling**: 
   - Count failures per method
   - After 3 consecutive fails, reset cache
   - Find new best method
5. **IFrame special case**: Once locked to iframe, stay there for session

**Benefits**:
- ⚡ Minimum latency after first success
- 🎯 No unnecessary retries
- 🔄 Auto-recovery from temporary failures
- 🛡️ Session-based tracking prevention (iframe)

#### 4. **Automatic Cleanup System**

```typescript
// Cleanup player script files every 5 minutes
setInterval(cleanupPlayerScripts, 5 * 60 * 1000);
cleanupPlayerScripts(); // Run on startup
```

**Purpose**: Remove temporary player script files created by YouTube libraries
- Runs on server startup
- Periodic cleanup every 5 minutes
- Silent failures (won't crash app)
- Cleans root and server directories

---

## Frontend Architecture

### Technology Stack
- **Framework**: React 18 (v18.2+)
- **Language**: TypeScript (v5.3+)
- **Build Tool**: Vite (v5.4+)
- **Styling**: TailwindCSS (v3.4+)
- **Animations**: Framer Motion (v11+)
- **State Management**: Zustand (v4.4+)
- **Storage**: localforage (v1.10+) - IndexedDB wrapper
- **Routing**: React Router DOM (v6.21+)

### Application Structure

```
client/src/
├── components/          # Reusable UI components
│   ├── PlayerBar.tsx   # Bottom player controls
│   ├── Sidebar.tsx     # Navigation sidebar
│   └── TrackCard.tsx   # Individual track display
│
├── pages/              # Route pages
│   ├── HomePage.tsx    # Landing page
│   ├── SearchPage.tsx  # Search interface + results
│   ├── LikedPage.tsx   # Saved/liked songs
│   └── QueuePage.tsx   # Playback queue
│
├── services/           # Business logic
│   ├── player.ts       # Player state & logic (Zustand)
│   └── api.ts          # Backend communication
│
├── App.tsx            # Root component + routing
└── main.tsx           # Entry point
```

### State Management (Zustand)

**Player Store** (`services/player.ts`):
```typescript
interface PlayerStore {
  // Current playback
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  
  // Queue management
  queue: Track[];
  
  // Liked songs (persisted to IndexedDB)
  likedSongs: Track[];
  
  // Audio elements
  audioElement: HTMLAudioElement | null;
  youtubePlayer: YT.Player | null;
  
  // Actions
  play: (track: Track) => Promise<void>;
  pause: () => void;
  next: () => void;
  prev: () => void;
  addToQueue: (track: Track) => void;
  toggleLike: (track: Track) => void;
}
```

**Key Features**:
- Persistent storage with localforage (IndexedDB)
- Automatic queue management (FIFO)
- Immediate stream termination on track change
- Dual audio handling (HTMLAudioElement + YouTube IFrame)

### Player Logic Flow

```
User clicks Play
       │
       ▼
┌──────────────────────────────────────┐
│  Is stream already playing?          │
│  YES → Terminate current stream      │
└──────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Fetch stream URL from backend       │
│  GET /api/track/:id/stream           │
└──────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Stream source type?                 │
├──────────────────────────────────────┤
│  ├─ Direct URL → HTMLAudioElement    │
│  └─ IFrame → YouTube IFrame Player   │
└──────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Auto-remove from queue (if queued)  │
│  Auto-play next when song ends       │
└──────────────────────────────────────┘
```

### UI Layer

**Pages**:

1. **HomePage** - Landing page with app intro
2. **SearchPage**:
   - Search input with real-time API calls
   - Grid of track results
   - Play + Add to Queue buttons per track
3. **LikedPage**:
   - Reversed order (newest first)
   - Play All → adds entire playlist to queue
   - Click song → adds from that position onward
4. **QueuePage**:
   - Current queue display
   - Remove individual tracks
   - Clear entire queue

**Components**:

1. **PlayerBar** (Bottom sticky):
   - Current track info
   - Play/Pause/Next/Prev controls
   - Volume slider
   - Progress bar
   - Queue badge (shows count)

2. **Sidebar**:
   - Navigation links
   - App branding

3. **TrackCard**:
   - Thumbnail
   - Title/Artist
   - Duration
   - Action buttons

---

## Data Flow

### Search Flow
```
User types query
       │
       ▼
Frontend debounce (500ms)
       │
       ▼
GET /api/search?q=query
       │
       ▼
Backend: youtubei.js.search()
       │
       ▼
YouTube API
       │
       ▼
Backend: Parse & format results
       │
       ▼
Frontend: Display in grid
```

### Playback Flow
```
User clicks Play
       │
       ▼
Frontend: player.play(track)
       │
       ▼
GET /api/track/:id/stream
       │
       ▼
Backend: getAudioStream(videoId)
       │
       ├─► Try cached method (if available)
       │   └─► Success → Return URL
       │
       └─► Try fallback chain
           └─► Cache successful method
           └─► Return URL
       │
       ▼
Frontend: 
  ├─ Direct URL → audioElement.src = url
  └─ IFrame → Load YouTube IFrame Player
       │
       ▼
Auto-queue management
Auto-play next on end
```

---

## Caching Strategy

### Server-Side (Session Cache)
```typescript
// In-memory cache (per server instance)
successfulMethod: string | null
methodFailCount: Record<string, number>
```

**Lifecycle**:
- Lives for entire server session
- Resets on server restart
- Resets after 3 consecutive failures
- IFrame locks permanently once used

**Benefits**:
- Minimum latency (single method check)
- No database required
- Auto-recovery
- Privacy (iframe tracking control)

### Client-Side (Browser Cache)

**IndexedDB (via localforage)**:
```typescript
// Persisted data
likedSongs: Track[]  // User's saved tracks
```

**Session Storage**:
```typescript
// In-memory only
currentTrack: Track | null
queue: Track[]
isPlaying: boolean
volume: number
```

**Audio Elements**:
- Browser automatically caches audio chunks
- IFrame player handles its own caching

---

## Performance Optimizations

### Backend
1. **Fast timeouts**: 5-8 seconds max per method
2. **Session caching**: Avoid repeated method discovery
3. **No retries**: Single attempt per method (fast fail)
4. **Parallel fallback**: Instant switch to next method
5. **Cleanup automation**: Background file cleanup (non-blocking)

### Frontend
1. **Code splitting**: Vite automatic chunking
2. **Lazy loading**: React.lazy for routes
3. **Debounced search**: 500ms delay on input
4. **IndexedDB**: Async storage (non-blocking UI)
5. **Framer Motion**: Hardware-accelerated animations
6. **Virtual scrolling**: (Could be added for large lists)

### Network
1. **CORS optimization**: Single origin policy
2. **HTTP/2**: Supported by Fastify
3. **Compression**: Automatic in production build
4. **CDN-ready**: Static assets via Vite build

---

## Error Handling

### Backend
```typescript
try {
  // Try method
  return await method(videoId);
} catch (error) {
  // Log error (console)
  // Try next fallback
  // If all fail, return error response
}
```

**Response Codes**:
- `200`: Success
- `404`: Video not found
- `500`: All methods failed
- `503`: Service temporarily unavailable

### Frontend
```typescript
try {
  // API call
  const data = await fetchStream(trackId);
  // Play audio
} catch (error) {
  // Show user-friendly error message
  // Log to console
  // Keep app functional
}
```

**User Experience**:
- Non-blocking errors (app stays functional)
- Graceful degradation
- Retry options where applicable

---

## Security Considerations

### Backend
1. **No file storage**: Stream URLs only (no copyright issues)
2. **CORS whitelist**: Frontend origin only
3. **Rate limiting**: Could be added via Fastify plugin
4. **Input validation**: URL encoding, query sanitization

### Frontend
1. **XSS prevention**: React's built-in escaping
2. **HTTPS required**: Production deployment
3. **No sensitive data**: No user accounts/passwords
4. **LocalStorage encryption**: Not needed (no sensitive data)

### Privacy
1. **No tracking**: Minimal data collection
2. **IFrame isolation**: Session-locked to prevent excessive tracking
3. **No analytics**: (Can be added optionally)
4. **No external CDNs**: Self-hosted assets

---

## Deployment Architecture

### Development
```
Terminal 1: cd server && npm run dev   (Port 3001)
Terminal 2: cd client && npm run dev   (Port 5173)
```

### Production
```
Backend:
  npm run build  → TypeScript → JavaScript (dist/)
  npm start      → node dist/index.js

Frontend:
  npm run build  → Vite → Optimized bundle (dist/)
  Serve via Nginx/Apache or Vercel/Netlify
```

**Recommended Stack**:
- **Backend**: VPS (DigitalOcean, Linode) or Railway
- **Frontend**: Vercel, Netlify, or Cloudflare Pages
- **Domain**: Cloudflare DNS + SSL
- **Monitoring**: PM2 (backend), Sentry (errors)

---

## Key Metrics

### Performance Targets
- **Stream resolution**: <2s (cached method)
- **Search response**: <1s
- **Metadata fetch**: <1s
- **UI responsiveness**: 60fps animations
- **Bundle size**: <500KB gzipped

### Reliability
- **Stream success rate**: >95% (multi-fallback)
- **Uptime**: 99.9% (with proper hosting)
- **Error recovery**: Automatic (method fallback)

---

## Future Enhancements

### Potential Features
1. **Playlist management**: Create/share playlists
2. **User accounts**: Cloud sync of liked songs
3. **Offline mode**: Service Worker caching
4. **Lyrics integration**: Genius API or similar
5. **Radio mode**: Auto-play similar songs
6. **Social features**: Share tracks, collaborative playlists
7. **Mobile app**: React Native conversion
8. **Desktop app**: Electron wrapper
9. **Audio visualization**: Canvas/WebGL visualizer
10. **Equalizer**: Web Audio API controls

### Technical Improvements
1. **Redis caching**: Persistent stream URL cache
2. **WebSocket**: Real-time updates
3. **GraphQL**: More efficient data fetching
4. **CDN integration**: Faster static asset delivery
5. **Docker**: Containerized deployment
6. **Load balancing**: Multi-instance backend
7. **Monitoring**: Prometheus + Grafana
8. **Testing**: Unit + E2E tests

---

## Development Guidelines

### Code Style
- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb config (can be added)
- **Prettier**: Formatting (can be added)
- **Naming**: camelCase (variables), PascalCase (components)

### Git Workflow
- **Branches**: feature/*, bugfix/*, hotfix/*
- **Commits**: Conventional commits
- **PRs**: Required for main branch

### Testing Strategy (To be implemented)
- **Unit**: Vitest for utilities
- **Integration**: API endpoint tests
- **E2E**: Playwright for user flows
- **Coverage**: 80%+ target

---

## Troubleshooting

### Common Issues

**Issue**: Stream fails to load
- **Solution**: Check backend logs, try different method manually, verify YouTube video availability

**Issue**: Search returns empty
- **Solution**: Check YouTube API quota, verify network connectivity, try different search query

**Issue**: Audio stuttering
- **Solution**: Check network speed, reduce quality in player, clear browser cache

**Issue**: IFrame won't load
- **Solution**: Check CORS settings, verify YouTube embed allowed, disable ad blockers

**Issue**: Player script files accumulating
- **Solution**: Auto-cleanup runs every 5 minutes, or manual: `find . -name "*-player-script.js" -delete`

---

## Technology Choices Rationale

### Why Fastify?
- ✅ Fastest Node.js framework (benchmarked)
- ✅ Built-in schema validation
- ✅ Plugin ecosystem
- ✅ TypeScript support

### Why Zustand?
- ✅ Lightweight (1KB)
- ✅ No boilerplate (vs Redux)
- ✅ React hooks integration
- ✅ Persistent storage support

### Why Vite?
- ✅ Instant HMR (Hot Module Replacement)
- ✅ Fast builds (esbuild)
- ✅ Modern ES modules
- ✅ Plugin ecosystem

### Why localforage?
- ✅ IndexedDB wrapper (better than localStorage)
- ✅ Automatic fallback (localStorage → WebSQL)
- ✅ Promise-based API
- ✅ Large storage capacity

### Why Multiple YouTube Libraries?
- ✅ Redundancy (if one breaks, others work)
- ✅ Coverage (different methods for different videos)
- ✅ Performance (fastest available method)
- ✅ Reliability (>95% success rate)

---

## Conclusion

MusicMu is built with a focus on:
- **Performance**: Fast stream resolution, minimal latency
- **Reliability**: Multi-method fallback, auto-recovery
- **Privacy**: No tracking, minimal data collection
- **Freedom**: No ads, unlimited skips, complete control
- **Simplicity**: Clean code, easy to maintain
- **Scalability**: Ready for enhancements and deployment

The architecture is designed to be **production-ready** while maintaining **developer-friendly** code structure.

---

## Legal Disclaimer

**MusicMu is an open-source project and is not affiliated with, endorsed by, or sponsored by Google LLC or any other content provider.**

This application:
- Uses publicly available APIs and libraries
- Does not store or redistribute copyrighted content
- Streams content directly from original sources
- Is provided for educational and personal use

Users are responsible for ensuring their usage complies with local laws and terms of service of content providers.
