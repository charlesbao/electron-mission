const electron = require('electron');
const {ipcMain} = require('electron');
const Menu = electron.Menu;
const request = require('request');
const fs = require('fs');

const Constants = require('./utils/constants');

var ipcRenderObject;

// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow;


function createWindow () {
  const menu = Menu.buildFromTemplate([]);
  Menu.setApplicationMenu(menu);
  // Create the browser window.
  mainWindow = new BrowserWindow({
    backgroundColor:'#2e2c29',
    title:'mission',
    width: 1200,
    height: 600,
    kiosk:false,
    alwaysOnTop:false,
    hasShadow:false,
    fullscreen:false,
    titleBarStyle: 'hidden',
    autoHideMenuBar:true
  })
  // mainWindow.setIgnoreMouseEvents(true)

  // and load the index.html of the app.
  mainWindow.loadURL('file://'+__dirname+'/index.html')
  // mainWindow.loadURL('http://127.0.0.1:8989')
  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })

  mainWindow.webContents.session.on('will-download', (event, item, webContents) => {
    // Set the save path, making Electron not to prompt a save dialog.

    item.setSavePath(ipcRenderObject.path)

    item.on('updated', (event, state) => {
      if (state === 'interrupted') {
        console.log('Download is interrupted but can be resumed')
        return ipcRenderObject.ipcSender.send('download', {
          err:true,
          name:item.getFilename(),
          hash:ipcRenderObject.hash
        });
      } else if (state === 'progressing') {
        if (item.isPaused()) {
          console.log('Download is paused')
        } else {
          console.log(`Received bytes: ${item.getReceivedBytes()}`)
        }
      }
    })
    item.once('done', (event, state) => {
      if (state === 'completed') {
        return ipcRenderObject.ipcSender.send(Constants.IPC.DOWNLOAD, {
          err:false,
          name:item.getFilename(),
          hash:ipcRenderObject.hash
        });
      } else {
        return ipcRenderObject.ipcSender.send(Constants.IPC.DOWNLOAD, {
          err:true,
          name:item.getFilename(),
          hash:ipcRenderObject.hash
        });
      }
    })
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.on('asynchronous-message', (event, arg) => {
  console.log(arg);  // prints "ping"
  event.sender.send('asynchronous-reply', 'pong');
});

ipcMain.on('destroy', (event, arg) => {
  mainWindow.destroy();
});

ipcMain.on(Constants.IPC.DOWNLOAD, (event, arg) => {
  let theUrl = arg['url'];
  mainWindow.webContents.downloadURL(theUrl);
  ipcRenderObject = {
    ipcSender:event.sender,
    hash:arg['hash'],
    path:arg['path']
  };
})

