import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { history, historyKeymap, redo, undo } from '@codemirror/commands';

const parent = document.getElementById('editor');
if (!parent) throw new Error('fixture root missing');

const view = new EditorView({
  state: EditorState.create({
    doc: '开头\n第二行',
    extensions: [history(), keymap.of(historyKeymap)],
  }),
  parent,
});

Object.assign(window, {
  fixture: {
    text: () => view.state.doc.toString(),
    undo: () => undo(view),
    redo: () => redo(view),
    focus: () => view.focus(),
  },
});
