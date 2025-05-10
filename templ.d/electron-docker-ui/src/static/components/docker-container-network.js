app.component('docker-container-network', {
    props: ['value'],
    template: `
        <span v-bind:title="details.help">
            {{ details.emoji }} {{ value.HostConfig.NetworkMode }}
        </span>
    `,
    computed: {
        details: function () {
            const modes = [
                {name: 'bridge', emoji: '🌉', help: 'Default Docker bridge network'},
                {name: 'host', emoji: '🏠', help: 'Shares the host\'s network stack directly'},
                {name: 'none', emoji: '🚫', help: 'No networking; container is isolated'},
                // {name: 'container:<id|name>', emoji: '🔗', help: 'Shares network with another container'},
                {name: '<custom_network>', emoji: '🛠️', help: 'User-defined bridge or overlay network'},
            ];
            return modes.find(v => v.name === this.value.HostConfig.NetworkMode)
                || modes[modes.length - 1];
        },
    },
});
