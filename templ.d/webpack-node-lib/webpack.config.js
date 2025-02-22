const path = require('path');

const prod = {
    mode: 'production',
    target: 'node',
    entry: '.',
    output: {
        path: path.resolve(__dirname, '../../dist/node-lib-prod'),
        filename: 'bundle.js',
    },
};

const dev = {
    mode: 'development',
    target: 'node',
    entry: '.',
    output: {
        path: path.resolve(__dirname, '../../dist/node-lib-dev'),
        filename: 'bundle.js',
    },
};

module.exports = [prod, dev];
