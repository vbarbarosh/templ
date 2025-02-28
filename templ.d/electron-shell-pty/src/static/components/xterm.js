app.component('xterm', {
    template: `
        <div />
    `,
    data: function () {
        return {
            proc: Vue.markRaw({}),
            xterm: Vue.markRaw(new Terminal()),
            fit_addon: Vue.markRaw(new FitAddon.FitAddon()),
        };
    },
    computed: {
    },
    watch: {
    },
    methods: {
        resize_window: function () {
            this.fit_addon.fit();
        },
        resize_xterm: function () {
            this.proc.resize(this.xterm.cols, this.xterm.rows);
        },
    },
    mounted: async function () {
        this.xterm.open(this.$el);
        this.xterm.loadAddon(this.fit_addon);
        this.fit_addon.fit();

        this.proc = await api_shell_pty({
            cmd: ['bash'],
            ondata: v => this.xterm.write(v),
            options: {
                cols: this.xterm.cols,
                rows: this.xterm.rows,
            },
        });

        this.xterm.onResize(this.resize_xterm);
        this.xterm.onData(v => this.proc.write(v));
        window.addEventListener('resize', this.resize_window);

        await this.proc.promise();
    },
    unmounted: function () {
        window.removeEventListener('resize', this.resize_window);
    },
});
