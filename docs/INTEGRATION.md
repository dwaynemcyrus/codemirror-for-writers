# Integration Guide for Next.js PWA

This guide shows how to integrate the enhanced markdown editor into your Next.js 15 PWA.

## Installation

```bash
# From local (during development)
npm install file:./codemirror-for-writers

# Or publish to npm/GitHub packages first
npm install codemirror-for-writers
```

## Basic Setup

### 1. Create Editor Component

```typescript
// components/MarkdownEditor.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { hybridMarkdown } from 'codemirror-for-writers';

interface MarkdownEditorProps {
  initialValue?: string;
  onChange?: (value: string) => void;
  onWikiLinkClick?: (link: { raw: string; title: string; section: string; alias: string; display: string }) => void;
  theme?: 'light' | 'dark';
}

export default function MarkdownEditor({
  initialValue = '',
  onChange,
  onWikiLinkClick,
  theme = 'light',
}: MarkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const view = new EditorView({
      doc: initialValue,
      extensions: [
        basicSetup,
        hybridMarkdown({
          theme,
          enableWikiLinks: true,
          enableYamlFrontmatter: true,
          enableExtendedMarkdown: true,
          enableCustomTasks: true,
          customTaskTypes: ['!', '>', '<', '?', 'i', '*'],
          onWikiLinkClick,
          onFrontmatterChange: (data) => {
            console.log('Frontmatter updated:', data);
          },
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && onChange) {
            onChange(update.state.doc.toString());
          }
        }),
      ],
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, []);

  // Update theme when it changes
  useEffect(() => {
    if (viewRef.current) {
      // Theme update logic
    }
  }, [theme]);

  return <div ref={editorRef} className="markdown-editor" />;
}
```

### 2. Create Styles

```css
/* styles/editor.css */
.markdown-editor {
  height: 100%;
  min-height: 400px;
}

.markdown-editor .cm-editor {
  height: 100%;
  font-size: 16px; /* Mobile-friendly */
}

.markdown-editor .cm-scroller {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .markdown-editor .cm-editor {
    font-size: 18px; /* Larger for mobile */
  }
  
  .markdown-editor .cm-content {
    padding: 16px;
  }
}
```

### 3. Use in Page

```typescript
// app/editor/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MarkdownEditor from '@/components/MarkdownEditor';

export default function EditorPage() {
  const router = useRouter();
  const [content, setContent] = useState('');

  const handleWikiLinkClick = (link: { title: string }) => {
    // Navigate to another note
    router.push(`/notes/${encodeURIComponent(link.title)}`);
  };

  return (
    <div className="editor-container">
      <MarkdownEditor
        initialValue={content}
        onChange={setContent}
        onWikiLinkClick={handleWikiLinkClick}
        theme="light"
      />
    </div>
  );
}
```

## Advanced Integration with RxDB

### Store Notes with Metadata

```typescript
// lib/db/schema.ts
import { RxJsonSchema } from 'rxdb';

export const noteSchema: RxJsonSchema<Note> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    title: { type: 'string' },
    content: { type: 'string' },
    frontmatter: { type: 'object' },
    updatedAt: { type: 'number' },
    createdAt: { type: 'number' },
  },
  required: ['id', 'title', 'content', 'updatedAt', 'createdAt'],
};

export interface Note {
  id: string;
  title: string;
  content: string;
  frontmatter: Record<string, any>;
  updatedAt: number;
  createdAt: number;
}
```

### Editor with Auto-Save

```typescript
// components/NoteEditor.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRxDB } from '@/lib/db/hooks';
import MarkdownEditor from './MarkdownEditor';
import { debounce } from 'lodash';

interface NoteEditorProps {
  noteId: string;
}

export default function NoteEditor({ noteId }: NoteEditorProps) {
  const db = useRxDB();
  const [note, setNote] = useState<Note | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load note
  useEffect(() => {
    if (!db) return;

    const loadNote = async () => {
      const doc = await db.notes.findOne(noteId).exec();
      if (doc) {
        setNote(doc.toJSON());
      }
    };

    loadNote();
  }, [db, noteId]);

  // Auto-save with debounce
  const saveNote = debounce(async (content: string) => {
    if (!db || !note) return;

    setIsSaving(true);
    try {
      await db.notes.upsert({
        ...note,
        content,
        updatedAt: Date.now(),
      });
    } finally {
      setIsSaving(false);
    }
  }, 1000);

  const handleChange = (content: string) => {
    saveNote(content);
  };

  const handleFrontmatterChange = async (frontmatter: Record<string, any>) => {
    if (!db || !note) return;

    await db.notes.upsert({
      ...note,
      frontmatter,
      updatedAt: Date.now(),
    });
  };

  if (!note) return <div>Loading...</div>;

  return (
    <div>
      {isSaving && <div className="saving-indicator">Saving...</div>}
      <MarkdownEditor
        initialValue={note.content}
        onChange={handleChange}
      />
    </div>
  );
}
```

## Mobile-First Considerations

### Touch-Friendly Toolbar

```typescript
// components/MobileToolbar.tsx
'use client';

import { actions } from 'codemirror-for-writers';
import { EditorView } from '@codemirror/view';

interface MobileToolbarProps {
  view: EditorView | null;
}

export default function MobileToolbar({ view }: MobileToolbarProps) {
  if (!view) return null;

  return (
    <div className="mobile-toolbar">
      <button onClick={() => actions.bold(view)}>𝐁</button>
      <button onClick={() => actions.italic(view)}>𝐼</button>
      <button onClick={() => actions.wikiLink(view)}>[[]]</button>
      <button onClick={() => actions.taskList(view)}>☑️</button>
      <button onClick={() => actions.heading1(view)}>H1</button>
      
      {/* Task type quick actions */}
      <button onClick={() => actions.urgentTask(view)}>⚠️</button>
      <button onClick={() => actions.scheduledTask(view)}>📅</button>
    </div>
  );
}
```

```css
/* styles/toolbar.css */
.mobile-toolbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  gap: 8px;
  padding: 12px;
  background: white;
  border-bottom: 1px solid #ddd;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.mobile-toolbar button {
  min-width: 48px; /* Touch-friendly size */
  height: 48px;
  padding: 0;
  border: 1px solid #ddd;
  background: white;
  border-radius: 8px;
  font-size: 18px;
  cursor: pointer;
  flex-shrink: 0;
}

.mobile-toolbar button:active {
  background: #f0f0f0;
  transform: scale(0.95);
}
```

## Offline-First with Service Worker

```typescript
// lib/editor/sync.ts
export async function syncNoteContent(noteId: string, content: string) {
  // Try to sync to Supabase
  try {
    await fetch('/api/notes/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId, content }),
    });
  } catch (error) {
    // Queue for later sync when online
    await queueOfflineSync({ noteId, content });
  }
}

async function queueOfflineSync(data: any) {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('sync-notes');
    
    // Store in IndexedDB for background sync
    await storeForBackgroundSync(data);
  }
}
```

## Performance Optimizations

### Lazy Load Editor

```typescript
// app/editor/page.tsx
import dynamic from 'next/dynamic';

const MarkdownEditor = dynamic(
  () => import('@/components/MarkdownEditor'),
  { ssr: false }
);

export default function EditorPage() {
  return <MarkdownEditor />;
}
```

### Virtual Scrolling for Long Documents

```typescript
// Use CodeMirror's built-in viewport handling
// Already optimized in the library
```

## Supabase Integration

### Sync Frontmatter to Database

```typescript
// lib/supabase/notes.ts
export async function syncNoteFrontmatter(
  noteId: string, 
  frontmatter: Record<string, any>
) {
  const { data, error } = await supabase
    .from('notes')
    .update({
      title: frontmatter.title,
      tags: frontmatter.tags,
      metadata: frontmatter,
    })
    .eq('id', noteId);
    
  if (error) throw error;
  return data;
}
```

## Testing

```typescript
// __tests__/editor.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MarkdownEditor from '@/components/MarkdownEditor';

test('renders wiki link on click', async () => {
  const handleClick = jest.fn();
  render(<MarkdownEditor onWikiLinkClick={handleClick} />);
  
  // Type wiki link
  const editor = screen.getByRole('textbox');
  await userEvent.type(editor, '[[Test Link]]');
  
  // Should call handler
  expect(handleClick).toHaveBeenCalledWith(expect.objectContaining({ title: 'Test Link' }));
});
```

## Next Steps

1. Install the package
2. Create the editor component
3. Set up RxDB integration
4. Add mobile toolbar
5. Configure offline sync
6. Test on iOS Safari

## Troubleshooting

### iOS Safari Issues
- Use `-webkit-overflow-scrolling: touch` for smooth scrolling
- Set `font-size: 16px` minimum to prevent auto-zoom
- Handle viewport meta tag properly

### Performance
- Use virtual scrolling for long documents
- Debounce auto-save
- Lazy load the editor component

### Offline
- Test thoroughly with DevTools offline mode
- Implement conflict resolution for sync
- Show clear offline indicators
