# FabJobHunter - one-time setup
#
# What this does, in order:
#   0. checks Node.js and npm are installed
#   1. checks every pinned package version actually exists on npm
#   2. installs the engine packages in this folder
#   3. downloads the Playwright browsers
#   4. installs the dashboard packages in web\
#
# How to run it. Open PowerShell in this folder and paste this one line:
#   powershell -ExecutionPolicy Bypass -File .\setup.ps1
#
# It stops at the first problem instead of carrying on. It never deletes
# anything and never asks for a payment method.

# Deliberately NOT using -ErrorActionPreference Stop. npm prints its warnings to
# the error stream, and strict mode turns those harmless warnings into fake
# failures. Every step below checks the real exit code instead.
$ErrorActionPreference = "Continue"
Set-Location $PSScriptRoot

function Step([string]$Label) {
    Write-Host ""
    Write-Host "=== $Label ===" -ForegroundColor Cyan
}

function Fail([string]$Message) {
    Write-Host ""
    Write-Host "STOPPED: $Message" -ForegroundColor Red
    Write-Host "Nothing was broken. Copy the text above and send it to me." -ForegroundColor Yellow
    exit 1
}

Step "0 of 4  Checking Node.js and npm"
$nodeVersion = ""
try { $nodeVersion = (node -v) } catch { $nodeVersion = "" }
if (-not $nodeVersion) {
    Fail "Node.js is not installed. Get the LTS installer from https://nodejs.org, install it, close and reopen PowerShell, then run this script again."
}
Write-Host "  Node.js $nodeVersion"
$npmVersion = ""
try { $npmVersion = (npm -v) } catch { $npmVersion = "" }
if (-not $npmVersion) { Fail "npm was not found even though Node.js is installed. Reinstalling Node.js from https://nodejs.org usually fixes this." }
Write-Host "  npm $npmVersion"

Step "1 of 4  Checking the pinned package versions exist on npm"
Write-Host "  (this only looks things up, it does not install yet)"
$pinned = @(
    "marked@14.1.4",
    "playwright@1.58.1",
    "next@16.2.9",
    "react@19.2.4",
    "react-dom@19.2.4",
    "eslint-config-next@16.2.9",
    "@base-ui/react@1.5.0",
    "class-variance-authority@0.7.1",
    "clsx@2.1.1",
    "lucide-react@1.17.0",
    "motion@12.40.0",
    "next-themes@0.4.6",
    "react-markdown@10.1.0",
    "shadcn@4.11.0",
    "sonner@2.0.7",
    "tailwind-merge@3.6.0",
    "tw-animate-css@1.4.0"
)
$missing = @()
foreach ($pkg in $pinned) {
    $null = & npm view $pkg version --silent 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ok       $pkg"
    } else {
        Write-Host "  MISSING  $pkg" -ForegroundColor Yellow
        $missing += $pkg
    }
}
if ($missing.Count -eq $pinned.Count) {
    Fail "Every single lookup failed, which almost always means npm could not reach the internet rather than the versions being wrong. Check your connection, then run this script again. Nothing was installed."
}
if ($missing.Count -gt 0) {
    Write-Host ""
    Write-Host "These exact versions are not on npm:" -ForegroundColor Yellow
    $missing | ForEach-Object { Write-Host "    $_" }
    Fail "$($missing.Count) pinned version(s) do not exist, so installing would fail halfway. Send me that list and I will correct package.json first. Nothing was installed."
}

Step "2 of 4  Installing the engine packages (marked, playwright)"
npm install
if ($LASTEXITCODE -ne 0) { Fail "The engine install failed. The npm error is just above." }
Write-Host "  Done. A node_modules folder now exists next to this script." -ForegroundColor Green

Step "3 of 4  Downloading the Playwright browsers"
Write-Host "  Heads up: this is a large download, roughly 500 MB to 1 GB, and can"
Write-Host "  take several minutes. It is free. Leave it running."
npx playwright install
if ($LASTEXITCODE -ne 0) { Fail "The Playwright browser download failed. Often this is just a dropped connection - running this script again is safe and it will pick up where it left off." }
Write-Host "  Done. The browser Playwright drives is ready." -ForegroundColor Green

Step "4 of 4  Installing the dashboard packages in web\"
Set-Location (Join-Path $PSScriptRoot "web")
npm install
if ($LASTEXITCODE -ne 0) { Fail "The dashboard install failed. The npm error is just above." }
Set-Location $PSScriptRoot
Write-Host "  Done. A web\node_modules folder now exists." -ForegroundColor Green

Write-Host ""
Write-Host "=== All four steps finished ===" -ForegroundColor Green
Write-Host ""
Write-Host "To start the dashboard, run:" -ForegroundColor Cyan
Write-Host "    cd web"
Write-Host "    npm run dev"
Write-Host ""
Write-Host "Then open http://localhost:4319 in your browser."
Write-Host "You should see a page that says FabJobHunter. No features yet - that is expected."
Write-Host ""
