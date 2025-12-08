@echo off
title Starting Servers...

echo Starting PHP server on port 3000...
start "PHP Server" cmd /k "php -S localhost:3000"

echo Starting Node admin server...
start "Node Server" cmd /k "node Server/admin-node.js"

echo All servers started.
pause