const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, Notification } = require('electron');
const path = require('path');
const Store = require('electron-store');
const db = require('./db');

// Initialize persistent store for settings
const store = new Store();

let mainWindow = null;
let dashboardWindow = null;
let settingsWindow = null;
let tray = null;
let isMonitoring = false;

// Default settings
const DEFAULT_SETTINGS = {
  pipeline: 'feature', // 'feature' or 'tfjs'
  framerate: 10,
  windowSize: 15,
  thresholds: {
    ok: 0.4,
    caution: 0.7
  },
  saveRawImages: false,
  soundVolume: 0.7,
  autoStartLogin: false,
  doNotDisturb: false,
  accessibility: {
    largeFonts: false,
    highContrast: false,
    muteAudio: false
  }
};

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 600,
    minHeight: 400,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, '../build/icon.png'),
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createDashboardWindow() {
  if (dashboardWindow) {
    dashboardWindow.focus();
    return;
  }

  dashboardWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, '../build/icon.png'),
    parent: mainWindow,
    modal: false
  });

  dashboardWindow.loadFile(path.join(__dirname, 'renderer', 'dashboard.html'));

  dashboardWindow.on('closed', () => {
    dashboardWindow = null;
  });
}

function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 700,
    height: 800,
    minWidth: 600,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, '../build/icon.png'),
    parent: mainWindow,
    modal: false
  });

  settingsWindow.loadFile(path.join(__dirname, 'renderer', 'settings.html'));

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

function createTray() {
  // Create a simple tray icon (in production, use proper icon files)
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'DeskEye',
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Open Dashboard',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        } else {
          createMainWindow();
        }
      }
    },
    {
      label: isMonitoring ? 'Stop Monitoring' : 'Start Monitoring',
      click: () => {
        toggleMonitoring();
      }
    },
    { type: 'separator' },
    {
      label: 'Settings',
      click: () => {
        createSettingsWindow();
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('DeskEye - Eye Strain Monitor');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    } else {
      createMainWindow();
    }
  });
}

function toggleMonitoring() {
  isMonitoring = !isMonitoring;
  
  if (mainWindow) {
    mainWindow.webContents.send('monitoring-state-changed', isMonitoring);
  }
  
  updateTrayMenu();
}

function updateTrayMenu() {
  if (!tray) return;
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'DeskEye',
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Open Dashboard',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        } else {
          createMainWindow();
        }
      }
    },
    {
      label: isMonitoring ? 'Stop Monitoring' : 'Start Monitoring',
      click: () => {
        toggleMonitoring();
      }
    },
    { type: 'separator' },
    {
      label: 'Settings',
      click: () => {
        createSettingsWindow();
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

// IPC Handlers
ipcMain.handle('get-settings', () => {
  const settings = store.get('settings', DEFAULT_SETTINGS);
  return { ...DEFAULT_SETTINGS, ...settings };
});

ipcMain.handle('save-settings', (event, settings) => {
  store.set('settings', settings);
  return { success: true };
});

ipcMain.handle('get-metrics', async (event, { startDate, endDate, limit }) => {
  try {
    const metrics = await db.getMetrics(startDate, endDate, limit);
    return { success: true, data: metrics };
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-metric', async (event, metric) => {
  try {
    await db.saveMetric(metric);
    return { success: true };
  } catch (error) {
    console.error('Error saving metric:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('export-metrics-csv', async (event, { startDate, endDate }) => {
  try {
    const csvPath = await db.exportToCSV(startDate, endDate);
    return { success: true, path: csvPath };
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('start-monitoring', () => {
  isMonitoring = true;
  updateTrayMenu();
  return { success: true };
});

ipcMain.handle('stop-monitoring', () => {
  isMonitoring = false;
  updateTrayMenu();
  return { success: true };
});

ipcMain.handle('open-dashboard', () => {
  createDashboardWindow();
  return { success: true };
});

ipcMain.handle('open-settings', () => {
  createSettingsWindow();
  return { success: true };
});

ipcMain.handle('show-notification', (event, { title, body }) => {
  if (Notification.isSupported()) {
    const notification = new Notification({
      title,
      body,
      icon: path.join(__dirname, '../build/icon.png')
    });
    notification.show();
  }
  return { success: true };
});

ipcMain.handle('get-monitoring-state', () => {
  return { isMonitoring };
});

// App lifecycle
app.whenReady().then(() => {
  // Initialize database
  db.initialize();
  
  createMainWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Keep app running in tray on all platforms
  // Don't quit unless explicitly requested
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

// Handle auto-start on login
ipcMain.handle('set-auto-start', (event, enabled) => {
  app.setLoginItemSettings({
    openAtLogin: enabled,
    openAsHidden: true
  });
  return { success: true };
});

ipcMain.handle('get-auto-start', () => {
  const settings = app.getLoginItemSettings();
  return { enabled: settings.openAtLogin };
});
