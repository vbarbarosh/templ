#!/usr/bin/env node

const body_parser = require('body-parser');
const cli = require('@vbarbarosh/node-helpers/src/cli');
const cors = require('cors');
const express = require('express');
const express_log = require('@vbarbarosh/express-helpers/src/express_log');
const express_params = require('@vbarbarosh/express-helpers/src/express_params');
const express_routes = require('@vbarbarosh/express-helpers/src/express_routes');
const express_run = require('@vbarbarosh/express-helpers/src/express_run');
const fs_mkdirp = require('@vbarbarosh/node-helpers/src/fs_mkdirp');
const fs_path_resolve = require('@vbarbarosh/node-helpers/src/fs_path_resolve');
const fs_read_json = require('@vbarbarosh/node-helpers/src/fs_read_json');
const fs_write_json = require('@vbarbarosh/node-helpers/src/fs_write_json');
const sanitize_filename = require('@vbarbarosh/node-helpers/src/sanitize_filename');

const PORT = parseInt(process.env.PORT) || 3000;

cli(main);

async function main()
{
    const app = express();

    await fs_mkdirp(fs_path_resolve(__dirname, '../data/db'));
    await fs_mkdirp(fs_path_resolve(__dirname, '../data/logs'));

    app.use(express_log({
        file: () => fs_path_resolve(__dirname, `../data/logs/http-${new Date().toJSON().substring(0, 10)}.log`),
    }));
    app.use(body_parser.json());
    app.use(cors());

    express_routes(app, [
        {req: 'GET /', fn: echo},
        {req: 'GET /:uid.json', fn: route_get_doc},
        {req: 'PUT /:uid.json', fn: route_put_doc},
        {req: 'ALL *', fn: page404},
    ]);

    await express_run(app, 3000, '0.0.0.0');
}

// GET /:uid.json
async function route_get_doc(req, res)
{
    const doc = await fs_read_json(fs_path_resolve(__dirname, `../data/db/${sanitize_filename(req.params.uid)}.json`));
    res.send(doc.body);
}

// PUT /:uid.json
async function route_put_doc(req, res)
{
    const file = fs_path_resolve(__dirname, `../data/db/${sanitize_filename(req.params.uid)}.json`);
    const doc = await fs_read_json(file);
    doc.body = req.body || null;
    doc.updated_at = new Date();
    await fs_write_json(file, doc);
    res.send();
}

async function echo(req, res)
{
    res.status(200).send(express_params(req));
}

async function page404(req, res)
{
    res.status(404).send(`Page not found: ${req.path}`);
}
