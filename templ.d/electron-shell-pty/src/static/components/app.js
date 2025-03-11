const app = Vue.createApp({
    template: `
        <div class="fix-f vsplit">
            <div class="p5 mi5" style="background:#2c2c2c;">
                <button v-on:click="exec('./artisan migrate')">migrate</button>
                <button v-on:click="exec('./artisan migrate:rollback')">migrate:rollback</button>
                <button v-on:click="exec('git status')">git status</button>
            </div>
            <div class="fluid rel">
                <xterm ref="xterm" class="abs-f black" />
            </div>
        </div>
    `,
    data: function () {
        return {
        };
    },
    methods: {
        exec: async function (cmd) {
            this.$refs.xterm.write(`${cmd}\n`);
            this.$refs.xterm.focus();
        },
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
