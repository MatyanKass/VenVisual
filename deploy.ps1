# Copies the plugin into a Vencord checkout, lints, type-checks and builds it.
# Usage: .\deploy.ps1 [-Vencord D:\Projects\Vencord] [-Inject]
param(
    [string]$Vencord = "D:\Projects\Vencord",
    [switch]$Inject
)
$ErrorActionPreference = "Stop"

$target = Join-Path $Vencord "src\userplugins\venVisual"
New-Item -ItemType Directory -Force $target | Out-Null
Copy-Item (Join-Path $PSScriptRoot "src\*") $target -Recurse -Force

Push-Location $Vencord
try {
    npx eslint src/userplugins/venVisual
    if ($LASTEXITCODE) { throw "eslint failed" }
    $tsc = npx tsc --noEmit -p . 2>&1 | Select-String "userplugins[\\/]venVisual"
    if ($tsc) { $tsc; throw "tsc failed" }
    pnpm build
    if ($LASTEXITCODE) { throw "build failed" }
    if ($Inject) { pnpm inject }
} finally {
    Pop-Location
}
Write-Host "VenVisual built. Restart Discord (Ctrl+R) to load it."
