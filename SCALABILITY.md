# 🚀 Scalability & Performance Features

## Overview

MusicMu backend is now optimized to handle **10 concurrent users** efficiently using 100% free, in-memory solutions. No external services required!

## ✅ Implemented Features

### 1. **Rate Limiting** 🛡️

**What it does:**
- Prevents abuse and spam
- Limits each IP to 100 requests per minute
- Protects server from accidental DDoS

**Configuration:**
- Max requests: 100/minute per IP
- Auto-resets every minute
- Returns 429 status code when exceeded

**Response when rate limited:**
```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again in 30 seconds"
}
```

### 2. **Request Queuing** ⏳

**What it does:**
- Controls concurrent operations
- Prevents server overload
- Smooths out traffic spikes

**Queue Configurations:**

| Queue Type | Concurrency | Timeout | Purpose |
|------------|-------------|---------|---------|
| Stream Resolution | 10 | 30s | Handles audio stream requests |
| Search | 5 | 15s | Handles search requests |

**How it works:**
- When 10 users request streams simultaneously, all are processed
- User #11's request waits in queue
- Requests are processed in FIFO order
- Automatic timeout after 30s for streams, 15s for searches

### 3. **Monitoring Endpoint** 📊

**Endpoint:** `GET /api/stats`

**Returns:**
```json
{
  "queues": {
    "stream": {
      "pending": 3,
      "queued": 2,
      "concurrency": 10
    },
    "search": {
      "pending": 1,
      "queued": 0,
      "concurrency": 5
    }
  },
  "uptime": 3600,
  "memory": {
    "rss": 45678912,
    "heapTotal": 12345678,
    "heapUsed": 9876543,
    "external": 123456
  }
}
```

**Use cases:**
- Monitor server health
- Debug performance issues
- Check if queues are backing up

## 📈 Performance Characteristics

### Supported Load (Single Instance)

| Metric | Value | Notes |
|--------|-------|-------|
| Concurrent Users | 10 | Optimal performance |
| Peak Users | 15-20 | Some queuing, still responsive |
| Max Users | 25-30 | Heavy queuing, slower responses |
| Requests/minute | 100/IP | Rate limit protection |
| Stream Concurrency | 10 | Simultaneous stream resolutions |
| Search Concurrency | 5 | Simultaneous searches |

### Response Times (Expected)

| Scenario | Response Time |
|----------|---------------|
| 1-5 users | 3-5 seconds |
| 5-10 users | 4-6 seconds |
| 10-15 users | 5-8 seconds |
| 15-20 users | 8-12 seconds |
| 20+ users | 12-20 seconds (queued) |

## 🎯 Cost Analysis

**Total Cost: $0/month** 💚

| Component | Cost | Alternative |
|-----------|------|-------------|
| Rate Limiting | $0 | In-memory (@fastify/rate-limit) |
| Request Queue | $0 | In-memory (p-queue) |
| Session Cache | $0 | In-memory (variables) |
| **Total** | **$0** | Redis would be $5-15/mo |

## 🔧 Configuration

### Environment Variables

```bash
# server/.env
PORT=3001
HOST=0.0.0.0
LOG_LEVEL=info
CORS_ORIGIN=*

# Queue settings (optional - defaults shown)
STREAM_QUEUE_CONCURRENCY=10
SEARCH_QUEUE_CONCURRENCY=5
```

### Tuning for Different Loads

**For 5 users (low traffic):**
```env
STREAM_QUEUE_CONCURRENCY=5
SEARCH_QUEUE_CONCURRENCY=3
```

**For 10 users (current default):**
```env
STREAM_QUEUE_CONCURRENCY=10
SEARCH_QUEUE_CONCURRENCY=5
```

**For 20 users (if you upgrade server):**
```env
STREAM_QUEUE_CONCURRENCY=20
SEARCH_QUEUE_CONCURRENCY=10
```

## 📊 Monitoring

### Check Queue Status

```bash
curl http://localhost:3001/api/stats
```

### Watch Server Logs

Look for these indicators:

**✅ Healthy:**
```
🎵 MusicMu Server running on http://0.0.0.0:3001
💾 Locked to ytdl-core for this session
```

**⚠️ Queuing (Normal under load):**
```
⏳ Stream queue: 3 pending, 2 waiting
🔍 Search queue: 1 pending, 0 waiting
```

**🔴 Problems:**
```
❌ Stream queue error: Timeout
⚠️ ytdl-core failed 3 times, finding new method
```

## 🚦 Traffic Patterns

### What to Expect

**10 concurrent users scenario:**
- All can search simultaneously (some queued)
- All can play different songs (all handled)
- Smooth experience, minor delays (< 10s)

**Peak load scenario (15-20 users):**
- Searches queued (5 at a time)
- Streams queued (10 at a time)
- Longer wait times (10-15s)
- System remains stable

**Overload scenario (25+ users):**
- Heavy queuing
- Some timeouts possible
- Need to scale up

## 🎓 When to Scale Up

### Signs you need more capacity:

1. **Queue stats show consistent backlog:**
   ```json
   {"stream": {"pending": 10, "queued": 15}}
   ```

2. **Users report slow responses** (>20s)

3. **Frequent timeout errors** in logs

4. **Memory usage consistently >80%**

### Scaling Options (when needed):

**Option 1: Upgrade Server** (Still Free)
- Deploy to larger free tier (Railway, Render)
- Increase queue concurrency to 20

**Option 2: Add Redis** ($5/month)
- Cache stream URLs
- Share cache across sessions
- 10x faster for popular songs

**Option 3: Horizontal Scaling** ($30/month)
- Multiple backend instances
- Load balancer
- Handle 100+ users

## 🎯 Current Sweet Spot

**10 concurrent users**
- ✅ Free hosting
- ✅ No external dependencies
- ✅ Fast response times
- ✅ Stable and reliable
- ✅ Easy to maintain

**Perfect for:**
- Personal use
- Friends & family
- Small communities
- Beta testing
- Proof of concept

## 🔮 Future Improvements

When you need them (100+ users):

1. **Redis caching** - Cache popular songs
2. **CDN** - Serve static assets faster
3. **Load balancing** - Multiple server instances
4. **Database** - User accounts, analytics
5. **Monitoring** - Sentry, DataDog
6. **Auto-scaling** - Kubernetes, AWS ECS

---

**Remember:** Start simple, measure actual usage, scale when needed. Don't over-engineer for problems you don't have yet! 🚀
