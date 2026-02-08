@echo off
REM ============================================
REM Dreamweaver - Windows Otomatik Kurulum
REM ============================================

echo.
echo ========================================
echo     DREAMWEAVER - KURULUM BASLIYOR
echo ========================================
echo.

REM Node.js kontrolu
echo [1/6] Node.js kontrolu...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [HATA] Node.js bulunamadi!
    echo Lutfen Node.js v18+ yukleyin: https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=1" %%v in ('node -v') do echo [OK] Node.js %%v bulundu

REM npm kontrolu
echo [2/6] npm kontrolu...
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [HATA] npm bulunamadi!
    pause
    exit /b 1
)
for /f "tokens=1" %%v in ('npm -v') do echo [OK] npm %%v bulundu

REM Bagimliliklari yukle
echo [3/6] Bagimliliklar yukleniyor...
call npm install --legacy-peer-deps
if %ERRORLEVEL% NEQ 0 (
    echo [HATA] Bagimlilik yukleme hatasi!
    pause
    exit /b 1
)
echo [OK] Bagimliliklar yuklendi

REM .env dosyasi kontrolu
echo [4/6] Environment konfigurasyonu...
if not exist .env (
    if exist .env.example (
        copy .env.example .env >nul
        echo [OK] .env dosyasi olusturuldu
        echo [UYARI] Production icin JWT_SECRET ve ADMIN_PASSWORD degistirin!
    ) else (
        echo [HATA] .env.example bulunamadi!
        pause
        exit /b 1
    )
) else (
    echo [OK] .env dosyasi mevcut
)

REM Veritabani kurulumu
echo [5/6] Veritabani hazirlaniyor...
call npx prisma generate
call npx prisma migrate deploy 2>nul || call npx prisma db push
call npm run db:seed 2>nul
echo [OK] Veritabani hazir

REM Build
echo [6/6] Production build...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [HATA] Build hatasi!
    pause
    exit /b 1
)
echo [OK] Build tamamlandi

echo.
echo ========================================
echo    KURULUM BASARIYLA TAMAMLANDI!
echo ========================================
echo.
echo Uygulamayi baslatmak icin:
echo   npm start        (Production)
echo   npm run dev      (Development)
echo.
echo Erisim: http://localhost:3000
echo Admin:  http://localhost:3000/admin
echo.
echo Admin Giris Bilgileri:
echo   Kullanici: admin
echo   Sifre: admin123
echo.

set /p CONTINUE="Uygulamayi simdi baslatmak ister misiniz? (E/H): "
if /i "%CONTINUE%"=="E" (
    echo Uygulama baslatiliyor...
    call npm start
)

pause
