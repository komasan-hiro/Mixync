@echo off
robocopy frontend_new frontend\src\pages HomePage.jsx LoginPage.jsx RegisterPage.jsx /IS /IT
robocopy frontend_new frontend\src\components SleepChart.jsx DataVisualization.jsx AlarmHistory.jsx PrivateRoute.jsx ShootingStars.jsx ShootingStars.css /IS /IT
robocopy frontend_new frontend\src App.jsx /IS /IT
robocopy frontend_new frontend index.html /IS /IT
exit /b 0
