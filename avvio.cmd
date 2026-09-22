@echo off
setlocal
title Solco - avvio
cd /d "%~dp0"

echo.
echo  Solco - vetrina di dischi
echo  -------------------------
echo  Serve PostgreSQL acceso con il database U5W7D2 (postgres / 1234).
echo.

echo  [1/3] Avvio backend  (Spring Boot, http://localhost:8080)
start "Solco BE" /D "%~dp0BE" cmd /k call "%~dp0BE\mvnw.cmd" spring-boot:run

if not exist "%~dp0FE\node_modules" (
  echo  [2/3] Prima installazione delle dipendenze del frontend...
  pushd "%~dp0FE"
  call npm install
  popd
) else (
  echo  [2/3] Dipendenze del frontend gia' installate
)

echo  [3/3] Avvio frontend (Vite, http://localhost:5173)
start "Solco FE" /D "%~dp0FE" cmd /k npm run dev

echo.
echo  Attendo che il backend risponda...
set /a tentativi=0
:attesa
set /a tentativi+=1
if %tentativi% gtr 90 (
  echo  Il backend non risponde dopo 3 minuti: controlla la finestra "Solco BE".
  pause
  exit /b 1
)
timeout /t 2 /nobreak >nul
powershell -NoProfile -Command "try { Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 http://localhost:8080/api/dischi | Out-Null; exit 0 } catch { exit 1 }"
if errorlevel 1 goto attesa

echo  Tutto pronto: apro il browser.
start "" http://localhost:5173
echo  Per fermare tutto chiudi le finestre "Solco BE" e "Solco FE".
timeout /t 5 >nul
endlocal
