<template>
  <div class="panel" :class="{ hidden: !value.visible }">
    <slot></slot>
  </div>
</template>

<script>
export default {
  props: ["value"],
  template: "#panel"
};
</script>

<style></style>
