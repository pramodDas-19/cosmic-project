@echo off
echo ======================================
echo   Node Modules Cleanup Script
echo ======================================

:: Kill all Node processes
echo Killing Node processes...
taskkill /f /im node.exe >nul 2>&1

:: Take ownership of node_modules
echo Taking ownership of node_modules...
takeown /f node_modules /r /d y >nul
icacls node_modules /grant administrators:F /t >nul

:: Delete node_modules folder
echo Deleting node_modules...
rmdir /s /q node_modules

:: Delete package-lock.json if it exists
if exist package-lock.json (
    echo Deleting package-lock.json...
    del /f package-lock.json
) else (
    echo No package-lock.json found.
)

:: Reinstall dependencies
echo Reinstalling dependencies...
npm install

echo ======================================
echo   Cleanup and reinstall completed!
echo ======================================
pause
