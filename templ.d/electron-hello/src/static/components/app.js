const app = Vue.createApp({
    template: `
        <div>
            <button v-on:click="click_ping">ping</button>
            <pre>{{ ping }}</pre>
            <input ref="search" v-model="search" v-on:keypress.enter="keypress_enter" type="text">
            <ul class="xp">
                <li v-for="item in items_search">
                    {{ item }}
                </li>
            </ul>
        </div>
    `,
    data: function () {
        return {
            ping: null,
            search: '',
            items: [
                'anchors.jpg',
                'balloons.jpg',
                'birdcage.jpg',
                'boat.jpg',
                'cyclists.jpg',
                'fortress.jpg',
                'graffiti.jpg',
                'hand-water.jpg',
                'heavy-box.jpg',
                'man-on-bench.jpg',
                'pipe-sculpture.jpg',
                'plane.jpg',
                'rain-coats.jpg',
                'restaurant-view.jpg',
                'sandy-boots.jpg',
                'scarecrow.jpg',
                'slimy.jpg',
                'trafalgar.jpg',
                'tree.jpg',
                'waterfall.jpg',
                'wood-textures.jpg',
                'yellow-balloon.jpg',
            ],
        };
    },
    computed: {
        items_search: function () {
            const filter = filter1_from_spec(this.search);
            return this.items.filter(filter);
        },
    },
    methods: {
        click_ping: async function () {
            this.ping = await api_ping();
        },
        keypress_enter: async function () {
            const templ = this.templates_search[0];
            if (templ) {
                await api_return(templ);
            }
        },
        document_visibilitychange: function () {
            if (document.hidden) {
                return;
            }
            this.$refs.search.focus();
            this.$refs.search.select();
        },
    },
    created: async function () {
        document.addEventListener('visibilitychange', this.document_visibilitychange);
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
