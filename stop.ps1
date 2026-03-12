# PowerShell script to stop all services

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🛑 Stopping AI Helpline Services" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

docker-compose down

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ All services stopped successfully!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Failed to stop services!" -ForegroundColor Red
    Write-Host ""
}

Read-Host "Press Enter to exit"
