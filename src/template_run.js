const fs_stat = require('@vbarbarosh/node-helpers/src/fs_stat');
const fs_read_utf8 = require('@vbarbarosh/node-helpers/src/fs_read_utf8');

/**
 * Create file(s) from a template
 */
async function template_run(input_file, output_dir)
{
    const stat = await fs_stat(input_file)
    if (stat.isFile()) {
        await as_file(input_file);
    }
    else if (stat.isDirectory()) {
        await as_directory(input_file);
    }
}

async function as_file(input_file)
{
    const s = await fs_read_utf8(input_file);
    console.log('as_file', s);
}

async function as_directory(input_file)
{
}

template_run('/home/vb/w/templ/templ.d/default-bash');

module.exports = template_run;
