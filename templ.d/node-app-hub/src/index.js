#!/usr/bin/env node

require('@dotenvx/dotenvx').config({path: `${__dirname}/../.env`});

const body_parser = require('body-parser');
const cli = require('@vbarbarosh/node-helpers/src/cli');
const express = require('express');
const express_log = require('@vbarbarosh/express-helpers/src/express_log');
const express_params = require('@vbarbarosh/express-helpers/src/express_params');
const express_routes = require('@vbarbarosh/express-helpers/src/express_routes');
const express_run = require('@vbarbarosh/express-helpers/src/express_run');
const fs_mkdirp = require('@vbarbarosh/node-helpers/src/fs_mkdirp');
const make = require('@vbarbarosh/type-helpers/src/make');

cli(main);

async function main()
{
    const app = express();

    await fs_mkdirp(`${__dirname}/../data/logs`);

    app.use(express_log({
        file: () => `${__dirname}/../data/logs/http-${new Date().toJSON().substring(0, 10)}.log`,
    }));

    app.use(express.static(`${__dirname}/static`));
    app.use(body_parser.json());

    express_routes(app, [
        {req: 'GET /', fn: echo},
        {req: 'GET /t/:size/*', fn: thumbnail},
        {req: 'ALL *', fn: page404},
    ]);

    await express_run(app, 3000, process.env.LISTEN || 'localhost');
}

async function echo(req, res)
{
    res.status(200).send(express_params(req));
}

async function thumbnail(req, res)
{
    const size = make(req.params.size, {type: 'int', min: 32, max: 2048, default: 1024});
    const path = make(req.params['0'], {type: 'str', default: ''});

    res.status(200).send({size, path, express_params: express_params(req)});
}

async function page404(req, res)
{
    res.status(404).send(`Page not found: ${req.path}`);
}
