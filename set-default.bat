@echo off
setlocal
title Markdown Viewer - Default File Association
echo ======================================================
echo    Markdown Viewer - Set as Default App
echo ======================================================
echo.

set "APP_PATH=%~dp0mdviewer.exe"
set "ICON_PATH=%~dp0markdown.ico"

if not exist "%APP_PATH%" (
    echo [ERROR] mdviewer.exe not found!
    pause
    exit /b 1
)

if not exist "%ICON_PATH%" (
    set "ICON_PATH=%APP_PATH%,0"
)

echo [1/3] Registering .md and .markdown file extensions...
reg add "HKCU\Software\Classes\.md" /ve /d "MDViewer.Document" /f >nul
reg add "HKCU\Software\Classes\.markdown" /ve /d "MDViewer.Document" /f >nul

echo [2/3] Setting document type, command, and icon...
reg add "HKCU\Software\Classes\MDViewer.Document" /ve /d "Markdown Document" /f >nul
reg add "HKCU\Software\Classes\MDViewer.Document\DefaultIcon" /ve /d "\"%ICON_PATH%\"" /f >nul
reg add "HKCU\Software\Classes\MDViewer.Document\shell\open\command" /ve /d "\"%APP_PATH%\" \"%%1\"" /f >nul
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.md\OpenWithProgids" /v "MDViewer.Document" /t REG_NONE /f >nul

echo [3/3] Adding 'Open with Markdown Viewer' to right-click context menu...
reg add "HKCU\Software\Classes\SystemFileAssociations\.md\shell\OpenWithMDViewer" /ve /d "Open with Markdown Viewer" /f >nul
reg add "HKCU\Software\Classes\SystemFileAssociations\.md\shell\OpenWithMDViewer" /v "Icon" /d "\"%ICON_PATH%\"" /f >nul
reg add "HKCU\Software\Classes\SystemFileAssociations\.md\shell\OpenWithMDViewer\command" /ve /d "\"%APP_PATH%\" \"%%1\"" /f >nul

reg add "HKCU\Software\Classes\SystemFileAssociations\.markdown\shell\OpenWithMDViewer" /ve /d "Open with Markdown Viewer" /f >nul
reg add "HKCU\Software\Classes\SystemFileAssociations\.markdown\shell\OpenWithMDViewer" /v "Icon" /d "\"%ICON_PATH%\"" /f >nul
reg add "HKCU\Software\Classes\SystemFileAssociations\.markdown\shell\OpenWithMDViewer\command" /ve /d "\"%APP_PATH%\" \"%%1\"" /f >nul

echo [Info] Refreshing Windows shell icon cache...
powershell -NoProfile -Command "Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class ShellNotify { [DllImport(\"shell32.dll\")] public static extern void SHChangeNotify(int wEventId, int uFlags, IntPtr dwItem1, IntPtr dwItem2); }'; [ShellNotify]::SHChangeNotify(0x08000000, 0, [IntPtr]::Zero, [IntPtr]::Zero)" >nul 2>&1
ie4uinit.exe -show >nul 2>&1

echo.
echo ======================================================
echo    Setup Completed Successfully!
echo ======================================================
echo.
echo Markdown (.md) files will now display the official icon
echo and open automatically in Markdown Viewer on double-click.
echo.
pause
