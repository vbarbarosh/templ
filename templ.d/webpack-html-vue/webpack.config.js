const path = require('path');
const webpack = require('webpack');
const {VueLoaderPlugin} = require('vue-loader');

const prod = {
    mode: 'production',
    target: 'web',
    entry: '.',
    output: {
        path: path.resolve(__dirname, '../../dist/html-vue-prod'),
        filename: 'bundle.js',
    },
    module: {
        rules: [
            {test: /\.vue$/, loader: 'vue-loader'},
            {test: /\.js$/, loader: 'babel-loader'},
            {test: /\.css$/, use: ['vue-style-loader', 'css-loader']},
            // https://webpack.js.org/loaders/sass-loader/
            {test: /\.sass$/, use: [
                'vue-style-loader',
                'css-loader',
                'postcss-loader',
                'sass-loader?{"sassOptions":{"indentedSyntax":true}}',
            ]},
        ],
    },
    resolve: {
        // [Vue warn]: You are using the runtime-only build of Vue where the template
        // compiler is not available. Either pre-compile the templates into render
        // functions, or use the compiler-included build.
        // https://github.com/vuejs-templates/webpack/issues/215#issuecomment-238095102
        alias: {
            vue: 'vue/dist/vue.js',
        },
    },
    plugins: [
        new VueLoaderPlugin(),
        new webpack.DefinePlugin({
            __dev__: JSON.stringify(false),
            __prod__: JSON.stringify(true),
            __version__: JSON.stringify('1.0.0'),
            __date__: JSON.stringify(new Date().toJSON()),
        }),
    ]
};

const dev = {
    mode: 'development',
    target: 'web',
    entry: '.',
    output: {
        path: path.resolve(__dirname, '../../dist/html-vue-dev'),
        filename: 'bundle.js',
    },
    module: {
        rules: [
            {test: /\.vue$/, loader: 'vue-loader'},
            {test: /\.js$/, loader: 'babel-loader'},
            {test: /\.css$/, use: ['vue-style-loader', 'css-loader']},
            // https://webpack.js.org/loaders/sass-loader/
            {test: /\.sass$/, use: [
                'vue-style-loader',
                'css-loader',
                'postcss-loader',
                'sass-loader?{"sassOptions":{"indentedSyntax":true}}',
            ]},
        ],
    },
    resolve: {
        // [Vue warn]: You are using the runtime-only build of Vue where the template
        // compiler is not available. Either pre-compile the templates into render
        // functions, or use the compiler-included build.
        // https://github.com/vuejs-templates/webpack/issues/215#issuecomment-238095102
        alias: {
            vue: 'vue/dist/vue.js',
        },
    },
    plugins: [
        new VueLoaderPlugin(),
        new webpack.DefinePlugin({
            __dev__: JSON.stringify(true),
            __prod__: JSON.stringify(false),
            __version__: JSON.stringify('1.0.0'),
            __date__: JSON.stringify(new Date().toJSON()),
        }),
    ]
};

module.exports = [prod, dev];
