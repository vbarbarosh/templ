#!/usr/bin/env node

const cli = require('@vbarbarosh/node-helpers/src/cli');
const fs_path_resolve = require('@vbarbarosh/node-helpers/src/fs_path_resolve');
const fs_read_stream = require('@vbarbarosh/node-helpers/src/fs_read_stream');
const fs_read_utf8 = require('@vbarbarosh/node-helpers/src/fs_read_utf8');
const fs_rmf = require('@vbarbarosh/node-helpers/src/fs_rmf');
const fs_write = require('@vbarbarosh/node-helpers/src/fs_write');
const make_int = require('@vbarbarosh/node-helpers/src/make_int');
const shell_spawn = require('@vbarbarosh/node-helpers/src/shell_spawn');
const stream = require('stream');

cli(main);

async function main()
{
    const client_pid_file = fs_path_resolve(__dirname, '../../var/client.pid');
    const client_stdout_file = fs_path_resolve(__dirname, '../../var/client.stdout');

    try {
        await fs_write(client_pid_file, `${process.pid}`);
        await show();
        await poll(client_stdout_file);
    }
    finally {
        await fs_rmf(client_pid_file);
        await fs_rmf(client_stdout_file);
    }
}

async function show()
{
    const pid_file = fs_path_resolve(__dirname, '../../var/pid');
    try {
        const pid = make_int(await fs_read_utf8(pid_file));
        if (pid) {
            process.kill(pid, 'SIGURG');
            process.stderr.write(`show ${pid}\n`);
            return;
        }
    }
    catch (error) {
    }

    const proc = await shell_spawn(['node_modules/.bin/electron', 'src/ui/index.js'], {cwd: fs_path_resolve(__dirname, '../..'), stdio: 'ignore'});
    proc.unref();
    process.stderr.write('spawn\n');
}

async function poll(client_stdout_file)
{
    await new Promise(resolve => process.on('SIGPOLL', resolve));
    await stream.promises.pipeline(fs_read_stream(client_stdout_file), process.stdout);
}
