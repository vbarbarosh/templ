#!/usr/bin/env node

const Promise = require('bluebird');
const cli = require('@vbarbarosh/node-helpers/src/cli');
const format_date = require('@vbarbarosh/node-helpers/src/format_date');

cli(main);

async function main()
{
    for (let i = 0; true; ++i) {
        console.log(`[${format_date(new Date())}] ${i}`);
        await Promise.delay(1000);
    }
}
