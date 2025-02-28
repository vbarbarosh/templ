const app = Vue.createApp({
    template: `
        <xterm class="fix-f flex-row-center black" />
    `,
    data: function () {
        return {
        };
    },
    methods: {
    },
    created: async function () {
    },
});

app.mixin({
    methods: {
        px,
        pc,
        format_bytes,
        format_date,
        format_thousands,
        plural,
    },
});

app.config.errorHandler = async function (error) {
    console.log('errorHandler', error);
};
app.config.warnHandler = async function (error) {
    console.log('warnHandler', error);
};
// Prevent Vue from spamming the console with "helpful" tips
app.config.productionTip = false;
