const Promise = require('bluebird');
const chokidar = require('chokidar');
const cli = require('@vbarbarosh/node-helpers/src/cli');
const electron = require('electron');
const format_date = require('@vbarbarosh/node-helpers/src/format_date');
const fs_exists = require('@vbarbarosh/node-helpers/src/fs_exists');
const fs_ls = require('@vbarbarosh/node-helpers/src/fs_ls');
const fs_mkdirp = require('@vbarbarosh/node-helpers/src/fs_mkdirp');
const fs_path_basename = require('@vbarbarosh/node-helpers/src/fs_path_basename');
const fs_path_dirname = require('@vbarbarosh/node-helpers/src/fs_path_dirname');
const fs_path_resolve = require('@vbarbarosh/node-helpers/src/fs_path_resolve');
const fs_read_stream = require('@vbarbarosh/node-helpers/src/fs_read_stream');
const fs_stat = require('@vbarbarosh/node-helpers/src/fs_stat');
const mime = require('mime').default;
const sharp = require('sharp');
const util = require('node:util');

cli(main);

async function main()
{
    await electron.app.whenReady();

    electron.ipcMain.handle('api_ping', function () {
        return `pong ${format_date(new Date())}`;
    });

    // https://www.electronjs.org/blog/electron-25-0#highlights
    // https://www.electronjs.org/docs/latest/api/net#netfetchinput-init
    electron.protocol.handle('thumbnail', async function (request) {
        console.log(`thumbnail 🖼️ ${request.method} ${request.url}`);
        const url = new URL(request.url.replace(/^thumbnail:(\/\/)?/, ''), `thumbnail://${process.cwd()}/`);
        const width = Number.parseInt(url.searchParams.get('w') ?? 400);
        const height = url.searchParams.get('h') ?? width;
        const image_file = decodeURIComponent(url.pathname);
        const thumb_file = fs_path_resolve(__dirname, `../var/thumbnails/${width}x${height}`) + image_file;
        if (!await fs_exists(thumb_file)) {
            await fs_mkdirp(fs_path_dirname(thumb_file));
            await sharp(image_file).resize({width, height, fit: 'inside', withoutEnlargement: true}).toFile(thumb_file);
        }
        return new Response(fs_read_stream(thumb_file), {
            status: 200,
            headers: {
                'Content-Type': mime.getType(thumb_file),
            },
        });
    });

    // https://www.electronjs.org/blog/electron-25-0#highlights
    // https://www.electronjs.org/docs/latest/api/net#netfetchinput-init
    electron.protocol.handle('file', async function (request) {
        const pathname = urlpath(request.url).replace(/\/+$/, '');
        console.log(`file ${request.url} | ${pathname}`);
        if (await fs_exists(pathname)) {
            const stat = await fs_stat(pathname);
            if (stat.isDirectory()) {
                return Response.redirect(`file://${pathname}/index.html`);
            }
            return electron.net.fetch(request, {bypassCustomProtocolHandlers: true});
        }
        const files = await fs_ls(fs_path_dirname(pathname));
        files.splice(0,0, {basename: '..', size: 0});
        const table = render_html_table(files, [
            {label: 'img', read: v => !v.basename.match(/\.(jpg|png|svg|webp|gif)$/) ? '' : `<img src="thumbnail://${v.pathname.split('/').map(encodeURIComponent).join('/')}?w=50">`},
            {label: 'basename', read: v => `<a href="${v.basename}">${v.basename}</a>`},
            {label: 'size', read: v => v.size},
        ]);
        return new Response(`${table}<pre>${util.inspect(request)}</pre>`, {
            status: 200,
            headers: {
                'Content-Type': 'text/html',
            }
        });
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

    const ignore = new Set(['node_modules', 'var']);
    const watcher = chokidar.watch(process.cwd(), {
        depth: 10,
        ignored: function (path) {
            return ignore.has(fs_path_basename(path));
        },
    });

    watcher.on('all', function (event, path) {
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

function render_html_table(items, columns)
{
    return `
        <style>table,th,td{border:1px solid;border-collapse:collapse;}thead{background:#ddd;}</style>
        <table>
            <thead>
                <tr>
                    ${columns.map(col => `<th>${col.label}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${items.map(item => `<tr>${columns.map(col => render_column(col, item)).join('')}</tr>`).join('')}
            </tbody>
        </table>
    `;
    function render_column(col, item) {
        if (col.read) {
            return `<td>${col.read(item)}</td>`;
        }
        return '<td></td>';
    }
}

function urlpath(url)
{
    // new URL('https://example.com/foo bar').pathname -> /foo%20bar
    // new URL('https://example.com/foo+bar').pathname -> /foo+bar
    return decodeURIComponent(new URL(url).pathname);
}
