@echo off
title Mining System - San Julian
cd /d "%~dp0"

echo ========================================
echo   MINING MAINTENANCE SYSTEM - v2
echo   San Julian - Sistema de Mantenimiento
echo ========================================
echo.

:: Verificar Python
where python >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python no encontrado. Instala Python 3.x primero.
    pause
    exit /b 1
)

:: Instalar dependencias backend si faltan
echo [1/3] Verificando dependencias del backend...
pip install flask flask-cors bcrypt pyjwt --quiet --exists-action i

:: Iniciar backend en segundo plano
echo [2/3] Iniciando servidor backend (puerto 5000)...
start "Mining Backend" /min cmd /c "cd /d "%~dp0backend" && python server.py"

:: Esperar que el backend arranque
timeout /t 3 /nobreak >nul

:: Iniciar frontend (build estático servido por Python http.server)
echo [3/3] Iniciando frontend (puerto 3000)...
start "Mining Frontend" /min cmd /c "cd /d "%~dp0frontend\build" && python -m http.server 3000"

timeout /t 2 /nobreak >nul

:: Abrir navegador
echo.
echo [OK] Sistema listo! Abriendo navegador...
echo      Backend:  http://localhost:5000
echo      Frontend: http://localhost:3000
echo.
start http://localhost:3000

echo Cierra esta ventana para detener el sistema o presiona cualquier tecla.
pause >nul

:: Al cerrar, matar los procesos
taskkill /f /fi "WINDOWTITLE eq Mining Backend*" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Mining Frontend*" >nul 2>&1