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

    // Create a tag-based policy
    const Bucket = 'hello';
    const response = await s3.send(new aws.PutBucketPolicyCommand({
        Bucket,
        Policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Principal: '*',
                    Action: 's3:GetObject',
                    Resource: `arn:aws:s3:::${Bucket}/*`,
                    Condition: {
                        StringEquals: {
                            's3:ExistingObjectTag/public': 'true'
                        }
                    }
                },
                {
                    Effect: 'Deny',
                    Principal: '*',
                    Action: 's3:GetObject',
                    Resource: `arn:aws:s3:::${Bucket}/*`,
                    Condition: {
                        StringNotEquals: {
                            's3:ExistingObjectTag/public': 'true'
                        }
                    }
                }
            ],
        })
    }));
    console.log(response);

    console.log(`🎉 Done in ${perf_end_human(time0)}`);
}
