@echo off
setlocal
title Markdown Viewer - Remove Default Association
echo ======================================================
echo    Markdown Viewer - Remove Default Association
echo ======================================================
echo.

echo Removing registry entries...
reg delete "HKCU\Software\Classes\.md" /f >nul 2>&1
reg delete "HKCU\Software\Classes\.markdown" /f >nul 2>&1
reg delete "HKCU\Software\Classes\MDViewer.Document" /f >nul 2>&1
reg delete "HKCU\Software\Classes\SystemFileAssociations\.md\shell\OpenWithMDViewer" /f >nul 2>&1
reg delete "HKCU\Software\Classes\SystemFileAssociations\.markdown\shell\OpenWithMDViewer" /f >nul 2>&1
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.md\OpenWithProgids" /v "MDViewer.Document" /f >nul 2>&1

echo [Info] Refreshing Windows shell icon cache...
powershell -NoProfile -Command "Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class ShellNotify { [DllImport(\"shell32.dll\")] public static extern void SHChangeNotify(int wEventId, int uFlags, IntPtr dwItem1, IntPtr dwItem2); }'; [ShellNotify]::SHChangeNotify(0x08000000, 0, [IntPtr]::Zero, [IntPtr]::Zero)" >nul 2>&1
ie4uinit.exe -show >nul 2>&1

echo.
echo ======================================================
echo    Associations Removed Successfully!
echo ======================================================
echo.
pause
