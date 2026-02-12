<div align="center">
  <img src="icon.png" alt="DontbeTerm Icon" width="128" height="128">
  <h1>DontbeTerm</h1>
  <p>多标签终端管理器，专为 Claude Code 设计，支持 AI 智能标签命名。</p>
</div>

DontbeTerm 让你同时运行多个 Claude Code 会话，并通过 AI 自动识别每个对话的主题来命名标签页。

## 功能特性

- **多标签终端** — 同时运行多个终端会话
- **Claude Code 集成** — 一键在指定目录启动 Claude Code
- **智能标签命名** — 点击"刷新主题"，AI 自动用 3-5 个字总结每个标签的对话内容
- **普通终端** — 也支持打开纯终端标签页
- **日间/夜间模式** — 一键切换主题
- **快捷键** — Cmd+T、Cmd+W、Cmd+1-9、Cmd+R
- **手动重命名** — 双击标签名即可修改

## 下载

前往 [Releases 页面](https://github.com/dontbesilent2025/DontbeTerm/releases/latest) 下载最新版本。

| 平台 | 文件 |
|------|------|
| macOS (Apple Silicon) | `DontbeTerm-x.x.x-arm64.dmg` |
| macOS (Intel) | `DontbeTerm-x.x.x-x64.dmg` |
| Windows (安装版) | `DontbeTerm-x.x.x-Setup.exe` |
| Windows (便携版) | `DontbeTerm-x.x.x-win-portable.zip` |

## 安装

### 一键安装（推荐）

在终端执行以下命令：

```bash
curl -fsSL https://raw.githubusercontent.com/dontbesilent2025/DontbeTerm/main/install.sh | bash
```

脚本会自动：
- 检测系统架构（Apple Silicon 或 Intel）
- 下载最新版本
- 安装到应用程序文件夹
- 移除隔离属性

### Homebrew 安装（即将支持）

```bash
# 即将支持
brew install --cask dontbeterm
```

### 手动安装

#### macOS

1. 下载对应的 DMG 文件
2. 打开 DMG，**双击"安装 DontbeTerm.command"**
3. 安装助手会自动完成所有步骤
4. 完成！

**手动安装**：如果你更喜欢手动操作，可以将应用拖到应用程序文件夹，然后在终端执行：
```bash
xattr -cr /Applications/DontbeTerm.app
```

**详细说明**：查看 [INSTALLATION.md](INSTALLATION.md)

### Windows

- **安装版**：双击 Setup.exe，按提示安装
- **便携版**：解压 zip 文件，直接运行 DontbeTerm.exe

如遇到 SmartScreen 警告，点击"更多信息" > "仍要运行"

**详细说明**：查看 [INSTALLATION.md](INSTALLATION.md)

- 点击 **`C+`** — 新建 Claude Code 会话（会弹出 Finder 选择工作目录）
- 点击 **`+`** — 新建普通终端
- 点击 **刷新主题** — AI 自动识别并重命名所有标签
- **双击标签名** — 手动重命名

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Cmd+T` | 新建 Claude Code 标签页 |
| `Cmd+W` | 关闭当前标签页 |
| `Cmd+R` | 刷新所有标签主题 |
| `Cmd+1-9` | 切换到指定标签页 |

## 系统要求

- **macOS** 10.13+ 或 **Windows** 10+
- 已安装 [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code)（用于 Claude Code 标签）
- Anthropic API Key（用于智能标签命名功能）

## 技术栈

基于 Electron、xterm.js、node-pty 构建。
