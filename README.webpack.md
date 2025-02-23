Templates for Webpack

## .browserslistrc

Use `.browserslistrc` to specify supported browsers. `babel-loader` with `@babel/preset-env`, and
`autoprefixer` will consult this file for supported browsers.

    # http://browserl.ist/?q=IE+%3E%3D+10%2C+Edge+%3E%3D+12%2C+Chrome+%3E%3D+50%2C+Firefox+%3E%3D+40%2C+Safari+%3E%3D+7%2C+iOS+%3E%3D+7

    IE >= 10
    Edge >= 12
    Chrome >= 40
    Firefox >= 40
    Safari >= 7
    iOS >= 7

## How to remove arrow functions from webpack output

https://stackoverflow.com/a/65376531

    // webpack.config.js
    module: {
       ...
       target: "es5", // include this!!
       loaders: [
         {
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'babel-loader',
         }
      ]
    }

https://webpack.js.org/configuration/target/#string

    esX - Compile for specified ECMAScript version. Examples: es5, es2020.

    browserslist - Infer a platform and the ES-features from a
                   browserslist-config (default if browserslist config is available)
