vue_component('waveform', {
    props: ['src'],
    template: `
        <div class="rel">
            <div v-once ref="container" class="abs-f" />
            <div v-if="loading" class="abs-c z1 white p5 bs5 flex-row-center" style="z-index:10;">
                <spinner class="w20 h20" /> {{ loading }}%
            </div>
        </div>
    `,
    data: function () {
        return {
            loading: null,
            wavesurfer: null,
            stop_at: null,
        };
    },
    watch: {
        src: function () {
            this.wavesurfer.load(this.src);
        },
    },
    methods: {
        // public methods
        waveform_pause: function () {
            this.wavesurfer.pause();
            this.stop_at = null;
        },
        waveform_preview: function (begin, end) {
            const duration = this.wavesurfer.getDuration();
            const begin_sec = begin*duration;
            const end_sec = end*duration;
            this.wavesurfer.setTime(begin_sec);
            this.wavesurfer.play();
            this.stop_at = end_sec;
        },
        // private methods
        audioprocess: function () {
            if (this.stop_at === null) {
                return;
            }
            if (this.wavesurfer.getCurrentTime() >= this.stop_at) {
                this.wavesurfer.pause();
                this.stop_at = null;
            }
        },
    },
    created: function () {
        console.log('[waveform_created]');
    },
    mounted: function () {
        const _this = this;
        console.log('[waveform_mounted]');

        this.resize_observer = new ResizeObserver(function () {
            _this.wavesurfer.setOptions({height: _this.$el.offsetHeight});
        });
        this.resize_observer.observe(this.$el);

        // const regions =WaveSurfer.Regions.create({
        //     dragSelection: true,
        // });
        this.wavesurfer = WaveSurfer.create({
            container: this.$refs.container,
            waveColor: '#4F4A85',
            progressColor: '#383351',
            height: 50,
            url: this.src,
            // plugins: [
            //     regions,
            //     WaveSurfer.Zoom.create({
            //         // the amount of zoom per wheel step, e.g. 0.5 means a 50% magnification per scroll
            //         scale: 0.5,
            //         minZoom: 10,
            //         maxZoom: 200,
            //     }),
            //     WaveSurfer.Minimap.create({
            //         // container: this.$el.minimap,
            //         height: 30,
            //         waveColor: '#ddd',
            //         progressColor: '#666',
            //         // optional:
            //         // showOverview: true,
            //     }),
            // ],
        });

        // regions.enableDragSelection({
        //     color: 'rgba(255, 0, 0, 0.1)',
        // });

        //setInterval(() => console.log(this.wavesurfer.setOptions({minPxPerSec: 100})), 1000);

        this.wavesurfer.on('audioprocess', this.audioprocess);
        this.wavesurfer.on('init', function (...args) {
            console.log('init', args);
        });
        this.wavesurfer.on('load', function (...args) {
            console.log('load', args);
        });
        this.wavesurfer.on('loading', function (...args) {
            _this.loading = args[0];
            console.log('loading', args);
        });
        this.wavesurfer.on('ready', function (...args) {
            _this.loading = false;
            console.log('ready', args);
        });
        this.wavesurfer.on('redraw', function (...args) {
            console.log('redraw', args);
        });
        this.wavesurfer.on('redrawcomplete', function (...args) {
            console.log('redrawcomplete', args);
        });
        this.wavesurfer.on('finish', function (...args) {
            console.log('finish', args);
        });
    },
    unmounted: function () {
        console.log('[waveform_unmounted]');
        this.wavesurfer?.destroy();
        this.resize_observer.disconnect();
    },
});
