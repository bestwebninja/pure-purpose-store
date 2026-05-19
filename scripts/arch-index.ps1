Write-Host "🧠 Building ARCH INDEX (SAFE MODE)"

$files = Get-ChildItem src -Recurse -File -ErrorAction SilentlyContinue |
Where-Object {
    $_.Extension -in ".ts", ".tsx" -and
    $_.FullName -notmatch "node_modules|dist|build"
}

$index = @{}

foreach ($f in $files) {
    try {
        $content = Get-Content $f.FullName -Raw -ErrorAction Stop

        if ($content -match "Campaign") {
            if (-not $index.ContainsKey("Campaign")) {
                $index["Campaign"] = @()
            }

            $index["Campaign"] += $f.FullName
        }
    } catch {
        continue
    }
}

$index | ConvertTo-Json -Depth 5 | Out-File ".arch-index.json"

Write-Host "✅ ARCH INDEX BUILT"
