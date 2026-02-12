#!/bin/bash

# DontbeTerm 安装助手
# 双击此脚本即可完成安装

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 清屏
clear

echo "╔════════════════════════════════════════╗"
echo "║     DontbeTerm 安装助手                ║"
echo "║     Installation Helper                ║"
echo "╚════════════════════════════════════════╝"
echo ""

# 获取脚本所在目录（DMG 挂载点）
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
APP_IN_DMG="$SCRIPT_DIR/DontbeTerm.app"
APP_DEST="/Applications/DontbeTerm.app"

echo "📦 正在检查应用..."
echo ""

# 检查 DMG 中的应用是否存在
if [ ! -d "$APP_IN_DMG" ]; then
    echo "${RED}❌ 错误: 找不到 DontbeTerm.app${NC}"
    echo ""
    echo "请确保此脚本在 DMG 文件中运行。"
    echo ""
    read -p "按 Enter 键退出..."
    exit 1
fi

# 检查应用程序文件夹是否已存在旧版本
if [ -d "$APP_DEST" ]; then
    echo "${YELLOW}⚠️  检测到已安装的版本${NC}"
    echo ""
    read -p "是否要替换现有版本？(y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "安装已取消。"
        echo ""
        read -p "按 Enter 键退出..."
        exit 0
    fi
    echo ""
    echo "🗑️  正在删除旧版本..."
    rm -rf "$APP_DEST"
fi

# 复制应用到应用程序文件夹
echo "📋 正在复制应用到应用程序文件夹..."
cp -R "$APP_IN_DMG" "$APP_DEST"

if [ $? -ne 0 ]; then
    echo ""
    echo "${RED}❌ 复制失败${NC}"
    echo ""
    echo "可能需要管理员权限。请尝试手动拖动应用到应用程序文件夹。"
    echo ""
    read -p "按 Enter 键退出..."
    exit 1
fi

echo "${GREEN}✓${NC} 复制完成"
echo ""

# 移除隔离属性
echo "🔓 正在移除隔离属性..."
xattr -cr "$APP_DEST" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "${GREEN}✓${NC} 隔离属性已移除"
else
    echo "${YELLOW}⚠️  移除隔离属性失败，但应用已安装${NC}"
    echo ""
    echo "如果应用无法打开，请在终端执行："
    echo "  xattr -cr /Applications/DontbeTerm.app"
fi

echo ""
echo "╔════════════════════════════════════════╗"
echo "║  ${GREEN}✅ 安装完成！${NC}                      ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "现在可以："
echo "  • 从启动台打开 DontbeTerm"
echo "  • 从应用程序文件夹打开 DontbeTerm"
echo "  • 使用 Spotlight 搜索 DontbeTerm"
echo ""
echo "提示：可以将 DontbeTerm 拖到 Dock 栏以便快速访问。"
echo ""

# 询问是否立即打开应用
read -p "是否立即打开 DontbeTerm？(y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 正在启动 DontbeTerm..."
    open "$APP_DEST"
fi

echo ""
read -p "按 Enter 键退出..."
