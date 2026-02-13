@echo off
setlocal enabledelayedexpansion

:: --- Configuration ---
set "NODE_VERSION=v20.11.1"
set "NODE_DIR=%~dp0.runtime\node"
set "APP_DIR=%~dp0"

echo ======================================================
echo           Raida's Garden - Launcher
echo ======================================================

:: 1. Check/Install Portable Node.js
if exist "!NODE_DIR!\node.exe" goto :node_exists

echo [INFO] Portable Node.js not found. Downloading !NODE_VERSION!...
mkdir "!NODE_DIR!" 2>nul
set "DL_URL=https://nodejs.org/dist/!NODE_VERSION!/node-!NODE_VERSION!-win-x64.zip"
set "ZIP_PATH=%temp%\node_portable.zip"
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('!DL_URL!', '!ZIP_PATH!')"

if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to download Node.js.
    pause
    exit /b 1
)

echo [INFO] Extracting Node.js...
powershell -Command "Expand-Archive -Path '!ZIP_PATH!' -DestinationPath '!NODE_DIR!' -Force"
move "!NODE_DIR!\node-!NODE_VERSION!-win-x64\*" "!NODE_DIR!\"
rmdir "!NODE_DIR!\node-!NODE_VERSION!-win-x64"
del "!ZIP_PATH!"

:node_exists

:: 2. Add Node to Path
set "PATH=!NODE_DIR!;!APP_DIR!node_modules\.bin;%PATH%"

:: 3. Enable Corepack (for pnpm)
echo [INFO] Enabling package manager support...
call corepack enable 2>nul

:: 4. Detect/Install Package Manager
set "PKG=pnpm"
set "PKG_FLAGS=--prefer-offline"

where pnpm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [INFO] Installing pnpm via corepack...
    call corepack prepare pnpm@latest --activate
)

:: 5. Check for dependencies
echo [INFO] Preparing environment via %PKG%...
if not exist "node_modules" goto :install_deps
echo [INFO] Verifying dependencies...
call %PKG% install %PKG_FLAGS%
goto :start_app

:install_deps
echo [INFO] Installing dependencies (this may take a minute)...
call %PKG% install %PKG_FLAGS%

:start_app
:: 5. Start the Application
echo [INFO] Handing over to Controller...
node scripts/launcher.js

if %ERRORLEVEL% neq 0 (
    echo [ERROR] Application exited with error code %ERRORLEVEL%
    pause
)
