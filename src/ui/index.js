const Promise = require('bluebird');
const cli = require('@vbarbarosh/node-helpers/src/cli');
const electron = require('electron');
const fs_path_resolve = require('@vbarbarosh/node-helpers/src/fs_path_resolve');
const fs_readdir = require('@vbarbarosh/node-helpers/src/fs_readdir');
const fs_write = require('@vbarbarosh/node-helpers/src/fs_write');

cli(main);

async function main()
{
    const pid_file = fs_path_resolve(__dirname, '../../var/pid');
    await fs_write(pid_file, `${process.pid}`);
    process.on('SIGUSR1', () => win.show());

    await electron.app.whenReady();

    electron.ipcMain.handle('api_ping', function (event, ...args) {
        return 'pong';
    });
    electron.ipcMain.handle('api_templates_list', async function (event, ...args) {
        const items = await fs_readdir(await fs_path_resolve(__dirname, '../../templ.d'));
        return {items, total: items.length, limit: items.length, offset: 0};
    });
    electron.ipcMain.handle('api_return', async function (event, out) {
        console.log('api_return', out);
        win.close();
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
        // backgroundColor: '#11191f',
    });

    // win.webContents.openDevTools({mode: 'bottom', activate: true});
    //
    // setInterval(function () {
    //     win.webContents.executeJavaScript('console.log("js from main", new Date())');
    // }, 2000);

    win.loadFile(fs_path_resolve(__dirname, 'index.html'));
    let done = false;
    win.on('close', function (event) {
        if (!done) {
            event.preventDefault();
        }
        win.hide();
        console.log('__close');
    });
    win.on('closed', function (event) {
        console.log('__closed');
    });
    win.on('blur', function (event) {
        win.hide();
        console.log('__blur');
    });

    // 🟢 Add a tray icon to restore the window
    const tray = new electron.Tray(fs_path_resolve(__dirname, '../../ubuntu/icon.png'));
    const contextMenu = electron.Menu.buildFromTemplate([
        { label: 'Show App', click: () => win.show() },
        { label: 'Quit', click: () => [done = true, electron.app.quit()] }
    ]);
    tray.setToolTip('Your App');
    tray.setContextMenu(contextMenu);

    // Restore app when clicking the tray icon
    tray.on('click', () => win.show());

    // await once(win, {
    //     closed: function (event) {
    //         event.preventDefault();
    //         win.hide();
    //         console.log('__closed');
    //     },
    //     blur: function () {
    //         console.log('__blur');
    //         win.close();
    //     },
    // });

    await new Promise(function () {
        // forever
    });
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
