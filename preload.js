const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Directory picker
  selectDirectory: () => ipcRenderer.invoke('dialog:select-directory'),

  // Terminal operations
  createTerminal: (tabId, cwd, autoCommand) => ipcRenderer.invoke('terminal:create', { tabId, cwd, autoCommand }),
  sendTerminalData: (tabId, data) => ipcRenderer.send('terminal:data', { tabId, data }),
  resizeTerminal: (tabId, cols, rows) => ipcRenderer.send('terminal:resize', { tabId, cols, rows }),
  closeTerminal: (tabId) => ipcRenderer.invoke('terminal:close', { tabId }),

  // File drop support
  onFileDrop: (callback) => {
    ipcRenderer.on('file:drop', (event, payload) => callback(payload));
  },

  // Terminal output (main -> renderer)
  onTerminalOutput: (callback) => {
    ipcRenderer.on('terminal:output', (event, payload) => callback(payload));
  },
  onTerminalClosed: (callback) => {
    ipcRenderer.on('terminal:closed', (event, payload) => callback(payload));
  },

  // Topic detection
  refreshTopics: () => ipcRenderer.invoke('topic:refresh'),
  onTopicStatus: (callback) => {
    ipcRenderer.on('topic:status', (event, payload) => callback(payload));
  },

  // Claude CLI status
  checkClaudeCli: () => ipcRenderer.invoke('claude-cli:check'),
  getClaudeCliStatus: () => ipcRenderer.invoke('claude-cli:status'),
  testClaudeCli: () => ipcRenderer.invoke('claude-cli:test'),
  getSetupGuide: () => ipcRenderer.invoke('claude-cli:setup-guide'),

  // Auto updater
  checkForUpdates: () => ipcRenderer.invoke('update:check'),
  downloadUpdate: () => ipcRenderer.invoke('update:download'),
  installUpdate: () => ipcRenderer.invoke('update:install'),
  getCurrentVersion: () => ipcRenderer.invoke('update:get-version'),
  onUpdateChecking: (callback) => {
    ipcRenderer.on('update:checking', () => callback());
  },
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update:available', (event, payload) => callback(payload));
  },
  onUpdateNotAvailable: (callback) => {
    ipcRenderer.on('update:not-available', (event, payload) => callback(payload));
  },
  onUpdateError: (callback) => {
    ipcRenderer.on('update:error', (event, payload) => callback(payload));
  },
  onUpdateDownloadProgress: (callback) => {
    ipcRenderer.on('update:download-progress', (event, payload) => callback(payload));
  },
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update:downloaded', (event, payload) => callback(payload));
  },

  // Shortcuts (main -> renderer)
  onNewTab: (callback) => {
    ipcRenderer.on('shortcut:new-tab', () => callback());
  },
  onCloseTab: (callback) => {
    ipcRenderer.on('shortcut:close-tab', () => callback());
  },
  onRefreshTopics: (callback) => {
    ipcRenderer.on('shortcut:refresh-topics', () => callback());
  },
  onSwitchTab: (callback) => {
    ipcRenderer.on('shortcut:switch-tab', (event, payload) => callback(payload));
  },
  onIncreaseFont: (callback) => {
    ipcRenderer.on('shortcut:increase-font', () => callback());
  },
  onDecreaseFont: (callback) => {
    ipcRenderer.on('shortcut:decrease-font', () => callback());
  },
  onResetFont: (callback) => {
    ipcRenderer.on('shortcut:reset-font', () => callback());
  },
  onPrevTab: (callback) => {
    ipcRenderer.on('shortcut:prev-tab', () => callback());
  },
  onNextTab: (callback) => {
    ipcRenderer.on('shortcut:next-tab', () => callback());
  }
});
