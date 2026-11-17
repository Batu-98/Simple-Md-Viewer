@echo off
setlocal
title Markdown Viewer - Varsayilan Uygulama Ayari
echo ======================================================
echo    Markdown Viewer - Varsayilan Uygulama Yapici
echo ======================================================
echo.

set "APP_PATH=%~dp0mdviewer.exe"
set "ICON_PATH=%~dp0markdown.ico"

if not exist "%APP_PATH%" (
    echo [HATA] mdviewer.exe bulunamadi!
    pause
    exit /b 1
)

if not exist "%ICON_PATH%" (
    set "ICON_PATH=%APP_PATH%,0"
)

echo [1/3] .md ve .markdown dosya uzantilari kaydediliyor...
reg add "HKCU\Software\Classes\.md" /ve /d "MDViewer.Document" /f >nul
reg add "HKCU\Software\Classes\.markdown" /ve /d "MDViewer.Document" /f >nul

echo [2/3] MDViewer dosya turu ve simgesi tanimlaniyor...
reg add "HKCU\Software\Classes\MDViewer.Document" /ve /d "Markdown Dokumani" /f >nul
reg add "HKCU\Software\Classes\MDViewer.Document\DefaultIcon" /ve /d "\"%ICON_PATH%\"" /f >nul
reg add "HKCU\Software\Classes\MDViewer.Document\shell\open\command" /ve /d "\"%APP_PATH%\" \"%%1\"" /f >nul
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.md\OpenWithProgids" /v "MDViewer.Document" /t REG_NONE /f >nul

echo [3/3] Sag tik menusune 'Markdown Viewer ile Ac' ekleniyor...
reg add "HKCU\Software\Classes\SystemFileAssociations\.md\shell\OpenWithMDViewer" /ve /d "Markdown Viewer ile Ac" /f >nul
reg add "HKCU\Software\Classes\SystemFileAssociations\.md\shell\OpenWithMDViewer" /v "Icon" /d "\"%ICON_PATH%\"" /f >nul
reg add "HKCU\Software\Classes\SystemFileAssociations\.md\shell\OpenWithMDViewer\command" /ve /d "\"%APP_PATH%\" \"%%1\"" /f >nul

reg add "HKCU\Software\Classes\SystemFileAssociations\.markdown\shell\OpenWithMDViewer" /ve /d "Markdown Viewer ile Ac" /f >nul
reg add "HKCU\Software\Classes\SystemFileAssociations\.markdown\shell\OpenWithMDViewer" /v "Icon" /d "\"%ICON_PATH%\"" /f >nul
reg add "HKCU\Software\Classes\SystemFileAssociations\.markdown\shell\OpenWithMDViewer\command" /ve /d "\"%APP_PATH%\" \"%%1\"" /f >nul

echo [Bilgi] Windows simge onbellegi yenileniyor...
powershell -NoProfile -Command "Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class ShellNotify { [DllImport(\"shell32.dll\")] public static extern void SHChangeNotify(int wEventId, int uFlags, IntPtr dwItem1, IntPtr dwItem2); }'; [ShellNotify]::SHChangeNotify(0x08000000, 0, [IntPtr]::Zero, [IntPtr]::Zero)" >nul 2>&1
ie4uinit.exe -show >nul 2>&1

echo.
echo ======================================================
echo    Islem Basariyla Tamamlandi!
echo ======================================================
echo.
echo Artik tum .md dosyalari klasik Markdown simgesiyle
echo gorunecek ve cift tiklandiginda otomatik acilacaktir.
echo.
pause
