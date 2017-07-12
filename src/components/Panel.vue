<template>
  <div :style="{width: width}">
    <slot></slot>
    <div class="handle" ref="handle"></div>
  </div>
</template>

<script>
export default {
  template: '#panel',
  props: ['value'],
  mounted() {
    const vm = this;
    function startResizing(e) {
      const width = e.clientX - vm.$el.offsetLeft;
      vm.value.width = width;
      vm.$emit('input', vm.value);
      vm.$emit('resized', width);
    }
    function stopResizing() {
      window.removeEventListener('mousemove', startResizing, false);
      window.removeEventListener('mouseup', stopResizing, false);
    }
    function initialiseResize() {
      window.addEventListener('mousemove', startResizing, false);
      window.addEventListener('mouseup', stopResizing, false);
    }
    this.$refs.handle.addEventListener('mousedown', initialiseResize, false);
    this.$parent.$on('resized', () => this.$emit('resized'));
  },
  computed: {
    width() {
      if (typeof this.value.width === 'number') {
        return `${this.value.width}px`;
      }
      return this.value.width;
    }
  }
};
</script>

<style>

</style>
