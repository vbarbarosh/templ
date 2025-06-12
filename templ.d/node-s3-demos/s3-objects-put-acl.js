#!/usr/bin/env node

const aws = require('@aws-sdk/client-s3');
const cli = require('@vbarbarosh/node-helpers/src/cli');
const perf_end_human = require('@vbarbarosh/node-helpers/src/perf_end_human');
const perf_start = require('@vbarbarosh/node-helpers/src/perf_start');

cli(main);

async function main()
{
    const time0 = perf_start();

    const s3 = new aws.S3Client({
        endpoint: 'http://localhost:7480',
        credentials: {
            accessKeyId: 's3hello',
            secretAccessKey: 's3hello',
        },
        forcePathStyle: true,
        signatureVersion: 'v4',
        region: 'us-east-1',
        apiVersion: '2006-03-01',
    });

    const response = await s3.send(new aws.PutObjectCommand({
        Bucket: 'hello',
        Key: 'public.txt',
        Body: 'hello',
        ContentType: 'text/plain',
        ACL: 'public-read',
    }));
    console.log(response);

    const response2 = await s3.send(new aws.PutObjectCommand({
        Bucket: 'hello',
        Key: 'private.txt',
        Body: 'hello',
        ContentType: 'text/plain',
    }));
    console.log(response2);

    console.log();
    console.log('http://localhost:7480/hello/public.txt');
    console.log('http://localhost:7480/hello/private.txt');
    console.log();

    console.log(`🎉 Done in ${perf_end_human(time0)}`);
}
