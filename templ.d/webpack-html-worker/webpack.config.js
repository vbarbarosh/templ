const path = require('path');

const prod = {
    mode: 'production',
    target: 'webworker',
    entry: '.',
    output: {
        path: path.resolve(__dirname, '../../dist/html-worker-prod'),
        filename: 'bundle.js',
    },
};

const dev = {
    mode: 'development',
    target: 'webworker',
    entry: '.',
    output: {
        path: path.resolve(__dirname, '../../dist/html-worker-dev'),
        filename: 'bundle.js',
    },
};

module.exports = [prod, dev];
