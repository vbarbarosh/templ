#!/usr/bin/env node

const Promise = require('bluebird');
const aws = require('@aws-sdk/client-s3');
const cli = require('@vbarbarosh/node-helpers/src/cli');
const perf_end_human = require('@vbarbarosh/node-helpers/src/perf_end_human');
const perf_start = require('@vbarbarosh/node-helpers/src/perf_start');
const stream = require('node:stream');

// 1. Define all known clients in a single place.
// 2. Define a set of friendly function

const clients = [
    {domain: 'hello', region: 'us-east-1', accessKeyId: 'minioadmin', secretAccessKey: 'minioadmin', endpoint: 'http://localhost:9000'},
    {domain: 'f1.minio.test', region: 'us-east-1', accessKeyId: 'minioadmin', secretAccessKey: 'minioadmin', endpoint: 'http://localhost:9000'},
    {domain: 'f2.minio.test', region: 'us-east-1', accessKeyId: 'minioadmin', secretAccessKey: 'minioadmin', endpoint: 'http://localhost:9000'},
];

cli(main);

async function main()
{
    const time0 = perf_start();

    console.log(s3_group([
        'https://f1.minio.test/foo.txt',
        'https://f1.minio.test/foo.txt',
        'https://f1.minio.test/bar.txt',
        'https://f2.minio.test/foo.txt',
        'https://custom.minio.test/foo.txt',
    ]));

    await s3_upload([
        {url: 'http://hello/file1.txt', body: '111' + new Date().toJSON()},
        {url: 'http://hello/file2.txt', body: '222' + new Date().toJSON()},
        {url: 'http://hello/file3.txt', body: '333' + new Date().toJSON()},
    ]);

    const tmp = await s3_download_utf8([
        'http://hello/file1.txt',
        'http://hello/file2.txt',
        'http://hello/file3.txt'
    ]);
    console.log(tmp);

    await s3_remove([
        'http://hello/file1.txt',
        'http://hello/file2.txt',
        'http://hello/file3.txt'
    ]);

    console.log(`🎉 Done in ${perf_end_human(time0)}`);
}

function s3_group(urls)
{
    clients.forEach(function (client) {
        client.s3 ??= new aws.S3Client({
            endpoint: client.endpoint,
            credentials: {
                accessKeyId: client.accessKeyId,
                secretAccessKey: client.secretAccessKey,
            },
            forcePathStyle: true,
            signatureVersion: 'v4',
            region: client.region,
            apiVersion: '2006-03-01',
        });
    });

    const unknown_urls = [];
    const processed_urls = new Set();
    const domain_to_client = new Map(clients.map(v => [v.domain, v]));
    const groups = new Map();
    urls.forEach(function (url) {
        if (processed_urls.has(url)) {
            return;
        }
        processed_urls.add(url);
        const client = domain_to_client.get(s3_parse(url).Bucket) ?? null;
        if (!client) {
            unknown_urls.push(url);
        }
        else {
            if (!groups.has(client)) {
                groups.set(client, {client, urls: []});
            }
            groups.get(client).urls.push(url);
        }
    });

    return [{client: null, urls: unknown_urls}, ...groups.values()];
}

function s3_parse(url)
{
    const obj = new URL(url);
    return {Bucket: obj.hostname, Key: obj.pathname};
}

// an array of {url, body, public: true, options: {}}
async function s3_upload(items)
{
    const groups = s3_group(items.map(v => v.url));
    if (groups[0].urls.length) {
        throw new Error(`No s3 client for the following urls:\n${groups[0].urls.join('\n')}`);
    }

    const url_to_group = new Map();
    groups.forEach(function (group) {
        group.url_to_item = new Map();
        group.urls.forEach(url => url_to_group.set(url, group))
    });
    items.forEach(item => url_to_group.get(item.url).url_to_item.set(item.url, item));

    await Promise.map(gen(), v => v, {concurrency: 50});
    function* gen() {
        for (let i = 1; i < groups.length; ++i) {
            const group = groups[i];
            for (let j = 0; j < group.urls.length; ++j) {
                const item = group.url_to_item.get(group.urls[j]);
                const {Bucket, Key} = s3_parse(item.url);
                yield group.client.s3.send(new aws.PutObjectCommand({Bucket, Key, Body: item.body, ...item.options}));
            }
        }
    }
}

async function s3_download(urls, fn = v => v)
{
    const groups = s3_group(urls);
    if (groups[0].urls.length) {
        throw new Error(`No s3 client for the following urls:\n${groups[0].urls.join('\n')}`);
    }

    const url_to_retval = new Map();
    await Promise.map(gen(), mapper, {concurrency: 50});
    function gen() {
        return groups.slice(1).flatMap(group => group.urls.map(url => ({group, url})));
    }
    async function mapper({group, url}) {
        const {Bucket, Key} = s3_parse(url);
        const response = await group.client.s3.send(new aws.GetObjectCommand({Bucket, Key}));
        const retval = await fn(response);
        url_to_retval.set(url, retval);
    }

    return urls.map(url => url_to_retval.get(url));
}

async function s3_download_buffers(urls)
{
    return s3_download(urls, async function (response) {
        const [buf] = await stream.Readable.from(response.Body).toArray();
        return buf;
    });
}

async function s3_download_utf8(urls)
{
    return s3_download(urls, async function (response) {
        const [buf] = await stream.Readable.from(response.Body).toArray();
        return buf.toString('utf8');
    });
}

async function s3_remove(urls)
{
    const groups = s3_group(urls);
    if (groups[0].urls.length) {
        throw new Error(`No s3 client for the following urls:\n${groups[0].urls.join('\n')}`);
    }

    await Promise.map(generator(), v => v, {concurrency: 50});
    function* generator() {
        for (let i = 1; i < groups.length; ++i) {
            const group = groups[i];
            for (let j = 0; j < group.urls.length; ++j) {
                const {Bucket, Key} = s3_parse(group.urls[j]);
                yield group.client.s3.send(new aws.DeleteObjectCommand({Bucket, Key}));
            }
        }
    }
}
