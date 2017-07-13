// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import vueMoment from 'vue-moment';
import uuidv4 from 'uuid/v4';
import panel from './components/Panel';
import editor from './components/Editor';
import catalog from './components/Catalog';

import './assets/main.css';
import * as storage from './utils/storage';

Vue.use(vueMoment);
Vue.config.productionTip = false;

function deepAssign(target, source) {
  Object.keys(source).forEach((prop) => {
    if (typeof source[prop] === 'object' && typeof target[prop] === 'object') {
      deepAssign(target[prop], source[prop]);
    } else {
      // eslint-disable-next-line
      target[prop] = source[prop];
    }
  });

  return target;
}


window.require(['vs/editor/editor.main'], () => {
  /* eslint-disable no-new */
  new Vue({
    el: '#editorApp',
    data() {
      return deepAssign(this.defaultNewPage(), this.load());
    },
    mounted() {
      this.updatePreview();
      window.addEventListener('message', (message) => {
        let txt = message.data;
        if (typeof txt === 'object' && 'vueDetected' in txt) {
          return;
        }
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
          this.save();
        },
        deep: true
      },
      panels: {
        handler() {
          setTimeout(() => this.$emit('resized'), 510);
          this.save();
        },
        deep: true
      },
      options: {
        handler() {
          storage.save(storage.OPTIONS, this.options);
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
        fullHtml += `    <style>\n${this.values.css}\n    </style>\n<script>console.log = function () {for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {args[_key] = arguments[_key];}parent.postMessage(args, "*");};</script>\n  </head>\n`;

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
      },
      load(id) {
        let idToLoad = id;
        if (!idToLoad) {
          if (window.post) {
            return window.post;
          }
          idToLoad = storage.load(storage.LAST);
        }
        if (idToLoad) {
          const data = storage.load(idToLoad);
          if (data.id === idToLoad) {
            return data;
          }
        }
        return {};
      },
      save() {
        storage.save(this.id, {
          id: this.id,
          panels: this.panels,
          values: this.values
        });
        storage.save(storage.LAST, this.id);
        let title = this.values.html.replace(/<.*?>/g, '');
        if (title.length > 70) {
          title = `${title.slice(0, 70)}...`;
        }
        storage.updateCatalog(this.id, title);
      },
      defaultNewPage() {
        const options = storage.load(storage.OPTIONS, {
          fontSize: 18,
          menuAlwaysShow: true
        });
        return {
          id: uuidv4(),
          showCatalog: false,
          isLoaded: true,
          options,
          panels: {
            html: {
              visible: true,
              width: '25%'
            },
            css: {
              visible: true,
              width: '25%'
            },
            javascript: {
              visible: true,
              width: '25%'
            },
            output: {
              visible: true,
              width: '25%'
            }
          },
          values: {
            html: `<!DOCTYPE html>
<html>
  <head>
    <title>Document Title</title>
    <meta charset="utf-8" />
  </head>
  <body>

  </body>
</html>
`,
            css: `*, *:before, *:after
{
  -moz-box-sizing: border-box;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
}
`,
            javascript: '/* JavaScript */'
          },
          outputConsole: []
        };
      },
      newPage() {
        const newData = this.defaultNewPage();
        Object.keys(newData).forEach(key => this.$set(this, key, newData[key]));
      },
      handleCatalogSelection(id) {
        if (id === 'new') {
          this.newPage();
        } else if (id) {
          const loadedPage = this.load(id);
          if (loadedPage.id === id) {
            Object.keys(loadedPage).forEach(key => this.$set(this, key, loadedPage[key]));
          }
        }
        this.showCatalog = false;
      },
      toggleMenu() {
        this.options.menuAlwaysShow = !this.options.menuAlwaysShow;
        this.$emit('resized');
      }
    },
    components: {
      panel,
      editor,
      catalog
    }
  });
});
