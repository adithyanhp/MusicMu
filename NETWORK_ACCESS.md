# Network Access Setup for Mobile Testing

## The Problem
YouTube's iframe player blocks playback when accessed via IP address (e.g., `http://192.168.42.166:5173`). This is a YouTube security restriction that cannot be bypassed.

## Solution: Use a Local Hostname

Instead of accessing via IP address, use a local hostname. Here's how:

### 1. Add hostname to your computer's hosts file

**On your Linux computer** (where the server runs):
```bash
sudo nano /etc/hosts
```

Add this line:
```
127.0.0.1       musicmu.local
192.168.42.166  musicmu.local
```

Save and exit (Ctrl+X, Y, Enter).

### 2. Add hostname to your phone

**On Android:**
1. Your phone needs to be rooted, OR
2. Use a DNS app like "Hosts Go" or "DNS Override"
3. Add entry: `192.168.42.166  musicmu.local`

**On iPhone:**
1. Install an app like "DNSOverride" or "Surge"
2. Add custom DNS entry for `musicmu.local` → `192.168.42.166`

**Alternative for both (easier):**
Use a router-level hosts file if your router supports it (e.g., Pi-hole, custom firmware).

### 3. Access the app

Instead of `http://192.168.42.166:5173`, use:
```
http://musicmu.local:5173
```

This will work on both localhost and network because:
- ✅ YouTube allows hostnames (even local ones like `.local`)
- ❌ YouTube blocks IP addresses

### 4. Current Workaround (Without hostname setup)

Since setting up hostnames on mobile can be complex, here's what you can do **right now**:

**Access on your computer only** using:
- `http://localhost:5173` (works perfectly)
- Or set up SSH tunnel from phone to access via localhost

**SSH Tunnel Method:**
```bash
# On your phone (using Termux or SSH client)
ssh -L 5173:localhost:5173 -L 3001:localhost:3001 user@192.168.42.166

# Then access http://localhost:5173 on your phone
```

## Why This Happens

YouTube's iframe embed API has these restrictions:
1. ✅ Works with: `localhost`, proper domain names, `.local` hostnames
2. ❌ Blocks: IP addresses (192.168.x.x, 10.x.x.x, etc.)
3. Reason: Security policy to prevent unauthorized embedding

## Alternative: Use Production Deployment

The **best solution** is to deploy to a real domain:
- Deploy to Vercel/Netlify (frontend) + Railway/Render (backend)
- Use a proper domain like `musicmu.yourdomain.com`
- YouTube will work perfectly with a real domain

## Testing Summary

| Access Method | Works? | Why |
|--------------|--------|-----|
| `http://localhost:5173` | ✅ Yes | YouTube allows localhost |
| `http://192.168.42.166:5173` | ❌ No | YouTube blocks IP addresses |
| `http://musicmu.local:5173` | ✅ Yes | YouTube allows .local domains |
| `https://yourdomain.com` | ✅ Yes | YouTube allows real domains |

