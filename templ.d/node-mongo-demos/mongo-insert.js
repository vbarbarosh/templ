#!/usr/bin/env node

const cli = require('@vbarbarosh/node-helpers/src/cli');
const perf_end_human = require('@vbarbarosh/node-helpers/src/perf_end_human');
const perf_start = require('@vbarbarosh/node-helpers/src/perf_start');
const {MongoClient} = require('mongodb');

const MONGO_URL = 'mongodb://hello:hello@127.0.0.1/hello';

cli(main);

async function main()
{
    const time0 = perf_start();

    const mongo = new MongoClient(MONGO_URL);

    console.log('📡 Connecting to MongoDB...');
    await mongo.connect();

    try {
        console.log('💾 Saving to history...');
        const col = mongo.db().collection('history');
        await col.insertOne({subject: 'hello', created_at: new Date(), data: {ggg: 1}});
    }
    finally {
        await mongo.close();
    }

    console.log(`🎉 Done in ${perf_end_human(time0)}`);
}
