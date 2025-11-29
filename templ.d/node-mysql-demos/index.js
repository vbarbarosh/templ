#!/usr/bin/env node

const cli = require('@vbarbarosh/node-helpers/src/cli');
const mysql2 = require('mysql2/promise');

cli(main);

async function main()
{
    // const conn = await mysql2.createConnection('mysql://hello:hello@127.0.0.1/hello?debug=false&charset=utf8mb4&timezone=0');
    const conn = await mysql2.createConnection('mysql://root:root@ignore/classicmodels?socketPath=../docker-compose-mysql/var-run-mysqld/mysqld.sock&debug=false&charset=utf8mb4&timezone=0');
    try {
        const [items, defs] = await conn.query('SHOW FULL TABLES');
        // node_modules/mysql2/lib/packets/column_definition.js
        console.log({items, defs: defs.map(v => v.inspect())});
    }
    finally {
        await conn.end();
    }
}
