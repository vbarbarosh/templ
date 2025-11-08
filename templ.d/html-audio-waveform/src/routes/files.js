const Promise = require('bluebird');
const fs_readdir = require('@vbarbarosh/node-helpers/src/fs_readdir');
const ffprobe = require('@vbarbarosh/ffmpeg-helpers/src/ffprobe');
const shell_json = require('@vbarbarosh/node-helpers/src/shell_json');

const routes = [
    {req: 'GET /files', fn: files_list},
];

async function files_list(req, res)
{
    const files = await fs_readdir(`${__dirname}/../../files`);
    res.send(await Promise.map(files, mapper, {concurrency: 10}));
}

async function mapper(file)
{
    const ffprobe_value = await shell_json(ffprobe({input: `${__dirname}/../../files/${file}`}));
    return {
        name: file,
        url: `/files/${file}`,
        ffprobe: ffprobe_value,
        duration_sec: +ffprobe_value.format.duration,
    };
}

module.exports = routes;
