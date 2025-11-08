vue_component('audio-picker', {
    emits: ['update:modelValue'],
    props: ['modelValue'],
    template: `
        <spinner v-if="!ready" />
        <table>
        <thead>
            <tr>
                <th>name</th>
                <th>size</th>
                <th>duration</th>
            </tr>
        </thead>
        <tbody>
        <tr v-for="file in files" v-on:click="click_tr(file)" v-bind:class="{yellow: (modelValue === file)}">
            <td>{{ file.name }}</td>
            <td class="r">{{ format_bytes(+file.ffprobe.format.size) }}</td>
            <td class="r">{{ format_seconds(file.duration_sec) }}</td>
        </tr>
        </tbody>
        </table>
    `,
    data: function () {
        return {
            ready: false,
            files: null,
        };
    },
    methods: {
        format_seconds,
        refresh: async function () {
            this.files = await api_files_list();
        },
        click_tr: function (file) {
            this.$emit('update:modelValue', file);
        },
    },
    created: async function () {
        await this.refresh();
        this.ready = true;
    },
});
