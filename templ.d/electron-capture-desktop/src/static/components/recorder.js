app.component('recorder', {
    template: `
        <div class="mi10">
            <button v-on:click="click_start">Start</button>
            <button v-on:click="click_stop">Stop</button>
            <button v-on:click="click_pause">Pause</button>
        </div>
        <div class="flex-row-center">
            <video ref="video" class="max-w800 max-h600" />
        </div>
    `,
    data: function () {
        return {
        };
    },
    computed: {
    },
    watch: {
    },
    methods: {
        click_start: async function () {
            const stream = await navigator.mediaDevices.getDisplayMedia({audio: false, video: true});
            this.$refs.video.srcObject = stream;
            this.$refs.video.play();
        },
        click_stop: function() {
            this.$refs.video.srcObject = null;
        },
        click_pause: function() {
            this.$refs.video.pause();
        },
    },
});

css`
.max-w800 { max-width: 800px; }
.max-h600 { max-height: 600px; }
`;
