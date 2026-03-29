#!/bin/bash
# 城市卡牌游戏 - Mac/Linux启动脚本

echo ""
echo "╔════════════════════════════════════════╗"
echo "║      城市卡牌游戏 - 正在启动...        ║"
echo "╚════════════════════════════════════════╝"
echo ""

# 检查Python3是否安装
if ! command -v python3 &> /dev/null
then
    echo "[错误] 未检测到Python3！"
    echo ""
    echo "Mac用户安装命令: brew install python3"
    echo "Linux用户安装命令: sudo apt install python3"
    echo ""
    exit 1
fi

echo "[✓] Python3已安装"
echo "[→] 启动游戏服务器..."
echo ""

# 进入dist目录
cd "$(dirname "$0")"

echo "游戏地址: http://localhost:8000"
echo ""
echo "╔════════════════════════════════════════╗"
echo "║   浏览器将自动打开，开始游戏吧！       ║"
echo "║   按 Ctrl+C 可停止游戏服务器           ║"
echo "╚════════════════════════════════════════╝"
echo ""

# 等待2秒后打开浏览器
sleep 2

# 根据操作系统打开浏览器
if [[ "$OSTYPE" == "darwin"* ]]; then
    # Mac
    open http://localhost:8000
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:8000
    fi
fi &

# 启动Python HTTP服务器
python3 -m http.server 8000
