async function up(knex, Promise)
{
    await knex.schema.createTable('tags', function (table) {
        table.increments();
        table.string('uid', 32).unique();
        table.string('title');
        table.timestamps();
    });
}

async function down(knex, Promise)
{
    await knex.schema.dropTable('tags');
}

module.exports.up = up;
module.exports.down = down;
