@echo off
echo Starting TensorFlow Project Servers...
echo.

echo Starting Backend Server (Port 4000)...
start "Backend Server" cmd /k "cd backend && npm run dev"

timeout /t 3

echo Starting Frontend Server (Port 3000)...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:4000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit...
pause
