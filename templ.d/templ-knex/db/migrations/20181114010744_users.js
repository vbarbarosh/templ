async function up(knex, Promise)
{
    await knex.schema.createTable('users', function (table) {
        table.increments();
        table.string('uid', 32).unique();
        table.string('email').unique();
        table.string('name');
        table.timestamps();
    });
}

async function down(knex, Promise)
{
    await knex.schema.dropTable('users');
}

module.exports.up = up;
module.exports.down = down;
