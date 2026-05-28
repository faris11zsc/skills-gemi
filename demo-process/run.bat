@echo off
:: ============================================================
::  DEMO PROCESS — SUPER-PACKER v3.0
::  Quick Launcher for Windows
:: ============================================================

setlocal EnableDelayedExpansion

echo.
echo  ====================================================
echo   DEMO PROCESS — SUPER-PACKER v3.0
echo   The Sasa Protocol - NotebookLM Giant Maker
echo  ====================================================
echo.

:: Check if arguments were passed
if "%~1"=="" (
    echo Usage: run.bat -i "INPUT_FOLDER" -o "OUTPUT_FOLDER" -b "BatchName"
    echo.
    echo Examples:
    echo   run.bat -i "D:\books\Tafsir" -o "D:\processed\Tafsir" -b "Tafsir"
    echo   run.bat -i "D:\books\Fiqh"   -o "D:\processed\Fiqh"   -b "Fiqh" -w 495000
    echo.
    echo Options:
    echo   -i  Input directory  (required)
    echo   -o  Output directory (required)
    echo   -b  Batch name       (optional, default: Batch)
    echo   -w  Words per Giant  (optional, default: 495000)
    echo   -s  Separator lines  (optional, default: 15)
    echo.
    pause
    exit /b 1
)

:: Run with maximum heap
node --max-old-space-size=26000 "%~dp0process.js" %*

echo.
pause
