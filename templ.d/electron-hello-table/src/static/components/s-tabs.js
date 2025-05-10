app.component('s-tabs', {
    props: ['items', 'theme'],
    template: `
        <div v-bind:class="(theme ?? 'tabs-basic')">
            <ul>
                <li v-for="item in items"
                    v-on:click="click(item)"
                    v-bind:key="item.key"
                    v-bind:class="{active: item.active, 'cur-pointer': !item.active}">
                    {{ item.label }}
                </li>
            </ul>
            <div>
                <component v-bind:is="active.component" class="active" />
            </div>
        </div>
    `,
    computed: {
        active: function () {
            return this.items.find(v => v.active) || this.items[0];
        },
    },
    watch: {
        items: {
            immediate: true,
            handler: function () {
                const active = this.items.find(v => v.active) || this.items[0];
                this.items.forEach(function (item, i) {
                    if (typeof item.key === 'undefined') {
                        item.key = `tab${i}`;
                    }
                    if (typeof item.active !== 'boolean') {
                        item.active = false;
                    }
                    if (item === active && !item.active) {
                        item.active = true;
                    }
                });
            },
        }
    },
    methods: {
        click: function (item) {
            this.items.forEach(v => v.active = (v === item));
        },
    },
});

css`
    .tabs-basic {
        font-family: Arial, sans-serif;
    }

    .tabs-basic > ul {
        display: flex;
        list-style: none;
        padding: 0;
        margin: 0;
        border-bottom: 2px solid #ddd;
        gap: 4px;
    }

    .tabs-basic > ul > li {
        padding: 8px 16px;
        cursor: pointer;
        background: #f5f5f5;
        border: 1px solid #ddd;
        border-bottom: none;
        border-radius: 4px 4px 0 0;
        margin-bottom: -2px;
        color: #666;
        list-style: none;
    }

    .tabs-basic > ul > li:hover {
        background: #eee;
    }

    .tabs-basic > ul > li.active {
        background: white;
        border-bottom: 2px solid white;
        color: #333;
        font-weight: bold;
    }

    .tabs-basic > div > div {
        display: none;
        padding: 20px;
        border: 1px solid #ddd;
        border-top: none;
        background: white;
    }

    .tabs-basic > div > div.active {
        display: block;
        animation: fadeIn 0.2s ease;
    }





    .tabs-modern {
        font-family: system-ui, sans-serif;
    }

    .tabs-modern > ul {
        display: flex;
        list-style: none;
        padding: 0;
        margin: 0;
        border-bottom: 1px solid #e2e8f0;
        gap: 16px;
    }

    .tabs-modern > ul > li {
        padding: 12px 0;
        cursor: pointer;
        color: #64748b;
        position: relative;
        transition: all 0.2s ease;
        list-style: none;
    }

    .tabs-modern > ul > li:hover {
        color: #334155;
    }

    .tabs-modern > ul > li.active {
        color: #3b82f6;
    }

    .tabs-modern > ul > li.active::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        width: 100%;
        height: 2px;
        background-color: #3b82f6;
    }

    .tabs-modern > div > div {
        display: none;
        background: white;
    }

    .tabs-modern > div > div.active {
        display: block;
        animation: fadeIn 0.2s ease;
    }





    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;
