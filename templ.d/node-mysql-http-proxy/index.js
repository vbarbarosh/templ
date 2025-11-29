#!/usr/bin/env node

const body_parser = require('body-parser');
const cli = require('@vbarbarosh/node-helpers/src/cli');
const express = require('express');
const express_log = require('@vbarbarosh/express-helpers/src/express_log');
const express_params = require('@vbarbarosh/express-helpers/src/express_params');
const express_routes = require('@vbarbarosh/express-helpers/src/express_routes');
const express_run = require('@vbarbarosh/express-helpers/src/express_run');
const fs_mkdirp = require('@vbarbarosh/node-helpers/src/fs_mkdirp');
const make = require('@vbarbarosh/type-helpers/src/make');
const mysql2 = require('mysql2/promise');

cli(main);

async function main()
{
    const app = express();

    await fs_mkdirp(`${__dirname}/data/logs`);

    app.use(express_log({
        file: () => `${__dirname}/data/logs/http-${new Date().toJSON().substring(0, 10)}.log`,
    }));

    app.use(body_parser.json());

    express_routes(app, [
        {req: 'GET /', fn: echo},
        {req: 'GET /api/v1/tables', fn: route_mysql_tables},
        {req: 'GET /api/v1/tables/:table/rows', fn: route_mysql_table_rows},
        {req: 'ALL *', fn: page404},
    ]);

    await express_run(app, 3000, process.env.LISTEN || 'localhost');
}

// GET /api/v1/tables
async function route_mysql_tables(req, res)
{
    const conn = await mysql2.createConnection('mysql://root:root@ignore/classicmodels?socketPath=../docker-compose-mysql/var-run-mysqld/mysqld.sock&debug=false&charset=utf8mb4&timezone=0');
    try {
        const [items, defs] = await conn.query('SELECT * FROM information_schema.tables WHERE table_schema = ?', ['classicmodels']);
        // node_modules/mysql2/lib/packets/column_definition.js
        res.send({items, defs: defs.map(v => v.inspect())});
    }
    finally {
        await conn.end();
    }
}

// GET /api/v1/tables/:table/rows?limit=100&offset=0
async function route_mysql_table_rows(req, res)
{
    const conn = await mysql2.createConnection('mysql://root:root@ignore/classicmodels?socketPath=../docker-compose-mysql/var-run-mysqld/mysqld.sock&debug=false&charset=utf8mb4&timezone=0');
    try {
        const table = req.params.table;
        const limit = make(req.query.limit, {type: 'int', min: 0, default: 100});
        const [items, defs] = await conn.query(`SELECT * FROM ${mysql2.escapeId(table)} LIMIT ?`, [limit]);
        // node_modules/mysql2/lib/packets/column_definition.js
        res.send({items, defs: defs.map(v => v.inspect())});
    }
    finally {
        await conn.end();
    }
}

async function echo(req, res)
{
    res.status(200).send(express_params(req));
}

async function page404(req, res)
{
    res.status(404).send(`Page not found: ${req.path}`);
}
