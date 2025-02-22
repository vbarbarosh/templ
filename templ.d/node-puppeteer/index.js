#!/usr/bin/env node

const cli = require('@vbarbarosh/node-helpers/src/cli');
const puppeteer = require('puppeteer');
const puppeteer_log = require('@vbarbarosh/puppeteer-helpers/src/puppeteer_log');

cli(main);

async function main()
{
    const browser = await puppeteer.launch();

    try {
        const page = puppeteer_log(await browser.newPage(), s => process.stderr.write(`${s}\n`));
        // https://comertbank.md/ returns 404 for HeadlessChrome
        // Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/92.0.4512.0 Safari/537.36
        // await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4512.0 Safari/537.36');
        await page.setViewport({width: 1280, height: 768});
        await page.goto('https://example.com');
        await page.screenshot({path: 'a.png', fullPage: true});
    }
    finally {
        browser.close();
    }
}
