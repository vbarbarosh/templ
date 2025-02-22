<template>
    <input v-on:input="input" v-bind:value="value" type="number" />
</template>

<script>
    const input_number = {
        props: ['value'],
        methods: {
            input: function (event) {
                this.emit_input(parseFloat(event.target.value));
            },
        },
    };

    export default input_number;
</script>
