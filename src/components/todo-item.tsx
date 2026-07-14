import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';
import { Card, Button, Row, CheckRow } from './ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Todo, Category } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { confirmFullyDone } from '@/lib/confirm';

interface TodoItemProps {
  todo: Todo;
  category?: Category;
  onComplete?: () => void;
  onSkip?: () => void;
  onDelete?: () => void;
}

export function TodoItem({
  todo,
  category,
  onComplete,
  onSkip,
  onDelete,
}: TodoItemProps) {
  const colors = useTheme();
  const store = useAppStore();
  const isDone = todo.status === 'done';

  const statusLabel =
    todo.status === 'shifted'
      ? '⤴ Shifted'
      : todo.status === 'skipped'
        ? 'Skipped'
        : todo.status === 'needs_review'
          ? '⚠ Needs review'
          : null;

  const handleToggle = async () => {
    if (isDone) {
      store.setTodoStatus(todo.id, 'pending');
      return;
    }
    if (store.topicFitsSlot(todo.id)) {
      store.resolveTodoCompletion(todo.id, true);
    } else {
      const node = todo.roadmapNodeId
        ? store.roadmapNodes.find((n) => n.id === todo.roadmapNodeId)
        : undefined;
      const fullyDone = await confirmFullyDone(node?.title || todo.title);
      store.resolveTodoCompletion(todo.id, fullyDone);
    }
    onComplete && onComplete();
  };

  return (
    <Card>
      <CheckRow
        emoji={category?.icon}
        label={todo.title}
        done={isDone}
        onToggle={handleToggle}
        subtitle={todo.description || undefined}
      />

      {(statusLabel || todo.shiftCount > 0) ? (
        <ThemedText type="small" themeColor="textSecondary">
          {statusLabel} {todo.shiftCount > 0 ? `(${todo.shiftCount}x)` : ''}
        </ThemedText>
      ) : null}

      {todo.checklist.length > 0 ? (
        <View style={{ gap: 2, marginTop: Spacing.one }}>
          {todo.checklist.map((item) => (
            <CheckRow
              key={item.id}
              label={item.text}
              done={item.done}
              onToggle={() => store.toggleChecklistItem(todo.id, item.id)}
            />
          ))}
        </View>
      ) : null}

      {(onSkip || onDelete) ? (
        <Row style={{ marginTop: Spacing.one }}>
          {onSkip ? (
            <Button
              small
              title="Skip"
              onPress={onSkip}
              variant={todo.status === 'skipped' ? 'primary' : 'secondary'}
            />
          ) : null}
          {onDelete ? <Button small title="Delete" onPress={onDelete} variant="ghost" /> : null}
        </Row>
      ) : null}
    </Card>
  );
}
