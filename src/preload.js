const { contextBridge, ipcRenderer } = require('electron');

/**
 * Secure IPC bridge for renderer processes
 * Exposes only necessary APIs to the renderer with proper validation
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // Settings management
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  
  // Metrics management
  getMetrics: (params) => ipcRenderer.invoke('get-metrics', params),
  saveMetric: (metric) => ipcRenderer.invoke('save-metric', metric),
  exportMetricsCSV: (params) => ipcRenderer.invoke('export-metrics-csv', params),
  
  // Monitoring control
  startMonitoring: () => ipcRenderer.invoke('start-monitoring'),
  stopMonitoring: () => ipcRenderer.invoke('stop-monitoring'),
  getMonitoringState: () => ipcRenderer.invoke('get-monitoring-state'),
  
  // Window management
  openDashboard: () => ipcRenderer.invoke('open-dashboard'),
  openSettings: () => ipcRenderer.invoke('open-settings'),
  
  // Notifications
  showNotification: (params) => ipcRenderer.invoke('show-notification', params),
  
  // Auto-start
  setAutoStart: (enabled) => ipcRenderer.invoke('set-auto-start', enabled),
  getAutoStart: () => ipcRenderer.invoke('get-auto-start'),
  
  // Event listeners
  onMonitoringStateChanged: (callback) => {
    ipcRenderer.on('monitoring-state-changed', (event, isMonitoring) => {
      callback(isMonitoring);
    });
  },
  
  removeMonitoringStateListener: () => {
    ipcRenderer.removeAllListeners('monitoring-state-changed');
  }
});

// Expose platform information
contextBridge.exposeInMainWorld('platform', {
  os: process.platform,
  arch: process.arch,
  version: process.versions
});
