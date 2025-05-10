const app = Vue.createApp({
    provide: function () {
        return {
            app: this,
        };
    },
    template: `
        <div class="mg15">
            <button v-on:click="click_ping">ping</button>
            <pre>{{ ping }}</pre>
            <s-tabs v-bind:items="tabs" />
        </div>
    `,
    data: function () {
        return {
            ping: null,
            tabs: [
                {label: 'Basic', component: 'app-tab1'},
                {label: 'Groups rowspan', component: 'app-tab2'},
                {label: 'Groups colspan', component: 'app-tab3'},
            ],
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
