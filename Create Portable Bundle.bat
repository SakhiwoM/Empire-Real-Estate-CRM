@echo off
setlocal
cd /d "%~dp0"

echo.
echo ============================================
echo    Empire Property CRM - Portable Builder
echo ============================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Create Portable Bundle.ps1" -Zip %*
if errorlevel 1 (
  echo.
  echo [ERROR] Portable bundle creation failed.
  echo.
  pause
  exit /b 1
)

echo.
echo [SUCCESS] Portable bundle created.
echo Check the "portable" folder in this project.
echo.
pause
exit /b 0
