const Promise = require('bluebird');
const chokidar = require('chokidar');
const cli = require('@vbarbarosh/node-helpers/src/cli');
const electron = require('electron');
const format_date = require('@vbarbarosh/node-helpers/src/format_date');
const fs_path_resolve = require('@vbarbarosh/node-helpers/src/fs_path_resolve');

cli(main);

async function main()
{
    await electron.app.whenReady();

    electron.ipcMain.handle('api_ping', function () {
        return `pong ${format_date(new Date())}`;
    });

    const win = new electron.BrowserWindow({
        width: 1200,
        height: 1000,
        webPreferences: {
            zoomFactor: 1.25,
            // (node:127005) electron: The default of contextIsolation
            // is deprecated and will be changing from false to true
            // in a future release of Electron. See
            // https://github.com/electron/electron/issues/23506 for
            // more information
            contextIsolation: true,
            nodeIntegration: false,
            preload: fs_path_resolve(__dirname, 'renderer.js'),
        },
        // backgroundColor: '#000',
    });

    // // 🔶 Ctrl+Shift+I to open
    // win.webContents.openDevTools({mode: 'bottom', activate: false});
    //
    // setInterval(function () {
    //     win.webContents.executeJavaScript('console.log("js from main", new Date())');
    // }, 2000);

    await win.loadFile(fs_path_resolve(process.cwd(), 'index.html'));

    const watcher = chokidar.watch(process.cwd()).on('all', function (event, path) {
        console.log('👀', event, path);
        if (event !== 'add' && event !== 'addDir') {
            console.log('🔄 Reloading...');
            win.reload();
        }
    });

    await once(win, {
        closed: function () {
            console.log('__closed');
        },
        // blur: function () {
        //     console.log('__blur');
        //     win.close();
        // },
    });

    await watcher.close();
}

async function once(inst, spec)
{
    const listeners = [];
    return new Promise(function (resolve) {
        Object.keys(spec).forEach(function (name) {
            async function handler(...args) {
                listeners.forEach(v => inst.off(v.name, v.handler));
                resolve(await spec[name](...args));
            }
            listeners.push({name, handler});
            inst.on(name, handler);
        });
    });
}
