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
  showNotification: (title, body) => ipcRenderer.send('show-notification', title, body)
});

// Güvenlik: Node.js API'lerini devre dışı bırak
window.process = {
  platform: process.platform,
  versions: {
    electron: process.versions.electron
  }
}; 