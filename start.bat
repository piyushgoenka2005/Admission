@echo off
setlocal

:: Always run from the folder where this .bat lives
cd /d "%~dp0"

title NRSC Internship Portal

set PORT=3000
set LAN_IP=

for /f %%i in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 ^| Where-Object { $_.IPAddress -ne ''127.0.0.1'' -and $_.IPAddress -notlike ''169.254*'' -and $_.InterfaceAlias -notmatch ''Loopback|vEthernet|Virtual'' } ^| Select-Object -First 1 -ExpandProperty IPAddress)"') do set LAN_IP=%%i

echo.
echo ============================================================
echo   NRSC Internship Portal
echo ============================================================
echo.

echo ============================================================
echo   Starting server at http://localhost:%PORT%
if defined LAN_IP (
	echo   LAN URL: http://%LAN_IP%:%PORT%
	echo   Share this LAN URL with devices on same Wi-Fi.
) else (
	echo   LAN URL not detected automatically.
	echo   Run "ipconfig" and use your IPv4 address with port %PORT%.
)
echo   Press Ctrl+C to stop.
echo ============================================================
echo.

start "" cmd /c "timeout /t 6 /nobreak >nul && start http://localhost:%PORT%"

call npm run dev:lan

endlocal
