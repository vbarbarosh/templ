app.component('docker-containers', {
    props: [],
    template: `
        <div v-if="items" class="mg10">
            <div class="flex-row mi10">
                <input ref="search" v-model="search" v-on:keypress.enter="keypress_enter" type="text">
                <button v-on:click="refresh">Refresh 🔄</button>            
            </div>
            <s-table v-bind:items="computed_items" v-bind:columns="columns" />
        </div>   
    `,
    data: function () {
        return {
            items: null,
            search: '',
            columns: [
                {label: 'name', read: v => this.render_name(v)},
                {label: 'status', component: 'docker-container-status'},
                {label: 'network', component: 'docker-container-network'},
            ],
        };
    },
    computed: {
        computed_items: function () {
            const filter = filter1_from_spec(this.search);
            return this.items.filter(v => filter(v._search)).sort(fcmp);
            function fcmp(a, b) {
                const a_host = a.HostConfig.NetworkMode === 'host';
                const b_host = b.HostConfig.NetworkMode === 'host';
                return (b_host - a_host) || a._search.localeCompare(b._search);
            }
        },
    },
    methods: {
        refresh: async function () {
            this.items = await api_docker_containers();
            this.items.forEach(v => v._key = v.Id);
            this.items.forEach(v => v._search = this.render_name(v));
        },
        render_name: function (v) {
            return `${v.Labels['com.docker.compose.project']} • ${v.Labels['com.docker.compose.service']}`;
        },
        keypress_enter: async function () {
        },
    },
    mounted: async function () {
        await this.refresh();
        await this.$nextTick();
        this.$refs.search.focus();
    },
});
