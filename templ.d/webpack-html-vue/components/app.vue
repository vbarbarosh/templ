<template>
    <div class="app">
        <app-header />
        <div>
            __dev__: {{ __dev__ }}
            <br>
            __prod__: {{ __prod__ }}
            <br>
            <input-number v-model="height" />
            <br>
            height={{ height }}
            <br>
            <using-style-css />
            <br>
            <using-style-sass />
        </div>
        <app-footer />
    </div>
</template>

<script>
    const app = {
        data: function () {
            return {
                height: 100,
            };
        },
    };

    export default app;
</script>

<style lang="sass">
    .app
        border: 1px solid
</style>
