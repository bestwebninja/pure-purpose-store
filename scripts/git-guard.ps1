# ===========================
# GIT GUARD LAYER — GATEWAY OS
# ===========================

Write-Host "`n🧠 Git Guard Layer Activated..." -ForegroundColor Cyan

# Get staged files
$staged = git diff --cached --name-only

if (-not $staged) {
    Write-Host "⚠️ No staged files detected." -ForegroundColor Yellow
    exit 0
}

# Define forbidden frontend paths
$blockedPatterns = @(
    "src/components/",
    "src/routes/",
    "src/styles.css",
    "src/**/*.css",
    "src/**/*.scss"
)

$violations = @()

foreach ($file in $staged) {
    foreach ($pattern in $blockedPatterns) {
        if ($file -like $pattern) {
            $violations += $file
        }
    }
}

if ($violations.Count -gt 0) {
    Write-Host "`n🚨 GATEWAY GUARD BLOCK ACTIVE" -ForegroundColor Red
    Write-Host "Frontend/UI files detected in commit:" -ForegroundColor Yellow

    $violations | ForEach-Object {
        Write-Host "   ❌ $_" -ForegroundColor Red
    }

    Write-Host "`n🧠 Rule: This commit is backend-only (Gateway OS)" -ForegroundColor Cyan
    Write-Host "Fix: unstage UI files before committing" -ForegroundColor Yellow

    exit 1
}

Write-Host "✅ Gateway OS commit validated (backend-only safe)" -ForegroundColor Green
exit 0