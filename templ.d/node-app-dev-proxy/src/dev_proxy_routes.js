const Markdown = require('markdown-it');
const Promise = require('bluebird');
const bytes = require('bytes');
const express_params = require('@vbarbarosh/express-helpers/src/express_params');
const fs_path_resolve = require('@vbarbarosh/node-helpers/src/fs_path_resolve');
const fs_read_utf8 = require('@vbarbarosh/node-helpers/src/fs_read_utf8');
const hljs = require('highlight.js');
const json_stringify_stable = require('@vbarbarosh/node-helpers/src/json_stringify_stable');
const request = require('request');
const stream = require('stream');
const stream_discard = require('@vbarbarosh/node-helpers/src/stream_discard');
const stream_md5 = require('@vbarbarosh/node-helpers/src/stream_md5');
const urlmod = require('@vbarbarosh/node-helpers/src/urlmod');
const urlnorm = require('./helpers/urlnorm');
const {Throttle} = require('stream-throttle');

const md = new Markdown({
    highlight: function (str, language) {
        if (language && hljs.getLanguage(language)) {
            try {
                return hljs.highlight(str, {language, ignoreIllegals: true}).value;
            }
            catch (error) {
            }
        }
        return '';
    }
});

function dev_proxy_routes()
{
    return [
        {req: 'GET /', fn: home},
        {req: 'GET /echo', fn: echo},
        {req: 'GET /proxy', fn: proxy},
        {req: 'ALL /null', fn: any_null},
        {req: 'ALL /md5', fn: any_md5},
        {req: 'ALL *', fn: page404},
    ];
}

async function home(req, res)
{
    const s = await fs_read_utf8(fs_path_resolve(__dirname, '../README.md'));
    let html = `
        <link rel="stylesheet" href="https://unpkg.com/@highlightjs/cdn-assets@11.9.0/styles/default.min.css">
        ${md.render(s)}
    `;
    html = html.replaceAll('http://127.0.0.1:3000/', urlmod(`${req.headers['x-forwarded-proto'] || 'http'}://${req.headers['host']}/`));
    res.send(html);
}

async function echo(req, res)
{
    res.send(express_params(req));
}

async function any_null(req, res)
{
    await stream.promises.finished(req.pipe(stream_discard()));
    res.send();
}

async function any_md5(req, res)
{
    const [buf] = await stream.Readable.from(req.pipe(stream_md5())).toArray();
    res.type('text/plain').send(buf.toString());
}

async function proxy(req, res)
{
    let end_ok = true;
    req.log(`[proxy_begin]`);

    try {
        if (req.query.redirects > 0) {
            const url = urlmod(`${req.headers['x-forwarded-proto'] || 'http'}://${req.headers['host']}${req.url}`, {redirects: (req.query.redirects - 1) || null});
            res.redirect(url);
            return;
        }

        if (!req.query.url) {
            res.redirect('/');
            return;
        }

        if (req.query.delay) {
            await Promise.delay(req.query.delay);
        }

        const url = urlnorm(req.query.url);

        if (req.query.throttle) {
            const rate = Math.max(10, bytes.parse(req.query.throttle.replace(/([^1-9Bb]$)/, '$1b')));
            const throttle = new Throttle({rate});
            Object.defineProperty(throttle, 'statusCode', {
                get: function () {
                    return res.statusCode;
                },
                set: function (value) {
                    res.statusCode = value;
                },
            });
            throttle.setHeader = function (...args) {
                return res.setHeader(...args);
            };
            await stream.promises.pipeline(req, request(url, {headers: req.query.headers}), throttle, res);
        }
        else {
            await stream.promises.pipeline(req, request(url, {headers: req.query.headers}), res);
        }
    }
    catch (error) {
        end_ok = false;
        const tmp = {...error, message: error.message, stack: error.stack.split(/\n\s*/)};
        req.log(`[proxy_end_error] ${json_stringify_stable(tmp)}`);
        res.status(400).type('text').send(tmp);
    }
    finally {
        if (end_ok) {
            req.log('[proxy_end_ok]');
        }
    }
}

async function page404(req, res)
{
    res.status(404).send(`Page not found: ${req.path}`);
}

module.exports = dev_proxy_routes;
