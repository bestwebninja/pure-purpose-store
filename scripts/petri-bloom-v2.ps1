Write-Host "====================================" -ForegroundColor DarkGray
Write-Host "🧠 PETRI BLOOM v2 - INTELLIGENCE LAYER" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor DarkGray

$root = "src"

# ----------------------------
# FILE COLLECTION (SAFE)
# ----------------------------
$files = Get-ChildItem $root -Recurse -File -ErrorAction SilentlyContinue |
Where-Object {
    $_.Extension -in ".ts", ".tsx" -and
    $_.FullName -notmatch "node_modules|dist|build"
}

# ----------------------------
# CAMPAIGN GOVERNANCE LAYER
# ----------------------------
Write-Host "`n🔥 CAMPAIGN GOVERNANCE CHECK" -ForegroundColor Cyan

$campaignDefs = @()
$campaignUsage = 0

foreach ($file in $files) {

    $content = Select-String -Path $file.FullName `
        -Pattern "export type Campaign|type Campaign =|interface Campaign" `
        -ErrorAction SilentlyContinue

    if ($content) {
        $campaignDefs += $file.FullName
    }

    $usage = Select-String -Path $file.FullName -Pattern "Campaign" -ErrorAction SilentlyContinue
    if ($usage) {
        $campaignUsage += ($usage | Measure-Object).Count
    }
}

# ----------------------------
# DUPLICATE DETECTION
# ----------------------------
$duplicateRisk = if ($campaignDefs.Count -gt 1) { $campaignDefs.Count - 1 } else { 0 }

# ----------------------------
# DOMAIN INTELLIGENCE
# ----------------------------
Write-Host "`n🧠 DOMAIN INTELLIGENCE" -ForegroundColor Cyan

$domain = @{
    Campaign = 0
    Donation = 0
    Infrastructure = 0
    Routing = 0
    Core = 0
}

foreach ($file in $files) {

    $content = Select-String -Path $file.FullName `
        -Pattern "Campaign|Donation|supabase|createFileRoute|Route" `
        -ErrorAction SilentlyContinue

    if ($content) {
        $text = $content | Out-String

        if ($text -match "Campaign") { $domain.Campaign++ }
        elseif ($text -match "Donation") { $domain.Donation++ }
        elseif ($text -match "supabase") { $domain.Infrastructure++ }
        elseif ($text -match "Route") { $domain.Routing++ }
        else { $domain.Core++ }
    }
}

# ----------------------------
# PETRI BLOOM SCORE (INTELLIGENCE GRADE)
# ----------------------------
$score = 100

if ($duplicateRisk -gt 0) { $score -= 40 }
if ($campaignUsage -gt 200) { $score -= 10 }
if ($domain.Infrastructure -eq 0) { $score -= 25 }

# ----------------------------
# OUTPUT
# ----------------------------
Write-Host "`n📊 PETRI BLOOM REPORT" -ForegroundColor Cyan

Write-Host "Campaign Definitions: $($campaignDefs.Count)"
Write-Host "Duplicate Risk: $duplicateRisk"
Write-Host "Campaign Usage: $campaignUsage"

Write-Host "`nDomain Breakdown:"
$domain.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object {
    Write-Host " - $($_.Key): $($_.Value)"
}

Write-Host "`n🌱 BLOOM SCORE: $score / 100"

# ----------------------------
# ENFORCEMENT DECISION ENGINE
# ----------------------------
if ($duplicateRisk -gt 0) {
    Write-Host "`n🔴 CRITICAL: MULTIPLE CAMPAIGN DEFINITIONS DETECTED" -ForegroundColor Red
    Write-Host "🚫 BUILD SHOULD BE BLOCKED" -ForegroundColor Red
}
elseif ($score -ge 80) {
    Write-Host "`n🟢 SYSTEM HEALTHY - READY FOR BUILD" -ForegroundColor Green
}
elseif ($score -ge 50) {
    Write-Host "`n🟡 SYSTEM WARNING - CLEANUP RECOMMENDED" -ForegroundColor Yellow
}
else {
    Write-Host "`n🔴 SYSTEM UNSTABLE - DO NOT BUILD" -ForegroundColor Red
}

Write-Host "`n====================================" -ForegroundColor DarkGray
Write-Host "🧠 PETRI BLOOM v2 COMPLETE" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor DarkGray
