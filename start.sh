#!/bin/bash

# Get the absolute path to the directory where this script is located
BASE_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Starting Delhi Municipal Corporation AI Helpline..."

# Check Redis is running
if ! redis-cli ping > /dev/null 2>&1; then
    echo "Starting Redis..."
    brew services start redis
    sleep 2
fi

echo "✅ Redis is running"

# Start Whisper STT in background
echo "Starting Whisper STT on port 5001..."
cd "$BASE_DIR/whisper" && python3 stt.py &
WHISPER_PID=$!

sleep 3

# Start API backend in background  
echo "Starting API backend on port 8000..."
# We run from root so .env is found automatically by load_dotenv() if standard
cd "$BASE_DIR" && python3 -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload &
API_PID=$!

echo ""
echo "===================================================="
echo "ALL SERVICES STARTED!"
echo "===================================================="
echo "  API Backend:   http://localhost:8000"
echo "  Dashboard:     http://localhost:8000/dashboard/"
echo "  Whisper STT:   http://localhost:5001"
echo "===================================================="
echo "Press Ctrl+C to stop all services"

# Wait and cleanup on exit
trap "echo 'Stopping...'; kill $WHISPER_PID $API_PID; brew services stop redis; exit" INT
wait
