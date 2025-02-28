#!/usr/bin/env node

const NotImplemented = require('@vbarbarosh/node-helpers/src/errors/NotImplemented');
const cli = require('@vbarbarosh/node-helpers/src/cli');
const fs = require('fs');
const fs_copy_excl = require('@vbarbarosh/node-helpers/src/fs_copy_excl');
const fs_exists = require('@vbarbarosh/node-helpers/src/fs_exists');
const fs_lstat = require('@vbarbarosh/node-helpers/src/fs_lstat');
const fs_mkdir = require('@vbarbarosh/node-helpers/src/fs_mkdir');
const fs_mkdirp = require('@vbarbarosh/node-helpers/src/fs_mkdirp');
const fs_path_basename = require('@vbarbarosh/node-helpers/src/fs_path_basename');
const fs_path_join = require('@vbarbarosh/node-helpers/src/fs_path_join');
const fs_path_relative = require('@vbarbarosh/node-helpers/src/fs_path_relative');
const fs_read_utf8 = require('@vbarbarosh/node-helpers/src/fs_read_utf8');
const fs_readdir = require('@vbarbarosh/node-helpers/src/fs_readdir');
const fs_rmrf = require('@vbarbarosh/node-helpers/src/fs_rmrf');
const fs_write = require('@vbarbarosh/node-helpers/src/fs_write');
const parallel = require('@vbarbarosh/node-helpers/src/parallel');
const sharp = require('sharp');

cli(main);

async function main()
{
    await fs_rmrf('out', (v,p) => console.log(v, p));
    await fs_mkdirp('out');

    const request = {};
    request.template_dir = fs_path_join(__dirname, '../templ.d/html-images-fancybox');

const files = [
    '/lipsum/images-random/anchors.jpg',
    '/lipsum/images-random/balloons.jpg',
    '/lipsum/images-random/birdcage.jpg',
    '/lipsum/images-random/boat.jpg',
    '/lipsum/images-random/cyclists.jpg',
    '/lipsum/images-random/fortress.jpg',
    '/lipsum/images-random/graffiti.jpg',
    '/lipsum/images-random/hand-water.jpg',
    '/lipsum/images-random/heavy-box.jpg',
    '/lipsum/images-random/man-on-bench.jpg',
    '/lipsum/images-random/pipe-sculpture.jpg',
    '/lipsum/images-random/plane.jpg',
    '/lipsum/images-random/rain-coats.jpg',
    '/lipsum/images-random/restaurant-view.jpg',
    '/lipsum/images-random/sandy-boots.jpg',
    '/lipsum/images-random/scarecrow.jpg',
    '/lipsum/images-random/slimy.jpg',
    '/lipsum/images-random/trafalgar.jpg',
    '/lipsum/images-random/tree.jpg',
    '/lipsum/images-random/waterfall.jpg',
    '/lipsum/images-random/wood-textures.jpg',
    '/lipsum/images-random/yellow-balloon.jpg',
];

    await parallel2({
        concurrency: 1,
        items: await fs_lstat_down(request.template_dir),
        fn: async function (lstat) {
            const output_file = fs_path_join('out', fs_path_relative(request.template_dir, lstat.path));
            if (lstat.isDirectory()) {
                if (!await fs_exists(output_file)) {
                    console.log('mkdir -p', output_file);
                    await fs_mkdir(output_file);
                }
            }
            else if (lstat.isFile()) {
                console.log('cp', lstat.path, '->', output_file);
                await fs_copy_excl(lstat.path, output_file);
            }
            else if (lstat.isSymbolicLink()) {
                const target = await fs.promises.readlink(lstat.path)
                console.log('ln -s', output_file, '->', target);
                await fs.promises.symlink(target, output_file);
            }
            else {
                throw new NotImplemented();
            }
        },
    });

    console.log('mkdir', 'out/files/thumbnails');
    await fs_mkdir('out/files/thumbnails');

    const out_files = [];
    const out_html = [];

    await parallel2({
        concurrency: 1,
        items: files,
        fn: async function (file) {
            const output_file = fs_path_join('out', 'files', fs_path_basename(file));
            const thumbnail_file = fs_path_join('out', 'files/thumbnails', fs_path_basename(file));
            console.log('cp', file, '->', output_file);
            await fs_copy_excl(file, output_file);
            console.log('thumbnail', file, '->', thumbnail_file);
            await sharp(file).resize(400, 400, {fit: 'outside', withoutEnlargement: true}).toFile(thumbnail_file);
            out_files.push(fs_path_relative('out', output_file));
            out_html.push(`
    <a class="images-item" href="${fs_path_relative('out', output_file)}" data-fancybox="images" data-caption="">
        <img class="images-img" src="${fs_path_relative('out', thumbnail_file)}" alt="">
    </a>
`);
        },
    });

    console.log(out_html);
    const html = await fs_read_utf8('out/index.html');
    await fs_write('out/index.html', html.replace(/^<div class="images">.*?^<\/div>/ms, `<div class="images">${out_html.join('')}</div>`));
}

async function parallel2({items, concurrency, fn})
{
    let i = 0;
    await parallel({
        concurrency,
        spawn: function () {
            if (i >= items.length) {
                return null;
            }
            return fn(items[i++]);
        },
    });
}

async function fs_lstat_down(path = '.')
{
    const out = [];
    for (const queue = [path]; queue.length; ) {
        const p = queue.pop();
        const lstat = await fs_lstat(p);
        lstat.path = p;
        out.push(lstat);
        if (lstat.isDirectory()) {
            const names = await fs_readdir(p);
            queue.push(...names.map(v => fs_path_join(p, v)));
        }
    }
    out.sort((a,b) => a.path.localeCompare(b.path));
    return out;
}
