const { contextBridge, ipcRenderer } = require('electron');

// Renderer process'e güvenli API'ler sağla
contextBridge.exposeInMainWorld('electronAPI', {
  // Platform bilgisini al
  platform: process.platform,
  
  // Uygulama versiyonunu al
  getVersion: () => process.versions.electron,
  
  // Pencere kontrolü
  minimize: () => ipcRenderer.send('minimize-window'),
  maximize: () => ipcRenderer.send('maximize-window'),
  close: () => ipcRenderer.send('close-window'),
  
  // Dosya sistemi işlemleri (güvenli)
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  
  // Sistem bilgileri
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  
  // Bildirimler
  showNotification: (title, body) => ipcRenderer.send('show-notification', title, body),
  
  // Studio channel için ek API'ler
  // Media permissions
  requestMediaPermissions: () => ipcRenderer.invoke('request-media-permissions'),
  
  // Hardware info
  getHardwareInfo: () => ipcRenderer.invoke('get-hardware-info'),
  
  // Performance monitoring
  getPerformanceStats: () => ipcRenderer.invoke('get-performance-stats'),
  
  // Studio recording
  startRecording: (options) => ipcRenderer.invoke('start-recording', options),
  stopRecording: () => ipcRenderer.invoke('stop-recording'),
  
  // Studio settings
  getStudioSettings: () => ipcRenderer.invoke('get-studio-settings'),
  updateStudioSettings: (settings) => ipcRenderer.invoke('update-studio-settings', settings)
});

// Güvenlik: Node.js API'lerini devre dışı bırak
window.process = {
  platform: process.platform,
  versions: {
    electron: process.versions.electron
  }
}; 