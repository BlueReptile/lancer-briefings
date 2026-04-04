@echo off
set "CWEBP=C:\Users\callm\Downloads\libwebp-1.6.0-windows-x64\libwebp-1.6.0-windows-x64\bin\cwebp.exe"

for /r %%f in (*.png) do (
    echo Convertendo: %%f
    "%CWEBP%" -q 90 "%%f" -o "%%~dpnf.webp"
    
    if exist "%%~dpnf.webp" (
        del "%%f"
        echo OK: %%~dpnf.webp
    ) else (
        echo ERRO ao converter: %%f
    )
)

echo.
echo Conversao finalizada.
pause