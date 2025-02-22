import './sass/main.sass';

import Vue from 'vue';

// https://github.com/webpack/webpack/issues/625
// https://webpack.js.org/guides/dependency-management/#require-context
const require_components = require.context('./components', true, /\.vue$/);
require_components.keys().forEach(function (key) {
    const name = key.replace(/.*[/](.*)\.vue$/, '$1');
    Vue.component(name, require_components(key).default);
});

Vue.mixin({
    computed: {
        __dev__: function () {
            return __dev__;
        },
        __prod__: function () {
            return __prod__;
        },
    },
    methods: {
        px: function (x) {
            return x + 'px';
        },
        emit_input: function (value) {
            this.$emit('input', value);
        },
    },
});

new Vue({
    el: document.body.appendChild(document.createElement('DIV')),
    template: '<app />',
    created: function () {
        console.log('app', __version__, __date__);
    }
});
