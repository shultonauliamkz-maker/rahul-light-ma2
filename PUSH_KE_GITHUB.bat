@echo off
title UPLOAD KE GITHUB - RAHUL LIGHT
color 0A

echo ====================================================================
echo    MENGUNGGAH PROYEK RAHUL LIGHT KE GITHUB ANDA
echo ====================================================================
echo.
echo Jika muncul jendela browser kecil, klik "Sign in with your browser"
echo atau "Authorize git-ecosystem".
echo.

"C:\Program Files\Git\cmd\git.exe" push -u origin main

echo.
echo ====================================================================
echo Selesai! Jika berhasil, seluruh kode sudah masuk ke GitHub.
echo ====================================================================
pause
