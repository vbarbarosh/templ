const Promise = require('bluebird');
const cli = require('@vbarbarosh/node-helpers/src/cli');
const electron = require('electron');
const format_date = require('@vbarbarosh/node-helpers/src/format_date');
const fs_path_resolve = require('@vbarbarosh/node-helpers/src/fs_path_resolve');
const http = require('http');

cli(main);

async function main()
{
    await electron.app.whenReady();

    electron.ipcMain.handle('api_ping', function (event, ...args) {
        return `pong ${format_date(new Date())}`;
    });

    electron.ipcMain.handle('api_docker_containers', async function (event, ...args) {
        return await api_docker_containers();
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

    // 🔶 Ctrl+Shift+I to open
    // win.webContents.openDevTools({mode: 'bottom', activate: false});
    //
    // setInterval(function () {
    //     win.webContents.executeJavaScript('console.log("js from main", new Date())');
    // }, 2000);

    await win.loadFile(fs_path_resolve(__dirname, 'static/index.html'));
    await once(win, {
        closed: function () {
            console.log('__closed');
        },
        blur: function () {
            console.log('__blur');
            win.close();
        },
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

// https://docs.docker.com/reference/api/engine/version/v1.39/#tag/Container/operation/ContainerList
async function api_docker_containers()
{
    const options = {
        method: 'GET',
        path: '/containers/json?all=true',
        socketPath: '/var/run/docker.sock',
    };
    return new Promise(function (resolve, reject) {
        const req = http.request(options, async function (res) {
            try {
                const chunks = await res.toArray();
                const json = Buffer.concat(chunks).toString();
                resolve(JSON.parse(json));
            }
            catch (error) {
                reject(error);
            }
        });
        req.on('error', reject);
        req.end();
    });
}
