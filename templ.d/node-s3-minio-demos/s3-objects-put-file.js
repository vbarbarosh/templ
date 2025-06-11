#!/usr/bin/env node

const aws = require('@aws-sdk/client-s3');
const cli = require('@vbarbarosh/node-helpers/src/cli');
const fs_path_basename = require('@vbarbarosh/node-helpers/src/fs_path_basename');
const fs_read_stream = require('@vbarbarosh/node-helpers/src/fs_read_stream');
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

    const response = await s3.send(new aws.PutObjectCommand({
        Bucket: 'hello',
        Key: fs_path_basename(__filename),
        Body: fs_read_stream(__filename),
        ContentType: 'text/javascript',
    }));
    console.log(response);

    console.log(`🎉 Done in ${perf_end_human(time0)}`);
}
