templ-knex

Template for knex

## Snippets

Remove all rows form table

    db('posts').del()

Insert a row into a table

    db('users').insert({id: 1, email: 'vladimir.barbarosh@gmail.com', created_at: new Date(), updated_at: new Date()})

Insert several rows into table:

    db('coords').insert([{x: 20}, {y: 30}, {x: 10, y: 20}])
    INSERT INTO `coords` (`x`, `y`) VALUES (20, DEFAULT), (DEFAULT, 30), (10, 20)
