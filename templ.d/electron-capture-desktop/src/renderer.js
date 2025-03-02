const electron = require('electron');

electron.contextBridge.exposeInMainWorld('ElectronApp', {
    api_ping: function () {
        return electron.ipcRenderer.invoke('api_ping');
    },
});
