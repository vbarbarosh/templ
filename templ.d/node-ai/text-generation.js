#!/usr/bin/env node

const cli = require('@vbarbarosh/node-helpers/src/cli');
const perf_end_human = require('@vbarbarosh/node-helpers/src/perf_end_human');
const perf_start = require('@vbarbarosh/node-helpers/src/perf_start');

cli(main);

async function main()
{
    const XT = await import('@xenova/transformers');
    const time0 = perf_start();

    const pipe = await XT.pipeline('text-generation', 'Xenova/gpt2');
    const response = await pipe("Hello, how are you?", { max_length: 50 });
    console.log(response);

    console.log(`🎉 Done in ${perf_end_human(time0)}`);
}
