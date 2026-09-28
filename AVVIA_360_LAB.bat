@echo off
setlocal EnableExtensions
cd /d "%~dp0"
set "PORT=8765"
set "URL=http://127.0.0.1:%PORT%/"

echo.
echo ==========================================
echo      Genova mApp - 360 Lab
echo ==========================================
echo.
echo Avvio server locale offline...

where py >nul 2>nul
if not errorlevel 1 (
  start "Genova mApp - 360 Lab Server" /D "%~dp0" cmd /k "py -m http.server %PORT% --bind 127.0.0.1"
  goto :WAIT_SERVER
)

where python >nul 2>nul
if not errorlevel 1 (
  start "Genova mApp - 360 Lab Server" /D "%~dp0" cmd /k "python -m http.server %PORT% --bind 127.0.0.1"
  goto :WAIT_SERVER
)

echo Python non trovato. Provo il server PowerShell integrato...
start "Genova mApp - 360 Lab Server" /D "%~dp0" powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "$code = Get-Content -LiteralPath '%~dp0server.ps1' -Raw; $sb = [ScriptBlock]::Create($code); ^& $sb -Port %PORT%"

goto :WAIT_SERVER

:WAIT_SERVER
set /a TRIES=0
:WAIT_LOOP
powershell.exe -NoLogo -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing -Uri '%URL%' -TimeoutSec 1; if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) { exit 0 } } catch {}; exit 1" >nul 2>nul
if not errorlevel 1 goto :OPEN_BROWSER
set /a TRIES+=1
if %TRIES% GEQ 12 goto :FALLBACK
ping 127.0.0.1 -n 2 >nul
goto :WAIT_LOOP

:OPEN_BROWSER
echo Server avviato correttamente.
echo Apro %URL%
start "" "%URL%"
exit /b 0

:FALLBACK
echo.
echo ATTENZIONE: non sono riuscito ad avviare il server locale.
echo Apro comunque index.html direttamente nel browser.
echo Per video e panorami il funzionamento migliore si ottiene tramite localhost.
echo.
start "" "%~dp0index.html"
pause
exit /b 1
