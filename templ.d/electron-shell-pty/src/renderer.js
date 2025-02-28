const electron = require('electron');

electron.contextBridge.exposeInMainWorld('ElectronApp', {
    api_ping: function () {
        return electron.ipcRenderer.invoke('api_ping');
    },
    api_shell_pty: async function ({cmd, options, ondata}) {
        let _resolve, _reject;
        const signals = await electron.ipcRenderer.invoke('api_shell_pty', cmd, options);
        const promise = new Promise(function (resolve, reject) {
            [_resolve, _reject] = [resolve, reject];
        });
        setup();
        return {
            clear: () => electron.ipcRenderer.send(signals.clear),
            resize: (rows, cols) => electron.ipcRenderer.send(signals.resize, rows, cols),
            write: data => electron.ipcRenderer.send(signals.write, data),
            kill: signal => electron.ipcRenderer.send(signals.kill, signal),
            pause: () => electron.ipcRenderer.send(signals.pause),
            resume: () => electron.ipcRenderer.send(signals.resume),
            promise: () => promise,
        };
        function setup() {
            electron.ipcRenderer.addListener(signals.onend, signal_onend);
            electron.ipcRenderer.addListener(signals.ondata, signal_ondata);
            electron.ipcRenderer.send(signals.ready);
        }
        function clean() {
            electron.ipcRenderer.removeAllListeners(signals.onend);
            electron.ipcRenderer.removeAllListeners(signals.ondata);
        }
        function signal_onend(event, error, out) {
            clean();
            error ? _reject(error) : _resolve(out);
        }
        function signal_ondata(event, data) {
            ondata(data);
        }
    },
});
