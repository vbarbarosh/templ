const path = require('path');

if (!process.env.DB_HOSTNAME) {
    const path = require('path');
    require('dotenv').config({path: path.resolve(__dirname, '.env')});
}

// docker run --rm -d -p 33060:3306 -e MYSQL_ROOT_PASSWORD=root -e MYSQL_USER=hello -e MYSQL_PASSWORD=hello -e MYSQL_DATABASE=hello mysql:5.7
module.exports = {
    development: {
        debug: false,
        client: 'mysql',
        connection: {
            host: process.env.DB_HOSTNAME,
            port: process.env.DB_PORT,
            user: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            // This is important for migrations. Newly created tables
            // and columns will have this charset by default.
            charset: 'utf8',
        },
        migrations: {
            tableName: 'migrations',
            directory: path.resolve(__dirname, 'db/migrations')
        }
    }
};
