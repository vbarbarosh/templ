app.component('app-tab1', {
    template: `
        <div class="mg15">
            <input ref="search" v-model="search" type="text">
            <s-table v-bind:items="items_search" v-bind:columns="columns" />
        </div>
    `,
    data: function () {
        return {
            search: '',
            items: [
                {name: 'anchors.jpg'},
                {name: 'balloons.jpg'},
                {name: 'birdcage.jpg'},
                {name: 'boat.jpg'},
                {name: 'cyclists.jpg'},
                {name: 'fortress.jpg'},
                {name: 'graffiti.jpg'},
                {name: 'hand-water.jpg'},
                {name: 'heavy-box.jpg'},
                {name: 'man-on-bench.jpg'},
                {name: 'pipe-sculpture.jpg'},
                {name: 'plane.jpg'},
                {name: 'rain-coats.jpg'},
                {name: 'restaurant-view.jpg'},
                {name: 'sandy-boots.jpg'},
                {name: 'scarecrow.jpg'},
                {name: 'slimy.jpg'},
                {name: 'trafalgar.jpg'},
                {name: 'tree.jpg'},
                {name: 'waterfall.jpg'},
                {name: 'wood-textures.jpg'},
                {name: 'yellow-balloon.jpg'},
            ],
            columns: [
                {label: 'name', read: v => v.name},
            ],
        };
    },
    computed: {
        items_search: function () {
            const filter = filter1_from_spec(this.search);
            return this.items.filter(v => filter(v.name));
        },
    },
    mounted: function () {
        this.$refs.search.focus();
    },
});
