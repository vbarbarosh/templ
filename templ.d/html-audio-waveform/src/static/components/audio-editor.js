vue_component('audio-editor', {
    props: ['audio'],
    template: `
        <div>
            <div class="audio-editor__viewport">
                ggg
            </div>      
            <div v-if="audio" class="silver oa">
                <markers v-bind:duration="audio.duration_sec" v-bind:pixels_per_second="pixels_per_second" />
                <div v-on:wheel="wheel" class="rel max-content">
                    <waveform ref="waveform" v-bind:src="audio.url" v-bind:style="{width: px(container_width)}" class="h50 no-pointer-events" />
                    <vrbox v-on:started="started_vrbox" v-bind:value="selection" class="abs-f" />
                </div>
            </div>
            <div class="flex-row-center-left gap10">
                <button v-on:click="click_preview">preview</button>
                <button v-on:click="click_crop_selection">crop</button>
                <button v-on:click="click_drop_selection">drop</button>
                <select v-model="pixels_per_second">
                    <option>1</option>
                    <option>2</option>
                    <option>3</option>
                    <option>4</option>
                    <option>5</option>
                    <option>10</option>
                    <option>20</option>
                    <option>30</option>
                    <option>40</option>
                    <option>50</option>
                </select>
            </div>
            <template v-if="audio">
                <div>begin: <input v-on:input="input_computed_begin" v-bind:value="computed_begin" type="text" /></div>
                <div>end: <input v-on:input="input_computed_end" v-bind:value="computed_end" type="text" /></div>
                <div>duration: {{ computed_duration }}</div>
            </template>
        </div>
    `,
    data: function () {
        return {
            pixels_per_second: 10,
            selection: {
                begin: 0,
                end: 0.1,
            },
        };
    },
    computed: {
        container_width: function () {
            return Math.ceil(this.audio.duration_sec*this.pixels_per_second);
        },
        computed_begin: function () {
            return format_seconds2(this.selection.begin*this.audio.duration_sec);
        },
        computed_end: function () {
            return format_seconds2(this.selection.end*this.audio.duration_sec);
        },
        computed_duration: function () {
            return format_seconds2((this.selection.end - this.selection.begin)*this.audio.duration_sec);
        },
    },
    watch: {
    },
    methods: {
        started_vrbox: function () {
            this.$refs.waveform.waveform_pause();
        },
        click_preview: function () {
            this.$refs.waveform.waveform_preview(this.selection.begin, this.selection.end);
        },
        click_crop_selection: async function () {
            const {begin, end} = this.selection;
            window.open(urlmod('/ffmpeg/crop', {file: this.audio.name, begin, end}), '_blank');
        },
        click_drop_selection: async function () {
            const {begin, end} = this.selection;
            window.open(urlmod('/ffmpeg/drop', {file: this.audio.name, begin, end}), '_blank');
        },
        input_computed_begin: function (event) {
            const begin = parse_hms(event.target.value)/this.audio.duration_sec;
            if (!Number.isNaN(begin)) {
                this.selection.begin = begin;
            }
        },
        input_computed_end: function (event) {
            const end = parse_hms(event.target.value)/this.audio.duration_sec;
            if (!Number.isNaN(end)) {
                this.selection.end = end;
            }
        },
        wheel: async function (event) {
            const {clientX, clientY} = event;
            const elem = event.currentTarget;
            const time = getRelativeCoords(event, elem).x/this.pixels_per_second;
            const items = [1,2,3,4,5,10,20,30,40,50];
            // const i = items.indexOf(this.pixels_per_second) + (event.deltaY < 0 ? 1 : -1);
            // if (i >= 0 && i < items.length) {
            //     this.pixels_per_second = items[i];
            // }
            this.pixels_per_second = clamp(1, 50, this.pixels_per_second*(event.deltaY < 0 ? 2 : 0.5));
            await this.$nextTick();
            const time2 = getRelativeCoords({clientX, clientY}, elem).x/this.pixels_per_second;
            const diff = time2 - time;
            elem.parentElement.scrollLeft -= diff*this.pixels_per_second;
        },
    },
    unmounted: function () {
    },
});

function getRelativeCoords(event, elem)
{
    const r = elem.getBoundingClientRect();
    return {
        x: event.clientX - r.left,
        y: event.clientY - r.top,
    };
}
