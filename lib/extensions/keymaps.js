import { keymap } from '@codemirror/view';
import { actions } from './actions.js';
import {
  setTypewriterEffect,
  setFocusModeEffect,
  writingModeField,
} from './writing-mode-state.js';

export const markdownKeymap = keymap.of([
  {
    key: 'Mod-Shift-t',
    run: (view) => {
      const current = view.state.field(writingModeField).typewriter;
      view.dispatch({ effects: setTypewriterEffect.of(!current) });
      return true;
    },
  },
  {
    key: 'Mod-Shift-f',
    run: (view) => {
      const current = view.state.field(writingModeField).focusMode;
      view.dispatch({ effects: setFocusModeEffect.of(!current) });
      return true;
    },
  },
  {
    key: 'Mod-b',
    run: (view) => {
      actions.bold(view);
      return true;
    },
  },
  {
    key: 'Mod-i',
    run: (view) => {
      actions.italic(view);
      return true;
    },
  },
  {
    key: 'Mod-k',
    run: (view) => {
      actions.link(view);
      return true;
    },
  },
  {
    key: 'Mod-`',
    run: (view) => {
      actions.inlineCode(view);
      return true;
    },
  },
  {
    key: 'Mod-Shift-`',
    run: (view) => {
      actions.codeBlock(view);
      return true;
    },
  },
  {
    key: 'Mod-h',
    run: (view) => {
      actions.replace(view);
      return true;
    },
  },
  {
    key: 'Mod-d',
    run: (view) => {
      actions.selectNextOccurrence(view);
      return true;
    },
  },
  {
    key: 'Mod-Shift-l',
    run: (view) => {
      actions.selectAllOccurrences(view);
      return true;
    },
  },
  {
    key: 'Mod-Shift-x',
    run: (view) => {
      actions.strikethrough(view);
      return true;
    },
  },
  {
    key: 'Mod-1',
    run: (view) => {
      actions.h1(view);
      return true;
    },
  },
  {
    key: 'Mod-2',
    run: (view) => {
      actions.h2(view);
      return true;
    },
  },
  {
    key: 'Mod-3',
    run: (view) => {
      actions.h3(view);
      return true;
    },
  },
  {
    key: 'Mod-Shift-8',
    run: (view) => {
      actions.bulletList(view);
      return true;
    },
  },
  {
    key: 'Mod-Shift-7',
    run: (view) => {
      actions.numberedList(view);
      return true;
    },
  },
  {
    key: 'Mod-Shift-9',
    run: (view) => {
      actions.taskList(view);
      return true;
    },
  },
  {
    key: 'Mod-Shift-.',
    run: (view) => {
      actions.quote(view);
      return true;
    },
  },
  {
    key: 'Mod-Shift-i',
    run: (view) => {
      actions.image(view);
      return true;
    },
  },
]);
