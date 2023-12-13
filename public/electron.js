require('dotenv').config();
const electron = require('electron');
const { ipcMain } = require('electron');
const path = require("path");
const isDev = require('electron-is-dev');
const { fetchEmails } = require(path.join(__dirname, 'emailservice.js'));


const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

let mainWindow;

function createWindow() {
  // Create the browser window.
  const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;
  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    webPreferences: { nodeIntegration: true,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, '../build/preload.js') },
  });
  // and load the index.html of the app.
  console.log(__dirname);
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000'); // Adjust this to your React app's URL
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
    mainWindow.webContents.openDevTools();
  }  
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

ipcMain.on('request-emails', (event, arg) => {
  fetchEmails(arg)
    .then(emails => {
      console.log("Here" + emails);
      event.reply('response-emails', emails);
    })
    .catch(error => {
      console.error(error);
      event.reply('response-emails', { error: 'Failed to fetch emails.' });
    });
});

