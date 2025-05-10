app.component('s-table', {
    props: ['items', 'columns', 'headless'],
    template: `
        <table>
            <thead v-if="(headless === undefined || (headless !== '' && !headless))">
                <tr>
                    <th v-for="col in computed_columns" v-bind:key="col.key" v-bind:class="col.class_th">
                        {{ col.label }}
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="!items.length" class="c">
                    <td v-bind:colspan="computed_columns.length">
                        <slot name="empty">
                            No items
                        </slot>
                    </td>
                </tr>
                <tr v-for="item in items" v-bind:key="(item.uid || item.pub_id || item.id)">
                    <template v-for="col in computed_columns">
                        <component v-if="col.component_td"
                                   v-bind:is="col.component_td"
                                   v-bind:key="col.key"
                                   v-bind:value="item"
                                   v-bind:class="col.class_td" />
                        <td v-else v-bind:key="col.key_else" v-bind:class="col.class_td">
                            <slot v-if="col.slot" v-bind:name="col.slot" v-bind:item="item" />
                            <component v-else-if="col.component" v-bind:is="col.component" v-bind:value="item" />
                            <template v-else>{{ col.read(item) }}</template>
                        </td>
                    </template>
                </tr>
            </tbody>
        </table>
    `,
    computed: {
        computed_columns: function () {
            if (this.columns) {
                return this.columns.map(function (column, i) {
                    // warnHandler Template compilation error: v-if/else branches must use unique keys.
                    const key =  column.key || column.uid || column.label || `col:${i}`;
                    return {
                        key,
                        key_else: `${key}-else`,
                        label: column.label,
                        class_th: `${column.class||''} ${column.class_th||''}`.trim() || null,
                        class_td: `${column.class||''} ${column.class_td||''}`.trim() || null,
                        read: column.read || ignore,
                        slot: column.slot || null,
                        component: column.component || null,
                        component_td: column.component_td || (column.component && column.component.endsWith('-td') ? column.component : null),
                    };
                });
            }
            return [];
        },
    },
});
