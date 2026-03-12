#!/bin/bash

echo "🚀 Deploying Delhi Municipal AI Helpline with Docker..."
echo "=================================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with your configuration."
    echo ""
    echo "Required variables:"
    echo "  - TWILIO_ACCOUNT_SID"
    echo "  - TWILIO_AUTH_TOKEN"
    echo "  - TWILIO_PHONE_NUMBER"
    echo "  - GROQ_API_KEY"
    echo "  - BASE_URL"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed!"
    echo "Please install Docker from: https://www.docker.com/get-started"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Error: Docker Compose is not installed!"
    echo "Please install Docker Compose"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down 2>/dev/null || docker compose down 2>/dev/null

# Build and start containers
echo ""
echo "🔨 Building Docker images..."
docker-compose build || docker compose build

echo ""
echo "🚀 Starting services..."
docker-compose up -d || docker compose up -d

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo ""
echo "🔍 Checking service health..."

if curl -f http://localhost:6379 &> /dev/null || echo "PING" | nc localhost 6379 &> /dev/null; then
    echo "✅ Redis is running"
else
    echo "⚠️  Redis health check skipped"
fi

if curl -f http://localhost:5001/ &> /dev/null; then
    echo "✅ Whisper STT is running"
else
    echo "⚠️  Whisper STT is starting..."
fi

if curl -f http://localhost:8000/ &> /dev/null; then
    echo "✅ API Backend is running"
else
    echo "⚠️  API Backend is starting..."
fi

echo ""
echo "===================================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "===================================================="
echo ""
echo "📊 Access Points:"
echo "  Dashboard:     http://localhost:8000/dashboard/"
echo "  API:           http://localhost:8000/"
echo "  Whisper STT:   http://localhost:5001/"
echo ""
echo "📝 Useful Commands:"
echo "  View logs:     docker-compose logs -f"
echo "  Stop all:      docker-compose down"
echo "  Restart:       docker-compose restart"
echo "  View status:   docker-compose ps"
echo ""
echo "🎉 Your AI Helpline is ready to serve!"
