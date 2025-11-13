#!/bin/bash

echo "🎵 Starting MusicMu..."
echo ""

# Get local IP address
LOCAL_IP=$(hostname -I | awk '{print $1}')

# Check if tmux is available
if ! command -v tmux &> /dev/null; then
    echo "⚠️  tmux not found. Starting servers in background..."
    
    # Start backend
    echo "🚀 Starting backend on port 3001..."
    cd "$PWD/server" && npm run dev > "$PWD/server.log" 2>&1 &
    BACKEND_PID=$!
    
    # Wait a bit for backend to start
    sleep 3
    
    # Start frontend
    echo "🎨 Starting frontend on port 5173..."
    cd "$PWD/client" && npm run dev > "$PWD/client.log" 2>&1 &
    FRONTEND_PID=$!
    
    echo ""
    echo "✅ Both servers started!"
    echo ""
    echo "� LOCAL ACCESS (This Device):"
    echo "   �📡 Backend:  http://localhost:3001"
    echo "   🌐 Frontend: http://localhost:5173"
    echo ""
    echo "🌍 NETWORK ACCESS (Other Devices):"
    echo "   📡 Backend:  http://$LOCAL_IP:3001"
    echo "   🌐 Frontend: http://$LOCAL_IP:5173"
    echo ""
    echo "� Open http://$LOCAL_IP:5173 on your phone/tablet!"
    echo ""
    echo "�📝 Logs:"
    echo "   Backend: tail -f server.log"
    echo "   Frontend: tail -f client.log"
    echo ""
    echo "🛑 To stop: kill $BACKEND_PID $FRONTEND_PID"
    
else
    echo "📺 Starting with tmux..."
    
    # Create new tmux session
    tmux new-session -d -s musicmu
    
    # Backend pane
    tmux send-keys -t musicmu "cd server && npm run dev" C-m
    
    # Split and start frontend
    tmux split-window -h -t musicmu
    tmux send-keys -t musicmu "cd client && npm run dev" C-m
    
    echo ""
    echo "✅ Servers started in tmux!"
    echo ""
    echo "� LOCAL ACCESS (This Device):"
    echo "   �📡 Backend:  http://localhost:3001"
    echo "   🌐 Frontend: http://localhost:5173"
    echo ""
    echo "🌍 NETWORK ACCESS (Other Devices):"
    echo "   📡 Backend:  http://$LOCAL_IP:3001"
    echo "   🌐 Frontend: http://$LOCAL_IP:5173"
    echo ""
    echo "📱 Open http://$LOCAL_IP:5173 on your phone/tablet!"
    echo ""
    echo "🔗 Attach to session: tmux attach -t musicmu"
    echo "🛑 To stop: tmux kill-session -t musicmu"
    echo ""
fi
