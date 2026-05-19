Write-Host "👀 Watching for file changes..."

while ($true) {
    Start-Sleep -Seconds 5

    $changes = git status --porcelain

    if ($changes) {
        Write-Host "🧠 Changes detected → running autonomous sync..."
        powershell -ExecutionPolicy Bypass -File scripts/autogit.ps1
    }
}