#!/usr/bin/env node

const aws = require('@aws-sdk/client-s3');
const cli = require('@vbarbarosh/node-helpers/src/cli');
const fs_read_stream = require('@vbarbarosh/node-helpers/src/fs_read_stream');
const perf_end_human = require('@vbarbarosh/node-helpers/src/perf_end_human');
const perf_start = require('@vbarbarosh/node-helpers/src/perf_start');
const s3_request_presigner = require('@aws-sdk/s3-request-presigner');

cli(main);

async function main()
{
    const time0 = perf_start();

    const s3 = new aws.S3Client({
        endpoint: 'http://minio.test:9000',
        credentials: {
            accessKeyId: 'minioadmin',
            secretAccessKey: 'minioadmin',
        },
        forcePathStyle: false,
        signatureVersion: 'v4',
        region: 'us-east-1',
        apiVersion: '2006-03-01',
    });

    const response = await s3.send(new aws.PutObjectCommand({
        Bucket: 'hello',
        Key: 'sign/private.txt',
        Body: fs_read_stream(__filename),
        ContentType: 'text/private',
    }));
    console.log(response);

    const sign_get = await s3_request_presigner.getSignedUrl(s3, new aws.GetObjectCommand({Bucket: 'hello', Key: 'sign/private.txt'}, {expiresInSeconds: 600}));
    const sign_put = await s3_request_presigner.getSignedUrl(s3, new aws.PutObjectCommand({Bucket: 'hello', Key: 'sign/put.txt', ContentType: 'text/plain'}, {expiresInSeconds: 600}));

    console.log();
    console.log('http://hello.minio.test:9000/sign/private.txt');
    console.log();
    console.log(sign_get);
    console.log();
    // curl -T file.txt {{sign_put_url}}
    console.log(sign_put);
    console.log();

    console.log(`🎉 Done in ${perf_end_human(time0)}`);
}
