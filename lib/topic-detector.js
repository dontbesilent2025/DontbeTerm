const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const { spawn } = require('child_process');

function stripAnsi(str) {
  return str
    .replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')
    .replace(/\x1B\][^\x07]*\x07/g, '')
    .replace(/[\x00-\x09\x0B-\x1F]/g, '');
}

// 从终端内容中提取有用信息用于命名
function extractInfoFromBuffer(bufferContent) {
  const cleaned = stripAnsi(bufferContent).trim();

  // 尝试提取目录名
  const cwdMatch = cleaned.match(/(?:^|\n)([~/][\w\-./]+)(?:\s|$)/);
  if (cwdMatch) {
    const dirPath = cwdMatch[1];
    const dirName = path.basename(dirPath);
    if (dirName && dirName !== '~' && dirName.length > 0) {
      return { type: 'directory', value: dirName };
    }
  }

  // 尝试提取命令
  const commandMatch = cleaned.match(/(?:^|\n)\$\s+(\w+)/);
  if (commandMatch) {
    const command = commandMatch[1];
    if (command && command !== 'cd' && command !== 'ls') {
      return { type: 'command', value: command };
    }
  }

  return null;
}

// 降级方案：基于规则的命名
function fallbackNaming(bufferContent) {
  console.log('[Topic Detector] Using fallback naming...');

  const info = extractInfoFromBuffer(bufferContent);

  if (info) {
    if (info.type === 'directory') {
      return info.value;
    } else if (info.type === 'command') {
      return `${info.value} 会话`;
    }
  }

  return '新对话';
}

// 通过 Claude Code CLI 检测主题
async function detectTopicViaClaudeCode(bufferContent) {
  return new Promise((resolve) => {
    console.log('[Topic Detector] Starting topic detection...');
    const cleaned = stripAnsi(bufferContent).trim();
    if (!cleaned || cleaned.length < 50) {
      console.log('[Topic Detector] Buffer too short, using fallback');
      resolve(fallbackNaming(bufferContent));
      return;
    }

    const content = cleaned.slice(-2000);
    console.log('[Topic Detector] Buffer length:', content.length);

    // 使用临时文件传递内容，避免命令行参数问题
    const tmpFile = path.join(app.getPath('temp'), `topic-${Date.now()}.txt`);

    try {
      fs.writeFileSync(tmpFile, content, 'utf8');
      console.log('[Topic Detector] Temp file created:', tmpFile);
    } catch (err) {
      console.error('[Topic Detector] Failed to write temp file:', err);
      resolve(fallbackNaming(bufferContent));
      return;
    }

    const command = `cat "${tmpFile}" | claude -p "请用3-5个中文字总结以下终端对话的主题。只输出主题词，不要任何解释或标点符号。"`;
    console.log('[Topic Detector] Executing command');

    const claudeProcess = spawn('sh', ['-c', command], {
      timeout: 20000, // 20秒超时
      env: { ...process.env, PATH: process.env.PATH }
    });

    let output = '';
    let errorOutput = '';
    let timedOut = false;

    const timeout = setTimeout(() => {
      timedOut = true;
      claudeProcess.kill();
      console.error('[Topic Detector] Command timed out');
    }, 20000);

    claudeProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    claudeProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    claudeProcess.on('close', (code) => {
      clearTimeout(timeout);
      console.log('[Topic Detector] Process closed with code:', code);

      // 清理临时文件
      try {
        fs.unlinkSync(tmpFile);
      } catch (err) {
        // 忽略清理错误
      }

      if (timedOut) {
        console.error('[Topic Detector] Timeout, using fallback');
        resolve(fallbackNaming(bufferContent));
        return;
      }

      if (code === 0 && output.trim()) {
        // 提取最后一个非空行作为结果
        const lines = output.trim().split('\n').filter(line => line.trim().length > 0);
        const topic = lines.length > 0 ? lines[lines.length - 1].trim() : '';
        console.log('[Topic Detector] Detected topic:', topic);

        // 过滤掉一些无效的结果
        if (topic && topic !== '新对话' && topic.length > 0 && topic.length < 20) {
          resolve(topic);
        } else {
          console.log('[Topic Detector] Topic invalid, using fallback');
          resolve(fallbackNaming(bufferContent));
        }
      } else {
        console.error('[Topic Detector] Claude Code failed:', errorOutput);
        console.error('[Topic Detector] Using fallback naming');
        resolve(fallbackNaming(bufferContent));
      }
    });

    claudeProcess.on('error', (err) => {
      clearTimeout(timeout);
      console.error('[Topic Detector] Failed to spawn claude:', err);
      console.error('[Topic Detector] This usually means Claude CLI is not installed or not in PATH');
      console.error('[Topic Detector] Using fallback naming');

      // 清理临时文件
      try {
        fs.unlinkSync(tmpFile);
      } catch (e) {
        // 忽略
      }
      resolve(fallbackNaming(bufferContent));
    });
  });
}

async function detectTopic(bufferContent) {
  const cleaned = stripAnsi(bufferContent).trim();
  if (!cleaned || cleaned.length < 50) {
    return '新对话';
  }

  // 使用 Claude Code CLI 检测主题
  return await detectTopicViaClaudeCode(bufferContent);
}

async function detectTopics(tabBuffers) {
  const results = await Promise.allSettled(
    tabBuffers.map(async ({ tabId, buffer }) => {
      const topic = await detectTopic(buffer);
      return { tabId, topic };
    })
  );

  return results.map((result, i) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return { tabId: tabBuffers[i].tabId, topic: '新对话' };
  });
}

module.exports = { detectTopic, detectTopics, stripAnsi };
