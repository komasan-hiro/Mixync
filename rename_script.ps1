$files = Get-ChildItem "frontend_new"
foreach ($f in $files) {
    if ($f.Name -match "HomePage") { Rename-Item $f.FullName -NewName "HomePage.jsx" -Force }
    if ($f.Name -match "LoginPage") { Rename-Item $f.FullName -NewName "LoginPage.jsx" -Force }
    if ($f.Name -match "RegisterPage") { Rename-Item $f.FullName -NewName "RegisterPage.jsx" -Force }
    if ($f.Name -match "SleepChart") { Rename-Item $f.FullName -NewName "SleepChart.jsx" -Force }
    if ($f.Name -match "DataVisualization") { Rename-Item $f.FullName -NewName "DataVisualization.jsx" -Force }
    if ($f.Name -match "AlarmHistory") { Rename-Item $f.FullName -NewName "AlarmHistory.jsx" -Force }
    if ($f.Name -match "PrivateRoute") { Rename-Item $f.FullName -NewName "PrivateRoute.jsx" -Force }
    if ($f.Name -match "ShootingStars.*jsx") { Rename-Item $f.FullName -NewName "ShootingStars.jsx" -Force }
    if ($f.Name -match "ShootingStars.*css") { Rename-Item $f.FullName -NewName "ShootingStars.css" -Force }
    if ($f.Name -match "App") { Rename-Item $f.FullName -NewName "App.jsx" -Force }
    if ($f.Name -match "index") { Rename-Item $f.FullName -NewName "index.html" -Force }
}
