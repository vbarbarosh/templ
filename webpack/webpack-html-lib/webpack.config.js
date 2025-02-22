const path = require('path');

const prod = {
    mode: 'production',
    target: 'web',
    entry: '.',
    output: {
        path: path.resolve(__dirname, '../../dist/html-lib-prod'),
        filename: 'bundle.js',
    },
};

const dev = {
    mode: 'development',
    target: 'web',
    entry: '.',
    output: {
        path: path.resolve(__dirname, '../../dist/html-lib-dev'),
        filename: 'bundle.js',
    },
};

module.exports = [prod, dev];
