# Student Task Manager - Setup Script
# Run this script after installing Node.js

Write-Host "🚀 Student Task Manager Setup" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green

# Check Node.js installation
Write-Host "`n1. Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Host "✓ Node.js version: $nodeVersion" -ForegroundColor Green
    Write-Host "✓ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first!" -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org" -ForegroundColor Cyan
    exit 1
}

# Install backend dependencies
Write-Host "`n2. Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Backend dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}

# Install frontend dependencies
Write-Host "`n3. Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location ../frontend
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Frontend dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}

# Return to project root
Set-Location ..

Write-Host "`n🎉 Setup Complete!" -ForegroundColor Green
Write-Host "=================`n" -ForegroundColor Green

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Update JWT_SECRET in backend/.env file" -ForegroundColor White
Write-Host "2. Install MongoDB or set up MongoDB Atlas" -ForegroundColor White
Write-Host "3. Run the application using VS Code tasks or manual commands" -ForegroundColor White

Write-Host "`nVS Code Tasks Available:" -ForegroundColor Cyan
Write-Host "- Start Backend Server" -ForegroundColor White
Write-Host "- Start Frontend Development Server" -ForegroundColor White

Write-Host "`nManual Commands:" -ForegroundColor Cyan
Write-Host "Backend:  cd backend && npm run dev" -ForegroundColor White
Write-Host "Frontend: cd frontend && npm start" -ForegroundColor White

Write-Host "`n📖 See README.md for detailed instructions" -ForegroundColor Green