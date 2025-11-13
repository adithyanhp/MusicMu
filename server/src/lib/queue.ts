import PQueue from 'p-queue';

/**
 * Request Queue Manager
 * Prevents server overload by limiting concurrent operations
 * 100% free, in-memory solution
 */

// Concurrency limits (tuned for 10 concurrent users)
const STREAM_CONCURRENCY = 10;  // Max 10 simultaneous stream resolutions
const SEARCH_CONCURRENCY = 5;   // Max 5 simultaneous searches

/**
 * Queue for stream resolution
 * Prevents overwhelming the server with too many stream requests
 */
export const streamQueue = new PQueue({
  concurrency: STREAM_CONCURRENCY,
  timeout: 30000, // 30 second timeout per request
});

/**
 * Queue for search requests
 * Search is more resource-intensive, so lower concurrency
 */
export const searchQueue = new PQueue({
  concurrency: SEARCH_CONCURRENCY,
  timeout: 15000, // 15 second timeout
});

// Monitor queue activity
streamQueue.on('active', () => {
  if (streamQueue.pending > 0) {
    console.log(`⏳ Stream queue: ${streamQueue.pending} pending, ${streamQueue.size} waiting`);
  }
});

searchQueue.on('active', () => {
  if (searchQueue.pending > 0) {
    console.log(`🔍 Search queue: ${searchQueue.pending} pending, ${searchQueue.size} waiting`);
  }
});

streamQueue.on('error', (error) => {
  console.error('❌ Stream queue error:', error.message);
});

searchQueue.on('error', (error) => {
  console.error('❌ Search queue error:', error.message);
});

/**
 * Get queue statistics (for monitoring endpoint)
 */
export function getQueueStats() {
  return {
    stream: {
      pending: streamQueue.pending,
      queued: streamQueue.size,
      concurrency: STREAM_CONCURRENCY,
    },
    search: {
      pending: searchQueue.pending,
      queued: searchQueue.size,
      concurrency: SEARCH_CONCURRENCY,
    },
  };
}
