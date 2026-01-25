/**
 * Wrap selected text with prefix and suffix
 */
function wrapSelection(view, before, after) {
  const { from, to } = view.state.selection.main;
  const text = view.state.sliceDoc(from, to);

  view.dispatch({
    changes: { from, to, insert: before + text + after },
    selection: { anchor: from + before.length, head: to + before.length },
  });
}

/**
 * Add prefix to the beginning of the current line
 */
function prefixLine(view, prefix) {
  const { from } = view.state.selection.main;
  const line = view.state.doc.lineAt(from);

  view.dispatch({
    changes: { from: line.from, to: line.from, insert: prefix },
  });
}

/**
 * Toggle heading prefix on the current line
 * If line has this heading, remove it
 * If line has different heading or no heading, set to this level
 */
function toggleHeading(view, level) {
  const { from } = view.state.selection.main;
  const line = view.state.doc.lineAt(from);
  const text = line.text;

  // Match any heading prefix (# to ######)
  const headingMatch = text.match(/^(#{1,6})\s/);
  const targetPrefix = '#'.repeat(level) + ' ';

  if (headingMatch) {
    const currentPrefix = headingMatch[0];
    if (currentPrefix === targetPrefix) {
      // Same heading level - remove it
      view.dispatch({
        changes: { from: line.from, to: line.from + currentPrefix.length, insert: '' },
      });
    } else {
      // Different heading level - replace it
      view.dispatch({
        changes: { from: line.from, to: line.from + currentPrefix.length, insert: targetPrefix },
      });
    }
  } else {
    // No heading - add it
    view.dispatch({
      changes: { from: line.from, to: line.from, insert: targetPrefix },
    });
  }
}

/**
 * Toggle list prefix on the current line
 * Handles bullet (-), numbered (1.), and task (- [ ]) lists
 */
function toggleList(view, type) {
  const { from } = view.state.selection.main;
  const line = view.state.doc.lineAt(from);
  const text = line.text;

  // Match list prefixes: bullet (- ), numbered (1. ), or task (- [ ] or - [x] )
  const bulletMatch = text.match(/^(-|\*|\+)\s(?!\[[ xX]\])/);
  const numberedMatch = text.match(/^(\d+)\.\s/);
  const taskMatch = text.match(/^(-|\*|\+)\s\[[ xX]\]\s/);

  const prefixes = {
    bullet: '- ',
    numbered: '1. ',
    task: '- [ ] ',
  };

  const targetPrefix = prefixes[type];
  let currentMatch = null;
  let currentType = null;

  if (taskMatch) {
    currentMatch = taskMatch[0];
    currentType = 'task';
  } else if (numberedMatch) {
    currentMatch = numberedMatch[0];
    currentType = 'numbered';
  } else if (bulletMatch) {
    currentMatch = bulletMatch[0];
    currentType = 'bullet';
  }

  if (currentMatch) {
    if (currentType === type) {
      // Same list type - remove it
      view.dispatch({
        changes: { from: line.from, to: line.from + currentMatch.length, insert: '' },
      });
    } else {
      // Different list type - replace it
      view.dispatch({
        changes: { from: line.from, to: line.from + currentMatch.length, insert: targetPrefix },
      });
    }
  } else {
    // No list prefix - add it
    view.dispatch({
      changes: { from: line.from, to: line.from, insert: targetPrefix },
    });
  }
}

/**
 * Insert text at cursor position
 */
function insertAt(view, text) {
  const { from, to } = view.state.selection.main;
  view.dispatch({
    changes: { from, to, insert: text },
  });
}

/**
 * Get currently selected text
 */
function getSelection(view) {
  const { from, to } = view.state.selection.main;
  return from !== to ? view.state.sliceDoc(from, to) : null;
}

/**
 * Toolbar formatting actions
 */
export const actions = {
  bold(view) {
    wrapSelection(view, '**', '**');
  },

  italic(view) {
    wrapSelection(view, '_', '_');
  },

  strikethrough(view) {
    wrapSelection(view, '~~', '~~');
  },

  h1(view) {
    toggleHeading(view, 1);
  },

  h2(view) {
    toggleHeading(view, 2);
  },

  h3(view) {
    toggleHeading(view, 3);
  },

  link(view) {
    const selection = getSelection(view);
    const exampleUrl = 'https://example.com';
    if (selection) {
      const { from, to } = view.state.selection.main;
      view.dispatch({
        changes: { from, to, insert: `[${selection}](${exampleUrl})` },
        selection: { anchor: from + selection.length + 3, head: from + selection.length + 3 + exampleUrl.length },
      });
    } else {
      const { from } = view.state.selection.main;
      view.dispatch({
        changes: { from, insert: `[link text](${exampleUrl})` },
        selection: { anchor: from + 1, head: from + 10 },
      });
    }
  },

  image(view) {
    const { from } = view.state.selection.main;
    const exampleUrl = 'https://placehold.co/400x200';
    view.dispatch({
      changes: { from, insert: `![alt text](${exampleUrl})` },
      selection: { anchor: from + 2, head: from + 10 },
    });
  },

  bulletList(view) {
    toggleList(view, 'bullet');
  },

  numberedList(view) {
    toggleList(view, 'numbered');
  },

  taskList(view) {
    toggleList(view, 'task');
  },

  inlineCode(view) {
    wrapSelection(view, '`', '`');
  },

  codeBlock(view) {
    const { from, to } = view.state.selection.main;
    const text = view.state.sliceDoc(from, to);
    const sampleCode = `javascript
function hello() {
  alert("hello world");
}
hello();`;
    const newText = text ? '```\n' + text + '\n```' : '```' + sampleCode + '\n```';

    view.dispatch({
      changes: { from, to, insert: newText },
      selection: { anchor: from + 4 },
    });
  },

  hr(view) {
    const { from } = view.state.selection.main;
    const line = view.state.doc.lineAt(from);

    view.dispatch({
      changes: { from: line.to, insert: '\n\n---\n' },
    });
  },

  quote(view) {
    prefixLine(view, '> ');
  },

  table(view) {
    const { from } = view.state.selection.main;
    const line = view.state.doc.lineAt(from);
    const sampleTable = `| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |`;

    view.dispatch({
      changes: { from: line.to, insert: '\n\n' + sampleTable + '\n' },
      selection: { anchor: line.to + 4 },
    });
  },

  diagram(view) {
    const { from } = view.state.selection.main;
    const line = view.state.doc.lineAt(from);
    const sampleDiagram = `\`\`\`mermaid
flowchart LR
    A[Start] --> B[Process]
    B --> C{Decision}
    C -->|Yes| D[Result 1]
    C -->|No| E[Result 2]
\`\`\``;

    view.dispatch({
      changes: { from: line.to, insert: '\n\n' + sampleDiagram + '\n' },
      selection: { anchor: line.to + 4 },
    });
  },

  emoji(view) {
    const { from } = view.state.selection.main;
    view.dispatch({
      changes: { from, insert: ':smile:' },
      selection: { anchor: from + 1, head: from + 6 },
    });
  },
};
