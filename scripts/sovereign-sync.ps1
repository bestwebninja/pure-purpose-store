Write-Host ""
Write-Host "====================================="
Write-Host "👑 MYBLESSINGS SOVEREIGN SYNC"
Write-Host "====================================="
Write-Host ""

# ------------------------------------------------
# 1. Verify repo
# ------------------------------------------------
if (!(Test-Path ".git")) {
    Write-Host "❌ Not inside a git repository"
    exit
}

# ------------------------------------------------
# 2. Install deps if needed
# ------------------------------------------------
Write-Host "📦 Checking dependencies..."
if (!(Test-Path "node_modules")) {
    npm install
}

# ------------------------------------------------
# 3. AST Architecture Heal
# ------------------------------------------------
Write-Host ""
Write-Host "🧠 Running AST Auto-Heal..."
npm run arch:heal

# ------------------------------------------------
# 4. Architecture Health Report
# ------------------------------------------------
Write-Host ""
Write-Host "🩺 Running Architecture Health..."
powershell -ExecutionPolicy Bypass -File scripts/arch-health-report.ps1

# ------------------------------------------------
# 5. Git Sync (Local Repo)
# ------------------------------------------------
Write-Host ""
Write-Host "🔄 Syncing Repository..."

git add .
git commit -m "👑 Sovereign auto-sync" 2>$null
git pull --rebase
git push

# ------------------------------------------------
# 6. Multi-Repo Mesh Sync
# ------------------------------------------------
Write-Host ""
Write-Host "🌐 Syncing Repo Mesh..."

if (Test-Path "scripts/mesh-sync.ps1") {
    powershell -ExecutionPolicy Bypass -File scripts/mesh-sync.ps1
}

# ------------------------------------------------
# 7. Final Status
# ------------------------------------------------
Write-Host ""
Write-Host "====================================="
Write-Host "✅ SOVEREIGN SYNC COMPLETE"
Write-Host "====================================="
Write-Host ""
