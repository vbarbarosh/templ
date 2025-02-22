const path = require('path');

const dev = {
    mode: 'development',
    target: 'node',
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'build/node-cli-dev'),
        filename: 'app.js',
    },
    externals: {
        'node-pty': 'commonjs2 node-pty',
    },
};

const prod = {
    mode: 'production',
    target: 'node',
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'build/node-cli-prod'),
        filename: 'app.js',
    },
    externals: {
        'node-pty': 'commonjs2 node-pty',
    },
};

module.exports = [dev, prod];
