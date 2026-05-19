Write-Host "`n===================================" -ForegroundColor Cyan
Write-Host "🧠 ARCHITECTURE HEALTH REPORT" -ForegroundColor Cyan
Write-Host "===================================`n" -ForegroundColor Cyan

# 1. Duplicate / usage scan
$usage = Get-ChildItem -Recurse -Path src -Include *.ts,*.tsx |
Select-String "createBlessingCheckout"

Write-Host "🔍 Function Usage Hits: $($usage.Count)" -ForegroundColor Yellow

# 2. Import drift detection
$drift = Get-ChildItem -Recurse -Path src -Include *.ts,*.tsx |
Select-String "@/server/|../server/|../../server/"

Write-Host "🔁 Import Drift Issues: $($drift.Count)" -ForegroundColor Yellow

# 3. Source of truth check
$source = Get-ChildItem -Recurse -Path src/server -Include *.ts |
Select-String "createBlessingCheckout"

Write-Host "📦 Server Definitions Found: $($source.Count)" -ForegroundColor Green

# 4. Router bindings check
$router = Get-ChildItem -Recurse -Path src/routes -Include *.tsx |
Select-String "useServerFn"

Write-Host "🧭 Router Bindings: $($router.Count)" -ForegroundColor Green

# 5. STATUS ENGINE
Write-Host "`n===================================" -ForegroundColor Cyan

if ($drift.Count -eq 0 -and $source.Count -ge 1) {
    Write-Host "🟢 ARCH STATUS: HEALTHY" -ForegroundColor Green
}
elseif ($drift.Count -lt 5) {
    Write-Host "🟡 ARCH STATUS: WARNING" -ForegroundColor Yellow
}
else {
    Write-Host "🔴 ARCH STATUS: BROKEN" -ForegroundColor Red
}

Write-Host "===================================`n" -ForegroundColor Cyan
