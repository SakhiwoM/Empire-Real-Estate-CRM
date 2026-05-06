@echo off
setlocal

echo.
echo ============================================
echo    Empire Property CRM - Close Utility
echo ============================================
echo.

for %%P in (5000 5173) do (
  for /f "tokens=5" %%I in ('netstat -ano ^| findstr ":%%P" ^| findstr "LISTENING"') do (
    echo [INFO] Stopping process %%I on port %%P...
    taskkill /PID %%I /F >nul 2>&1
  )
)

echo [DONE] Close operation finished.
echo If any app window is still open, you can close it manually.
echo.
pause
exit /b 0
