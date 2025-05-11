#!/usr/bin/env node

// A basic template for node cli apps

require('@dotenvx/dotenvx').config();

const Promise = require('bluebird');
const cli = require('@vbarbarosh/node-helpers/src/cli');
const perf_end_human = require('@vbarbarosh/node-helpers/src/perf_end_human');
const perf_start = require('@vbarbarosh/node-helpers/src/perf_start');

cli(main);

async function main()
{
    const time0 = perf_start();

    await Promise.delay(1000);

    console.log(`🎉 Done in ${perf_end_human(time0)}`);
}
