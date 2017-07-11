<template>
  <div>
      <slot></slot>
      <div class="handle" ref="handle"></div>
  </div>
</template>

<script>
export default {
  template: '#panel',
  mounted() {
    const vm = this;
    function startResizing(e) {
      const width = e.clientX - vm.$el.offsetLeft;
      vm.$el.style.width = `${width}px`;
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
  }
};
</script>

<style>

</style>
