#!/usr/bin/env node

const Promise = require('bluebird');
const aws = require('@aws-sdk/client-s3');
const cli = require('@vbarbarosh/node-helpers/src/cli');
const perf_end_human = require('@vbarbarosh/node-helpers/src/perf_end_human');
const perf_start = require('@vbarbarosh/node-helpers/src/perf_start');

cli(main);

async function main()
{
    const time0 = perf_start();

    const s3 = new aws.S3Client({
        endpoint: 'http://localhost:9000',
        credentials: {
            accessKeyId: 'minioadmin',
            secretAccessKey: 'minioadmin',
        },
        forcePathStyle: true,
        signatureVersion: 'v4',
        region: 'us-east-1',
        apiVersion: '2006-03-01',
    });

    const response = await s3.send(new aws.ListObjectsV2Command({Bucket: 'hello'}));
    console.log(response);

    await Promise.map(response.Contents, mapper, {concurrency: 100});
    async function mapper(item) {
        const tagging = await s3.send(new aws.GetObjectTaggingCommand({Bucket: 'hello', Key: item.Key}));
        console.log({item, tags: tagging.TagSet});
    }

    console.log(`🎉 Done in ${perf_end_human(time0)}`);
}
