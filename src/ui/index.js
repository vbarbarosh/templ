const Promise = require('bluebird');
const cli = require('@vbarbarosh/node-helpers/src/cli');
const electron = require('electron');
const fs_path_resolve = require('@vbarbarosh/node-helpers/src/fs_path_resolve');
const fs_read_utf8 = require('@vbarbarosh/node-helpers/src/fs_read_utf8');
const fs_readdir = require('@vbarbarosh/node-helpers/src/fs_readdir');
const fs_write = require('@vbarbarosh/node-helpers/src/fs_write');
const make_int = require('@vbarbarosh/type-helpers/src/make_int');

cli(main);

async function main()
{
    let cancel_client = false;

    const pid_file = fs_path_resolve(__dirname, '../../var/pid');
    await fs_write(pid_file, `${process.pid}`);
    process.on('SIGURG', () => win.show());

    await electron.app.whenReady();

    electron.ipcMain.handle('api_ping', function (event, ...args) {
        return 'pong';
    });
    electron.ipcMain.handle('api_templates_list', async function (event, ...args) {
        const d = fs_path_resolve(__dirname, '../../templ.d');
        const names = await fs_readdir(d);
        const items = names.map(function (name) {
            return {name, template_dir: fs_path_resolve(d, name)};
        });
        return {items, total: names.length, limit: names.length, offset: 0};
    });
    electron.ipcMain.handle('api_return', async function (event, json) {
        await return_to_client(json);
        cancel_client = false;
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
    win.on('show', function () {
        console.log('__show');
        cancel_client = true;
    });
    win.on('hide', async function () {
        console.log('__hide');
        if (cancel_client) {
            await return_to_client('', 'SIGTERM');
        }
    });
    win.on('close', async function (event) {
        console.log('__close');
        if (!done) {
            event.preventDefault();
        }
        win.hide();
    });
    win.on('closed', async function (event) {
        console.log('__closed');
    });
    win.on('blur', async function (event) {
        console.log('__blur');
        if (cancel_client) {
            cancel_client = false;
            await return_to_client('', 'SIGTERM');
        }
        win.hide();
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

async function return_to_client(json, signal = 'SIGPOLL')
{
    try {
        const client_pid_file = fs_path_resolve(__dirname, '../../var/client.pid');
        const client_stdout_file = fs_path_resolve(__dirname, '../../var/client.stdout');
        const pid = make_int(await fs_read_utf8(client_pid_file));
        if (pid) { // ignore 0 pid
            await fs_write(client_stdout_file, json);
            process.kill(pid, signal);
        }
    }
    catch (error) {
        console.error('return_to_client Failed', error);
    }
}
