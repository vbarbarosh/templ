https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/s3-node-examples.html

Minio does not support `ACL: public-read` with private buckets they way S3 does.
The solution is to use *tag-based bucket policy*.

```javascript
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
```
