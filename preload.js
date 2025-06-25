const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    saveConfig: (configData, fileName) => {
      return ipcRenderer.invoke('save-config', configData, fileName);
    },
    loadConfig: () => {
      return ipcRenderer.invoke('load-config');
    },
    getDefaultConfig: () => {
      return ipcRenderer.invoke('get-default-config');
    },
    getMenuStructure: () => {
      return ipcRenderer.invoke('get-menu-structure');
    }
  }
);
