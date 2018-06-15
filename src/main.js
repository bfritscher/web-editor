// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import vueMoment from 'vue-moment';
import Split from 'split.js';
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

function computeSizes(panels) {
  const sizes = [];
  if (panels.html.visible) sizes.push(panels.html.width);
  if (panels.css.visible) sizes.push(panels.css.width);
  if (panels.javascript.visible) sizes.push(panels.javascript.width);
  if (panels.output.visible) sizes.push(panels.output.width);
  return sizes;
}
function computePanels(panels) {
  const ids = [];
  if (panels.html.visible) ids.push('#html');
  if (panels.css.visible) ids.push('#css');
  if (panels.javascript.visible) ids.push('#javascript');
  if (panels.output.visible) ids.push('#output');
  return ids;
}

window.require(['vs/editor/editor.main'], () => {
  /* eslint-disable no-new */
  new Vue({
    el: '#editorApp',
    data() {
      return deepAssign(this.defaultNewPage(), this.load());
    },
    mounted() {
      this.createSplit();
      window.addEventListener('message', (message) => {
        let txt = message.data;
        if (typeof txt === 'object' && 'vueDetected' in txt) {
          return;
        }
        if (typeof txt === 'object' && 'panels' in txt && 'values' in txt) {
          window.post = txt;
          const loadedPage = deepAssign(this.defaultNewPage(), this.load());
          Object.keys(loadedPage).forEach(key => this.$set(this, key, loadedPage[key]));
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
          if (this.split) {
            this.split.destroy();
          }
          this.$nextTick(() => this.createSplit());
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
      createSplit() {
        const vm = this;
        vm.split = Split(computePanels(this.panels), {
          gutterSize: 5,
          sizes: computeSizes(this.panels),
          onDrag() {
            window.dispatchEvent(new Event('resize'));
          },
          onDragEnd() {
            // TODO: save sizes, without triggering watcher on panels...
            console.log(vm.split.getSizes());
          },
          elementStyle(dimension, size, gutterSize) {
            return {
              'flex-basis': `calc(${size}% - ${gutterSize}px)`
            };
          },
          gutterStyle(dimension, gutterSize) {
            return {
              'flex-basis': `${gutterSize}px`
            };
          }
        });
        this.updatePreview();
        this.$nextTick(() => {
          window.dispatchEvent(new Event('resize'));
          setTimeout(() => window.dispatchEvent(new Event('resize')), 1000);
        });
      },
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
        let title = this.values.html.replace(/<(?:.|[\n\r])*?>/g, '');
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
              width: 25
            },
            css: {
              visible: true,
              width: 25
            },
            javascript: {
              visible: true,
              width: 25
            },
            output: {
              visible: true,
              width: 25
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
      }
    },
    components: {
      panel,
      editor,
      catalog
    }
  });
});
