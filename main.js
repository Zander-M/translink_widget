const { app, BrowserWindow, Tray, Menu, screen} = require('electron');
const path = require('path');

let tray = null
let win = null

function createWindow() {
    win = new BrowserWindow({
    width: 300,
    height: 140,
    show: false,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    transparent: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });
  win.loadFile('index.html');
  win.on('blur', () => {
    if (win && win.isVisible()) win.hide();
  });
//   win.webContents.openDevTools({ mode: 'detach' }); // debug
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
  const display = screen.getDisplayNearestPoint({ x: trayBounds.x, y: trayBounds.y });

  // Center window horizontally on tray icon
  const x = Math.round(trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2);

  let y;
  if (process.platform === 'darwin') {
    // Align top of window with bottom of tray icon
    y = Math.round(trayBounds.y + trayBounds.height + 4);
  } else {
    // Align bottom of window with top of tray icon (Windows)
    y = Math.round(trayBounds.y - trayBounds.height - windowBounds.height) + 36;
  }

  win.setBounds({ x, y, width: windowBounds.width, height: windowBounds.height });

  if (win.isVisible()) {
    win.hide();
  } else {
    win.show();
    win.focus();
  }
}


app.whenReady().then(() => {
  createWindow();
  createTray();
});