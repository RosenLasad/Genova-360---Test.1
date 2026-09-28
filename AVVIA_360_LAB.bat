@echo off
setlocal EnableExtensions
cd /d "%~dp0"
set "PORT=8765"
set "URL=http://127.0.0.1:%PORT%/"

echo.
echo ==========================================
echo      Genova mApp - 360 Lab v0.1.4
echo ==========================================
echo.
echo Avvio server locale offline con PowerShell...
echo Non serve Python.

start "Genova mApp - 360 Lab Server" /D "%~dp0" powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "$code = Get-Content -LiteralPath '%~dp0server.ps1' -Raw; $sb = [ScriptBlock]::Create($code); & $sb -Port %PORT%"

set /a TRIES=0
:WAIT_LOOP
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "try { $r = Invoke-WebRequest -UseBasicParsing -Uri '%URL%' -TimeoutSec 1; if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) { exit 0 } } catch {}; exit 1" >nul 2>nul
if not errorlevel 1 goto :OPEN_BROWSER
set /a TRIES+=1
if %TRIES% GEQ 15 goto :FALLBACK
ping 127.0.0.1 -n 2 >nul
goto :WAIT_LOOP

:OPEN_BROWSER
echo Server avviato correttamente.
echo Apro %URL%
start "" "%URL%"
exit /b 0

:FALLBACK
echo.
echo ERRORE: il server locale PowerShell non si e avviato.
echo Apro comunque index.html direttamente nel browser.
echo Per video e panorami e preferibile usare localhost o Netlify.
echo.
start "" "%~dp0index.html"
pause
exit /b 1
