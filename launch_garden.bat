@echo off
setlocal
title Raida's Garden - Launch Sequence

echo ========================================================
echo       LEAF & LOAM SYSTEMS - LAUNCH SEQUENCE
echo ========================================================
echo.

:: 1. CHECK DEPENDENCIES
echo [1/4] Checking dependencies...
if not exist "node_modules" (
    echo    - node_modules not found. Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b %ERRORLEVEL%
    )
    echo    - Dependencies installed.
) else (
    echo    - Dependencies verified.
)
echo.

:: 2. VERIFY BUILD
echo [2/4] Verifying build integrity...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build failed. Please check the errors above.
    pause
    exit /b %ERRORLEVEL%
)
echo    - Build successful.
echo.

:: 3. LAUNCH SERVER (Background)
echo [3/4] Launching Development Server...
start "Raida's Garden - Server" /MIN npm run dev
echo    - Server process initiated.
echo.

:: 4. LAUNCH APP (Browser)
echo [4/4] Launching Interface...
:: Wait a moment for Vite to spin up
timeout /t 5 /nobreak > nul
start http://localhost:5173
echo.

echo ========================================================
echo       SYSTEM ONLINE. HAPPY GARDENING.
echo ========================================================
echo.
pause
