Write-Host "====================================" -ForegroundColor DarkGray
Write-Host "?? ARCHITECTURE CONTROL CONSOLE v1" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor DarkGray

$repoRoot = Get-Location
Write-Host "?? Repo: $repoRoot"

Write-Host "`n?? GIT STATUS CHECK" -ForegroundColor Cyan
git status

$changes = git status --porcelain 2>$null

if ($changes) {

    Write-Host "`n?? Uncommitted changes detected" -ForegroundColor Yellow
    $changes | ForEach-Object { Write-Host $_ }

    $input = Read-Host "`nCommit & push? (y/n)"

    if ($input -eq "y") {

        git add .

        $msg = Read-Host "Commit message"
        if (-not $msg) { $msg = "auto-sync: architecture update" }

        git commit -m "$msg"
        git push

        if ($LASTEXITCODE -eq 0) {
            Write-Host "? GitHub sync complete" -ForegroundColor Green
        } else {
            Write-Host "? Git push failed" -ForegroundColor Red
        }
    }
}
else {
    Write-Host "`n? Working tree clean" -ForegroundColor Green
}

Write-Host "`n?? ARCH HEALTH CHECK (SAFE MODE)" -ForegroundColor Cyan

$files = Get-ChildItem -Path src -Recurse -File -ErrorAction SilentlyContinue |
Where-Object { $_.Extension -in ".ts", ".tsx" -and $_.FullName -notmatch "node_modules|dist|build" }

$campaignHits = 0
$fileCount = 0

foreach ($file in $files) {
    $fileCount++
    try {
        $content = Get-Content -LiteralPath $file.FullName -Raw -ErrorAction Stop
        if ($content -match "Campaign") {
            $campaignHits++
        }
    } catch {
        continue
    }
}

Write-Host "?? Files scanned: $fileCount"
Write-Host "?? Campaign references found: $campaignHits"

Write-Host "`n====================================" -ForegroundColor DarkGray
Write-Host "?? CONSOLE RUN COMPLETE" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor DarkGray
