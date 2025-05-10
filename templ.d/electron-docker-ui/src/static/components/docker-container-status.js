app.component('docker-container-status', {
    props: ['value'],
    template: `
        <span v-bind:title="details.help">
            {{ details.emoji }} {{ value.Status }}
        </span>
    `,
    computed: {
        details: function () {
            const states = [
                {name: 'created', emoji: '🍼', help: 'Container created, not started'},
                {name: 'restarting', emoji: '🔁', help: 'Restarting after exit/failure'},
                {name: 'running', emoji: '🟢', help: 'Running normally'},
                {name: 'removing', emoji: '🗑️', help: 'Being removed'},
                {name: 'paused', emoji: '⏸️', help: 'Running but paused'},
                {name: 'exited', emoji: '🔚', help: 'Stopped after completion or error'},
                {name: 'dead', emoji: '☠️', help: 'Unresponsive, failed shutdown'},
            ];
            return states.find(v => v.name === this.value.State);
        },
    },
});
