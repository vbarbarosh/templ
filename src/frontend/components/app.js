const app = Vue.createApp({
    template: `
        <div>
            <button v-on:click="click_ping">ping</button>
            <pre>{{ ping }}</pre>
            <input ref="search" v-model="search" type="text">
            <ul class="xp">
                <li v-for="item in templates_search">
                    {{ item }}
                </li>
            </ul>
        </div>
    `,
    data: function () {
        return {
            ping: null,
            search: '',
            templates_list: null,
        };
    },
    computed: {
        templates_search: function () {
            const fcmp = filter1_from_spec(this.search);
            return this.templates_list.items.filter(fcmp);
        },
    },
    methods: {
        refresh: async function () {
            this.templates_list = await api_templates_list();
        },
        click_ping: async function () {
            this.ping = await api_ping();
        },
    },
    created: async function () {
        await this.refresh();
        await this.$nextTick();
        this.$refs.search.focus();
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
