'use client';

import { useState, useEffect, useRef } from 'react';
import { Button, Card, Input, Row, SectionHeader, EmptyState } from '@/components/ui';
import { LottieLoader } from '@/components/LottieLoader';
import { useAppStore } from '@/store/useAppStore';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Note, FutureIdea, MarkdownFile } from '@/types';
import { marked } from 'marked';

interface RoadmapStep {
  index: number;
  title: string;
  bullets: string[];
}

function parseRoadmap(content: string): RoadmapStep[] {
  if (!content) return [];
  const lines = content.split('\n');
  const steps: RoadmapStep[] = [];
  let currentStep: RoadmapStep | null = null;
  let stepCounter = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const title = headingMatch[2].replace(/[\*\_~`]/g, '').trim();
      if (
        title.toLowerCase().includes('zero to advanced') || 
        title.toLowerCase().includes('how this roadmap works') ||
        title.toLowerCase().includes('daily schedule') ||
        title.toLowerCase().includes('tracking metrics') ||
        title.toLowerCase().includes('milestone project')
      ) {
        continue;
      }
      currentStep = {
        index: stepCounter++,
        title,
        bullets: []
      };
      steps.push(currentStep);
    } else if (currentStep) {
      const bulletMatch = line.match(/^[\-\*\+\d\.\>]\s+(.+)$/);
      if (bulletMatch) {
        const text = bulletMatch[1].replace(/[\*\_~`]/g, '').trim();
        if (text && text.length > 2) {
          currentStep.bullets.push(text);
        }
      } else if (line.length > 0 && !line.startsWith('---') && !line.startsWith('|')) {
        if (!line.startsWith('<') && !line.startsWith('`')) {
          const cleanText = line.replace(/[\*\_~`]/g, '').trim();
          if (cleanText.length > 10 && currentStep.bullets.length < 8) {
            currentStep.bullets.push(cleanText);
          }
        }
      }
    }
  }
  return steps;
}

const defaultDSARoadmap: RoadmapStep[] = [
  {
    index: 1,
    title: "MONTH 1 — Foundations: Complexity, Arrays, Strings, Hashing",
    bullets: [
      "Week 1: Big O Complexity Analysis & Dynamic Arrays",
      "Week 2: String Manipulations & Hash Map / Hash Set mappings",
      "Week 3: Two Pointers & Sliding Window techniques (converging, slow/fast)",
      "Week 4: Prefix Sum Range Queries & Subarray Sum Equals K identities",
      "Milestone Project: Dynamic Array, custom Hash Map, & Sliding Window Rate Limiter"
    ]
  },
  {
    index: 2,
    title: "MONTH 2 — Searching, Sorting, Recursion, Linked Lists, Stacks & Queues",
    bullets: [
      "Week 5: Binary Search invariants & Monotonic search-on-answer space",
      "Week 6: Recursion trees, call-stack mechanics, and Permutations/Subsets",
      "Week 7: Singly/Doubly Linked Lists, Dummy nodes, and Floyd's cycle detection",
      "Week 8: Stacks & Queues, Min-Stack design, and Monotonic Stack patterns",
      "Milestone Project: Expression calculator (PEMDAS) & LRU Browser History Simulator"
    ]
  },
  {
    index: 3,
    title: "MONTH 3 — Trees, BSTs, Heaps, Tries, Backtracking",
    bullets: [
      "Week 9: Binary Trees, Depth-First (in/pre/post) & Level-Order BFS traversals",
      "Week 10: Binary Search Trees (inorder=sorted) & Min/Max Heap Priority Queues",
      "Week 11: Trie Prefix Trees & Backtracking templates (Choose, Explore, Unchoose)",
      "Week 12: Consolidation, custom comparators, and running median calculations",
      "Milestone Project: Autocomplete search engine (Trie + Heap)"
    ]
  },
  {
    index: 4,
    title: "MONTH 4 — Graphs: Traversal, Topo Sort, Union-Find, Shortest Paths",
    bullets: [
      "Week 13: Graph representations, Component counting, DFS/BFS traversals",
      "Week 14: Kahn's Topological Sort algorithm & Disjoint Set Union (path compression)",
      "Week 15: Dijkstra / Bellman-Ford Shortest Paths & Kruskal's Minimum Spanning Tree",
      "Week 16: Multi-source BFS (spread), 0-1 BFS, and Grid traversal algorithms",
      "Milestone Project: Flight-route path planner CLI (Dijkstra + DSU)"
    ]
  },
  {
    index: 5,
    title: "MONTH 5 — Greedy Algorithms & Dynamic Programming",
    bullets: [
      "Week 17: Greedy choice properties, Interval scheduling, and Huffman coding",
      "Week 18: Dynamic Programming basics: Memoization vs Tabulation, Grid DP",
      "Week 19: Classic DP paradigms: Knapsack, LCS, LIS, Coin Change",
      "Week 20: DP on Trees, Matrix Chain Multiplication, and State Space DP",
      "Milestone Project: Stock trading simulation with transaction fees & cooldowns"
    ]
  },
  {
    index: 6,
    title: "MONTH 6 — Advanced Data Structures & Interview Readiness",
    bullets: [
      "Week 21: Bit Manipulation, Segment Trees, and Fenwick Trees (Binary Indexed)",
      "Week 22: Advanced Graphs (Tarjan's strongly connected, Eulerian path) & String search (KMP)",
      "Week 23: Mock interview gauntlets (Pramp) & Resume reviews",
      "Week 24: final FAANG-style review, speed optimization, and mistake journal audit",
      "Milestone Project: Distributed task scheduler with priority queues & dependency sorting"
    ]
  }
];

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

  const [publicRoadmapContent, setPublicRoadmapContent] = useState('');
  const [roadmapSource, setRoadmapSource] = useState<string>('dsa_public');

  useEffect(() => {
    store.syncWithCloud(['notes', 'savedLinks', 'futureIdeas', 'shiftLogs', 'markdownFiles']);
    
    fetch('/DSA-Roadmap.md')
      .then((res) => {
        if (res.ok) return res.text();
        return '';
      })
      .then((text) => {
        if (text) setPublicRoadmapContent(text);
      })
      .catch((err) => console.warn('Failed to fetch public DSA-Roadmap:', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [tab, setTab] = useState<'notes' | 'links' | 'ideas' | 'markdown' | 'roadmap'>('notes');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedNoteIds, setExpandedNoteIds] = useState<Record<string, boolean>>({});
  const [expandedIdeaIds, setExpandedIdeaIds] = useState<Record<string, boolean>>({});

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        const title = file.name.replace(/\.md$/i, '');
        store.addMarkdownFile({ title, content: text });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Creation form visibility states
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [isCreatingIdea, setIsCreatingIdea] = useState(false);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);

  // New markdown document states
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');

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

  const startEditingNote = (note: Note) => {
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

  const startEditingIdea = (idea: FutureIdea) => {
    setEditingIdeaId(idea.id);
    setEditIdeaTitle(idea.title);
    setEditIdeaDesc(idea.description || '');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionHeader title="Vault" />

      <Row style={{ gap: 4, marginBottom: 8 }}>
        {(['notes', 'links', 'ideas', 'markdown', 'roadmap'] as const).map((t) => (
          <Button
            key={t}
            small
            title={t === 'markdown' ? 'Markdown' : t === 'roadmap' ? 'Roadmap' : t.charAt(0).toUpperCase() + t.slice(1)}
            onPress={() => {
              setTab(t);
              setIsCreatingNote(false);
              setIsCreatingIdea(false);
              setIsCreatingLink(false);
              setIsCreatingDoc(false);
              setEditingNoteId(null);
              setEditingIdeaId(null);
              setSelectedFileId(null);
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
                store.loadingSections?.notes ? (
                  <LottieLoader text="Syncing Notes..." size={120} />
                ) : (
                  <EmptyState title="No notes yet" />
                )
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
                        {note.content ? (() => {
                          const isLong = note.content.length > 300;
                          const expanded = expandedNoteIds[note.id];
                          
                          if (isLong && !expanded) {
                            return (
                              <div style={{ position: 'relative', maxHeight: '120px', overflow: 'hidden' }}>
                                <div
                                  dangerouslySetInnerHTML={{ __html: note.content }}
                                  style={{
                                    fontSize: 13,
                                    color: 'var(--color-text-secondary)',
                                    lineHeight: 1.4,
                                  }}
                                />
                                <div style={{
                                  position: 'absolute',
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                  height: 40,
                                  background: 'linear-gradient(to bottom, transparent, var(--color-surface))',
                                  pointerEvents: 'none'
                                }} />
                              </div>
                            );
                          }
                          
                          return (
                            <div
                              dangerouslySetInnerHTML={{ __html: note.content }}
                              style={{
                                fontSize: 13,
                                color: 'var(--color-text-secondary)',
                                lineHeight: 1.4,
                              }}
                            />
                          );
                        })() : null}
                        
                        <Row style={{ gap: 8, marginTop: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                          <Row style={{ gap: 8 }}>
                            <Button small title="Edit" variant="secondary" onPress={() => startEditingNote(note)} />
                            <Button small title="Delete" variant="ghost" onPress={() => store.deleteNote(note.id)} />
                          </Row>
                          {note.content && note.content.length > 300 && (
                            <Button 
                              small 
                              title={expandedNoteIds[note.id] ? "Show Less" : "Show More"} 
                              variant="secondary" 
                              onPress={() => setExpandedNoteIds(prev => ({ ...prev, [note.id]: !prev[note.id] }))} 
                            />
                          )}
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
                store.loadingSections?.savedLinks ? (
                  <LottieLoader text="Syncing Links..." size={120} />
                ) : (
                  <EmptyState title="No links yet" />
                )
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
                store.loadingSections?.futureIdeas ? (
                  <LottieLoader text="Syncing Ideas..." size={120} />
                ) : (
                  <EmptyState title="No ideas yet" />
                )
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
                        {idea.description ? (() => {
                          const isLong = idea.description.length > 300;
                          const expanded = expandedIdeaIds[idea.id];
                          
                          if (isLong && !expanded) {
                            return (
                              <div style={{ position: 'relative', maxHeight: '120px', overflow: 'hidden' }}>
                                <div
                                  dangerouslySetInnerHTML={{ __html: idea.description }}
                                  style={{
                                    fontSize: 13,
                                    color: 'var(--color-text-secondary)',
                                    lineHeight: 1.4,
                                  }}
                                />
                                <div style={{
                                  position: 'absolute',
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                  height: 40,
                                  background: 'linear-gradient(to bottom, transparent, var(--color-surface))',
                                  pointerEvents: 'none'
                                }} />
                              </div>
                            );
                          }
                          
                          return (
                            <div
                              dangerouslySetInnerHTML={{ __html: idea.description }}
                              style={{
                                fontSize: 13,
                                color: 'var(--color-text-secondary)',
                                lineHeight: 1.4,
                              }}
                            />
                          );
                        })() : null}
                        
                        <Row style={{ gap: 8, marginTop: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                          <Row style={{ gap: 8 }}>
                            <Button small title="Edit" variant="secondary" onPress={() => startEditingIdea(idea)} />
                            <Button small title="Delete" variant="ghost" onPress={() => store.deleteFutureIdea(idea.id)} />
                          </Row>
                          {idea.description && idea.description.length > 300 && (
                            <Button 
                              small 
                              title={expandedIdeaIds[idea.id] ? "Show Less" : "Show More"} 
                              variant="secondary" 
                              onPress={() => setExpandedIdeaIds(prev => ({ ...prev, [idea.id]: !prev[idea.id] }))} 
                            />
                          )}
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

      {tab === 'markdown' && (
        <>
          <input
            type="file"
            ref={fileInputRef}
            accept=".md"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />

          {selectedFileId ? (() => {
            const file = store.markdownFiles?.find((f) => f.id === selectedFileId);
            if (!file) return null;
            
            let htmlContent = '';
            try {
              htmlContent = marked.parse(file.content) as string;
            } catch (err) {
              htmlContent = '<p>Error rendering markdown file.</p>';
            }

            return (
              <Card>
                <Row style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid var(--color-border)', paddingBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>{file.title}</span>
                  <Row style={{ gap: 8 }}>
                    <Button small title="Close Reader" variant="secondary" onPress={() => setSelectedFileId(null)} />
                    <Button
                      small
                      title="Delete"
                      variant="ghost"
                      onPress={() => {
                        if (confirm('Are you sure you want to delete this file?')) {
                          store.deleteMarkdownFile(file.id);
                          setSelectedFileId(null);
                        }
                      }}
                    />
                  </Row>
                </Row>

                <div 
                  className="markdown-body"
                  dangerouslySetInnerHTML={{ __html: htmlContent }} 
                  style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 6 }}
                />

                <style
                  dangerouslySetInnerHTML={{
                    __html: `
                      .markdown-body {
                        color: var(--color-text);
                        line-height: 1.6;
                        font-size: 14px;
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                      }
                      .markdown-body::-webkit-scrollbar {
                        display: none;
                      }
                      .markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4 {
                        margin-top: 1.2em;
                        margin-bottom: 0.6em;
                        font-weight: 700;
                        color: var(--color-text);
                      }
                      .markdown-body h1 { font-size: 1.6em; border-bottom: 1px solid var(--color-border); padding-bottom: 0.3em; }
                      .markdown-body h2 { font-size: 1.3em; border-bottom: 1px solid var(--color-border); padding-bottom: 0.2em; }
                      .markdown-body h3 { font-size: 1.15em; }
                      .markdown-body p { margin-bottom: 0.8em; }
                      .markdown-body ul, .markdown-body ol { padding-left: 1.5em; margin-bottom: 0.8em; }
                      .markdown-body li { margin-bottom: 0.25em; }
                      .markdown-body code {
                        background-color: var(--color-surface-muted);
                        padding: 0.2em 0.4em;
                        border-radius: var(--radius-sm);
                        font-family: monospace;
                        font-size: 0.85em;
                        border: 1px solid var(--color-border);
                      }
                      .markdown-body pre {
                        background-color: var(--color-surface-muted);
                        padding: 0.8em;
                        border-radius: var(--radius-md);
                        overflow-x: auto;
                        margin-bottom: 0.8em;
                        border: 1px solid var(--color-border);
                      }
                      .markdown-body pre code {
                        background-color: transparent;
                        padding: 0;
                        border-radius: 0;
                        font-size: inherit;
                        border: none;
                      }
                      .markdown-body table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 0.8em;
                        font-size: 0.9em;
                      }
                      .markdown-body th, .markdown-body td {
                        border: 1px solid var(--color-border);
                        padding: 0.4em 0.6em;
                        text-align: left;
                      }
                      .markdown-body th {
                        background-color: var(--color-surface-muted);
                        font-weight: bold;
                      }
                      .markdown-body blockquote {
                        border-left: 4px solid var(--color-primary);
                        padding-left: 0.8em;
                        color: var(--color-text-secondary);
                        margin: 0 0 0.8em 0;
                        font-style: italic;
                      }
                      .markdown-body hr {
                        border: 0;
                        border-top: 1px solid var(--color-border);
                        margin: 1.5em 0;
                      }
                    `,
                  }}
                />
              </Card>
            );
          })() : (
            <>
              {isCreatingDoc ? (
                <Card>
                  <span style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>New Markdown Document</span>
                  <Input value={newDocTitle} onChangeText={setNewDocTitle} placeholder="Document title" />
                  <textarea
                    value={newDocContent}
                    onChange={(e) => setNewDocContent(e.target.value)}
                    placeholder="Write or paste markdown text here..."
                    style={{
                      width: '100%',
                      minHeight: 200,
                      padding: 10,
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-surface-muted)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                      fontFamily: 'monospace',
                      fontSize: 13,
                      resize: 'vertical',
                      outline: 'none',
                      marginTop: 6,
                      marginBottom: 8,
                    }}
                  />
                  <Row style={{ gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                    <Button
                      title="Cancel"
                      variant="secondary"
                      onPress={() => {
                        setIsCreatingDoc(false);
                        setNewDocTitle('');
                        setNewDocContent('');
                      }}
                    />
                    <Button
                      title="Save Document"
                      onPress={() => {
                        if (!newDocTitle.trim()) return;
                        store.addMarkdownFile({ title: newDocTitle.trim(), content: newDocContent });
                        setNewDocTitle('');
                        setNewDocContent('');
                        setIsCreatingDoc(false);
                      }}
                      disabled={!newDocTitle.trim()}
                    />
                  </Row>
                </Card>
              ) : (
                <>
                  <Row style={{ gap: 8, marginBottom: 12 }}>
                    <Button title="+ Upload Markdown File" onPress={() => fileInputRef.current?.click()} />
                    <Button title="+ Write Markdown Document" variant="secondary" onPress={() => setIsCreatingDoc(true)} />
                  </Row>

                  {(store.markdownFiles || []).length === 0 ? (
                    store.loadingSections?.markdownFiles ? (
                      <LottieLoader text="Syncing Markdown Docs..." size={120} />
                    ) : (
                      <EmptyState title="No markdown files yet" subtitle="Upload or write `.md` documents to read them visually" />
                    )
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                      {(store.markdownFiles || []).map((file) => (
                        <Card key={file.id} style={{ justifyContent: 'space-between', display: 'flex', flexDirection: 'column', minHeight: 110 }}>
                          <div>
                            <span style={{ fontWeight: 700, display: 'block', marginBottom: 4 }}>{file.title}</span>
                            <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                              Uploaded: {new Date(file.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <Row style={{ gap: 8, marginTop: 12 }}>
                            <Button small title="Read" onPress={() => setSelectedFileId(file.id)} />
                            <Button small title="Delete" variant="ghost" onPress={() => {
                              if (confirm('Are you sure you want to delete this file?')) {
                                store.deleteMarkdownFile(file.id);
                              }
                            }} />
                          </Row>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}

      {tab === 'roadmap' && (() => {
        const docs = store.markdownFiles || [];
        let steps: RoadmapStep[] = [];
        let sourceTitle = 'DSA 6-Month Roadmap';

        if (roadmapSource === 'dsa_public') {
          if (publicRoadmapContent) {
            steps = parseRoadmap(publicRoadmapContent);
          }
          if (steps.length === 0) {
            steps = defaultDSARoadmap;
          }
        } else {
          const doc = docs.find(d => d.id === roadmapSource);
          if (doc) {
            steps = parseRoadmap(doc.content);
            sourceTitle = doc.title;
          }
        }

        const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card>
              <Row style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 16, display: 'block' }}>Roadmap Timeline Visualizer</span>
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    Visualizing: <strong>{sourceTitle}</strong>
                  </span>
                </div>
                <div>
                  <select
                    value={roadmapSource}
                    onChange={(e) => setRoadmapSource(e.target.value)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--color-surface-muted)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  >
                    <option value="dsa_public">DSA-Roadmap.md (Public)</option>
                    {docs.map(doc => (
                      <option key={doc.id} value={doc.id}>{doc.title} (Vault)</option>
                    ))}
                  </select>
                </div>
              </Row>
            </Card>

            {steps.length === 0 ? (
              <EmptyState title="Empty Roadmap" subtitle="No topics or headings found in the selected file." />
            ) : (
              <div 
                className="timeline-container"
                style={{ 
                  position: 'relative', 
                  paddingLeft: 44, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 16,
                  marginTop: 10 
                }}
              >
                <div 
                  style={{
                    position: 'absolute',
                    left: 17,
                    top: 15,
                    bottom: 15,
                    width: 2,
                    borderLeft: '2px dashed var(--color-border)',
                    opacity: 0.7,
                  }}
                />

                {steps.map((step, sIdx) => {
                  const color = colors[sIdx % colors.length];
                  const formattedIndex = step.index.toString().padStart(2, '0');

                  return (
                    <div key={sIdx} style={{ position: 'relative' }}>
                      <div
                        style={{
                          position: 'absolute',
                          left: -39,
                          top: 10,
                          width: 26,
                          height: 26,
                          borderRadius: '50%',
                          border: `2px solid ${color}`,
                          backgroundColor: 'var(--color-surface)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          fontWeight: 700,
                          color: color,
                          zIndex: 2,
                          boxShadow: '0 0 0 4px var(--color-surface)',
                        }}
                      >
                        {formattedIndex}
                      </div>

                      <Card style={{ borderLeft: `4px solid ${color}`, padding: 16, margin: 0 }}>
                        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text)', display: 'block', marginBottom: 10 }}>
                          {step.title}
                        </span>

                        {step.bullets && step.bullets.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {step.bullets.map((bullet, bIdx) => (
                              <Row key={bIdx} style={{ alignItems: 'flex-start', gap: 6 }}>
                                <span 
                                  style={{ 
                                    color: color, 
                                    fontWeight: 'bold', 
                                    fontSize: 13, 
                                    lineHeight: '18px',
                                    transform: 'scaleY(0.9)',
                                    display: 'inline-block' 
                                  }}
                                >
                                  &gt;
                                </span>
                                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.4, flex: 1 }}>
                                  {bullet}
                                </span>
                              </Row>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                            No subtopics found under this section.
                          </span>
                        )}
                      </Card>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
