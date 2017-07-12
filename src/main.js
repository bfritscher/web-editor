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
        let fullHtml = '';
        const htmlMatch = this.values.html.match(/(^(?:.|[\n\r])*?)(?:<head>|<body)/mi);
        if (htmlMatch) {
          fullHtml = htmlMatch[1];
        } else {
          fullHtml = '<html>\n';
        }

        const headMatch = this.values.html.match(/(<head>(?:.|[\n\r])*)<\/head>/mi);
        if (headMatch) {
          fullHtml += headMatch[1];
        } else {
          fullHtml += '  <head>\n';
        }
        fullHtml += `    <style>\n${this.values.css}\n    </style>\n</head>\n`;

        const bodyMatch = this.values.html.match(/(<body(?:.|[\n\r])*)?<\/body>/mi);
        if (bodyMatch) {
          if (bodyMatch[1]) {
            fullHtml += bodyMatch[1];
          } else {
            fullHtml += '<body>\n<h1 style="color:red">HTML ERROR</h1>';
          }
        } else {
          fullHtml += this.values.html;
        }
        fullHtml += `   <script>
      console.log = function () {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        parent.postMessage(args, '*');
      };
      ${this.values.javascript}
      </script>
  </body>
</html>`;

        return fullHtml;
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
