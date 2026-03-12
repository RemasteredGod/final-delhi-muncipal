@echo off
chcp 65001 > nul
cls

echo ========================================
echo 🚀 Deploying Delhi Municipal AI Helpline
echo ========================================
echo.

REM Check if .env file exists
if not exist .env (
    echo ❌ Error: .env file not found!
    echo Please create a .env file with your configuration.
    echo.
    echo Required variables:
    echo   - TWILIO_ACCOUNT_SID
    echo   - TWILIO_AUTH_TOKEN
    echo   - TWILIO_PHONE_NUMBER
    echo   - GROQ_API_KEY
    echo   - BASE_URL
    pause
    exit /b 1
)

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Docker is not installed!
    echo Please install Docker Desktop from: https://www.docker.com/get-started
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed
echo.

REM Stop any existing containers
echo 🛑 Stopping existing containers...
docker-compose down 2>nul
echo.

REM Build and start containers
echo 🔨 Building Docker images...
docker-compose build
if errorlevel 1 (
    echo ❌ Build failed!
    pause
    exit /b 1
)

echo.
echo 🚀 Starting services...
docker-compose up -d
if errorlevel 1 (
    echo ❌ Failed to start services!
    pause
    exit /b 1
)

REM Wait for services to be ready
echo.
echo ⏳ Waiting for services to be ready...
timeout /t 15 /nobreak >nul

echo.
echo ========================================
echo ✅ DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo 📊 Access Points:
echo   Dashboard:     http://localhost:8000/dashboard/
echo   API:           http://localhost:8000/
echo   Whisper STT:   http://localhost:5001/
echo.
echo 📝 Useful Commands:
echo   View logs:     docker-compose logs -f
echo   Stop all:      docker-compose down
echo   Restart:       docker-compose restart
echo   View status:   docker-compose ps
echo.
echo 🎉 Your AI Helpline is ready to serve!
echo.

REM Open dashboard in browser
timeout /t 2 /nobreak >nul
start http://localhost:8000/dashboard/

pause
