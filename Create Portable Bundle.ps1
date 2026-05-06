param(
  [string]$OutputRoot = "portable",
  [switch]$Zip
)

$ErrorActionPreference = "Stop"

function Write-Info {
  param([string]$Message)
  Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Ensure-Directory {
  param([string]$PathValue)
  if (-not (Test-Path -LiteralPath $PathValue)) {
    New-Item -ItemType Directory -Path $PathValue | Out-Null
  }
}

function Invoke-NpmInDirectory {
  param(
    [string]$WorkingDir,
    [string[]]$Arguments
  )

  Push-Location $WorkingDir
  try {
    & npm @Arguments
    if ($LASTEXITCODE -ne 0) {
      throw "npm $($Arguments -join ' ') failed in $WorkingDir."
    }
  } finally {
    Pop-Location
  }
}

function Write-FileContent {
  param(
    [string]$FilePath,
    [string]$Content
  )

  Set-Content -LiteralPath $FilePath -Value $Content -Encoding Ascii
}

$projectRoot = if ($PSScriptRoot) {
  $PSScriptRoot
} elseif ($MyInvocation.MyCommand.Path) {
  Split-Path -Parent $MyInvocation.MyCommand.Path
} else {
  (Get-Location).Path
}
$projectRoot = (Resolve-Path -LiteralPath $projectRoot).Path

$serverDir = Join-Path $projectRoot "server"
$clientDir = Join-Path $projectRoot "client"
$serverNodeModules = Join-Path $serverDir "node_modules"
$clientNodeModules = Join-Path $clientDir "node_modules"
$clientDist = Join-Path $clientDir "dist"
$clientPreviewServer = Join-Path $clientDir "preview-server.js"

if (-not (Test-Path -LiteralPath $serverDir)) {
  throw "Server directory not found at $serverDir."
}
if (-not (Test-Path -LiteralPath $clientDir)) {
  throw "Client directory not found at $clientDir."
}
if (-not (Test-Path -LiteralPath $clientPreviewServer)) {
  throw "Client preview server not found at $clientPreviewServer."
}

try {
  $nodeCommand = Get-Command node -ErrorAction Stop
} catch {
  throw "Node.js is required on the build machine. Install Node.js LTS and retry."
}

try {
  Get-Command npm -ErrorAction Stop | Out-Null
} catch {
  throw "npm is required on the build machine. Reinstall Node.js LTS and retry."
}

$nodeExe = $nodeCommand.Source
$nodeInstallDir = Split-Path -Parent $nodeExe
if (-not (Test-Path -LiteralPath (Join-Path $nodeInstallDir "node.exe"))) {
  throw "Could not locate node.exe at $nodeInstallDir."
}

Write-Info "Using Node runtime from: $nodeInstallDir"

if (-not (Test-Path -LiteralPath $serverNodeModules)) {
  Write-Info "Installing backend dependencies..."
  Invoke-NpmInDirectory -WorkingDir $serverDir -Arguments @("install")
}

if (-not (Test-Path -LiteralPath $clientNodeModules)) {
  Write-Info "Installing frontend dependencies..."
  Invoke-NpmInDirectory -WorkingDir $clientDir -Arguments @("install")
}

Write-Info "Building frontend production files..."
Invoke-NpmInDirectory -WorkingDir $clientDir -Arguments @("run", "build")

if (-not (Test-Path -LiteralPath (Join-Path $clientDist "index.html"))) {
  throw "Frontend build failed: dist/index.html not found."
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$outputRootPath = if ([System.IO.Path]::IsPathRooted($OutputRoot)) {
  $OutputRoot
} else {
  Join-Path $projectRoot $OutputRoot
}
Ensure-Directory -PathValue $outputRootPath

$bundleFolderName = "Empire Property CRM Portable $timestamp"
$bundleRoot = Join-Path $outputRootPath $bundleFolderName
Ensure-Directory -PathValue $bundleRoot

$runtimeNodeDir = Join-Path $bundleRoot "runtime\node"
$appRoot = Join-Path $bundleRoot "app"
$serverDest = Join-Path $appRoot "server"
$clientDest = Join-Path $appRoot "client"

Ensure-Directory -PathValue $runtimeNodeDir
Ensure-Directory -PathValue $appRoot
Ensure-Directory -PathValue $clientDest

Write-Info "Copying portable Node runtime..."
Copy-Item -Path (Join-Path $nodeInstallDir "*") -Destination $runtimeNodeDir -Recurse -Force

Write-Info "Copying backend app and local data..."
Copy-Item -LiteralPath $serverDir -Destination $serverDest -Recurse -Force

Write-Info "Copying built frontend..."
Copy-Item -LiteralPath $clientDist -Destination (Join-Path $clientDest "dist") -Recurse -Force
Copy-Item -LiteralPath $clientPreviewServer -Destination (Join-Path $clientDest "preview-server.js") -Force

$startScriptPath = Join-Path $bundleRoot "Start Empire Property CRM.bat"
$stopScriptPath = Join-Path $bundleRoot "Stop Empire Property CRM.bat"
$portableReadmePath = Join-Path $bundleRoot "README - PORTABLE.txt"

$startScriptContent = @'
@echo off
setlocal
cd /d "%~dp0"
title Empire Property CRM (Portable)

echo.
echo ============================================
echo    Empire Property CRM - Portable Start
echo ============================================
echo.

set "NODE_EXE=%~dp0runtime\node\node.exe"
set "SERVER_DIR=%~dp0app\server"
set "CLIENT_DIR=%~dp0app\client"

if not exist "%NODE_EXE%" (
  echo [ERROR] Portable Node runtime not found.
  echo Expected file: %NODE_EXE%
  echo.
  pause
  exit /b 1
)

if not exist "%SERVER_DIR%\.env" (
  if exist "%SERVER_DIR%\.env.example" (
    copy /Y "%SERVER_DIR%\.env.example" "%SERVER_DIR%\.env" >nul
    echo [INFO] Created .env from .env.example
  ) else (
    >"%SERVER_DIR%\.env" (
      echo PORT=5000
      echo HOST=127.0.0.1
      echo CLIENT_URL=http://localhost:5173
      echo JWT_SECRET=change_this_to_a_long_random_secret
      echo JWT_EXPIRES_IN=7d
      echo AUTH_COOKIE_NAME=empire_crm_session
    )
    echo [INFO] Created default .env file
  )
)

for %%P in (5000 5173) do (
  for /f "tokens=5" %%I in ('netstat -ano ^| findstr ":%%P" ^| findstr "LISTENING"') do (
    echo [WARN] Port %%P is already in use by PID %%I. Close other app if needed.
  )
)

echo [INFO] Starting backend...
start "Empire CRM Backend" cmd /k "cd /d ""%SERVER_DIR%"" && ""%NODE_EXE%"" src\index.js"

echo [INFO] Starting frontend...
start "Empire CRM Frontend" cmd /k "cd /d ""%CLIENT_DIR%"" && ""%NODE_EXE%"" preview-server.js"

echo [INFO] Waiting for services to start...
timeout /t 6 /nobreak >nul

start "" "http://localhost:5173"

echo.
echo [SUCCESS] Empire Property CRM is launching.
echo Keep both command windows open while using the app.
echo.
pause
exit /b 0
'@

$stopScriptContent = @'
@echo off
setlocal

echo.
echo ============================================
echo    Empire Property CRM - Portable Stop
echo ============================================
echo.

for %%P in (5000 5173) do (
  for /f "tokens=5" %%I in ('netstat -ano ^| findstr ":%%P" ^| findstr "LISTENING"') do (
    echo [INFO] Stopping process %%I on port %%P...
    taskkill /PID %%I /F >nul 2>&1
  )
)

echo [DONE] Close operation finished.
echo If any app window is still open, close it manually.
echo.
pause
exit /b 0
'@

$portableReadmeContent = @'
Empire Property CRM - Portable Package
======================================

How to run:
1) Double-click: Start Empire Property CRM.bat
2) Use the app in your browser at http://localhost:5173
3) To stop, double-click: Stop Empire Property CRM.bat

Notes:
- This package is local/offline and runs only on this computer.
- Keep both opened command windows running while you use the app.
- Database file is stored in: app\server\data\empire_property_crm.db
- Uploaded images are stored in: app\server\uploads\properties
- Backups are stored in: app\server\backups
'@

Write-FileContent -FilePath $startScriptPath -Content $startScriptContent
Write-FileContent -FilePath $stopScriptPath -Content $stopScriptContent
Write-FileContent -FilePath $portableReadmePath -Content $portableReadmeContent

if ($Zip) {
  $zipPath = Join-Path $outputRootPath ("$bundleFolderName.zip")
  if (Test-Path -LiteralPath $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
  }
  Write-Info "Creating ZIP package..."
  Compress-Archive -Path $bundleRoot -DestinationPath $zipPath -CompressionLevel Optimal
  Write-Info "ZIP created: $zipPath"
}

Write-Host ""
Write-Host "Portable bundle created successfully:" -ForegroundColor Green
Write-Host $bundleRoot -ForegroundColor Green
Write-Host ""
