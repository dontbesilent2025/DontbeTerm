const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const pty = require('node-pty');
const topicDetector = require('./lib/topic-detector');

let win;
const terminals = new Map();

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1e1e1e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false,
      webSecurity: false  // Temporarily disable to test file drag-drop
    }
  });

  // Prevent default file drop behavior (opening files in window)
  win.webContents.on('will-navigate', (event, url) => {
    event.preventDefault();
    // If it's a file URL from drag-drop, extract the path and send to renderer
    if (url.startsWith('file://')) {
      const filePath = decodeURIComponent(url.replace('file://', ''));
      win.webContents.send('file:drop', { paths: [filePath] });
    }
  });

  win.webContents.on('will-attach-webview', (event) => {
    event.preventDefault();
  });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  buildMenu();
}

// --- IPC: Directory picker ---

ipcMain.handle('dialog:select-directory', async () => {
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory'],
    title: '选择工作目录',
    buttonLabel: '选择'
  });
  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true };
  }
  return { canceled: false, path: result.filePaths[0] };
});

// --- IPC: Terminal management ---

ipcMain.handle('terminal:create', (event, { tabId, cwd, autoCommand }) => {
  const shell = process.env.SHELL || '/bin/zsh';
  const ptyProcess = pty.spawn(shell, ['-l'], {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd: cwd || process.env.HOME,
    env: { ...process.env, TERM: 'xterm-256color' }
  });

  const entry = { pty: ptyProcess, buffer: '', alive: true };
  terminals.set(tabId, entry);

  ptyProcess.onData((data) => {
    if (win && !win.isDestroyed()) {
      win.webContents.send('terminal:output', { tabId, data });
    }
    // Append to rolling buffer (keep last 4000 raw chars, strip on read)
    entry.buffer += data;
    if (entry.buffer.length > 4000) {
      entry.buffer = entry.buffer.slice(-4000);
    }
  });

  ptyProcess.onExit(({ exitCode }) => {
    entry.alive = false;
    if (win && !win.isDestroyed()) {
      win.webContents.send('terminal:closed', { tabId, exitCode });
    }
  });

  // Auto-run command after shell initializes (if specified)
  if (autoCommand) {
    setTimeout(() => {
      if (entry.alive) {
        ptyProcess.write(autoCommand + '\r');
      }
    }, 500);
  }

  // Workaround: nudge window size to force xterm.js relayout.
  // xterm.js in Electron sometimes doesn't calculate dimensions correctly
  // on first render; a tiny resize triggers proper recalculation.
  if (win && !win.isDestroyed()) {
    const [w, h] = win.getSize();
    win.setSize(w + 1, h + 1);
    setTimeout(() => {
      if (win && !win.isDestroyed()) {
        win.setSize(w, h);
      }
    }, 50);
  }

  return { tabId };
});

ipcMain.on('terminal:data', (event, { tabId, data }) => {
  const entry = terminals.get(tabId);
  if (entry && entry.alive) {
    entry.pty.write(data);
  }
});

ipcMain.on('terminal:resize', (event, { tabId, cols, rows }) => {
  const entry = terminals.get(tabId);
  if (entry && entry.alive) {
    entry.pty.resize(cols, rows);
  }
});

ipcMain.handle('terminal:close', (event, { tabId }) => {
  const entry = terminals.get(tabId);
  if (entry) {
    if (entry.alive) {
      entry.pty.kill();
    }
    terminals.delete(tabId);
  }
  return { tabId };
});

// --- IPC: Topic detection ---

ipcMain.handle('topic:refresh', async () => {
  console.log('[Main] Topic refresh requested');
  const tabBuffers = [];
  for (const [tabId, entry] of terminals) {
    tabBuffers.push({ tabId, buffer: entry.buffer });
  }
  console.log('[Main] Processing', tabBuffers.length, 'tabs');

  try {
    const results = await topicDetector.detectTopics(tabBuffers);
    console.log('[Main] Topic detection completed:', results);
    for (const { tabId, topic } of results) {
      if (win && !win.isDestroyed()) {
        win.webContents.send('topic:status', {
          tabId, status: 'done', topic
        });
      }
    }
    return { success: true };
  } catch (err) {
    console.error('[Main] Topic detection error:', err);
    for (const { tabId } of tabBuffers) {
      if (win && !win.isDestroyed()) {
        win.webContents.send('topic:status', {
          tabId, status: 'error', topic: '新对话'
        });
      }
    }
    return { success: false, error: err.message };
  }
});

// --- Menu & Shortcuts ---

function buildMenu() {
  const template = [
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: '文件',
      submenu: [
        {
          label: '新建标签页',
          accelerator: 'CmdOrCtrl+T',
          click: () => {
            if (win) win.webContents.send('shortcut:new-tab');
          }
        },
        {
          label: '关闭标签页',
          accelerator: 'CmdOrCtrl+W',
          click: () => {
            if (win) win.webContents.send('shortcut:close-tab');
          }
        }
      ]
    },
    {
      label: '查看',
      submenu: [
        {
          label: '刷新主题',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            if (win) win.webContents.send('shortcut:refresh-topics');
          }
        },
        { type: 'separator' },
        {
          label: '放大字体',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            if (win) win.webContents.send('shortcut:increase-font');
          }
        },
        {
          label: '缩小字体',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            if (win) win.webContents.send('shortcut:decrease-font');
          }
        },
        {
          label: '重置字体大小',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            if (win) win.webContents.send('shortcut:reset-font');
          }
        },
        { type: 'separator' },
        {
          label: '上一个标签',
          accelerator: 'CmdOrCtrl+Alt+Left',
          click: () => {
            console.log('Prev tab menu clicked');
            if (win) win.webContents.send('shortcut:prev-tab');
          }
        },
        {
          label: '下一个标签',
          accelerator: 'CmdOrCtrl+Alt+Right',
          click: () => {
            console.log('Next tab menu clicked');
            if (win) win.webContents.send('shortcut:next-tab');
          }
        },
        { type: 'separator' },
        ...Array.from({ length: 9 }, (_, i) => ({
          label: `标签页 ${i + 1}`,
          accelerator: `CmdOrCtrl+${i + 1}`,
          click: () => {
            if (win) win.webContents.send('shortcut:switch-tab', { index: i });
          }
        })),
        { type: 'separator' },
        { role: 'toggleDevTools' }
      ]
    },
    { role: 'editMenu' },
    { role: 'windowMenu' }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// --- App lifecycle ---

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  for (const [, entry] of terminals) {
    if (entry.alive) entry.pty.kill();
  }
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle file drops on macOS (native API)
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  console.log('File dropped via open-file event:', filePath);

  // Send the full file path to the active window
  if (win && !win.isDestroyed()) {
    win.webContents.send('file:drop', { paths: [filePath] });
  }
});
