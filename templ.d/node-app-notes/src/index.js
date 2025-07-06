#!/usr/bin/env node

const Promise = require('bluebird');;
const amx = require('@vbarbarosh/express-helpers/src/amx');
const body_parser = require('body-parser');
const cli = require('@vbarbarosh/node-helpers/src/cli');
const express = require('express');
const express_log = require('@vbarbarosh/express-helpers/src/express_log');
const express_params = require('@vbarbarosh/express-helpers/src/express_params');
const express_routes = require('@vbarbarosh/express-helpers/src/express_routes');
const express_run = require('@vbarbarosh/express-helpers/src/express_run');
const fs_exists = require('@vbarbarosh/node-helpers/src/fs_exists');
const fs_lstat = require('@vbarbarosh/node-helpers/src/fs_lstat');
const fs_mkdirp = require('@vbarbarosh/node-helpers/src/fs_mkdirp');
const fs_path_basename = require('@vbarbarosh/node-helpers/src/fs_path_basename');
const fs_path_dirname = require('@vbarbarosh/node-helpers/src/fs_path_dirname');
const fs_path_resolve = require('@vbarbarosh/node-helpers/src/fs_path_resolve');
const fs_read_utf8 = require('@vbarbarosh/node-helpers/src/fs_read_utf8');
const fs_readdir = require('@vbarbarosh/node-helpers/src/fs_readdir');
const fs_rename = require('@vbarbarosh/node-helpers/src/fs_rename');
const fs_write = require('@vbarbarosh/node-helpers/src/fs_write');
const multer = require('multer');
const sanitize_filename = require('@vbarbarosh/node-helpers/src/sanitize_filename');
const sharp = require('sharp');

cli(main);

async function main()
{
    const app = express();
    const upload = multer({storage: multer.memoryStorage()});

    app.use(express_log({
        file: () => `${__dirname}/../data/logs/http-${new Date().toJSON().substring(0, 10)}.log`,
    }));

    app.use(express.static(fs_path_resolve(__dirname, 'static')));
    app.use(body_parser.json());

    app.post('/api/v1/notes/:note_uid/files', upload.array('file'), amx(notes_upload_file));

    express_routes(app, [
        {req: 'GET /', fn: echo},
        {req: 'GET /r/*', fn: data_fetch},
        {req: 'GET /api/v1/notes.json', fn: notes_list},
        {req: 'POST /api/v1/notes', fn: notes_create},
        {req: 'DELETE /api/v1/notes/:note_uid', fn: notes_remove},
        {req: 'DELETE /api/v1/notes/:note_uid/files/:filename', fn: notes_remove_file},
        {req: 'PATCH /api/v1/notes/:note_uid', fn: notes_update},
        {req: 'ALL *', fn: page404},
    ]);

    await express_run(app, 3000, process.env.LISTEN || 'localhost');
}

async function echo(req, res)
{
    res.status(200).send(express_params(req));
}

async function page404(req, res)
{
    res.status(404).send(`Page not found: ${req.path}`);
}

async function data_fetch(req, res)
{
    const path = req.params['0'];
    if (!path || path.includes('..')) {
        res.status(400).send('Invalid path');
        return;
    }

    res.sendFile(fs_path_resolve(`${__dirname}/../data/notes/${path}`));
}

async function notes_list(req, res)
{
    const d = `${__dirname}/../data/notes`;
    const names = await fs_readdir(d);
    const items = [];
    await Promise.all(names.map(async function (name) {
        const lstat = await fs_lstat(`${d}/${name}`);
        let i = name.indexOf('-');
        if (i === -1) {
            i = name.length;
        }
        const files = [];
        if (await fs_exists(`${d}/${name}/files`)) {
            const tmp = await fs_readdir(`${d}/${name}/files`);
            await Promise.map(tmp, async function (file) {
                const lstat = await fs_lstat(`${d}/${name}/files/${file}`);
                const url = `/r/${name}/files/${file}`;
                const thumbnail_url = await is_image(`${d}/${name}/files/${file}`) ? url : null;
                files.push({
                    name: file,
                    url,
                    thumbnail_url,
                    size: lstat.size,
                });
            });
        }
        items.push({
            uid: name.slice(0, i),
            name: name.slice(i + 1),
            body: await fs_read_utf8(`${d}/${name}/README.md`),
            prefix: `/r/${name}/`,
            files,
            created_at: lstat.birthtime,
            updated_at: lstat.ctime,
        });
    }));
    res.send({items: items.sort((b, a) => fcmp_strings_ascii(a.uid, b.uid))});
}

async function notes_create(req, res)
{
    const name = req.body.name;
    const body = req.body.body.toString().trim() + '\n';

    const uid = now_fs();
    const dir_name = uid;
    const dir_path = fs_path_resolve(__dirname, '..', 'data', 'notes', dir_name);

    await fs_mkdirp(dir_path);
    await fs_write(`${dir_path}/README.md`, body);

    res.status(201).json({uid, name, prefix: `/r/${dir_name}/`});
}

// PATCH /api/v1/notes/:note_uid body=xxx
async function notes_update(req, res)
{
    const note_uid = req.params.note_uid;
    const body = req.body.body.toString().trim() + '\n';

    const d = fs_path_resolve(__dirname, '..', 'data', 'notes', note_uid);

    if (!await fs_exists(`${d}/README.md`)) {
        res.status(404).send('Note not found');
        return;
    }

    await fs_write(`${d}/README.md`, body);
    res.status(204).send();
}

// DELETE /api/v1/notes/:note_uid
async function notes_remove(req, res)
{
    const note_uid = req.params.note_uid;

    const d = `${__dirname}/../data`;
    await fs_rename(`${d}/notes/${note_uid}`, `${d}/trash-bin/${now_fs()}-${note_uid}`);

    res.send();
}

// DELETE /api/v1/notes/:note_uid/files/:filename
async function notes_remove_file(req, res)
{
    const note_uid = req.params.note_uid;
    const filename = sanitize_filename(req.params.filename);

    const d = `${__dirname}/../data`;
    const source = `${d}/notes/${note_uid}/files/${filename}`;
    const target = `${d}/trash-bin/${now_fs()}-${note_uid}-files/${filename}`;

    if (!await fs_exists(source)) {
        res.status(404, 'File Not Found').send();
        return;
    }

    await fs_mkdirp(fs_path_dirname(target));
    await fs_rename(source, target);
    res.send();
}

// POST /api/v1/notes/:note_uid/files | file=@/path/to/file
// POST /api/v1/notes/:note_uid/files?nonunique | file=@/path/to/file
async function notes_upload_file(req, res)
{
    const note_uid = req.params.note_uid;
    const file = req.files[0];

    if (!file) {
        res.status(400).send('No file was provided');
        return;
    }

    const d = fs_path_resolve(__dirname, '..', 'data', 'notes', note_uid);
    if (!await fs_exists(d)) {
        res.status(404).send('Note Not Found');
        return;
    }

    const file_path = fs_path_resolve(d, 'files', sanitize_filename(file.originalname));

    if (await fs_exists(file_path)) {
        res.status(409).send('File Already Exists');
        return;
    }

    await fs_mkdirp(fs_path_dirname(file_path));
    await fs_write(file_path, file.buffer);

    const lstat = await fs_lstat(file_path);
    const name = fs_path_basename(file_path);
    const url = `/r/${name}/files/${file}`;
    const thumbnail_url = await is_image(`${d}/${name}/files/${file}`) ? url : null;
    res.send({
        name,
        url,
        thumbnail_url,
        size: lstat.size,
    });
}

function now_fs()
{
    const now = new Date();
    return [
        now.getFullYear(),
        now.getMonth() + 1,
        now.getDate(),
        'xx',
        now.getHours(),
        now.getMinutes(),
        now.getSeconds()
    ].map(n => n.toString().padStart(2, '0')).join('').replace('xx', '_');
}

async function is_image(buf)
{
    try {
        await sharp(buf).metadata();
        return true;
    }
    catch (error) {
        return false;
    }
}

function fcmp_strings_ascii(a, b)
{
    return a < b ? -1 : a > b ? 1 : 0;
}
