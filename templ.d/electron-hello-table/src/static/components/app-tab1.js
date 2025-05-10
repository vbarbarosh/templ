app.component('app-tab1', {
    inject: ['app'],
    template: `
        <div>
            <h2>tab1</h2>
            <s-table v-bind:items="app.items_search" v-bind:columns="app.columns" />
        </div>
    `,
});
