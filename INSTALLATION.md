# DontbeTerm 安装指南

## macOS 安装

### 方法一：使用安装助手（最简单，推荐）

1. 下载对应的 DMG 文件：
   - Apple Silicon (M1/M2/M3): `DontbeTerm-x.x.x-arm64.dmg`
   - Intel: `DontbeTerm-x.x.x-x64.dmg`

2. 打开 DMG 文件，你会看到三个项目：
   - DontbeTerm.app（应用程序）
   - Applications（应用程序文件夹快捷方式）
   - **安装 DontbeTerm.command**（安装助手）

3. **双击"安装 DontbeTerm.command"**
   - 脚本会自动将应用复制到应用程序文件夹
   - 自动移除隔离属性
   - 询问是否立即打开应用

4. 完成！现在可以正常使用了

### 方法二：手动安装

1. 下载并打开 DMG 文件

2. 将 DontbeTerm.app 拖到应用程序文件夹

3. 打开终端，执行以下命令：
   ```bash
   xattr -cr /Applications/DontbeTerm.app
   ```

4. 现在可以正常打开应用了

1. 下载并安装 DMG 文件

2. 首次打开时，如果提示"应用已损坏"：
   - 打开"系统设置" > "隐私与安全性"
   - 找到"仍要打开"按钮并点击
   - 或者在终端执行：`xattr -cr /Applications/DontbeTerm.app`

### 为什么需要这个步骤？

DontbeTerm 目前是未签名的应用。macOS 的 Gatekeeper 安全机制会阻止未签名应用的运行。执行 `xattr -cr` 命令会移除应用的隔离属性，允许应用运行。

**注意**：这是安全的操作，因为：
- DontbeTerm 是开源软件，代码可在 GitHub 上查看
- 构建过程完全透明，通过 GitHub Actions 自动构建
- 你可以自己从源代码构建应用

### 未来计划

我们计划在未来版本中：
- 使用 Apple Developer ID 签名应用
- 通过 Apple 公证服务认证
- 这样就不需要额外的步骤了

---

## Windows 安装

### 标准安装（推荐）

1. 下载 `DontbeTerm-x.x.x-Setup.exe`

2. 双击运行安装程序

3. 如果 Windows Defender 提示"Windows 已保护你的电脑"：
   - 点击"更多信息"
   - 点击"仍要运行"

4. 按照安装向导完成安装

5. 安装完成后，可以从开始菜单或桌面快捷方式启动应用

### 便携版（无需安装）

如果你不想安装，可以使用便携版：

1. 下载 `DontbeTerm-x.x.x-win-portable.zip`（如果提供）

2. 解压到任意文件夹

3. 运行 `DontbeTerm.exe`

### 常见问题

#### 问题 1：提示"缺少 DLL 文件"

**解决方案**：安装 Visual C++ Redistributable
- 下载：https://aka.ms/vs/17/release/vc_redist.x64.exe
- 安装后重启应用

#### 问题 2：应用无法启动

**解决方案**：
1. 确保你的 Windows 版本是 Windows 10 或更高
2. 检查是否有杀毒软件阻止了应用
3. 尝试以管理员身份运行

#### 问题 3：终端无法创建

**解决方案**：
1. 确保系统中安装了 PowerShell 或 CMD
2. 检查应用是否有足够的权限

### 为什么需要点击"仍要运行"？

DontbeTerm 目前是未签名的应用。Windows SmartScreen 会警告未签名的应用。这是正常的安全提示。

**注意**：这是安全的操作，因为：
- DontbeTerm 是开源软件
- 构建过程通过 GitHub Actions 自动完成
- 你可以查看源代码并自己构建

### 未来计划

我们计划在未来版本中：
- 使用代码签名证书签名应用
- 这样就不会有 SmartScreen 警告了

---

## 从源代码构建

如果你想自己构建应用：

### 前置要求

- Node.js 20 或更高版本
- npm 或 yarn

### 构建步骤

1. 克隆仓库：
   ```bash
   git clone https://github.com/your-username/dontbeterm2.git
   cd dontbeterm2
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 构建应用：
   ```bash
   # macOS
   npm run dist:mac

   # Windows
   npm run dist:win

   # 所有平台
   npm run dist:all
   ```

4. 构建产物在 `dist/` 目录中

---

## 技术支持

如果遇到问题：

1. 查看 [GitHub Issues](https://github.com/your-username/dontbeterm2/issues)
2. 提交新的 Issue 描述你的问题
3. 包含以下信息：
   - 操作系统版本
   - 应用版本
   - 错误信息截图
   - 复制日志（应用内"复制日志"按钮）

---

## 安全说明

### 为什么应用未签名？

代码签名需要：
- **macOS**: Apple Developer Program 会员资格（$99/年）
- **Windows**: 代码签名证书（$100-$500/年）

作为开源项目，我们目前没有这些资源。但你可以：
- 查看完整的源代码
- 查看 GitHub Actions 构建日志
- 自己从源代码构建

### 应用是否安全？

是的，DontbeTerm 是安全的：
- ✅ 完全开源
- ✅ 构建过程透明
- ✅ 不收集任何数据
- ✅ 不需要网络权限（除了 Claude Code CLI 功能）
- ✅ 所有代码可审查

---

## 更新日志

查看 [CHANGELOG.md](CHANGELOG.md) 了解版本更新内容。
