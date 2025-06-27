const { contextBridge, ipcRenderer } = require('electron');

// Set up event listeners
let aboutShowListener = null;
let toggleCopyIconsListener = null;
let toggleMenuCopyIconsListener = null;
let toggleConfigSectionListener = null;
let showSettingsListener = null;

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
    },
    getAboutContent: () => {
      return ipcRenderer.invoke('get-about-content');
    },
    onShowAbout: (callback) => {
      // Remove previous listener if it exists
      if (aboutShowListener) {
        ipcRenderer.removeListener('show-about', aboutShowListener);
      }

      // Set up new listener
      aboutShowListener = () => callback();
      ipcRenderer.on('show-about', aboutShowListener);
    },
    onToggleCopyIcons: (callback) => {
      // Remove previous listener if it exists
      if (toggleCopyIconsListener) {
        ipcRenderer.removeListener('toggle-copy-icons', toggleCopyIconsListener);
      }

      // Set up new listener
      toggleCopyIconsListener = (event, value) => callback(value);
      ipcRenderer.on('toggle-copy-icons', toggleCopyIconsListener);
    },
    getShowCopyIcons: () => {
      return ipcRenderer.invoke('get-show-copy-icons');
    },
    onToggleMenuCopyIcons: (callback) => {
      // Remove previous listener if it exists
      if (toggleMenuCopyIconsListener) {
        ipcRenderer.removeListener('toggle-menu-copy-icons', toggleMenuCopyIconsListener);
      }

      // Set up new listener
      toggleMenuCopyIconsListener = (event, value) => callback(value);
      ipcRenderer.on('toggle-menu-copy-icons', toggleMenuCopyIconsListener);
    },
    getShowMenuCopyIcons: () => {
      return ipcRenderer.invoke('get-show-menu-copy-icons');
    },
    onToggleConfigSection: (callback) => {
      // Remove previous listener if it exists
      if (toggleConfigSectionListener) {
        ipcRenderer.removeListener('toggle-config-section', toggleConfigSectionListener);
      }

      // Set up new listener
      toggleConfigSectionListener = (event, value) => callback(value);
      ipcRenderer.on('toggle-config-section', toggleConfigSectionListener);
    },
    getShowConfigSection: () => {
      return ipcRenderer.invoke('get-show-config-section');
    },
    onShowSettings: (callback) => {
      // Remove previous listener if it exists
      if (showSettingsListener) {
        ipcRenderer.removeListener('show-settings', showSettingsListener);
      }

      // Set up new listener
      showSettingsListener = () => callback();
      ipcRenderer.on('show-settings', showSettingsListener);
    },
    saveSettings: (settings) => {
      return ipcRenderer.invoke('save-settings', settings);
    }
  }
);
