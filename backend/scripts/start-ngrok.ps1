# ─────────────────────────────────────────────────────────────────────────────
# start-ngrok.ps1
# Starts ngrok tunnel on port 5000 and automatically updates .env with the
# new public URL so Safaricom callbacks work for STK Push.
# Usage: .\scripts\start-ngrok.ps1
# ─────────────────────────────────────────────────────────────────────────────

param(
    [int]$Port = 5000,
    [string]$EnvFile = ".\.env"
)

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Midusa Elibrary - ngrok STK Push Helper" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check ngrok is installed
if (-not (Get-Command ngrok -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] ngrok is not installed or not in PATH." -ForegroundColor Red
    Write-Host ""
    Write-Host "Install it from: https://ngrok.com/download" -ForegroundColor Yellow
    Write-Host "Or with Chocolatey: choco install ngrok" -ForegroundColor Yellow
    Write-Host "Or with Winget: winget install ngrok.ngrok" -ForegroundColor Yellow
    exit 1
}

Write-Host "[1/3] Starting ngrok tunnel on port $Port..." -ForegroundColor Green
Start-Process -FilePath "ngrok" -ArgumentList "http $Port" -WindowStyle Minimized

# Wait for ngrok API to be ready
Write-Host "[2/3] Waiting for ngrok to start..." -ForegroundColor Green
Start-Sleep -Seconds 3

# Fetch public URL from ngrok local API
try {
    $tunnels = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -TimeoutSec 5
    $publicUrl = ($tunnels.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1).public_url

    if (-not $publicUrl) {
        $publicUrl = ($tunnels.tunnels | Select-Object -First 1).public_url
    }

    if ($publicUrl) {
        Write-Host ""
        Write-Host "  ngrok URL: $publicUrl" -ForegroundColor Cyan
        $callbackUrl = "$publicUrl/api/payments/callback"
        Write-Host "  Callback URL: $callbackUrl" -ForegroundColor Cyan
        Write-Host ""

        # Update MPESA_CALLBACK_URL in .env
        Write-Host "[3/3] Updating .env with new callback URL..." -ForegroundColor Green
        $envContent = Get-Content $EnvFile -Raw
        if ($envContent -match "MPESA_CALLBACK_URL=") {
            $envContent = $envContent -replace "MPESA_CALLBACK_URL=.*", "MPESA_CALLBACK_URL=$callbackUrl"
        } else {
            $envContent += "`nMPESA_CALLBACK_URL=$callbackUrl"
        }
        Set-Content $EnvFile $envContent -NoNewline
        Write-Host ""
        Write-Host "[OK] .env updated. MPESA_CALLBACK_URL = $callbackUrl" -ForegroundColor Green
        Write-Host ""
        Write-Host "IMPORTANT: Restart your backend server (npm run dev) to load the new callback URL." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "==================================================" -ForegroundColor Cyan
        Write-Host "  ngrok is running. Keep this terminal open." -ForegroundColor Cyan
        Write-Host "  ngrok Dashboard: http://localhost:4040" -ForegroundColor Cyan
        Write-Host "==================================================" -ForegroundColor Cyan
    } else {
        Write-Host "[WARNING] Could not detect public URL from ngrok API." -ForegroundColor Yellow
        Write-Host "Open http://localhost:4040 to get the URL manually." -ForegroundColor Yellow
        Write-Host "Then update MPESA_CALLBACK_URL in .env with: <ngrok-url>/api/payments/callback" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[WARNING] Could not connect to ngrok API at http://localhost:4040" -ForegroundColor Yellow
    Write-Host "ngrok may still be starting. Try: Invoke-RestMethod http://localhost:4040/api/tunnels" -ForegroundColor Yellow
}
