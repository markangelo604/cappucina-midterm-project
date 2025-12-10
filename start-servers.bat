@echo off
title Starting Servers...

REM ===============================
REM Detect local IPv4 address
REM ===============================
for /f "tokens=2 delims=:" %%A in ('ipconfig ^| findstr /R /C:"IPv4 Address"') do (
    for /f "tokens=* delims= " %%B in ("%%A") do set SERVER_IP=%%B
    goto :FOUND_IP
)

:FOUND_IP
echo Starting PHP server on %SERVER_IP%:3000...
start "PHP Server" cmd /k "php -S %SERVER_IP%:3000"

echo Starting Node admin server...
start "Node Server" cmd /k "node Server/admin-node.js"

echo All servers started.
pause
