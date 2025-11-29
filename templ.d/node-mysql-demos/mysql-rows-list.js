#!/usr/bin/env node

const cli = require('@vbarbarosh/node-helpers/src/cli');
const mysql2 = require('mysql2/promise');

cli(main);

async function main()
{
    const conn = await mysql2.createConnection('mysql://hello:hello@127.0.0.1/hello?debug=false&charset=utf8mb4&collation=utf8mb4_unicode_ci&timezone=0');
    try {
        const table = 'geolite2';
        const limit = 10;
        const [items, defs] = await conn.query(`SELECT * FROM ${mysql2.escapeId(table)} LIMIT ?`, [limit]);
        // node_modules/mysql2/lib/packets/column_definition.js
        console.log({items, defs: defs.map(v => v.inspect())});
    }
    finally {
        await conn.end();
    }
}
