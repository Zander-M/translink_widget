const { app, BrowserWindow, Tray, Menu} = require('electron');
const gotTheLock = app.requestSingleInstanceLock();

const path = require('path');
const { loadConfig } = require('./config');
const config = loadConfig()


let tray = null
let win = null

function createWindow() {
    win = new BrowserWindow({
    width: 300,
    height: 150,
    show: false,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    transparent: false,
    icon: path.join(__dirname, 'assets/icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });
  win.loadFile('index.html');
  win.on('blur', () => {
    if (win && win.isVisible()) win.hide();
  });
  win.webContents.openDevTools({ mode: 'detach' }); // debug
}

function createTray() {
    const iconPath = path.join(__dirname, "icon.png")
    tray = new Tray(iconPath);
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show/Hide',
            click:() => {
                if (win.isVisible()) {
                    win.hide();
                } else {
                    win.show();
                }
            }
        },
        {type: 'separator'},
        {
            label: "Quit",
            click: () => {
                app.quit();
            }
        }
    ]);
    
    tray.setToolTip("TransLink Bus Widget");
    tray.setContextMenu(contextMenu);

    // Single click to toggle window
    tray.on("click",toggleWindow);
}

function toggleWindow() {
  if (!win || !tray) return;

  const trayBounds = tray.getBounds();       // Tray icon position
  const windowBounds = win.getBounds();      // Current window size

  // Center window horizontally on tray icon
  const x = Math.round(trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2);

  let y;
  if (process.platform === 'darwin') {
    // Align top of window with bottom of tray icon
    y = Math.round(trayBounds.y + trayBounds.height + 4);
  } else {
    // Align bottom of window with top of tray icon (Windows)
    y = Math.round(trayBounds.y - windowBounds.height - 4);
  }

  win.setBounds({ x, y, width: windowBounds.width, height: windowBounds.height });

  if (win.isVisible()) {
    win.hide();
  } else {
    win.show();
    win.focus();
  }
}

if (!gotTheLock){
  app.quit();
} else {
  app.whenReady().then(() => {
    createWindow();
    createTray();
    const wasAutoStarted = app.getLoginItemSettings().wasOpenedAtLogin;

    if (!wasAutoStarted) {
      win.show(); // only show if launched manually
    } else {
      win.hide(); // remain hidden at login
    }

    app.setLoginItemSettings({
    openAtLogin: config.autoStartUp,
    path: process.execPath
    });
  });
}

app.on('second-instance', (event, argv, workingDirectory)=>{
  if (win) {
    win.show();
    win.focus();
  }
})

