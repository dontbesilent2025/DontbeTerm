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

// 通过 Claude Code CLI 检测主题
async function detectTopicViaClaudeCode(bufferContent) {
  return new Promise((resolve) => {
    const cleaned = stripAnsi(bufferContent).trim();
    if (!cleaned || cleaned.length < 50) {
      resolve('新对话');
      return;
    }

    const content = cleaned.slice(-2000);

    // 使用临时文件传递内容，避免命令行参数问题
    const tmpFile = path.join(app.getPath('temp'), `topic-${Date.now()}.txt`);

    try {
      fs.writeFileSync(tmpFile, content, 'utf8');
    } catch (err) {
      console.error('Failed to write temp file:', err);
      resolve('新对话');
      return;
    }

    const command = `cat "${tmpFile}" | claude -p "请用3-5个中文字总结以下终端对话的主题。只输出主题词，不要任何解释或标点符号。"`;

    const claudeProcess = spawn('sh', ['-c', command], {
      timeout: 20000 // 20秒超时
    });

    let output = '';
    let errorOutput = '';

    claudeProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    claudeProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    claudeProcess.on('close', (code) => {
      // 清理临时文件
      try {
        fs.unlinkSync(tmpFile);
      } catch (err) {
        // 忽略清理错误
      }

      if (code === 0 && output.trim()) {
        // 提取最后一行作为结果
        const lines = output.trim().split('\n');
        const topic = lines[lines.length - 1].trim();

        // 过滤掉一些无效的结果
        if (topic && topic !== '新对话' && topic.length > 0 && topic.length < 20) {
          resolve(topic);
        } else {
          resolve('新对话');
        }
      } else {
        console.error('Claude Code failed:', errorOutput);
        resolve('新对话');
      }
    });

    claudeProcess.on('error', (err) => {
      console.error('Failed to spawn claude:', err);
      // 清理临时文件
      try {
        fs.unlinkSync(tmpFile);
      } catch (e) {
        // 忽略
      }
      resolve('新对话');
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
