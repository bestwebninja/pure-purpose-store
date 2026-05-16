Write-Host "🔒 Architecture Guard Running..."

$violations = Get-ChildItem -Recurse -Path src -Include *.ts,*.tsx -File |
Select-String -Pattern "createServerFn" |
Where-Object { $_.Path -like "*\\lib\\*" }

if ($violations) {
    Write-Host "❌ ARCHITECTURE VIOLATION FOUND"
    $violations
    exit 1
}

Write-Host "✅ Architecture OK - no violations found"
