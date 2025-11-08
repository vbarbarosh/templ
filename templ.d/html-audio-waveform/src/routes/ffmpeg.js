const fs_copy = require('@vbarbarosh/node-helpers/src/fs_copy');
const fs_path_join = require('@vbarbarosh/node-helpers/src/fs_path_join');
const fs_tempdir = require('@vbarbarosh/node-helpers/src/fs_tempdir');
const make = require('@vbarbarosh/type-helpers');
const shell = require('@vbarbarosh/node-helpers/src/shell');

const routes = [
    {req: 'GET /ffmpeg/crop', fn: ffmpeg_crop},
    {req: 'GET /ffmpeg/drop', fn: ffmpeg_drop},
];

// GET /ffmpeg-crop?file=..&begin=0.5&end=0.9
async function ffmpeg_crop(req, res)
{
    const file = make(req.query.file, {type: 'str', default: 'american-cartoon-418307.mp3'});
    const begin = make(req.query.begin, {type: 'float', min: 0, max: 1, default: 0});
    const end = make(req.query.end, {type: 'float', min: 0, max: 1, default: 1});
    await fs_tempdir(async function (d) {
        const src = fs_path_join(`${__dirname}/../../files`, file.split('/').pop());
        await fs_copy(src, `${d}/a.mp3`);
        await shell([`${__dirname}/../../bin/ffmpeg-crop`, 'a.mp3', 'out.mp3', begin, end], {cwd: d});
        res.sendFile(`${d}/out.mp3`);
    });
}

// GET /ffmpeg-drop?file=..&begin=0.5&end=0.9
async function ffmpeg_drop(req, res)
{
    const file = make(req.query.file, {type: 'str', default: 'american-cartoon-418307.mp3'});
    const begin = make(req.query.begin, {type: 'float', min: 0, max: 1, default: 0});
    const end = make(req.query.end, {type: 'float', min: 0, max: 1, default: 1});
    await fs_tempdir(async function (d) {
        const src = fs_path_join(`${__dirname}/../../files`, file.split('/').pop());
        await fs_copy(src, `${d}/a.mp3`);
        await shell([`${__dirname}/../../bin/ffmpeg-drop`, 'a.mp3', 'out.mp3', begin, end], {cwd: d});
        res.sendFile(`${d}/out.mp3`);
    });
}

module.exports = routes;
