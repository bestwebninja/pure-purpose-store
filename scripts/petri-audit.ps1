Write-Host "====================================" -ForegroundColor DarkGray
Write-Host "🧠 PETRI BLOOM AUDIT ENGINE" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor DarkGray

$root = "src"

# -----------------------------
# SAFE FILE COLLECTION
# -----------------------------
$files = Get-ChildItem $root -Recurse -File -ErrorAction SilentlyContinue |
Where-Object {
    $_.Extension -in ".ts", ".tsx" -and
    $_.FullName -notmatch "node_modules|dist|build"
}

# -----------------------------
# DUPLICATE DETECTION
# -----------------------------
$campaignFiles = @()
$duplicateCount = 0

Write-Host "`n🔍 Scanning Campaign definitions..." -ForegroundColor Cyan

foreach ($file in $files) {

    $hits = Select-String -Path $file.FullName `
        -Pattern "export type Campaign|type Campaign =|Campaign =" `
        -ErrorAction SilentlyContinue

    if ($hits) {
        $campaignFiles += $file.FullName

        if ($hits.Count -gt 1) {
            $duplicateCount++
        }
    }
}

# -----------------------------
# DOMAIN SIGNAL SNAPSHOT
# -----------------------------
Write-Host "`n🧠 DOMAIN SNAPSHOT" -ForegroundColor Cyan

$domain = @{
    Campaign = 0
    Donation = 0
    Infrastructure = 0
    Routing = 0
}

foreach ($file in $files) {

    $content = Select-String -Path $file.FullName `
        -Pattern "Campaign|Donation|supabase|createFileRoute|Route" `
        -ErrorAction SilentlyContinue

    if ($content) {
        $text = $content | Out-String

        if ($text -match "Campaign") { $domain.Campaign++ }
        if ($text -match "Donation") { $domain.Donation++ }
        if ($text -match "supabase") { $domain.Infrastructure++ }
        if ($text -match "createFileRoute|Route") { $domain.Routing++ }
    }
}

# -----------------------------
# REPORT
# -----------------------------
Write-Host "`n📊 RESULTS" -ForegroundColor Cyan

Write-Host "Campaign files found: $($campaignFiles.Count)"
Write-Host "Duplicate hotspots: $duplicateCount"
Write-Host "Campaign signals: $($domain.Campaign)"
Write-Host "Donation signals: $($domain.Donation)"
Write-Host "Infrastructure signals: $($domain.Infrastructure)"
Write-Host "Routing signals: $($domain.Routing)"

# -----------------------------
# BLOOM SCORE (BUILD GATE)
# -----------------------------
$score = 100

if ($duplicateCount -gt 0) { $score -= 30 }
if ($campaignFiles.Count -gt 5) { $score -= 10 }
if ($domain.Infrastructure -eq 0) { $score -= 20 }

Write-Host "`n🌱 PETRI BLOOM SCORE: $score / 100"

if ($score -ge 80) {
    Write-Host "🟢 READY FOR BUILD" -ForegroundColor Green
}
elseif ($score -ge 50) {
    Write-Host "🟡 NEED CLEANUP BEFORE BUILD" -ForegroundColor Yellow
}
else {
    Write-Host "🔴 ARCHITECTURE RISK - DO NOT BUILD" -ForegroundColor Red
}

Write-Host "`n====================================" -ForegroundColor DarkGray
Write-Host "🧠 PETRI AUDIT COMPLETE" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor DarkGray
