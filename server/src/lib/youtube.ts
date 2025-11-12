import { Innertube } from 'youtubei.js';
import play from 'play-dl';
import ytdl from '@distube/ytdl-core';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

export interface AudioStream {
  url: string;
  source: string;
  bitrate?: number;
}

export interface TrackMetadata {
  videoId: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail: string;
}

export interface SearchResult {
  videoId: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail: string;
}

// Cache for Innertube instance
let innertubeInstance: Innertube | null = null;

// Cache for successful method per session
let successfulMethod: string | null = null;
let methodFailCount: Record<string, number> = {};
const MAX_FAILS_BEFORE_RESET = 3; // Reset to trying all methods after 3 consecutive fails

// Get directory path for cleanup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cleanup player script files - runs periodically
async function cleanupPlayerScripts(): Promise<void> {
  try {
    // Clean root directory
    const rootDir = path.join(__dirname, '../../..');
    await cleanupScriptsInDirectory(rootDir);
    
    // Clean server directory
    const serverDir = path.join(__dirname, '../..');
    await cleanupScriptsInDirectory(serverDir);
  } catch (error) {
    // Silently fail - cleanup is not critical
  }
}

async function cleanupScriptsInDirectory(dir: string): Promise<void> {
  try {
    const files = await fs.readdir(dir);
    const playerScripts = files.filter(file => file.endsWith('-player-script.js'));
    
    for (const file of playerScripts) {
      try {
        await fs.unlink(path.join(dir, file));
      } catch {
        // Ignore errors on individual file deletion
      }
    }
  } catch {
    // Ignore directory read errors
  }
}

// Run cleanup periodically (every 5 minutes)
setInterval(cleanupPlayerScripts, 5 * 60 * 1000);

// Also run on startup
cleanupPlayerScripts();

async function getInnertubeInstance(): Promise<Innertube> {
  if (!innertubeInstance) {
    innertubeInstance = await Innertube.create({
      lang: 'en',
      location: 'US',
      retrieve_player: true,
    });
  }
  return innertubeInstance;
}

// Helper function to add timeout to any promise
function withTimeout<T>(promise: Promise<T>, ms: number, name: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`${name} timeout after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}

// Primary: @distube/ytdl-core - Most reliable
async function tryYTDL(videoId: string): Promise<AudioStream> {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const info = await ytdl.getInfo(url, {
    requestOptions: {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    }
  });
  
  const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
  
  if (audioFormats.length === 0) {
    throw new Error('No audio-only formats available');
  }

  const bestAudio = audioFormats.reduce((best, current) => {
    const bestBitrate = parseInt(best.audioBitrate?.toString() || '0');
    const currentBitrate = parseInt(current.audioBitrate?.toString() || '0');
    return currentBitrate > bestBitrate ? current : best;
  });

  if (!bestAudio.url) {
    throw new Error('No URL in best audio format');
  }

  return {
    url: bestAudio.url,
    source: 'ytdl-core',
    bitrate: parseInt(bestAudio.audioBitrate?.toString() || '0'),
  };
}

// Fallback 1: play-dl - Fast and reliable
async function tryPlayDL(videoId: string): Promise<AudioStream> {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  
  const isValid = await play.yt_validate(url);
  if (isValid !== 'video') {
    throw new Error('Invalid YouTube URL');
  }
  
  const info = await play.video_info(url);
  const formats = info.format;
  
  const audioFormats = formats.filter((f: any) => f.mimeType?.includes('audio'));
  
  if (audioFormats.length === 0) {
    throw new Error('No audio formats available');
  }
  
  const bestAudio = audioFormats.reduce((best: any, current: any) => {
    return (current.bitrate || 0) > (best.bitrate || 0) ? current : best;
  });
  
  if (!bestAudio.url) {
    throw new Error('No valid URL in audio format');
  }
  
  return {
    url: bestAudio.url,
    source: 'play-dl',
    bitrate: bestAudio.bitrate || 0,
  };
}

// Fallback 2: youtubei.js (Innertube)
async function tryInnertube(videoId: string): Promise<AudioStream> {
  const yt = await Innertube.create({
    lang: 'en',
    location: 'US',
    retrieve_player: true,
  });
  
  const info = await yt.getInfo(videoId);
  
  const format = info.chooseFormat({ 
    quality: 'best',
    type: 'audio'
  });
  
  if (!format) {
    throw new Error('No audio format available');
  }
  
  let url: string;
  if (format.decipher) {
    url = format.decipher(yt.session.player);
  } else if (format.url) {
    url = format.url;
  } else {
    throw new Error('Cannot extract URL from format');
  }
  
  return {
    url,
    source: 'youtubei.js',
    bitrate: format.bitrate,
  };
}

// Fallback 3: Invidious API - Multiple instances
async function tryInvidiousAPI(videoId: string): Promise<AudioStream> {
  const instances = [
    'https://yewtu.be',
    'https://invidious.kavin.rocks',
    'https://vid.puffyan.us',
    'https://invidious.snopyta.org',
  ];
  
  let lastInstanceError: any;
  
  for (const instance of instances) {
    try {
      const response = await axios.get(`${instance}/api/v1/videos/${videoId}`, {
        timeout: 3000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      
      const data = response.data;
      
      const audioFormats = data.adaptiveFormats?.filter(
        (f: any) => f.type?.includes('audio')
      ) || [];
      
      if (audioFormats.length > 0) {
        audioFormats.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
        const bestAudio = audioFormats[0];
        
        if (!bestAudio.url) {
          throw new Error('No URL in audio format');
        }
        
        return {
          url: bestAudio.url,
          source: 'invidious',
          bitrate: bestAudio.bitrate || 0,
        };
      }
    } catch (error) {
      lastInstanceError = error;
      continue;
    }
  }
  
  throw new Error(`All Invidious instances failed`);
}

// Fallback 4: IFrame embed (last resort - returns embed URL for frontend)
async function tryIframeAudio(videoId: string): Promise<AudioStream> {
  return {
    url: `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`,
    source: 'iframe',
  };
}

// Main resolver - Find best method once, then stick to it
export async function getAudioStream(videoId: string): Promise<AudioStream> {
  // If iframe was successful before, stick to it for this session
  if (successfulMethod === 'iframe') {
    console.log(`🎯 Using iframe (session locked)`);
    return tryIframeAudio(videoId);
  }

  // If we have a successful method cached, use it immediately
  if (successfulMethod) {
    const methods: Record<string, () => Promise<AudioStream>> = {
      'ytdl-core': () => withTimeout(tryYTDL(videoId), 5000, 'ytdl-core'),
      'play-dl': () => withTimeout(tryPlayDL(videoId), 5000, 'play-dl'),
      'youtubei.js': () => withTimeout(tryInnertube(videoId), 7000, 'youtubei.js'),
      'invidious': () => withTimeout(tryInvidiousAPI(videoId), 8000, 'invidious'),
    };

    const cachedFn = methods[successfulMethod];
    if (cachedFn) {
      try {
        const result = await cachedFn();
        methodFailCount[successfulMethod] = 0;
        return result;
      } catch (error) {
        methodFailCount[successfulMethod] = (methodFailCount[successfulMethod] || 0) + 1;
        
        // If cached method fails too many times, reset and find new method
        if (methodFailCount[successfulMethod] >= MAX_FAILS_BEFORE_RESET) {
          console.log(`⚠️ ${successfulMethod} failed ${MAX_FAILS_BEFORE_RESET} times, finding new method`);
          successfulMethod = null;
          methodFailCount = {};
        }
      }
    }
  }

  // First time or reset - find best available method
  const fallbacks = [
    { name: 'ytdl-core', fn: () => withTimeout(tryYTDL(videoId), 5000, 'ytdl-core') },
    { name: 'play-dl', fn: () => withTimeout(tryPlayDL(videoId), 5000, 'play-dl') },
    { name: 'youtubei.js', fn: () => withTimeout(tryInnertube(videoId), 7000, 'youtubei.js') },
    { name: 'invidious', fn: () => withTimeout(tryInvidiousAPI(videoId), 8000, 'invidious') },
    { name: 'iframe', fn: () => tryIframeAudio(videoId) },
  ];

  let lastError: any = null;

  // Try each method until one succeeds
  for (const { name, fn } of fallbacks) {
    if (name === successfulMethod) continue; // Already tried above
    
    try {
      console.log(`⚡ Trying ${name}...`);
      const result = await fn();
      
      // Lock to this method for the session
      successfulMethod = name;
      methodFailCount[name] = 0;
      console.log(`💾 Locked to ${name} for this session`);
      
      return result;
    } catch (error) {
      lastError = error;
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.log(`❌ ${name} failed: ${errorMsg.slice(0, 80)}`);
      continue;
    }
  }

  throw new Error(`All methods failed. Last: ${lastError?.message || 'Unknown'}`);
}

// Get metadata with timeout
export async function getMetadata(videoId: string): Promise<TrackMetadata> {
  try {
    const yt = await getInnertubeInstance();
    const infoPromise = yt.getInfo(videoId);
    const info = await withTimeout(infoPromise, 8000, 'Metadata fetch');
    
    const details = info.basic_info;
    
    return {
      videoId,
      title: details.title || 'Unknown Title',
      artist: details.author || 'Unknown Artist',
      duration: details.duration || 0,
      thumbnail: details.thumbnail?.[0]?.url || '',
    };
  } catch (error) {
    console.error('Innertube metadata failed, trying ytdl-core...', error);
    
    try {
      const infoPromise = ytdl.getBasicInfo(videoId);
      const info = await withTimeout(infoPromise, 8000, 'ytdl-core metadata');
      return {
        videoId,
        title: info.videoDetails.title || 'Unknown Title',
        artist: info.videoDetails.author.name || 'Unknown Artist',
        duration: parseInt(info.videoDetails.lengthSeconds) || 0,
        thumbnail: info.videoDetails.thumbnails[0]?.url || '',
      };
    } catch (fallbackError) {
      // Return basic metadata if all else fails
      console.error('All metadata sources failed, returning basic info');
      return {
        videoId,
        title: 'Unknown Title',
        artist: 'Unknown Artist',
        duration: 0,
        thumbnail: '',
      };
    }
  }
}

// Search using Innertube
export async function search(query: string, limit: number = 10): Promise<SearchResult[]> {
  try {
    const yt = await getInnertubeInstance();
    
    // Add timeout to prevent hanging
    const searchPromise = yt.search(query, {
      type: 'video',
    });
    
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Search timeout')), 15000)
    );
    
    const results = await Promise.race([searchPromise, timeoutPromise]);

    const videos = results.videos || [];
    
    return videos.slice(0, limit).map((video: any) => ({
      videoId: video.id,
      title: video.title?.text || video.title || 'Unknown Title',
      artist: video.author?.name || 'Unknown Artist',
      duration: video.duration?.seconds || 0,
      thumbnail: video.thumbnails?.[0]?.url || video.best_thumbnail?.url || '',
    }));
  } catch (error) {
    console.error('Search failed:', error);
    // Return empty array instead of throwing to prevent 500 errors
    return [];
  }
}

// Utility function to reset session cache (useful for debugging or session restart)
export function resetStreamMethodCache(): void {
  const previousMethod = successfulMethod;
  successfulMethod = null;
  methodFailCount = {};
  console.log(`🔄 Stream method cache reset (was: ${previousMethod || 'none'})`);
}

// Utility function to get current cache status
export function getStreamMethodCacheStatus(): { method: string | null; failCounts: Record<string, number> } {
  return {
    method: successfulMethod,
    failCounts: { ...methodFailCount }
  };
}
