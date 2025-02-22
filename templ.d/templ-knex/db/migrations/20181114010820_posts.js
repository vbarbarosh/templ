async function up(knex, Promise)
{
    await knex.schema.createTable('posts', function (table) {
        table.increments();
        table.string('uid', 32).unique();
        table.integer('user_id', 32).unsigned().notNullable();
        table.string('title');
        table.longtext('body');
        table.timestamps();
        table.foreign('user_id').references('id').on('users');
    });
}

async function down(knex, Promise)
{
    await knex.schema.dropTable('posts');
}

module.exports.up = up;
module.exports.down = down;
