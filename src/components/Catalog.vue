<template>
  <transition name="modal">
    <div class="modal-mask" @click="$emit('close')">
      <div class="modal-wrapper">
        <div class="modal-container">

          <div class="modal-header">
            <h3>History of documents</h3>
          </div>

          <div class="modal-body">
            <a v-for="page in sortedCatalog" :key="page.id"  href="#" @click.prevent="$emit('close', page.id)"><span>{{page.title}}</span>{{page.lastSaved | moment('from') }}</a>
          </div>

          <div class="modal-footer">
            <button @click.prevent="$emit('close', 'new')">NEW PAGE</button>
            <span></span>
            <button class="modal-default-button">CLOSE</button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { catalog } from '../utils/storage';

export default {
  data() {
    return {
      catalog
    };
  },
  computed: {
    sortedCatalog() {
      return Object.values(this.catalog).sort((a, b) => a.lastSaved < b.lastSaved);
    }
  }
};
</script>

<style>
.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, .5);
  display: table;
  transition: opacity .3s ease;
}

.modal-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.modal-container {
  min-width: 300px;
  max-width: 600px;
  padding: 20px 30px;
  background-color: #fff;
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, .33);
  transition: all .3s ease;
  font-family: Helvetica, Arial, sans-serif;
  flex: 1;
  overflow: hidden;
  max-height: 80%;
  display: flex;
  flex-direction: column;
}

.modal-header h3 {
  margin-top: 0;
  color: #006AC3;
}

.modal-body {
  margin: 20px 0;
  overflow-y: auto;
}

.modal-body a {
  display: flex;
  padding: 4px;
}

.modal-body a:hover {
  background-color: #006AC3;
  color: white;
}

.modal-body a span{
  flex: 1;
  padding-right: 20px;
}

.modal-default-button {
  float: right;
}

.modal-footer button {
  border: 1px solid #006AC3;
  background-color: #006AC3;
  color: white;
  padding: 10px;
}

.modal-footer button:hover {
    background-color: #002AC3;
}


/*
 * The following styles are auto-applied to elements with
 * transition="modal" when their visibility is toggled
 * by Vue.js.
 *
 * You can easily play with the modal transition by editing
 * these styles.
 */

.modal-enter {
  opacity: 0;
}

.modal-leave-active {
  opacity: 0;
}

.modal-enter .modal-container,
.modal-leave-active .modal-container {
  -webkit-transform: scale(1.1);
  transform: scale(1.1);
}
</style>
