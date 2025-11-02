@echo off
echo Starting Jharkhand Civic Issues Application on Localhost...
echo.

echo Installing dependencies...
call npm run install-all

echo.
echo Starting the application...
echo Server will run on: http://localhost:5000
echo Client will run on: http://localhost:3000
echo.

call npm run dev
