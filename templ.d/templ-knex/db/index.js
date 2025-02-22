const cuid = require('cuid');
const knex = require('knex');
const knexfile = require('../knexfile');

module.exports = knex(knexfile[process.env.NODE_ENV || 'development']);
// Take a look at **abc_end.md**
module.exports.end = () => module.exports.destroy();
module.exports.uid_comments = () => `cmt_${cuid()}`;
module.exports.uid_posts = () => `pst_${cuid()}`;
module.exports.uid_tags = () => `tag_${cuid()}`;
module.exports.uid_users = () => `usr_${cuid()}`;
