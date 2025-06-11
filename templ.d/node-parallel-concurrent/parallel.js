#!/usr/bin/env node

const Promise = require('bluebird');
const cli = require('@vbarbarosh/node-helpers/src/cli');
const perf_end_human = require('@vbarbarosh/node-helpers/src/perf_end_human');
const perf_start = require('@vbarbarosh/node-helpers/src/perf_start');

cli(main);

async function main()
{
    const time0 = perf_start();

    const result = await Promise.map(generator(), mapper, {concurrency: 2});
    console.log(result);

    console.log(`🎉 Done in ${perf_end_human(time0)}`);
}

function* generator()
{
    for (let i = 0; i < 10; ++i) {
        yield i;
    }
}

async function mapper(ms)
{
    console.log(`[begin] ${ms}`);
    await Promise.delay(ms*100);
    console.log(`[end] ${ms}`);
    return ms*2;
}
