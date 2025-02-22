#!/usr/bin/env node

require('@dotenvx/dotenvx').config();

const body_parser = require('body-parser');
const cli = require('@vbarbarosh/node-helpers/src/cli');
const express = require('express');
const express_params = require('@vbarbarosh/express-helpers/src/express_params');
const express_routes = require('@vbarbarosh/express-helpers/src/express_routes');
const express_run = require('@vbarbarosh/express-helpers/src/express_run');
const fs_path_resolve = require('@vbarbarosh/node-helpers/src/fs_path_resolve');

// A basic template for node express apps

cli(main);

async function main()
{
    const app = express();

    app.use(express.static(fs_path_resolve(__dirname, 'static')));
    app.use(body_parser.json());

    express_routes(app, [
        {req: 'GET /', fn: echo},
        {req: 'GET /api/v1/articles.json', fn: route_articles_list},
        {req: 'POST /api/v1/articles', fn: route_articles_create},
        {req: 'DELETE /api/v1/articles/:article_uid', fn: route_articles_delete},
        {req: 'PATCH /api/v1/articles/:article_uid', fn: route_articles_update},
        {req: 'PUT /api/v1/articles/:article_uid', fn: route_articles_replace},
        {req: 'ALL *', fn: page404},
    ]);

    await express_run(app);
}

// GET /api/v1/articles.json
async function route_articles_list(req, res)
{
    res.send({
        limit: 10,
        offset: 0,
        total: 100,
        items: [],
    });
}

// POST /api/v1/articles
async function route_articles_create(req, res)
{
    res.status({uid: 'na', message: 'POST /api/v1/articles'});
}

// DELETE /api/v1/articles/:article_uid
async function route_articles_delete(req, res)
{
    const {article_uid} = req.params;
    res.status({uid: article_uid, message: `DELETE /api/v1/articles/${articles}`});
}

// PATCH /api/v1/articles/:article_uid
async function route_articles_update(req, res)
{
    const {article_uid} = req.params;
    res.status({uid: article_uid, message: `PATCH /api/v1/articles/${articles}`});
}

// PUT /api/v1/articles/:article_uid
async function route_articles_replace(req, res)
{
    const {article_uid} = req.params;
    res.status({uid: article_uid, message: `PUT /api/v1/articles/${articles}`});
}

async function echo(req, res)
{
    res.status(200).send(express_params(req));
}

async function page404(req, res)
{
    res.status(404).send(`Page not found: ${req.path}`);
}
