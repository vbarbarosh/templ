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

    for (let i = 0; i < 1000; ++i) {
        const response = await s3.send(new aws.ListObjectsV2Command({Bucket: 'hello'}));
        console.log(response);
        if (!response.KeyCount) {
            break;
        }
        const responses = await Promise.map(response.Contents, v => s3.send(new aws.DeleteObjectCommand({Bucket: 'hello', Key: v.Key})), {concurrency: 100});
        console.log(responses);
    }

    const response = await s3.send(new aws.DeleteBucketCommand({Bucket: 'hello'}));
    console.log(response);

    console.log(`🎉 Done in ${perf_end_human(time0)}`);
}
