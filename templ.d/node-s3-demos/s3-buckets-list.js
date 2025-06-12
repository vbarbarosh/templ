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

    const response = await s3.send(new aws.ListBucketsCommand());
    console.log(response);

    for (const Bucket of response.Buckets) {
        try {
            console.log(`CORS[${Bucket.Name}]`, await s3.send(new aws.GetBucketCorsCommand({Bucket: Bucket.Name})));
        }
        catch (error) {
            console.log(`CORS[${Bucket.Name}]`, error);
        }
    }

    for (const Bucket of response.Buckets) {
        try {
            console.log(`ACL[${Bucket.Name}]`, await s3.send(new aws.GetBucketAclCommand({Bucket: Bucket.Name})));
        }
        catch (error) {
            console.log(`ACL[${Bucket.Name}]`, error);
        }
    }

    console.log(`🎉 Done in ${perf_end_human(time0)}`);
}
