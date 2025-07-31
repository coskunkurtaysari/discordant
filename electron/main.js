const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  // Ana pencereyi oluştur
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      // API route'ları için güvenlik ayarları
      webSecurity: false, // CORS sorunları için geçici olarak devre dışı
      allowRunningInsecureContent: true, // CORS sorunları için geçici olarak açık
      // Network ayarları
      partition: 'persist:main',
      // CSP'yi devre dışı bırak (UploadThing için)
      webPreferences: {
        webSecurity: false,
        allowRunningInsecureContent: true,
        partition: 'persist:main',
      },
      // CORS için gerekli ayarlar
      experimentalFeatures: false,
      // CAPTCHA için ek ayarlar
      sandbox: false,
      webgl: true,
      plugins: true
    },
    icon: path.join(__dirname, '../public/favicon.ico'),
    titleBarStyle: 'default',
    show: false
  });

  // Pencere hazır olduğunda göster
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Development modunda localhost:3000'i yükle
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    // Development tools'u aç
    mainWindow.webContents.openDevTools();
    
    // HEAD isteklerini engelle
    mainWindow.webContents.session.webRequest.onBeforeRequest((details, callback) => {
      if (details.method === 'HEAD' && details.url === 'http://localhost:3000/') {
        callback({ cancel: true });
      } else {
        callback({ cancel: false });
      }
    });
    
    // CSP headers'ı kaldır (UploadThing için)
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      if (details.url.includes('localhost:3000')) {
        const responseHeaders = { ...details.responseHeaders };
        delete responseHeaders['content-security-policy'];
        delete responseHeaders['Content-Security-Policy'];
        callback({ responseHeaders });
      } else {
        callback({ responseHeaders: details.responseHeaders });
      }
    });
  } else {
    // Production modunda build edilmiş dosyaları yükle
    mainWindow.loadFile(path.join(__dirname, '../out/index.html'));
  }

  // Pencere kapatıldığında uygulamayı kapat
  mainWindow.on('closed', () => {
    app.quit();
  });

        // API route'ları için CORS ayarları
      mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
        (details, callback) => {
          // Clerk için origin'i localhost olarak ayarla
          if (details.url.includes('clerk.accounts.dev') || details.url.includes('clerk.com')) {
            details.requestHeaders['Origin'] = 'http://localhost:3000';
          } else if (details.url.includes('uploadthing.com') || details.url.includes('ingest.uploadthing.com')) {
            // UploadThing için özel ayarlar
            details.requestHeaders['Origin'] = 'http://localhost:3000';
            details.requestHeaders['Access-Control-Allow-Origin'] = '*';
          } else {
            details.requestHeaders['Origin'] = 'electron://discordant';
          }
          callback({ requestHeaders: details.requestHeaders });
        }
      );

  // Güvenlik: Yeni pencere açılmasını engelle
  mainWindow.webContents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
}

// Electron hazır olduğunda pencereyi oluştur
app.whenReady().then(() => {
  createWindow();

  // macOS için pencere yeniden açıldığında
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Tüm pencereler kapatıldığında uygulamayı kapat
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Güvenlik: Yeni pencere açılmasını engelle
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
}); 