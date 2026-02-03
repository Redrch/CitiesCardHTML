@echo off
REM 城市卡牌游戏 - Windows启动脚本
title 城市卡牌游戏

echo.
echo ╔════════════════════════════════════════╗
echo ║      城市卡牌游戏 - 正在启动...        ║
echo ╚════════════════════════════════════════╝
echo.

REM 检查Python是否安装
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到Python！
    echo.
    echo 请先安装Python：https://www.python.org/
    echo.
    pause
    exit /b
)

echo [✓] Python已安装
echo [→] 启动游戏服务器...
echo.

cd dist

REM 启动Python HTTP服务器
echo 游戏地址: http://localhost:8000
echo.
echo ╔════════════════════════════════════════╗
echo ║   浏览器将自动打开，开始游戏吧！       ║
echo ║   关闭此窗口可停止游戏服务器           ║
echo ╚════════════════════════════════════════╝
echo.

REM 自动打开浏览器
timeout /t 2 /nobreak >nul
start http://localhost:8000

REM 启动服务器
python -m http.server 8000
