'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { LottieLoader } from '@/components/LottieLoader';
import { Button, Card, Input, SectionHeader } from '@/components/ui';
import { TodoItem } from '@/components/TodoItem';
import { useAppStore } from '@/store/useAppStore';

export default function NodeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const store = useAppStore();

  useEffect(() => {
    store.syncWithCloud(['categories', 'roadmapNodes']);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const node = store.roadmapNodes.find((n) => n.id === id);
  const [description, setDescription] = useState(node?.description || '');
  const [subtopicTitle, setSubtopicTitle] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  if (!node) {
    if (store.loadingSections?.roadmapNodes) {
      return <LottieLoader text="Loading Topic..." size={120} />;
    }
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <span>Topic not found</span>
      </div>
    );
  }

  const linkedTodos = store.todos.filter((t) => t.roadmapNodeId === id);

  const saveDescription = () => {
    store.updateRoadmapNode(id, { description });
    setIsEditing(false);
  };

  const addSubtopic = () => {
    if (!subtopicTitle.trim()) return;
    store.addRoadmapNode({
      categoryId: node.categoryId,
      title: subtopicTitle.trim(),
      description: '',
      estimatedDurationMins: 30,
      status: 'pending',
      parentId: id,
      order: 0,
    });
    setSubtopicTitle('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <SectionHeader title={node.title} />

      <Card>
        <span style={{ fontWeight: 700, marginBottom: 4, display: 'block' }}>Status</span>
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{node.status}</span>

        <span style={{ fontWeight: 700, marginTop: 8, marginBottom: 4, display: 'block' }}>Estimated Duration</span>
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{node.estimatedDurationMins} minutes</span>

        <Button
          small
          title={isEditing ? 'Save' : 'Edit Description'}
          onPress={() => {
            if (isEditing) saveDescription();
            else setIsEditing(true);
          }}
          style={{ marginTop: 8 }}
        />
      </Card>

      {isEditing && (
        <Card>
          <Input value={description} onChangeText={setDescription} placeholder="Description" multiline />
        </Card>
      )}

      <SectionHeader title="Add Sub-topic" />
      <Card>
        <Input value={subtopicTitle} onChangeText={setSubtopicTitle} placeholder="Sub-topic title" />
        <Button title="Add" onPress={addSubtopic} disabled={!subtopicTitle.trim()} />
      </Card>

      {linkedTodos.length > 0 && (
        <>
          <SectionHeader title="Linked Todos" />
          {linkedTodos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} onComplete={() => store.setTodoStatus(todo.id, 'done')} />
          ))}
        </>
      )}
    </div>
  );
}
