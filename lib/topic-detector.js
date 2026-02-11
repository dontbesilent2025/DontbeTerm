const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

// 使用用户数据目录存储配置
const configPath = path.join(app.getPath('userData'), 'config.json');

let apiKey = '';
let baseUrl = '';
let client = null;

// 加载配置
function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(data);
      apiKey = config.apiKey || '';
      baseUrl = config.baseUrl || '';
    }
  } catch (err) {
    console.error('Failed to load config:', err);
  }
}

// 保存配置
function saveConfig() {
  try {
    const config = { apiKey, baseUrl };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save config:', err);
  }
}

// 初始化时加载配置
loadConfig();

function stripAnsi(str) {
  return str
    .replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')
    .replace(/\x1B\][^\x07]*\x07/g, '')
    .replace(/[\x00-\x09\x0B-\x1F]/g, '');
}

function configure(newApiKey, newBaseUrl) {
  apiKey = newApiKey;
  baseUrl = newBaseUrl;
  client = null;
  saveConfig();
}

function getConfig() {
  return { apiKey, baseUrl };
}

function getClient() {
  if (!client) {
    const opts = { apiKey };
    if (baseUrl) opts.baseURL = baseUrl;
    client = new Anthropic(opts);
  }
  return client;
}

async function detectTopic(bufferContent) {
  const cleaned = stripAnsi(bufferContent).trim();
  if (!cleaned || cleaned.length < 50) {
    return '新对话';
  }

  const anthropic = getClient();
  const message = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 30,
    messages: [{
      role: 'user',
      content: `请用3-5个中文字总结以下终端对话的主题。只输出主题词，不要任何解释或标点符号。如果内容不足以判断主题，请输出"新对话"。\n\n${cleaned.slice(-2000)}`
    }]
  });

  return message.content[0].text.trim();
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

module.exports = { detectTopic, detectTopics, stripAnsi, configure, getConfig };
