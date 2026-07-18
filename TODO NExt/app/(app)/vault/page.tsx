'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Input, Row, SectionHeader, EmptyState } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

function RichTextEditor({
  content,
  onChange,
}: {
  content: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== content) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--color-surface-muted)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        marginTop: 4,
        marginBottom: 8,
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 6,
          padding: '6px 12px',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          style={{
            padding: '4px 8px',
            borderRadius: 6,
            border: 'none',
            background: editor.isActive('bold') ? 'var(--color-surface-muted)' : 'transparent',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: 12,
            color: 'var(--color-text)',
          }}
          suppressHydrationWarning
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          style={{
            padding: '4px 8px',
            borderRadius: 6,
            border: 'none',
            background: editor.isActive('italic') ? 'var(--color-surface-muted)' : 'transparent',
            fontStyle: 'italic',
            cursor: 'pointer',
            fontSize: 12,
            color: 'var(--color-text)',
          }}
          suppressHydrationWarning
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          style={{
            padding: '4px 8px',
            borderRadius: 6,
            border: 'none',
            background: editor.isActive('strike') ? 'var(--color-surface-muted)' : 'transparent',
            textDecoration: editor.isActive('strike') ? 'line-through' : 'none',
            cursor: 'pointer',
            fontSize: 12,
            color: 'var(--color-text)',
          }}
          suppressHydrationWarning
        >
          S
        </button>
        <div style={{ width: 1, height: 16, backgroundColor: 'var(--color-border)' }} />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          style={{
            padding: '4px 8px',
            borderRadius: 6,
            border: 'none',
            background: editor.isActive('bulletList') ? 'var(--color-surface-muted)' : 'transparent',
            cursor: 'pointer',
            fontSize: 12,
            color: 'var(--color-text)',
          }}
          suppressHydrationWarning
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          style={{
            padding: '4px 8px',
            borderRadius: 6,
            border: 'none',
            background: editor.isActive('orderedList') ? 'var(--color-surface-muted)' : 'transparent',
            cursor: 'pointer',
            fontSize: 12,
            color: 'var(--color-text)',
          }}
          suppressHydrationWarning
        >
          1. List
        </button>
      </div>

      {/* Content Area */}
      <div style={{ padding: '10px 14px', flex: 1, minHeight: 90 }}>
        <EditorContent editor={editor} />
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .ProseMirror {
          outline: none;
          min-height: 80px;
          color: var(--color-text);
        }
        .ProseMirror p {
          margin-bottom: 8px;
        }
        .ProseMirror ul, .ProseMirror ol {
          padding-left: 20px;
          margin-bottom: 8px;
        }
      `,
        }}
      />
    </div>
  );
}

export default function VaultPage() {
  const store = useAppStore();
  const [tab, setTab] = useState<'notes' | 'links' | 'ideas'>('notes');

  // Creation form visibility states
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [isCreatingIdea, setIsCreatingIdea] = useState(false);
  const [isCreatingLink, setIsCreatingLink] = useState(false);

  // New item states
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaDesc, setIdeaDesc] = useState('');

  // Editing states
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteTitle, setEditNoteTitle] = useState('');
  const [editNoteContent, setEditNoteContent] = useState('');

  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [editIdeaTitle, setEditIdeaTitle] = useState('');
  const [editIdeaDesc, setEditIdeaDesc] = useState('');

  const addNote = () => {
    if (!noteTitle.trim()) return;
    store.addNote({ title: noteTitle.trim(), content: noteContent.trim(), tags: [] });
    setNoteTitle('');
    setNoteContent('');
    setIsCreatingNote(false);
  };

  const saveNoteEdit = (id: string) => {
    if (!editNoteTitle.trim()) return;
    store.updateNote(id, { title: editNoteTitle.trim(), content: editNoteContent.trim() });
    setEditingNoteId(null);
  };

  const startEditingNote = (note: any) => {
    setEditingNoteId(note.id);
    setEditNoteTitle(note.title);
    setEditNoteContent(note.content || '');
  };

  const addLink = () => {
    if (!linkTitle.trim() || !linkUrl.trim()) return;
    store.addLink({ title: linkTitle.trim(), url: linkUrl.trim(), categoryId: null, notes: '' });
    setLinkTitle('');
    setLinkUrl('');
    setIsCreatingLink(false);
  };

  const addIdea = () => {
    if (!ideaTitle.trim()) return;
    store.addFutureIdea({ title: ideaTitle.trim(), description: ideaDesc.trim(), priority: 'medium' });
    setIdeaTitle('');
    setIdeaDesc('');
    setIsCreatingIdea(false);
  };

  const saveIdeaEdit = (id: string) => {
    if (!editIdeaTitle.trim()) return;
    store.updateFutureIdea(id, { title: editIdeaTitle.trim(), description: editIdeaDesc.trim() });
    setEditingIdeaId(null);
  };

  const startEditingIdea = (idea: any) => {
    setEditingIdeaId(idea.id);
    setEditIdeaTitle(idea.title);
    setEditIdeaDesc(idea.description || '');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionHeader title="Vault" />

      <Row style={{ gap: 4, marginBottom: 8 }}>
        {(['notes', 'links', 'ideas'] as const).map((t) => (
          <Button
            key={t}
            small
            title={t.charAt(0).toUpperCase() + t.slice(1)}
            onPress={() => {
              setTab(t);
              setIsCreatingNote(false);
              setIsCreatingIdea(false);
              setIsCreatingLink(false);
              setEditingNoteId(null);
              setEditingIdeaId(null);
            }}
            variant={tab === t ? 'primary' : 'secondary'}
          />
        ))}
      </Row>

      {tab === 'notes' && (
        <>
          {isCreatingNote ? (
            <Card>
              <span style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>New Note</span>
              <Input value={noteTitle} onChangeText={setNoteTitle} placeholder="Note title" />
              <RichTextEditor content={noteContent} onChange={setNoteContent} />
              <Row style={{ gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => {
                    setIsCreatingNote(false);
                    setNoteTitle('');
                    setNoteContent('');
                  }}
                />
                <Button title="Save Note" onPress={addNote} disabled={!noteTitle.trim()} />
              </Row>
            </Card>
          ) : (
            <>
              <Button title="+ Create Note" onPress={() => setIsCreatingNote(true)} />

              {store.notes.length === 0 ? (
                <EmptyState title="No notes yet" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {store.notes.map((note) => {
                    const isEditing = editingNoteId === note.id;
                    if (isEditing) {
                      return (
                        <Card key={note.id}>
                          <span style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Edit Note</span>
                          <Input value={editNoteTitle} onChangeText={setEditNoteTitle} placeholder="Note title" />
                          <RichTextEditor content={editNoteContent} onChange={setEditNoteContent} />
                          <Row style={{ gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                            <Button title="Cancel" variant="secondary" onPress={() => setEditingNoteId(null)} />
                            <Button
                              title="Save Changes"
                              onPress={() => saveNoteEdit(note.id)}
                              disabled={!editNoteTitle.trim()}
                            />
                          </Row>
                        </Card>
                      );
                    }
                    return (
                      <Card key={note.id}>
                        <span style={{ fontWeight: 700 }}>{note.title}</span>
                        {note.content ? (
                          <div
                            dangerouslySetInnerHTML={{ __html: note.content }}
                            style={{
                              fontSize: 13,
                              color: 'var(--color-text-secondary)',
                              lineHeight: 1.4,
                            }}
                          />
                        ) : null}
                        <Row style={{ gap: 8, marginTop: 10 }}>
                          <Button small title="Edit" variant="secondary" onPress={() => startEditingNote(note)} />
                          <Button small title="Delete" variant="ghost" onPress={() => store.deleteNote(note.id)} />
                        </Row>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}

      {tab === 'links' && (
        <>
          {isCreatingLink ? (
            <Card>
              <span style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>New Link</span>
              <Input value={linkTitle} onChangeText={setLinkTitle} placeholder="Link title" />
              <Input value={linkUrl} onChangeText={setLinkUrl} placeholder="URL" />
              <Row style={{ gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => {
                    setIsCreatingLink(false);
                    setLinkTitle('');
                    setLinkUrl('');
                  }}
                />
                <Button title="Save Link" onPress={addLink} disabled={!linkTitle.trim() || !linkUrl.trim()} />
              </Row>
            </Card>
          ) : (
            <>
              <Button title="+ Add Link" onPress={() => setIsCreatingLink(true)} />

              {store.savedLinks.length === 0 ? (
                <EmptyState title="No links yet" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {store.savedLinks.map((link) => (
                    <Card key={link.id}>
                      <span style={{ fontWeight: 700 }}>{link.title}</span>
                      <span
                        style={{
                          fontSize: 12,
                          color: 'var(--color-text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {link.url}
                      </span>
                      <Button small title="Delete" variant="ghost" onPress={() => store.deleteLink(link.id)} />
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {tab === 'ideas' && (
        <>
          {isCreatingIdea ? (
            <Card>
              <span style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>New Idea</span>
              <Input value={ideaTitle} onChangeText={setIdeaTitle} placeholder="Idea title" />
              <RichTextEditor content={ideaDesc} onChange={setIdeaDesc} />
              <Row style={{ gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => {
                    setIsCreatingIdea(false);
                    setIdeaTitle('');
                    setIdeaDesc('');
                  }}
                />
                <Button title="Save Idea" onPress={addIdea} disabled={!ideaTitle.trim()} />
              </Row>
            </Card>
          ) : (
            <>
              <Button title="+ Create Idea" onPress={() => setIsCreatingIdea(true)} />

              {store.futureIdeas.length === 0 ? (
                <EmptyState title="No ideas yet" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {store.futureIdeas.map((idea) => {
                    const isEditing = editingIdeaId === idea.id;
                    if (isEditing) {
                      return (
                        <Card key={idea.id}>
                          <span style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Edit Idea</span>
                          <Input value={editIdeaTitle} onChangeText={setEditIdeaTitle} placeholder="Idea title" />
                          <RichTextEditor content={editIdeaDesc} onChange={setEditIdeaDesc} />
                          <Row style={{ gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                            <Button title="Cancel" variant="secondary" onPress={() => setEditingIdeaId(null)} />
                            <Button
                              title="Save Changes"
                              onPress={() => saveIdeaEdit(idea.id)}
                              disabled={!editIdeaTitle.trim()}
                            />
                          </Row>
                        </Card>
                      );
                    }
                    return (
                      <Card key={idea.id}>
                        <span style={{ fontWeight: 700 }}>{idea.title}</span>
                        {idea.description ? (
                          <div
                            dangerouslySetInnerHTML={{ __html: idea.description }}
                            style={{
                              fontSize: 13,
                              color: 'var(--color-text-secondary)',
                              lineHeight: 1.4,
                            }}
                          />
                        ) : null}
                        <Row style={{ gap: 8, marginTop: 10 }}>
                          <Button small title="Edit" variant="secondary" onPress={() => startEditingIdea(idea)} />
                          <Button small title="Delete" variant="ghost" onPress={() => store.deleteFutureIdea(idea.id)} />
                        </Row>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
