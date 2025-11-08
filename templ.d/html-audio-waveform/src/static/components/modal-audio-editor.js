vue_component('modal-audio-editor', {
    props: ['value'],
    inject: ['modal'],
    template: `
        <div v-on:click="click_backdrop" class="fix-f flex-row oa" style="background:rgba(0,0,0,0.25)">
            <div class="ma">
                <div class="w500 m15 p15 white bs50 br5">
                    <!-- content -->
                    <p>Praesent non suscipit lectus. Integer in lectus quam. Sed sed cursus mi. Maecenas mattis, metus ac volutpat vehicula, lacus felis vulputate est, at euismod tortor augue sed neque. Duis porttitor nisl et sapien efficitur, eget feugiat purus dapibus. Nam mattis aliquam felis, in tempor metus tempus at. In molestie vestibulum dolor ut consectetur.</p>
                    <p>Vestibulum aliquet enim quis sodales tincidunt. Donec vulputate magna diam, id feugiat nisi aliquam in. Cras gravida odio ac metus tincidunt pharetra. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum porttitor laoreet neque vel tincidunt. Integer eu scelerisque purus, quis porta ligula. Donec molestie risus ac malesuada laoreet. Duis eleifend enim tincidunt sagittis efficitur. Nunc maximus libero eget rutrum sollicitudin. Praesent cursus non justo sed auctor. Phasellus nibh nibh, egestas eget leo quis, molestie varius felis. In lobortis porta ultrices. Nunc gravida semper diam, a tincidunt urna porta ut. Proin cursus mi quam, vitae lobortis nunc feugiat eu. Maecenas ut gravida lectus, eget tincidunt ante.</p>
                    <pre>{{ value }}</pre>
                    <div class="flex-row-center mi10">
                        <button-green v-on:click="modal.return(true)">Confirm</button-green>
                        <button-transparent v-on:click="modal.return(false)">Cancel</button-transparent>
                    </div>
                </div>
            </div>
        </div>
    `,
    data: function () {
        return {};
    },
    computed: {
    },
    watch: {
    },
    methods: {
        click_backdrop: function (event) {
            if (event.target === event.currentTarget) {
                this.modal.return(false);
            }
        },
    },
    unmounted: function () {
    },
});

function modal_audio_editor(value)
{
    return vue_modal({template: '<modal-audio-editor v-bind:value="value" />', value});
}
