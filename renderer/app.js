/* global TerminalManager */

// --- Debug Logging System ---
const debugLogs = [];
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info
};

function addLog(type, ...args) {
  const timestamp = new Date().toISOString();
  const message = args.map(arg => {
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg, null, 2);
      } catch (e) {
        return String(arg);
      }
    }
    return String(arg);
  }).join(' ');

  debugLogs.push({ timestamp, type, message });

  // Keep only last 500 logs
  if (debugLogs.length > 500) {
    debugLogs.shift();
  }
}

// Override console methods
console.log = function(...args) {
  addLog('log', ...args);
  originalConsole.log.apply(console, args);
};

console.error = function(...args) {
  addLog('error', ...args);
  originalConsole.error.apply(console, args);
};

console.warn = function(...args) {
  addLog('warn', ...args);
  originalConsole.warn.apply(console, args);
};

console.info = function(...args) {
  addLog('info', ...args);
  originalConsole.info.apply(console, args);
};

// Capture unhandled errors
window.addEventListener('error', (event) => {
  addLog('error', `Unhandled error: ${event.message} at ${event.filename}:${event.lineno}:${event.colno}`);
});

window.addEventListener('unhandledrejection', (event) => {
  addLog('error', `Unhandled promise rejection: ${event.reason}`);
});

console.log('Debug logging system initialized');

// --- App State ---

const terminalManager = new TerminalManager();
const tabs = []; // { id, title, manuallyRenamed }
let activeTabId = null;

// DOM references
const tabBar = document.getElementById('tab-bar');
const btnAddTerminal = document.getElementById('btn-add-terminal');
const btnAddClaude = document.getElementById('btn-add-claude');
const btnAddHappy = document.getElementById('btn-add-happy');
const terminalContainer = document.getElementById('terminal-container');
const btnRefresh = document.getElementById('btn-refresh');
const btnCopyLogs = document.getElementById('btn-copy-logs');
const btnClaudeCommands = document.getElementById('btn-claude-commands');
const claudeCommandsMenu = document.getElementById('claude-commands-menu');
const btnScrollToBottom = document.getElementById('btn-scroll-to-bottom');
const btnTheme = document.getElementById('btn-theme');
const btnScrollBottom = document.getElementById('btn-scroll-bottom');
const claudeCliStatus = document.getElementById('claude-cli-status');

// --- Claude CLI Status Management ---

async function updateClaudeCliStatus() {
  console.log('[App] Checking Claude CLI status...');
  const statusDot = claudeCliStatus.querySelector('.status-dot');
  const statusText = claudeCliStatus.querySelector('.status-text');

  try {
    const status = await window.api.getClaudeCliStatus();
    console.log('[App] Claude CLI status:', status);

    // Remove all status classes
    claudeCliStatus.classList.remove('available', 'unavailable', 'error');

    if (status.available) {
      claudeCliStatus.classList.add('available');
      statusText.textContent = 'Claude CLI 可用';
      claudeCliStatus.title = `Claude CLI 已安装\n版本: ${status.version || '未知'}`;
    } else {
      claudeCliStatus.classList.add('unavailable');
      statusText.textContent = 'Claude CLI 不可用';
      claudeCliStatus.title = `Claude CLI 未安装或不可用\n${status.error || ''}\n\n点击查看配置指南`;
    }
  } catch (err) {
    console.error('[App] Failed to get Claude CLI status:', err);
    claudeCliStatus.classList.remove('available', 'unavailable');
    claudeCliStatus.classList.add('error');
    statusText.textContent = 'Claude CLI 检查失败';
    claudeCliStatus.title = '无法检查 Claude CLI 状态';
  }
}

// Show setup guide when clicking on unavailable status
claudeCliStatus.addEventListener('click', async () => {
  const status = await window.api.getClaudeCliStatus();
  if (!status.available) {
    const guide = await window.api.getSetupGuide();
    showSetupGuide(guide);
  } else {
    // If available, run a test
    console.log('[App] Testing Claude CLI...');
    const testResult = await window.api.testClaudeCli();
    if (testResult.success) {
      alert('Claude CLI 测试成功！\n\n输出: ' + testResult.output);
    } else {
      alert('Claude CLI 测试失败\n\n错误: ' + testResult.error);
    }
  }
});

function showSetupGuide(guide) {
  let message = `${guide.title}\n\n`;
  guide.steps.forEach(step => {
    message += `${step.step}. ${step.title}\n   ${step.description}\n\n`;
  });
  message += '\n常见问题:\n';
  guide.troubleshooting.forEach(item => {
    message += `\n问题: ${item.problem}\n解决: ${item.solution}\n`;
  });
  alert(message);
}

// --- Tab Management ---

function generateTabId() {
  return Date.now().toString() + Math.random().toString(36).slice(2, 6);
}

async function createNewTab(autoCommand) {
  let cwd = null;
  let dirName = '终端';

  // Only show directory picker for Claude tabs
  if (autoCommand) {
    const result = await window.api.selectDirectory();
    if (result.canceled) return;
    cwd = result.path;
    dirName = cwd.split('/').pop() || cwd;
  }

  const tabId = generateTabId();
  const tabData = { id: tabId, title: dirName, manuallyRenamed: false };
  tabs.push(tabData);

  const tabEl = document.createElement('div');
  tabEl.className = 'tab';
  tabEl.dataset.tabId = tabId;

  const titleSpan = document.createElement('span');
  titleSpan.className = 'tab-title';
  titleSpan.textContent = tabData.title;

  const closeBtn = document.createElement('span');
  closeBtn.className = 'tab-close';
  closeBtn.textContent = '\u00d7';

  tabEl.appendChild(titleSpan);
  tabEl.appendChild(closeBtn);
  // Insert before both add buttons
  tabBar.insertBefore(tabEl, btnAddTerminal);

  tabEl.addEventListener('click', (e) => {
    if (!e.target.classList.contains('tab-close')) {
      switchToTabById(tabId);
    }
  });

  titleSpan.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    startRename(tabEl, tabData);
  });

  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeTab(tabId);
  });

  const wrapper = document.createElement('div');
  wrapper.className = 'terminal-wrapper';
  wrapper.dataset.tabId = tabId;
  terminalContainer.appendChild(wrapper);

  // Make visible before creating xterm
  activeTabId = tabId;
  tabBar.querySelectorAll('.tab').forEach((el) => {
    el.classList.toggle('active', el.dataset.tabId === tabId);
  });
  terminalContainer.querySelectorAll('.terminal-wrapper').forEach((el) => {
    el.classList.toggle('active', el.dataset.tabId === tabId);
  });

  const { cols, rows } = terminalManager.create(tabId, wrapper);

  await window.api.createTerminal(tabId, cwd, autoCommand || null);
  window.api.resizeTerminal(tabId, cols, rows);
  terminalManager.focus(tabId);
}

function switchToTabById(tabId) {
  activeTabId = tabId;
  tabBar.querySelectorAll('.tab').forEach((el) => {
    el.classList.toggle('active', el.dataset.tabId === tabId);
  });
  terminalContainer.querySelectorAll('.terminal-wrapper').forEach((el) => {
    el.classList.toggle('active', el.dataset.tabId === tabId);
  });
  requestAnimationFrame(() => {
    terminalManager.focus(tabId);
  });
}

function switchToTabByIndex(index) {
  if (index >= 0 && index < tabs.length) {
    switchToTabById(tabs[index].id);
  }
}

function switchToPrevTab() {
  console.log('switchToPrevTab called');
  if (tabs.length === 0) return;
  const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
  const prevIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
  console.log(`Switching from tab ${currentIndex} to ${prevIndex}`);
  switchToTabById(tabs[prevIndex].id);
}

function switchToNextTab() {
  console.log('switchToNextTab called');
  if (tabs.length === 0) return;
  const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
  const nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
  console.log(`Switching from tab ${currentIndex} to ${nextIndex}`);
  switchToTabById(tabs[nextIndex].id);
}

async function closeTab(tabId) {
  const index = tabs.findIndex((t) => t.id === tabId);
  if (index === -1) return;

  if (tabs.length === 1) {
    await createNewTab();
    if (tabs.length === 1) return;
  }

  tabs.splice(index, 1);
  const tabEl = tabBar.querySelector(`.tab[data-tab-id="${tabId}"]`);
  if (tabEl) tabEl.remove();
  terminalManager.destroy(tabId);
  await window.api.closeTerminal(tabId);

  if (activeTabId === tabId) {
    const newIndex = Math.min(index, tabs.length - 1);
    switchToTabById(tabs[newIndex].id);
  }
}

// --- Tab Rename ---

function startRename(tabEl, tabData) {
  const titleSpan = tabEl.querySelector('.tab-title');
  if (!titleSpan) return;

  const input = document.createElement('input');
  input.className = 'tab-rename-input';
  input.value = tabData.title;
  titleSpan.replaceWith(input);
  input.select();
  input.focus();

  let finished = false;
  const finishRename = () => {
    if (finished) return;
    finished = true;
    const newTitle = input.value.trim() || tabData.title;
    tabData.title = newTitle;
    tabData.manuallyRenamed = true;
    const newSpan = document.createElement('span');
    newSpan.className = 'tab-title';
    newSpan.textContent = newTitle;
    newSpan.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      startRename(tabEl, tabData);
    });
    input.replaceWith(newSpan);
  };

  input.addEventListener('blur', finishRename);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') finishRename();
    if (e.key === 'Escape') {
      input.value = tabData.title;
      finishRename();
    }
    e.stopPropagation();
  });
}

// --- Topic Detection ---

async function refreshAllTopics() {
  tabs.forEach((tabData) => {
    if (!tabData.manuallyRenamed) {
      updateTabTitle(tabData.id, '分析中...', true);
    }
  });
  await window.api.refreshTopics();
}

function updateTabTitle(tabId, title, analyzing) {
  const tabData = tabs.find((t) => t.id === tabId);
  if (tabData && !analyzing) {
    tabData.title = title;
  }
  const tabEl = tabBar.querySelector(`.tab[data-tab-id="${tabId}"]`);
  if (tabEl) {
    const titleSpan = tabEl.querySelector('.tab-title');
    if (titleSpan) {
      titleSpan.textContent = title;
      titleSpan.classList.toggle('analyzing', !!analyzing);
    }
  }
}

// --- Theme Toggle ---

// Detect system theme on startup
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
let isLight = !prefersDark.matches; // Start with system preference

console.log('System theme detection:', {
  prefersDark: prefersDark.matches,
  isLight: isLight
});

function toggleTheme() {
  isLight = !isLight;
  if (isLight) {
    document.body.classList.add('light');
  } else {
    document.body.classList.remove('light');
  }
  btnTheme.textContent = isLight ? '夜间模式' : '日间模式';
  terminalManager.setLightMode(isLight);
}

// Initialize theme based on system preference
function initTheme() {
  console.log('Initializing theme with isLight:', isLight);
  if (isLight) {
    document.body.classList.add('light');
  } else {
    document.body.classList.remove('light');
  }
  btnTheme.textContent = isLight ? '夜间模式' : '日间模式';
  terminalManager.setLightMode(isLight);
}

// --- Copy Logs ---

function copyLogsToClipboard() {
  console.log('Copy logs button clicked');

  const logText = debugLogs.map(log => {
    return `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`;
  }).join('\n');

  const fullReport = `=== DontbeTerm Debug Logs ===
Generated: ${new Date().toISOString()}
Total logs: ${debugLogs.length}

${logText}

=== System Info ===
User Agent: ${navigator.userAgent}
Platform: ${navigator.platform}
Language: ${navigator.language}
`;

  navigator.clipboard.writeText(fullReport).then(() => {
    console.log('Logs copied to clipboard successfully');
    // Show temporary notification
    const originalText = btnCopyLogs.textContent;
    btnCopyLogs.textContent = '已复制!';
    btnCopyLogs.style.backgroundColor = '#0dbc79';
    setTimeout(() => {
      btnCopyLogs.textContent = originalText;
      btnCopyLogs.style.backgroundColor = '';
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy logs:', err);
    alert('复制失败: ' + err.message);
  });
}

// --- Claude Commands Menu ---

function toggleClaudeCommandsMenu() {
  claudeCommandsMenu.classList.toggle('hidden');
}

function executeClaudeCommand(command) {
  console.log('Executing Claude command:', command);
  if (activeTabId) {
    // Send command with newline to execute immediately
    window.api.sendTerminalData(activeTabId, command + '\r');
    // Focus terminal after sending command
    setTimeout(() => {
      terminalManager.focus(activeTabId);
    }, 100);
    // Close menu after execution
    claudeCommandsMenu.classList.add('hidden');
  } else {
    console.warn('No active tab to execute command');
  }
}

// Close menu when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.claude-commands-wrapper')) {
    claudeCommandsMenu.classList.add('hidden');
  }
});

// --- IPC Listeners ---

window.api.onTerminalOutput(({ tabId, data }) => {
  terminalManager.write(tabId, data);
});

window.api.onTerminalClosed(({ tabId }) => {
  const tabData = tabs.find((t) => t.id === tabId);
  if (tabData) {
    updateTabTitle(tabId, tabData.title + ' (ended)', false);
  }
});

window.api.onTopicStatus(({ tabId, status, topic }) => {
  const tabData = tabs.find((t) => t.id === tabId);
  if (tabData && !tabData.manuallyRenamed) {
    updateTabTitle(tabId, topic, false);
  }
});

// Handle file drops from main process
window.api.onFileDrop(({ paths }) => {
  console.log('File drop from main process:', paths);
  if (activeTabId && paths && paths.length > 0) {
    const quotedPaths = paths.map(p => p.includes(' ') ? `"${p}"` : p);
    const pathString = quotedPaths.join(' ');
    console.log('Sending file paths to terminal:', pathString);
    window.api.sendTerminalData(activeTabId, pathString);
  }
});

// --- Shortcut Listeners ---

console.log('Setting up shortcut listeners...');

window.api.onNewTab(() => createNewTab('claude'));
window.api.onCloseTab(() => { if (activeTabId) closeTab(activeTabId); });
window.api.onRefreshTopics(() => refreshAllTopics());
window.api.onSwitchTab(({ index }) => switchToTabByIndex(index));
window.api.onIncreaseFont(() => {
  console.log('onIncreaseFont shortcut triggered');
  terminalManager.increaseFontSize();
});
window.api.onDecreaseFont(() => {
  console.log('onDecreaseFont shortcut triggered');
  terminalManager.decreaseFontSize();
});
window.api.onResetFont(() => {
  console.log('onResetFont shortcut triggered');
  terminalManager.resetFontSize();
});
window.api.onPrevTab(() => {
  console.log('onPrevTab shortcut triggered');
  switchToPrevTab();
});
window.api.onNextTab(() => {
  console.log('onNextTab shortcut triggered');
  switchToNextTab();
});

console.log('Shortcut listeners set up complete');

// --- Button Listeners ---

btnAddTerminal.addEventListener('click', () => createNewTab());
btnAddClaude.addEventListener('click', () => createNewTab('claude'));
btnAddHappy.addEventListener('click', () => createNewTab('happy'));
btnRefresh.addEventListener('click', () => refreshAllTopics());
btnCopyLogs.addEventListener('click', () => copyLogsToClipboard());
btnClaudeCommands.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleClaudeCommandsMenu();
});
btnTheme.addEventListener('click', () => toggleTheme());

// Toolbar scroll to bottom button
btnScrollToBottom.addEventListener('click', () => {
  console.log('Toolbar scroll to bottom clicked');
  if (activeTabId) {
    terminalManager.scrollToBottom(activeTabId);
  }
});

// Claude commands menu items
document.querySelectorAll('.commands-menu-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.stopPropagation();
    const command = item.dataset.command;
    executeClaudeCommand(command);
  });
});

btnScrollBottom.addEventListener('click', () => {
  console.log('Scroll to bottom clicked');
  if (activeTabId) {
    terminalManager.scrollToBottom(activeTabId);
    btnScrollBottom.classList.remove('visible');
  }
});

// Auto-show scroll button when terminal has scrollback
// Check periodically if terminal is scrolled up
setInterval(() => {
  if (activeTabId) {
    const instance = terminalManager.instances.get(activeTabId);
    if (instance && instance.terminal) {
      const terminal = instance.terminal;
      // Check if terminal is scrolled up (not at bottom)
      const isAtBottom = terminal.buffer.active.viewportY === terminal.buffer.active.baseY;
      if (!isAtBottom) {
        btnScrollBottom.classList.add('visible');
      } else {
        btnScrollBottom.classList.remove('visible');
      }
    }
  }
}, 500); // Check every 500ms

// --- Init ---

// Initialize theme based on system preference
initTheme();

// Check Claude CLI status on startup
updateClaudeCliStatus();

createNewTab('claude');
