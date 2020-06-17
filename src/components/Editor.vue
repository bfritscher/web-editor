<template>
  <div :class="{ focused }"></div>
</template>
<script>
import * as monaco from "monaco-editor";
import { emmetHTML, emmetCSS } from "emmet-monaco-es";

emmetHTML(monaco);
emmetCSS(monaco);

export default {
  props: {
    language: { type: String, default: "javascript" },
    options: { type: Object, default: () => {} },
    value: { type: String, default: "" }
  },
  data() {
    return {
      editor: {},
      internalValue: this.value,
      focused: false
    };
  },
  watch: {
    language() {
      monaco.editor.setModelLanguage(this.editor.getModel(), this.language);
    },
    value(newValue) {
      if (newValue !== this.internalValue) {
        this.editor.setValue(newValue);
      }
    },
    options: {
      handler() {
        if (!this.editor) return;
        this.editor.updateOptions(this.options);
      },
      deep: true
    }
  },
  mounted() {
    this.editor = monaco.editor.create(
      this.$el,
      Object.assign(
        {
          value: this.value,
          language: this.language,
          autoIndent: false,
          formatOnPaste: true,
          lineNumbersMinChars: 0,
          minimap: {
            enabled: false
          },
          renderIndentGuides: true,
          lineNumbers: "off",
          renderLineHighlight: "none",
          hideCursorInOverviewRuler: true,
          scrollBeyondLastLine: false,
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8
          }
        },
        this.options
      )
    );
    this.editor.onDidChangeModelContent(() => {
      this.internalValue = this.editor.getValue();
      this.$emit("input", this.internalValue);
    });
    this.editor.onDidFocusEditorWidget(() => {
      this.$emit("focus");
      this.focused = true;
    });
    this.editor.onDidBlurEditorWidget(() => {
      this.$emit("blur");
      this.focused = false;
    });
    window.addEventListener(
      "resize",
      () => {
        this.editor.layout();
      },
      false
    );
  },
  destroyed() {
    if (typeof this.editor !== "undefined") {
      this.editor.dispose();
    }
  }
};
</script>

<style></style>
