Write-Host ""
Write-Host "===================================="
Write-Host "🤖 AUTONOMOUS GIT ENGINE"
Write-Host "===================================="

# ----------------------------
# 1. Run AST Safety Check
# ----------------------------
Write-Host "🧠 Running AST Engine..."
node scripts/ast-engine-v2.js

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ BLOCKED: AST violations detected"
    exit 1
}

# ----------------------------
# 2. Run Architecture Health
# ----------------------------
Write-Host "📊 Running Architecture Health..."
powershell -ExecutionPolicy Bypass -File scripts/arch-health-report.ps1

# ----------------------------
# 3. Stage changes
# ----------------------------
Write-Host "📦 Staging changes..."
git add .

# ----------------------------
# 4. Auto commit
# ----------------------------
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git commit -m "auto: autonomous sync [$timestamp]" 2>$null

# ----------------------------
# 5. Pull latest (safe merge)
# ----------------------------
Write-Host "🔄 Syncing with remote..."
git pull --rebase

# ----------------------------
# 6. Push automatically
# ----------------------------
Write-Host "🚀 Pushing to GitHub..."
git push

Write-Host ""
Write-Host "===================================="
Write-Host "✅ AUTONOMOUS SYNC COMPLETE"
Write-Host "===================================="
Write-Host ""