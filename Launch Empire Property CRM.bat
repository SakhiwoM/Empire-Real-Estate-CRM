@echo off
setlocal

cd /d "%~dp0"
title Empire Property CRM Launcher

echo.
echo ============================================
echo    Empire Property CRM - Launch Utility
echo ============================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js is not installed.
  echo Please install Node.js LTS, then run this launcher again.
  echo Download: https://nodejs.org
  echo.
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm is not available on this machine.
  echo Reinstall Node.js LTS and try again.
  echo.
  pause
  exit /b 1
)

if not exist "server\.env" (
  echo [INFO] Creating server\.env from .env.example ...
  copy /Y "server\.env.example" "server\.env" >nul
)

if not exist "server\node_modules" (
  echo [INFO] Installing backend dependencies - first run...
  pushd "server"
  call npm install
  if errorlevel 1 (
    echo [ERROR] Backend dependency install failed.
    popd
    pause
    exit /b 1
  )
  popd
)

if not exist "client\node_modules" (
  echo [INFO] Installing frontend dependencies - first run...
  pushd "client"
  call npm install
  if errorlevel 1 (
    echo [ERROR] Frontend dependency install failed.
    popd
    pause
    exit /b 1
  )
  popd
)

echo [INFO] Starting backend...
start "Empire CRM Backend" cmd /k "cd /d ""%~dp0server"" && npm run dev"

echo [INFO] Starting frontend...
start "Empire CRM Frontend" cmd /k "cd /d ""%~dp0client"" && npm run dev"

echo [INFO] Waiting for startup...
timeout /t 6 /nobreak >nul

start "" "http://localhost:5173"

echo.
echo [SUCCESS] Empire Property CRM is launching.
echo Keep both command windows open while using the system.
echo.
pause
exit /b 0
