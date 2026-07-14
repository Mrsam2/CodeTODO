import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Input, Row, SectionHeader } from '@/components/ui';
import { TodoItem } from '@/components/todo-item';
import { Spacing } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';

export default function NodeDetailScreen() {
  const { id } = useLocalSearchParams() as { id: string };
  const store = useAppStore();
  const node = store.roadmapNodes.find((n) => n.id === id);
  const [description, setDescription] = useState(node?.description || '');
  const [subtopicTitle, setSubtopicTitle] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  if (!node) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText>Topic not found</ThemedText>
      </ThemedView>
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
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader title={node.title} />

        <Card>
          <ThemedText type="bodyBold" style={{ marginBottom: Spacing.one }}>
            Status
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {node.status}
          </ThemedText>

          <ThemedText type="bodyBold" style={{ marginTop: Spacing.two, marginBottom: Spacing.one }}>
            Estimated Duration
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {node.estimatedDurationMins} minutes
          </ThemedText>

          <Button
            small
            title={isEditing ? 'Save' : 'Edit Description'}
            onPress={() => {
              if (isEditing) {
                saveDescription();
              } else {
                setIsEditing(true);
              }
            }}
            style={{ marginTop: Spacing.two }}
          />
        </Card>

        {isEditing && (
          <Card>
            <Input
              value={description}
              onChangeText={setDescription}
              placeholder="Description"
              multiline
            />
          </Card>
        )}

        <SectionHeader title="Add Sub-topic" />
        <Card>
          <Input
            value={subtopicTitle}
            onChangeText={setSubtopicTitle}
            placeholder="Sub-topic title"
          />
          <Button title="Add" onPress={addSubtopic} disabled={!subtopicTitle.trim()} />
        </Card>

        {linkedTodos.length > 0 && (
          <>
            <SectionHeader title="Linked Todos" />
            {linkedTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onComplete={() => store.setTodoStatus(todo.id, 'done')}
              />
            ))}
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: 120 },
});
