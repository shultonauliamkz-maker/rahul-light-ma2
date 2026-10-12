@echo off
title RAHUL LIGHT - MA2 DOWNGRADER (PUBLIC ONLINE RUNNER)
color 0E

echo ====================================================================
echo        RAHUL LIGHT - GRANDMA2 FILE DOWNGRADER SUITE
echo ====================================================================
echo [1/2] Menjalankan Server Lokal Express...
start /b cmd /c "node server/index.js"

timeout /t 2 >nul

echo [2/2] Membuka Tunnel Publik HTTPS Gratis...
echo ====================================================================
echo  Website RAHUL LIGHT sedang terhubung ke Internet Publik!
echo  Tunggu beberapa detik, link publik HTTPS akan muncul di bawah ini...
echo ====================================================================
echo.

C:\Windows\System32\OpenSSH\ssh.exe -o StrictHostKeyChecking=no -R 80:127.0.0.1:3000 nokey@localhost.run

pause
