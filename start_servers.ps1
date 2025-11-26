# Script de démarrage des serveurs SYGLA-H2O

Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  SYGLA-H2O - Démarrage des serveurs  " -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Démarrage du backend Django
Write-Host "[1/2] Démarrage du serveur Django..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; python manage.py runserver"

Start-Sleep -Seconds 3

# Démarrage du frontend React
Write-Host "[2/2] Démarrage du serveur React..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm start"

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Green
Write-Host "  Serveurs démarrés avec succès!       " -ForegroundColor Green
Write-Host "═══════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Backend Django  : http://localhost:8000" -ForegroundColor White
Write-Host "Frontend React  : http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Identifiants de connexion:" -ForegroundColor Cyan
Write-Host "  Email    : admin@sygla-h2o.com" -ForegroundColor White
Write-Host "  Password : admin123" -ForegroundColor White
Write-Host ""
