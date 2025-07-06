#!/usr/bin/env node

const cli = require('@vbarbarosh/node-helpers/src/cli');
const dev_proxy_routes = require('./dev_proxy_routes');
const express = require('express');
const express_log = require('@vbarbarosh/express-helpers/src/express_log');
const express_routes = require('@vbarbarosh/express-helpers/src/express_routes');
const express_run = require('@vbarbarosh/express-helpers/src/express_run');

cli(main);

async function main()
{
    const app = express();

    app.use(express_log({
        file: () => `${__dirname}/logs/http-${new Date().toJSON().substring(0, 10)}.log`
    }));

    express_routes(app, dev_proxy_routes());

    await express_run(app, 3000, process.env.LISTEN || 'localhost');
}
