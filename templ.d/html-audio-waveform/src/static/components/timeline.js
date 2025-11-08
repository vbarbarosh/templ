vue_component('timeline', {
    props: ['tracks', 'duration', 'pixels_per_second'],
    template: `
        <div class="rel">
<!--
            <div class="rel h20 silver">
                <div v-for="item in markers" v-bind:style="{left: px(item.left)}" class="abs flex-row-center h10 border">
                    {{ item.text }}
                </div>            
            </div>
-->
            <markers v-bind:duration="duration" v-bind:pixels_per_second="pixels_per_second" />
            <div v-bind:style="container_style" class="rainbow oh">
                <div v-for="track in tracks"
                     v-on:mousedown="mousedown_track($event, track)"
                     v-bind:style="render_track_style(track)"
                     class="rel h40 oh">
                        <waveform v-bind:src="track.audio.url" class="abs-f z0 no-pointer-events" />
                        <span class="abs-cl ml10 white">
                            {{ track.audio.name }} | {{ format_seconds2(track.audio.duration_sec) }}
                            <button v-on:click="click_edit(track)">
                                edit
                            </button>
                        </span>
                </div>
            </div>
        </div>
    `,
    computed: {
        pps: function () {
            return (+this.pixels_per_second) || 20;
        },
        markers: function () {
            const out = [];
            for (let i = 0, end = Math.ceil(this.duration); i < end; ++i) {
                const left = i*this.pps;
                if (out.length === 0 || (left - out[out.length-1].left >= 50)) {
                    out.push({left, text: format_seconds2(i)});
                }
            }
            return out;
        },
        container_style: function () {
            return {
                width: this.px(Math.ceil(this.pps*this.duration)),
            };
        },
    },
    methods: {
        format_seconds2,
        render_track_style: function (track) {
            return {
                marginLeft: this.px(Math.ceil(track.begin_sec*this.pps)),
                width: this.px(Math.ceil(track.audio.duration_sec*this.pps)),
            };
        },
        mousedown_track: function (event, track) {
            const _this = this;
            const begin_sec0 = track.begin_sec;
            event.preventDefault();
            dd({
                event,
                begin: function () {
                },
                update: function ({dx}) {
                    track.begin_sec = round(begin_sec0 + dx/_this.pps, 0.5);
                },
            });
        },
        click_edit: async function (track) {
            await modal_hello({audio: track.audio}).promise();
        },
    },
});
