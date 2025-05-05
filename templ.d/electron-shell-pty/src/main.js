const Promise = require('bluebird');
const cli = require('@vbarbarosh/node-helpers/src/cli');
const cuid = require('cuid');
const electron = require('electron');
const format_date = require('@vbarbarosh/node-helpers/src/format_date');
const fs_path_resolve = require('@vbarbarosh/node-helpers/src/fs_path_resolve');
const node_pty = require('node-pty');

cli(main);

async function main()
{
    let _exit_code;

    await electron.app.whenReady();

    electron.ipcMain.handle('api_ping', function () {
        return `pong ${format_date(new Date())}`;
    });
    electron.ipcMain.handle('api_exit', function (event, exit_code) {
        _exit_code = exit_code;
        win.close();
    });
    electron.ipcMain.handle('api_shell_pty', async function (event, cmd, options) {
        let proc;
        const {sender} = event;
        const uid = `api_shell_pty_${cuid()}`;
        const signals = {
            onend: `${uid}_onend`,
            ondata: `${uid}_ondata`,
            ready: `${uid}_ready`,
            clear: `${uid}_clear`,
            resize: `${uid}_resize`,
            write: `${uid}_write`,
            kill: `${uid}_kill`,
            pause: `${uid}_pause`,
            resume: `${uid}_resume`,
        };
        function setup() {
            electron.ipcMain.addListener(signals.ready, ready);
            electron.ipcMain.addListener(signals.clear, clear);
            electron.ipcMain.addListener(signals.resize, resize);
            electron.ipcMain.addListener(signals.write, write);
            electron.ipcMain.addListener(signals.kill, kill);
            electron.ipcMain.addListener(signals.pause, pause);
            electron.ipcMain.addListener(signals.resume, resume);
        }
        function teardown() {
            electron.ipcMain.removeAllListeners(signals.ready);
            electron.ipcMain.removeAllListeners(signals.clear);
            electron.ipcMain.removeAllListeners(signals.resize);
            electron.ipcMain.removeAllListeners(signals.write);
            electron.ipcMain.removeAllListeners(signals.kill);
            electron.ipcMain.removeAllListeners(signals.pause);
            electron.ipcMain.removeAllListeners(signals.resume);
        }
        function ready() {
            proc = node_pty.spawn(cmd[0], cmd.slice(1), options);
            proc.onData(function (data) {
                sender.send(signals.ondata, data);
            });
            proc.onExit(function ({exitCode: exit_code, signal}) {
                teardown();
                if (exit_code) {
                    sender.send(signals.onend, {message: `Process terminated with ${exit_code}, and signal=${signal}`, exit_code, signal});
                }
                else {
                    sender.send(signals.onend);
                }
            });
        }
        function clear() {
            proc.clear();
        }
        function resize(event, cols, rows) {
            proc.resize(cols, rows);
        }
        function write(event, data) {
            proc.write(data);
        }
        function kill(event, signal) {
            proc.kill(signal);
        }
        function pause() {
            proc.pause();
        }
        function resume() {
            proc.resume();
        }
        setup();
        return signals;
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
        backgroundColor: '#000',
    });

    // // 🔶 Ctrl+Shift+I to open
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

    if (_exit_code) {
        process.exit(_exit_code);
    }
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
