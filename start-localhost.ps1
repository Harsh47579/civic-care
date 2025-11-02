Write-Host "Starting Jharkhand Civic Issues Application on Localhost..." -ForegroundColor Green
Write-Host ""

Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm run install-all

Write-Host ""
Write-Host "Starting the application..." -ForegroundColor Yellow
Write-Host "Server will run on: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Client will run on: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""

npm run dev
