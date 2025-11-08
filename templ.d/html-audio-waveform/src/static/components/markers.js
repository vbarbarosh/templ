vue_component('markers', {
    props: ['duration', 'pixels_per_second'],
    template: `
        <div class="flex-row h20">
            <span v-for="marker in markers" v-bind:style="{width: px(marker.width)}" class="flex-noshrink bbox flex-row-center-left border xborder-vr">
                {{ marker.text }}
            </span>            
        </div>
    `,
    computed: {
        pps: function () {
            return (+this.pixels_per_second) || 20;
        },
        markers: function () {
            const out = [];
            const width = 50;
            for (let i = 0; i < 1000; ++i) {
                if ((i+1)*width/this.pps > this.duration) {
                    break;
                }
                const seconds = i*width/this.pps;
                out.push({width, text: format_seconds2(seconds)});
            }
            return out;
        },
    },
});
