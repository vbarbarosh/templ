#!/usr/bin/env node

const cli = require('@vbarbarosh/node-helpers/src/cli');
const fs_path_resolve = require('@vbarbarosh/node-helpers/src/fs_path_resolve');
const fs_read_utf8 = require('@vbarbarosh/node-helpers/src/fs_read_utf8');
const make_int = require('@vbarbarosh/node-helpers/src/make_int');
const shell_spawn = require('@vbarbarosh/node-helpers/src/shell_spawn');

cli(main);

async function main()
{
    const pid_file = fs_path_resolve(__dirname, '../../var/pid');
    try {
        const pid = make_int(await fs_read_utf8(pid_file));
        if (pid) {
            process.kill(pid, 'SIGUSR1');
            console.log('show', pid);
            return;
        }

    }
    catch (error) {
    }

    const proc = await shell_spawn(['node_modules/.bin/electron', 'src/ui/index.js'], {cwd: fs_path_resolve(__dirname, '../..'), stdio: 'ignore'});
    proc.unref();
    console.log('spawn');
}
