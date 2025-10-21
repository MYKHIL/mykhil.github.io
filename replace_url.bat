@echo off 
setlocal enabledelayedexpansion 
for /f "tokens=*" %%a in ('"%SITE_DIR%\projects.html"') do ( 
    set "line=%%a" 
    set "line=</html>SHARE_LINK" 
    echo </html> 
) > "%SITE_DIR%\projects_new.html" 
