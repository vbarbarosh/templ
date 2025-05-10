app.component('app-tab2', {
    inject: ['app'],
    template: `
        <div>
            <h2>tab2</h2>
            <s-table v-bind:items="app.items_search" v-bind:columns="app.columns" />
        </div>
    `,
});
