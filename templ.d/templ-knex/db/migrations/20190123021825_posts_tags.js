async function up(knex, Promise)
{
    await knex.schema.createTable('posts_tags', function (table) {
        table.integer('post_id', 32).unsigned().notNullable();
        table.integer('tag_id', 32).unsigned().notNullable();
        table.foreign('post_id').references('id').on('posts');
        table.foreign('tag_id').references('id').on('tags');
        table.unique(['post_id', 'tag_id']);
    });
}

async function down(knex, Promise)
{
    await knex.schema.dropTable('posts_tags');
}

module.exports.up = up;
module.exports.down = down;
