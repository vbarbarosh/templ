// https://github.com/mochajs/mocha/blob/master/example/config/.mocharc.js

const config = {
    spec: ['src/**/*.test.js'],
    require: ['@babel/register', './mocha.global.js'],
    recursive: true,
};

module.exports = config;
