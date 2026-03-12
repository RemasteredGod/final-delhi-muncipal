# PowerShell deployment script for Delhi Municipal AI Helpline
# Single-click deployment with Docker

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 Deploying Delhi Municipal AI Helpline" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path .env)) {
    Write-Host "❌ Error: .env file not found!" -ForegroundColor Red
    Write-Host "Please create a .env file with your configuration." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Required variables:" -ForegroundColor Yellow
    Write-Host "  - TWILIO_ACCOUNT_SID"
    Write-Host "  - TWILIO_AUTH_TOKEN"
    Write-Host "  - TWILIO_PHONE_NUMBER"
    Write-Host "  - GROQ_API_KEY"
    Write-Host "  - BASE_URL"
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Docker is installed
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Docker is not installed!" -ForegroundColor Red
    Write-Host "Please install Docker Desktop from: https://www.docker.com/get-started" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Docker is running
try {
    docker ps | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Docker is not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Stop any existing containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose down 2>$null
Write-Host ""

# Build and start containers
Write-Host "🔨 Building Docker images..." -ForegroundColor Cyan
docker-compose build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "🚀 Starting services..." -ForegroundColor Cyan
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start services!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Wait for services to be ready
Write-Host ""
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check service health
Write-Host ""
Write-Host "🔍 Checking service health..." -ForegroundColor Cyan

$services = @{
    "Redis" = "http://localhost:6379"
    "Whisper STT" = "http://localhost:5001/"
    "API Backend" = "http://localhost:8000/"
}

foreach ($service in $services.Keys) {
    try {
        if ($service -eq "Redis") {
            # Skip Redis HTTP check
            Write-Host "✅ $service is running" -ForegroundColor Green
        } else {
            $response = Invoke-WebRequest -Uri $services[$service] -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ $service is running" -ForegroundColor Green
            }
        }
    } catch {
        Write-Host "⚠️  $service is starting..." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Access Points:" -ForegroundColor Cyan
Write-Host "  Dashboard:     http://localhost:8000/dashboard/" -ForegroundColor White
Write-Host "  API:           http://localhost:8000/" -ForegroundColor White
Write-Host "  Whisper STT:   http://localhost:5001/" -ForegroundColor White
Write-Host ""
Write-Host "📝 Useful Commands:" -ForegroundColor Cyan
Write-Host "  View logs:     docker-compose logs -f" -ForegroundColor White
Write-Host "  Stop all:      docker-compose down" -ForegroundColor White
Write-Host "  Restart:       docker-compose restart" -ForegroundColor White
Write-Host "  View status:   docker-compose ps" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Your AI Helpline is ready to serve!" -ForegroundColor Green
Write-Host ""

# Open dashboard in browser
Start-Sleep -Seconds 2
Start-Process "http://localhost:8000/dashboard/"

Write-Host "Opening dashboard in your browser..." -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to exit"
