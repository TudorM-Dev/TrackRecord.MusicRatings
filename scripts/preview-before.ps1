#Requires -Version 7.0
[CmdletBinding()]
param(
    [string]$When = "yesterday",
    [string]$Commit,
    [int]$Port = 5174,
    [switch]$Remove
)

$ErrorActionPreference = "Stop"

$repo = (git rev-parse --show-toplevel 2>$null)
if (-not $repo) { throw "Not inside a git repository." }
$repo = $repo -replace '/', '\'
$worktree = Join-Path (Split-Path $repo -Parent) "TrackRecord.before"

if ($Remove) {
    if (Test-Path $worktree) {
        git -C $repo worktree remove --force $worktree
        Write-Host "Removed $worktree" -ForegroundColor Yellow
    } else {
        Write-Host "Nothing to remove." -ForegroundColor Yellow
    }
    return
}

if ($Commit) {
    $sha = (git -C $repo rev-parse --verify "$Commit^{commit}" 2>$null)
    if (-not $sha) { throw "No commit matches '$Commit'." }
} else {
    $sha = (git -C $repo rev-list -1 --before="$When" HEAD)
    if (-not $sha) { throw "No commit on this branch older than '$When'." }
}

$subject = (git -C $repo log -1 --format="%s" $sha)
$stamp = (git -C $repo log -1 --format="%ad" --date=format:"%d %b %Y, %H:%M" $sha)

Write-Host ""
Write-Host "  Showing TrackRecord as of" -NoNewline
Write-Host " $stamp" -ForegroundColor Cyan
Write-Host "  $($sha.Substring(0,7))  $subject" -ForegroundColor DarkGray
Write-Host ""

if (Test-Path $worktree) {
    git -C $worktree checkout --detach --force $sha | Out-Null
} else {
    git -C $repo worktree add --detach $worktree $sha | Out-Null
}

$client = Join-Path $worktree "client"
if (-not (Test-Path (Join-Path $client "node_modules"))) {
    Write-Host "  First run for this snapshot, installing dependencies..." -ForegroundColor DarkGray
    Push-Location $client
    try { npm ci --silent } finally { Pop-Location }
}

$apiUp = $false
try {
    Invoke-WebRequest "http://localhost:3000/api/health" -TimeoutSec 2 -UseBasicParsing | Out-Null
    $apiUp = $true
} catch { }

if (-not $apiUp) {
    Write-Host "  The API is not running on port 3000." -ForegroundColor Yellow
    Write-Host "  Start it in another terminal, or this snapshot will show empty screens:" -ForegroundColor Yellow
    Write-Host "    cd $repo\server; npm run dev" -ForegroundColor DarkGray
    Write-Host ""
}

Write-Host "  Old version  -> http://localhost:$Port" -ForegroundColor Green
Write-Host "  Current one  -> http://localhost:5173" -ForegroundColor DarkGray
Write-Host "  Ctrl+C to stop. Clean up later with: .\scripts\preview-before.ps1 -Remove" -ForegroundColor DarkGray
Write-Host ""

Push-Location $client
try {
    npm run dev -- --port $Port --strictPort
} finally {
    Pop-Location
}
