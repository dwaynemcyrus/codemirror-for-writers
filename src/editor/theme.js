import { EditorView } from '@codemirror/view';

// Base theme settings shared between light and dark
const baseTheme = {
  '&': {
    height: '100%',
    fontSize: '17px',
  },
  '.cm-content': {
    fontFamily: 'Charter, "Bitstream Charter", "Sitka Text", Cambria, serif',
    padding: '20px 48px',
    lineHeight: '1.75',
  },
  '.cm-line': {
    padding: '4px 0',
  },
  '.cm-scroller': {
    overflow: 'auto',
  },
};

// Light theme
export const lightTheme = EditorView.theme({
  ...baseTheme,
  '&': {
    ...baseTheme['&'],
    backgroundColor: '#fff',
  },
  '.cm-content': {
    ...baseTheme['.cm-content'],
    caretColor: '#333',
  },
  '.cm-cursor': {
    borderLeftColor: '#333',
    borderLeftWidth: '2px',
  },
  '.cm-selectionBackground': {
    backgroundColor: '#b4d5fe',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: '#b4d5fe',
  },
});

// Dark theme
export const darkTheme = EditorView.theme({
  ...baseTheme,
  '&': {
    ...baseTheme['&'],
    backgroundColor: '#1e1e1e',
  },
  '.cm-content': {
    ...baseTheme['.cm-content'],
    caretColor: '#fff',
    color: '#d4d4d4',
  },
  '.cm-cursor': {
    borderLeftColor: '#fff',
    borderLeftWidth: '2px',
  },
  '.cm-selectionBackground': {
    backgroundColor: '#264f78',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: '#264f78',
  },
});

// Default export for backwards compatibility
export const editorTheme = lightTheme;
