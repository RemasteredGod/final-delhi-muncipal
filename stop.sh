#!/bin/bash

echo "Stopping all services..."

# Kill processes on ports 8000 and 5001
lsof -ti:8000 | xargs kill -9 2>/dev/null && echo "✅ API stopped"
lsof -ti:5001 | xargs kill -9 2>/dev/null && echo "✅ Whisper stopped"

# Stop Redis
brew services stop redis && echo "✅ Redis stopped"

echo "===================================================="
echo "All services stopped."
echo "===================================================="
