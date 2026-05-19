Write-Host "?? Multi-Repo Mesh Sync Starting..."

git fetch origin
git fetch upstream

Write-Host "?? Comparing repos..."

git log origin/main..upstream/main --oneline

Write-Host "? Sync check complete (no auto merge performed)"
