const app = Vue.createApp({
    template: `
        <div>
            <button v-on:click="click_ping">ping</button>
            <pre>{{ ping }}</pre>
            <docker-containers />
        </div>
    `,
    data: function () {
        return {
            ping: null,
            docker_containers: null,
        };
    },
    methods: {
        click_ping: async function () {
            this.ping = await api_ping();
        },
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
