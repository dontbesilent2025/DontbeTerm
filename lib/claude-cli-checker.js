const { spawn } = require('child_process');
const { app } = require('electron');

// Claude CLI 状态
let claudeCliStatus = {
  available: false,
  version: null,
  lastCheck: null,
  error: null
};

/**
 * 检查 Claude CLI 是否可用
 */
async function checkClaudeCli() {
  return new Promise((resolve) => {
    console.log('[Claude CLI Check] Starting check...');

    const checkProcess = spawn('which', ['claude']);
    let output = '';
    let errorOutput = '';

    checkProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    checkProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    checkProcess.on('close', (code) => {
      if (code === 0 && output.trim()) {
        console.log('[Claude CLI Check] Found at:', output.trim());
        // Claude CLI 存在，检查版本
        checkClaudeVersion().then((version) => {
          claudeCliStatus = {
            available: true,
            version: version,
            lastCheck: Date.now(),
            error: null
          };
          console.log('[Claude CLI Check] Available, version:', version);
          resolve(claudeCliStatus);
        }).catch((err) => {
          claudeCliStatus = {
            available: false,
            version: null,
            lastCheck: Date.now(),
            error: 'Version check failed: ' + err.message
          };
          console.error('[Claude CLI Check] Version check failed:', err);
          resolve(claudeCliStatus);
        });
      } else {
        claudeCliStatus = {
          available: false,
          version: null,
          lastCheck: Date.now(),
          error: 'Claude CLI not found in PATH'
        };
        console.error('[Claude CLI Check] Not found in PATH');
        resolve(claudeCliStatus);
      }
    });

    checkProcess.on('error', (err) => {
      claudeCliStatus = {
        available: false,
        version: null,
        lastCheck: Date.now(),
        error: 'Check failed: ' + err.message
      };
      console.error('[Claude CLI Check] Error:', err);
      resolve(claudeCliStatus);
    });
  });
}

/**
 * 检查 Claude CLI 版本
 */
async function checkClaudeVersion() {
  return new Promise((resolve, reject) => {
    const versionProcess = spawn('claude', ['--version']);
    let output = '';

    versionProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    versionProcess.stderr.on('data', (data) => {
      output += data.toString();
    });

    versionProcess.on('close', (code) => {
      if (code === 0) {
        const version = output.trim();
        resolve(version);
      } else {
        reject(new Error('Version command failed'));
      }
    });

    versionProcess.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * 测试 Claude CLI 是否可以正常工作
 */
async function testClaudeCli() {
  return new Promise((resolve) => {
    console.log('[Claude CLI Test] Testing with simple prompt...');

    const testProcess = spawn('sh', ['-c', 'echo "test" | claude -p "Say OK"'], {
      timeout: 10000
    });

    let output = '';
    let errorOutput = '';

    testProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    testProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    testProcess.on('close', (code) => {
      if (code === 0 && output.trim()) {
        console.log('[Claude CLI Test] Test successful');
        resolve({ success: true, output: output.trim() });
      } else {
        console.error('[Claude CLI Test] Test failed:', errorOutput);
        resolve({
          success: false,
          error: errorOutput || 'No output received'
        });
      }
    });

    testProcess.on('error', (err) => {
      console.error('[Claude CLI Test] Error:', err);
      resolve({ success: false, error: err.message });
    });
  });
}

/**
 * 获取 Claude CLI 状态
 */
function getClaudeCliStatus() {
  return claudeCliStatus;
}

/**
 * 获取配置指南
 */
function getSetupGuide() {
  return {
    title: 'Claude CLI 配置指南',
    steps: [
      {
        step: 1,
        title: '安装 Claude Code CLI',
        description: '访问 https://docs.anthropic.com/claude/docs/claude-code 下载并安装'
      },
      {
        step: 2,
        title: '验证安装',
        description: '在终端运行: claude --version'
      },
      {
        step: 3,
        title: '配置认证',
        description: '运行: claude auth login'
      },
      {
        step: 4,
        title: '测试',
        description: '运行: echo "test" | claude -p "Say hello"'
      }
    ],
    troubleshooting: [
      {
        problem: 'command not found: claude',
        solution: 'Claude CLI 未安装或不在 PATH 中。请重新安装或添加到 PATH。'
      },
      {
        problem: 'Authentication required',
        solution: '需要登录。运行: claude auth login'
      },
      {
        problem: 'Network error',
        solution: '检查网络连接，确保可以访问 Anthropic API'
      }
    ]
  };
}

module.exports = {
  checkClaudeCli,
  testClaudeCli,
  getClaudeCliStatus,
  getSetupGuide
};
