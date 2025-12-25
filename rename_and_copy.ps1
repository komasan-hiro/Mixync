# Rename files to ASCII to avoid encoding issues
Get-ChildItem -Path 'frontend_new\*HomePage*.jsx' | Rename-Item -NewName 'HomePage.jsx' -ErrorAction SilentlyContinue
Get-ChildItem -Path 'frontend_new\*LoginPage*.jsx' | Rename-Item -NewName 'LoginPage.jsx' -ErrorAction SilentlyContinue
Get-ChildItem -Path 'frontend_new\*RegisterPage*.jsx' | Rename-Item -NewName 'RegisterPage.jsx' -ErrorAction SilentlyContinue
Get-ChildItem -Path 'frontend_new\*SleepChart*.jsx' | Rename-Item -NewName 'SleepChart.jsx' -ErrorAction SilentlyContinue
Get-ChildItem -Path 'frontend_new\*DataVisualization*.jsx' | Rename-Item -NewName 'DataVisualization.jsx' -ErrorAction SilentlyContinue
Get-ChildItem -Path 'frontend_new\*AlarmHistory*.jsx' | Rename-Item -NewName 'AlarmHistory.jsx' -ErrorAction SilentlyContinue
Get-ChildItem -Path 'frontend_new\*PrivateRoute*.jsx' | Rename-Item -NewName 'PrivateRoute.jsx' -ErrorAction SilentlyContinue
Get-ChildItem -Path 'frontend_new\*ShootingStars*.jsx' | Rename-Item -NewName 'ShootingStars.jsx' -ErrorAction SilentlyContinue
Get-ChildItem -Path 'frontend_new\*ShootingStars*.css' | Rename-Item -NewName 'ShootingStars.css' -ErrorAction SilentlyContinue
Get-ChildItem -Path 'frontend_new\*App*.jsx' | Rename-Item -NewName 'App.jsx' -ErrorAction SilentlyContinue
Get-ChildItem -Path 'frontend_new\*index*.html' | Rename-Item -NewName 'index.html' -ErrorAction SilentlyContinue

# Copy files to destination
Copy-Item 'frontend_new\HomePage.jsx' -Destination 'frontend\src\pages\HomePage.jsx' -Force
Copy-Item 'frontend_new\LoginPage.jsx' -Destination 'frontend\src\pages\LoginPage.jsx' -Force
Copy-Item 'frontend_new\RegisterPage.jsx' -Destination 'frontend\src\pages\RegisterPage.jsx' -Force
Copy-Item 'frontend_new\SleepChart.jsx' -Destination 'frontend\src\components\SleepChart.jsx' -Force
Copy-Item 'frontend_new\DataVisualization.jsx' -Destination 'frontend\src\components\DataVisualization.jsx' -Force
Copy-Item 'frontend_new\AlarmHistory.jsx' -Destination 'frontend\src\components\AlarmHistory.jsx' -Force
Copy-Item 'frontend_new\PrivateRoute.jsx' -Destination 'frontend\src\components\PrivateRoute.jsx' -Force
Copy-Item 'frontend_new\ShootingStars.jsx' -Destination 'frontend\src\components\ShootingStars.jsx' -Force
Copy-Item 'frontend_new\ShootingStars.css' -Destination 'frontend\src\components\ShootingStars.css' -Force
Copy-Item 'frontend_new\App.jsx' -Destination 'frontend\src\App.jsx' -Force
Copy-Item 'frontend_new\index.html' -Destination 'frontend\index.html' -Force
