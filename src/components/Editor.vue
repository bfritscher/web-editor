<template>

</template>

<script>
import * as emmet from '../../vendors/emmet/emmet';

// https://github.com/hstarorg/emmet-monaco
const expandAbbreviation = (emmetInstance, source, language) => {
  try {
    const target = emmetInstance.expandAbbreviation(source, language, language);
    const result = emmetInstance.tabStops.extract(target, { escape(ch) { return ch; } });
    return result.text;
  } catch (e) {
    return '';
  }
};

const enableEmmet = (editor, emmetInstance) => {
  if (!emmetInstance) {
    throw new Error('Must include emmet.');
  }
  if (!editor) {
    throw new Error('Must provide window.monaco-editor instance.');
  }
  if (editor.model.getLanguageIdentifier().language === 'html') {
    editor.addCommand(window.monaco.KeyCode.Tab, () => {
      let word = editor.model.getValueInRange(editor.getSelection());
      const pos = editor.getPosition();
      if (!word) {
        const lineContent = editor.model.getLineContent(pos.lineNumber);
        word = emmetInstance.utils.action.extractAbbreviation(lineContent.substring(0, pos.column));
      }
      // Get expand text
      const expandText = expandAbbreviation(emmetInstance, word, 'html');
      if (expandText) {
        // replace range content: pos.column , pos.column -word.length;
        const range = new window.monaco.Range(pos.lineNumber, pos.column - word.length,
          pos.lineNumber, pos.column);
        const id = { major: 1, minor: 1 };
        const op = { identifier: id, range, text: expandText, forceMoveMarkers: true };
        editor.executeEdits('', [op]);
      }
    });
  }
};

export default {
  props: {
    language: { type: String, default: 'javascript' },
    options: { type: Object, default: {} },
    value: { type: String, default: '' }
  },
  template: '<div :class="{focused}"></div>',
  data() {
    return {
      editor: {},
      internalValue: this.value,
      focused: false
    };
  },
  mounted() {
    this.editor = window.monaco.editor.create(this.$el, Object.assign({
      value: this.value,
      language: this.language,
      autoIndent: false,
      formatOnPaste: true,
      lineNumbersMinChars: 0,
      minimap: {
        enabled: false
      },
      renderIndentGuides: true,
      lineNumbers: 'off',
      renderLineHighlight: 'none',
      hideCursorInOverviewRuler: true,
      scrollBeyondLastLine: false,
      scrollbar: {
        verticalScrollbarSize: 8,
        horizontalScrollbarSize: 8
      }
    }, this.options));
    enableEmmet(this.editor, emmet);
    this.editor.onDidChangeModelContent(() => {
      this.internalValue = this.editor.getValue();
      this.$emit('input', this.internalValue);
    });
    this.editor.onDidFocusEditor(() => {
      this.$emit('focus');
      this.focused = true;
    });
    this.editor.onDidBlurEditor(() => {
      this.$emit('blur');
      this.focused = false;
    });
    window.addEventListener('resize', () => {
      this.editor.layout();
    }, false);
  },
  destroyed() {
    if (typeof this.editor !== 'undefined') {
      this.editor.dispose();
    }
  },
  watch: {
    language() {
      window.monaco.editor.setModelLanguage(this.editor.getModel(), this.language);
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
  }
};
</script>

<style>

</style>
