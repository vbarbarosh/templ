async function up(knex, Promise)
{
    await knex.schema.createTable('comments', function (table) {
        table.increments();
        table.string('uid', 32).unique();
        table.integer('user_id', 32).unsigned().notNullable();
        table.integer('post_id', 32).unsigned().notNullable();
        table.string('body');
        table.timestamps();
        table.foreign('user_id').references('id').on('users');
        table.foreign('post_id').references('id').on('posts');
    });
}

async function down(knex, Promise)
{
    await knex.schema.dropTable('comments');
}

module.exports.up = up;
module.exports.down = down;
