# DontbeTerm

多标签终端管理器，专为 Claude Code 设计，支持 AI 智能标签命名。

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

| 平台 | 下载 |
|------|------|
| macOS (Apple Silicon / M系列芯片) | [DontbeTerm-Mac-AppleSilicon.dmg](https://github.com/dontbesilent2025/DontbeTerm/releases/latest) |
| macOS (Intel) | [DontbeTerm-Mac-Intel.dmg](https://github.com/dontbesilent2025/DontbeTerm/releases/latest) |
| Windows | [DontbeTerm-Windows-Setup.exe](https://github.com/dontbesilent2025/DontbeTerm/releases/latest) |

## 使用说明

### 1. 安装

- **macOS**：打开 `.dmg` 文件，将 DontbeTerm 拖入"应用程序"文件夹。首次打开时，右键点击应用选择"打开"（未签名应用需要此操作）。
- **Windows**：运行 `.exe` 安装程序。

### 2. 配置 API（用于智能标签命名）

首次启动时会弹出设置窗口，请填写：

- **Base URL**：你的 Claude API 地址（例如 `https://api.anthropic.com`）
- **API Key**：你的 API 密钥

之后也可以通过工具栏的"设置"按钮修改。

> API 仅用于标签自动命名功能（使用 claude-3-5-haiku 模型）。每次命名约花费 $0.001。终端和 Claude Code 会话使用你本地的 `claude` CLI，与此 API 无关。

### 3. 使用

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
