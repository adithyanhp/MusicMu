# YouTube Player Script Auto-Cleanup

## Problem
YouTube streaming libraries (`@distube/ytdl-core`, `youtubei.js`) generate temporary player script files with names like `1762965497458-player-script.js` during audio stream extraction. These files were accumulating in the project directories.

## Solution Implemented

### 1. **Automatic Cleanup** ✅
Added automatic cleanup that:
- Runs on server startup
- Runs every 5 minutes while server is active
- Silently removes all `*-player-script.js` files from:
  - Root directory (`/`)
  - Server directory (`/server`)

**Files Modified:**
- `/server/src/lib/youtube.ts` - Added cleanup functions

### 2. **Git Ignore** ✅
Added pattern to `.gitignore` to prevent tracking these files:
```
# YouTube player script cache files
*-player-script.js
```

### 3. **Removed Unused Dependency** ✅
Removed `yt-stream` package which was imported but never used.

## Why Not Block Creation?

**Cannot block creation because:**
1. These files are created by third-party libraries (`@distube/ytdl-core`, `youtubei.js`) internally
2. The libraries need these scripts to decipher YouTube signatures
3. Blocking creation would break audio streaming functionality

**Auto-removal is the best approach because:**
- ✅ Doesn't break functionality
- ✅ Keeps directories clean
- ✅ Runs automatically in background
- ✅ No performance impact (runs every 5 minutes)
- ✅ Silent failures won't crash the app

## How It Works

```typescript
// Cleanup runs:
// 1. On server startup
// 2. Every 5 minutes thereafter

setInterval(cleanupPlayerScripts, 5 * 60 * 1000);
cleanupPlayerScripts(); // Run on startup
```

The cleanup:
1. Scans root and server directories
2. Finds all files matching `*-player-script.js`
3. Deletes them silently (ignores errors)
4. Continues without affecting app functionality

## Manual Cleanup (if needed)

```bash
# From project root
find . -name "*-player-script.js" -not -path "./node_modules/*" -delete
```

## Monitoring

The player scripts are now automatically managed and won't accumulate. If you ever see them, they'll be cleaned up within 5 minutes maximum.
