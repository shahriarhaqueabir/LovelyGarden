@echo off
setlocal
title RaidasGardenLauncher

echo ===================================================
echo       INITIALIZING RAIDA'S GARDEN SYSTEM
echo ===================================================
echo.

echo [1/3] Booting Simulation Server...
:: Start npm run dev in a separate, minimized command prompt
:: "RaidaGardenHost" is the unique title we use to identify and kill it later
start "RaidaGardenHost" /min cmd /c "npm run dev"

echo [2/3] Waiting for connection uplink...
:: Give Vite a moment to bundle and start listening
timeout /t 4 /nobreak >nul

echo [3/3] Launching Interface...
echo.
echo      The Garden Deck is opening in App Mode.
echo      Close the Garden window to shut down the system.
echo.

:: Launch Edge in App Mode and WAIT for it to close
:: We assume Edge is available as it is standard on Windows.
:: If Edge is not found or fails, it falls through.
start /wait msedge --app=http://localhost:5173

:: Logic: 
:: If start /wait returns, it means the app window was closed (or failed to launch properly).
:: We then proceed to cleanup.

echo.
echo ===================================================
echo       SHUTTING DOWN SIMULATION
echo ===================================================
echo.
echo Closing server processes...

:: Kill the specific console window we started, including child processes (Node/Vite)
taskkill /FI "WINDOWTITLE eq RaidaGardenHost" /T /F 

echo.
echo Shutdown Complete.
timeout /t 2 >nul
exit
