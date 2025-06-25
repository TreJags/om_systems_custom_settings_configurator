const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');

// Initialize the store for persistent data
const store = new Store();

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the index.html of the app
  mainWindow.loadFile('index.html');

  // Open DevTools in development mode
  // mainWindow.webContents.openDevTools();

  // Emitted when the window is closed
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window when the dock icon is clicked
    if (mainWindow === null) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handlers for file operations
ipcMain.handle('save-config', async (event, configData, fileName) => {
  try {
    const { filePath } = await dialog.showSaveDialog({
      title: 'Save Configuration',
      defaultPath: fileName || 'config.json',
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });

    if (filePath) {
      fs.writeFileSync(filePath, JSON.stringify(configData, null, 2));
      return { success: true, filePath };
    }
    return { success: false, message: 'Save cancelled' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('load-config', async () => {
  try {
    const { filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });

    if (filePaths && filePaths.length > 0) {
      const data = fs.readFileSync(filePaths[0], 'utf8');
      return { success: true, data: JSON.parse(data), filePath: filePaths[0] };
    }
    return { success: false, message: 'Load cancelled' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Get default configuration structure
ipcMain.handle('get-default-config', () => {
  try {
    // Read menu structure from the configuration file
    const menuStructurePath = path.join(__dirname, 'menu_structure.json');
    const menuStructure = JSON.parse(fs.readFileSync(menuStructurePath, 'utf8'));

    // Create default config based on the menu structure
    const defaultConfig = {};

    // For each menu in the structure, create an object with empty objects for each setting
    for (const menuName in menuStructure) {
      defaultConfig[menuName] = {};

      // For each setting in the menu, create an empty object
      if (Array.isArray(menuStructure[menuName])) {
        // Handle array of settings
        menuStructure[menuName].forEach(settingName => {
          defaultConfig[menuName][settingName] = {};
        });
      } else if (typeof menuStructure[menuName] === 'object') {
        // Handle object of settings
        for (const settingName in menuStructure[menuName]) {
          defaultConfig[menuName][settingName] = {};
        }
      }
    }

    return defaultConfig;
  } catch (error) {
    console.error('Error loading menu structure:', error);
    // Fallback to a basic structure if the file can't be loaded
    return {
      "Menu 1": { "Custom Mode": {}, "Button Settings": {} }
    };
  }
});

// Get menu structure
ipcMain.handle('get-menu-structure', () => {
  try {
    const menuStructurePath = path.join(__dirname, 'menu_structure.json');
    const menuStructure = JSON.parse(fs.readFileSync(menuStructurePath, 'utf8'));
    return { success: true, data: menuStructure };
  } catch (error) {
    console.error('Error loading menu structure:', error);
    return { success: false, message: error.message };
  }
});
