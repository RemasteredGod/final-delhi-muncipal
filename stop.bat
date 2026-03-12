@echo off
chcp 65001 > nul
cls

echo ========================================
echo 🛑 Stopping AI Helpline Services
echo ========================================
echo.

docker-compose down

if errorlevel 1 (
    echo ❌ Failed to stop services!
    pause
    exit /b 1
)

echo.
echo ✅ All services stopped successfully!
echo.
pause
