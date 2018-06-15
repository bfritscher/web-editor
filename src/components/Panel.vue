<template>
  <div class="panel" :class="{hidden: !value.visible}">
    <slot></slot>
  </div>
</template>

<script>
export default {
  template: '#panel',
  props: ['value']
};
</script>

<style>

</style>
