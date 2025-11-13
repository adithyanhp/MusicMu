#!/bin/bash

echo "🎵 Starting MusicMu (Production Mode)..."
echo ""

# Get local IP address
LOCAL_IP=$(hostname -I | awk '{print $1}')

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Start backend
echo "🚀 Starting backend on port 3001..."
cd "$SCRIPT_DIR/server" && node dist/index.js > "$SCRIPT_DIR/server.log" 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
sleep 2

# Start frontend using serve
echo "🎨 Starting frontend on port 5173..."
cd "$SCRIPT_DIR/client"
node serve.js > "$SCRIPT_DIR/client.log" 2>&1 &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers started!"
echo ""
echo "🏠 LOCAL ACCESS (This Device):"
echo "   📡 Backend:  http://localhost:3001"
echo "   🌐 Frontend: http://localhost:5173"
echo "   🌐 MusicMu:  http://musicmu.local:5173"
echo ""
echo "🌍 NETWORK ACCESS (Other Devices):"
echo "   📡 Backend:  http://$LOCAL_IP:3001"
echo "   🌐 Frontend: http://$LOCAL_IP:5173"
echo ""
echo "📱 Open http://musicmu.local:5173 on any device!"
echo ""
echo "📝 Logs:"
echo "   Backend: tail -f $SCRIPT_DIR/server.log"
echo "   Frontend: tail -f $SCRIPT_DIR/client.log"
echo ""
echo "🛑 To stop: kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "PIDs: Backend=$BACKEND_PID Frontend=$FRONTEND_PID"

# Save PIDs to file for easy stopping
echo "$BACKEND_PID $FRONTEND_PID" > "$SCRIPT_DIR/.musicmu.pids"

# Monitor processes - restart if they die
while true; do
  if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "⚠️ Backend died, restarting..."
    cd "$SCRIPT_DIR/server" && node dist/index.js > "$SCRIPT_DIR/server.log" 2>&1 &
    BACKEND_PID=$!
  fi
  
  if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "⚠️ Frontend died, restarting..."
    cd "$SCRIPT_DIR/client" && node serve.js > "$SCRIPT_DIR/client.log" 2>&1 &
    FRONTEND_PID=$!
  fi
  
  sleep 5
done
