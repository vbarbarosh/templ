#!/usr/bin/env node

const cli = require('@vbarbarosh/node-helpers/src/cli');
const mysql2 = require('mysql2/promise');

cli(main);

async function main()
{
    const conn = await mysql2.createConnection('mysql://hello:hello@127.0.0.1/hello?debug=false&charset=UTF8&timezone=0');
    try {
        const items = await conn.query('SELECT * FROM users LIMIT 10');
        console.log(items);
    }
    finally {
        await conn.end();
    }
}
