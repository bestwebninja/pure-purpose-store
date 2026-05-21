Write-Host "Checking forbidden imports..."

$violations = Get-ChildItem .\src -Recurse -Include *.ts,*.tsx |
Select-String "@/server/" |
Where-Object { $_.Line -notmatch "@/server/api/gateway" }

if ($violations) {
    Write-Host "❌ ARCHITECTURE VIOLATION DETECTED" -ForegroundColor Red
    $violations | ForEach-Object { $_.Path + ":" + $_.LineNumber + " " + $_.Line }
    exit 1
}

Write-Host "✅ Gateway OS Clean"