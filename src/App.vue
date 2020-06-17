<template>
  <div
    id="editorApp"
    :class="{ 'menu-always-show': options.menuAlwaysShow, loaded: isLoaded }"
  >
    <div class="loaderBox">
      <div class="loader">Loading...</div>
    </div>
    <catalog v-if="showCatalog" @close="handleCatalogSelection"></catalog>
    <nav v-cloak @dblclick="toggleMenu">
      <div id="logo"><span>Web</span> Explorer</div>
      <div>
        <button
          class="btn-icon open-catalog"
          @click="showCatalog = true"
        ></button>
      </div>
      <div class="flex"></div>
      <button
        :class="{ on: panels.html.visible }"
        @click="panels.html.visible = !panels.html.visible"
      >
        HTML
      </button>
      <button
        :class="{ on: panels.css.visible }"
        @click="panels.css.visible = !panels.css.visible"
      >
        CSS
      </button>
      <button
        :class="{ on: panels.javascript.visible }"
        @click="panels.javascript.visible = !panels.javascript.visible"
      >
        JavaScript
      </button>
      <button
        :class="{ on: panels.output.visible }"
        @click="panels.output.visible = !panels.output.visible"
      >
        Output
      </button>
      <div class="flex"></div>
      <div>
        <button
          class="btn-icon font-minus"
          @click="options.fontSize--"
        ></button>
        <button class="btn-icon font-plus" @click="options.fontSize++"></button>
        <form
          method="POST"
          action="//fritscher.ch/html/"
          target="_blank"
          class="externalPreview"
        >
          <textarea v-model="preview" name="html"></textarea>
          <input type="submit" value class="btn-icon" />
        </form>
      </div>
    </nav>

    <div v-cloak class="edit">
      <transition name="fade">
        <panel
          v-if="
            !(panels.html || panels.css || panels.javascript || panels.output)
          "
        >
          <h1 v-cloak>No panel selected!</h1>
        </panel>
      </transition>
      <transition name="fade">
        <panel v-if="panels.html.visible" id="html" v-model="panels.html">
          <editor
            v-model="values.html"
            language="html"
            :options="options"
          ></editor>
        </panel>
      </transition>
      <transition name="fade">
        <panel v-if="panels.css.visible" id="css" v-model="panels.css">
          <editor
            v-model="values.css"
            language="css"
            :options="options"
          ></editor>
        </panel>
      </transition>
      <transition name="fade">
        <panel
          v-if="panels.javascript.visible"
          id="javascript"
          v-model="panels.javascript"
        >
          <editor
            v-model="values.javascript"
            language="javascript"
            :options="options"
          ></editor>
        </panel>
      </transition>
      <transition name="fade">
        <panel v-if="panels.output.visible" id="output" v-model="panels.output">
          <iframe ref="preview"></iframe>
          <div
            v-if="outputConsole.length > 0"
            v-cloak
            id="console"
            :style="{ 'font-size': options.fontSize + 'px' }"
          >
            <button class="btn-icon clear" @click="outputConsole = []"></button>
            <pre v-for="(l, i) in outputConsole" v-cloak :key="i">{{ l }}</pre>
          </div>
        </panel>
      </transition>
    </div>
  </div>
</template>

<script>
import Split from "split.js";
import { v4 as uuidv4 } from "uuid";
import panel from "./components/Panel";
import editor from "./components/Editor";
import catalog from "./components/Catalog";

import "./assets/main.css";
import * as storage from "./utils/storage";

function deepAssign(target, source) {
  Object.keys(source).forEach(prop => {
    if (typeof source[prop] === "object" && typeof target[prop] === "object") {
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
  if (panels.html.visible) ids.push("#html");
  if (panels.css.visible) ids.push("#css");
  if (panels.javascript.visible) ids.push("#javascript");
  if (panels.output.visible) ids.push("#output");
  return ids;
}

export default {
  components: {
    panel,
    editor,
    catalog
  },
  data() {
    return deepAssign(this.defaultNewPage(), this.load());
  },
  computed: {
    preview() {
      let fullHtml = "";
      const htmlMatch = this.values.html.match(
        /(^(?:.|[\n\r])*?)(?:<head>|<body)/im
      );
      if (htmlMatch) {
        fullHtml = htmlMatch[1];
      } else {
        fullHtml = "<html>\n";
      }

      const headMatch = this.values.html.match(
        /(<head>(?:.|[\n\r])*)<\/head>/im
      );
      if (headMatch) {
        fullHtml += headMatch[1];
      } else {
        fullHtml += "  <head>\n";
      }
      fullHtml += `<style>
      ${this.values.css}
      </style>
      <script>console.log = function () {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        parent.postMessage(args, "*");
      }
      <`;
      fullHtml += "/script>\n</head>";

      const bodyMatch = this.values.html.match(
        /(<body(?:.|[\n\r])*)?<\/body>/im
      );
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
      <`;
      fullHtml += `/script>
  </body>
</html>`;
      return fullHtml;
    }
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
  mounted() {
    this.$nextTick(() => {
      this.createSplit();
    });
    window.addEventListener(
      "message",
      message => {
        let txt = message.data;
        if (typeof txt === "object" && "vueDetected" in txt) {
          return;
        }
        if (typeof txt === "object" && "panels" in txt && "values" in txt) {
          window.post = txt;
          const loadedPage = deepAssign(this.defaultNewPage(), this.load());
          Object.keys(loadedPage).forEach(key =>
            this.$set(this, key, loadedPage[key])
          );
          return;
        }
        if (message.data.join) {
          txt = message.data.join(", ");
        }
        this.outputConsole.push(txt);
      },
      false
    );
  },
  methods: {
    createSplit() {
      const vm = this;
      vm.split = Split(computePanels(this.panels), {
        gutterSize: 5,
        sizes: computeSizes(this.panels),
        onDrag() {
          window.dispatchEvent(new Event("resize"));
        },
        onDragEnd() {
          // TODO: save sizes, without triggering watcher on panels...
          console.log(vm.split.getSizes());
        },
        elementStyle(dimension, size, gutterSize) {
          return {
            "flex-basis": `calc(${size}% - ${gutterSize}px)`
          };
        },
        gutterStyle(dimension, gutterSize) {
          return {
            "flex-basis": `${gutterSize}px`
          };
        }
      });
      this.updatePreview();
      this.$nextTick(() => {
        window.dispatchEvent(new Event("resize"));
        setTimeout(() => window.dispatchEvent(new Event("resize")), 1000);
      });
    },
    updatePreview() {
      if (!this.$refs.preview) {
        return;
      }
      const win =
        this.$refs.preview.contentDocument ||
        this.$refs.preview.contentWindow.document;
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
      let title = this.values.html.replace(/<(?:.|[\n\r])*?>/g, "");
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
          javascript: "/* JavaScript */"
        },
        outputConsole: []
      };
    },
    newPage() {
      const newData = this.defaultNewPage();
      Object.keys(newData).forEach(key => this.$set(this, key, newData[key]));
    },
    handleCatalogSelection(id) {
      if (id === "new") {
        this.newPage();
      } else if (id) {
        const loadedPage = this.load(id);
        if (loadedPage.id === id) {
          Object.keys(loadedPage).forEach(key =>
            this.$set(this, key, loadedPage[key])
          );
        }
      }
      this.showCatalog = false;
    },
    toggleMenu() {
      this.options.menuAlwaysShow = !this.options.menuAlwaysShow;
    }
  }
};
</script>
