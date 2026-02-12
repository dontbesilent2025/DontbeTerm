#!/bin/bash

# DontbeTerm 一键安装脚本
# 使用方法: curl -fsSL https://raw.githubusercontent.com/dontbesilent2025/DontbeTerm/main/install.sh | bash

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 清屏
clear

echo ""
echo "${BLUE}╔════════════════════════════════════════╗${NC}"
echo "${BLUE}║     DontbeTerm 一键安装脚本            ║${NC}"
echo "${BLUE}║     One-Click Installation Script      ║${NC}"
echo "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# 检测系统架构
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
    DOWNLOAD_ARCH="arm64"
    echo "✓ 检测到 Apple Silicon (M1/M2/M3)"
elif [ "$ARCH" = "x86_64" ]; then
    DOWNLOAD_ARCH="x64"
    echo "✓ 检测到 Intel 处理器"
else
    echo "${RED}❌ 不支持的架构: $ARCH${NC}"
    exit 1
fi

echo ""

# 获取最新版本
echo "📡 正在获取最新版本信息..."
LATEST_RELEASE=$(curl -s https://api.github.com/repos/dontbesilent2025/DontbeTerm/releases/latest)
VERSION=$(echo "$LATEST_RELEASE" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/' | sed 's/v//')

if [ -z "$VERSION" ]; then
    echo "${RED}❌ 无法获取版本信息${NC}"
    echo "请检查网络连接或手动下载: https://github.com/dontbesilent2025/DontbeTerm/releases"
    exit 1
fi

echo "${GREEN}✓${NC} 最新版本: v$VERSION"
echo ""

# 构建下载 URL
DOWNLOAD_URL="https://github.com/dontbesilent2025/DontbeTerm/releases/download/v${VERSION}/DontbeTerm-${VERSION}-${DOWNLOAD_ARCH}.dmg"
DMG_FILE="/tmp/DontbeTerm-${VERSION}-${DOWNLOAD_ARCH}.dmg"

# 下载 DMG
echo "📥 正在下载 DontbeTerm..."
echo "   URL: $DOWNLOAD_URL"
echo ""

if command -v wget &> /dev/null; then
    wget -q --show-progress -O "$DMG_FILE" "$DOWNLOAD_URL"
elif command -v curl &> /dev/null; then
    curl -L --progress-bar -o "$DMG_FILE" "$DOWNLOAD_URL"
else
    echo "${RED}❌ 需要 curl 或 wget 来下载文件${NC}"
    exit 1
fi

if [ ! -f "$DMG_FILE" ]; then
    echo "${RED}❌ 下载失败${NC}"
    exit 1
fi

echo "${GREEN}✓${NC} 下载完成"
echo ""

# 挂载 DMG
echo "💿 正在挂载 DMG..."
MOUNT_POINT=$(hdiutil attach "$DMG_FILE" -nobrowse | grep "/Volumes/" | sed 's/.*\(\/Volumes\/.*\)/\1/')

if [ -z "$MOUNT_POINT" ]; then
    echo "${RED}❌ 挂载失败${NC}"
    rm -f "$DMG_FILE"
    exit 1
fi

echo "${GREEN}✓${NC} 已挂载到: $MOUNT_POINT"
echo ""

# 检查应用是否存在
APP_PATH="$MOUNT_POINT/DontbeTerm.app"
if [ ! -d "$APP_PATH" ]; then
    echo "${RED}❌ 在 DMG 中找不到应用${NC}"
    hdiutil detach "$MOUNT_POINT" -quiet
    rm -f "$DMG_FILE"
    exit 1
fi

# 检查是否已安装旧版本
DEST_PATH="/Applications/DontbeTerm.app"
if [ -d "$DEST_PATH" ]; then
    echo "${YELLOW}⚠️  检测到已安装的版本${NC}"
    read -p "是否要替换现有版本？(y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "安装已取消。"
        hdiutil detach "$MOUNT_POINT" -quiet
        rm -f "$DMG_FILE"
        exit 0
    fi
    echo ""
    echo "🗑️  正在删除旧版本..."
    rm -rf "$DEST_PATH"
fi

# 复制应用
echo "📋 正在安装 DontbeTerm..."
cp -R "$APP_PATH" "$DEST_PATH"

if [ $? -ne 0 ]; then
    echo "${RED}❌ 安装失败${NC}"
    hdiutil detach "$MOUNT_POINT" -quiet
    rm -f "$DMG_FILE"
    exit 1
fi

echo "${GREEN}✓${NC} 应用已复制到应用程序文件夹"
echo ""

# 移除隔离属性
echo "🔓 正在移除隔离属性..."
xattr -cr "$DEST_PATH" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "${GREEN}✓${NC} 隔离属性已移除"
else
    echo "${YELLOW}⚠️  移除隔离属性失败，但应用已安装${NC}"
    echo ""
    echo "如果应用无法打开，请手动执行："
    echo "  xattr -cr /Applications/DontbeTerm.app"
fi

# 清理
echo ""
echo "🧹 正在清理临时文件..."
hdiutil detach "$MOUNT_POINT" -quiet
rm -f "$DMG_FILE"

echo ""
echo "${BLUE}╔════════════════════════════════════════╗${NC}"
echo "${BLUE}║  ${GREEN}✅ 安装完成！${NC}                      ${BLUE}║${NC}"
echo "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo "现在可以："
echo "  • 从启动台打开 DontbeTerm"
echo "  • 从应用程序文件夹打开 DontbeTerm"
echo "  • 使用 Spotlight 搜索 DontbeTerm"
echo "  • 运行命令: open -a DontbeTerm"
echo ""
echo "提示：可以将 DontbeTerm 拖到 Dock 栏以便快速访问。"
echo ""

# 询问是否立即打开
read -p "是否立即打开 DontbeTerm？(y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 正在启动 DontbeTerm..."
    open -a DontbeTerm
fi

echo ""
echo "感谢使用 DontbeTerm！"
echo "项目地址: https://github.com/dontbesilent2025/DontbeTerm"
echo ""
