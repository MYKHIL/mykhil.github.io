@echo off
REM Wrapper to run the PowerShell script with progress, logging and error reporting
setlocal
REM ensure console uses UTF-8 so PowerShell output redirected to files uses UTF-8 encoding
chcp 65001 > nul

REM compute repo root and script paths
set "REPO_ROOT=%~dp0"
set "SCRIPT=%REPO_ROOT%scripts\update_website.ps1"
set "TARGET=%REPO_ROOT%projects.html"
set "LOG=%REPO_ROOT%update_website.log"

echo ==================================================
echo Running update script
echo Script: "%SCRIPT%"
echo Target file: "%TARGET%"
echo Log: "%LOG%"
echo Starting at %date% %time%
echo ==================================================

REM Run PowerShell interactively; transcript to temp file then convert to UTF-8 so prompts/menu remain visible
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Start-Transcript -Path '%LOG%.trans' -Force; & '%SCRIPT%'; exit $LASTEXITCODE } finally { Stop-Transcript | Out-Null; try { Get-Content -LiteralPath '%LOG%.trans' -ErrorAction SilentlyContinue | Set-Content -LiteralPath '%LOG%' -Encoding UTF8 -Force } catch { Write-Error 'Failed to convert transcript to UTF8' } }"

set "RC=%ERRORLEVEL%"
if %RC% equ 0 (
	echo.
	echo Completed successfully. Files affected: "%TARGET%"
	echo See log at "%LOG%" for details.
) else (
	echo.
	echo ERROR: Script exited with code %RC%.
	echo Showing last 40 lines of log:
	powershell -NoProfile -Command "Get-Content -Path '%LOG%' -Tail 40 -ErrorAction SilentlyContinue"
	echo.
	echo Please inspect the full log file for details: "%LOG%"
)

pause
endlocal