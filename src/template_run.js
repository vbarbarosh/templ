const fs_stat = require('@vbarbarosh/node-helpers/src/fs_stat');
const fs_read_utf8 = require('@vbarbarosh/node-helpers/src/fs_read_utf8');
const fs_copy = require('@vbarbarosh/node-helpers/src/fs_copy');

/**
 * Create file(s) from a template
 */
async function template_run(templ_file)
{
    await fs_copy(templ_file, 'a');
    // const stat = await fs_stat(input_file)
    // if (stat.isFile()) {
    //     await as_file(input_file);
    // }
    // else if (stat.isDirectory()) {
    //     await as_directory(input_file);
    // }
}

module.exports = template_run;
