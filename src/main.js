// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import panel from './components/Panel';
import editor from './components/Editor';

import './assets/main.css';

Vue.config.productionTip = false;

window.require(['vs/editor/editor.main'], () => {
  /* eslint-disable no-new */
  new Vue({
    el: '#editorApp',
    data: {
      panels: {
        html: true,
        css: true,
        javascript: true,
        output: true,
        console: true
      },
      values: {
        html: '<h1>test</h1>',
        css: 'h1 { color: red; }',
        javascript: `function x() {
\tconsole.log("Hello world!");
}`
      },
      outputConsole: []
    },
    mounted() {
      this.updatePreview();
      window.addEventListener('message', (message) => {
        let txt = message.data;
        if (message.data.join) {
          txt = message.data.join(', ');
        }
        this.outputConsole.push(txt);
      }, false);
    },
    watch: {
      values: {
        handler() {
          this.updatePreview();
        },
        deep: true
      },
      panels: {
        handler() {
          setTimeout(() => this.$emit('resized'), 510);
        },
        deep: true
      }
    },
    computed: {
      preview() {
        return `<html>
  <head>
    <style>
      ${this.values.css}
    </style>
  </head>
  <body>
    ${this.values.html}
    <script>
      console.log = (...args) => {
        parent.postMessage(args, '*');
      };
      ${this.values.javascript}
</script>
  </body>
</html>`;
      }
    },
    methods: {
      updatePreview() {
        if (!this.$refs.preview) {
          return;
        }
        const win = this.$refs.preview.contentDocument || this.$refs.preview.contentWindow.document;
        win.open();
        win.write(this.preview);
        win.close();
      }
    },
    components: {
      panel,
      editor
    }
  });
});
