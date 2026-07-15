import { useMemo, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import {
  Button, Card, Input, Row, SectionHeader, EmptyState,
  DateStrip, SegmentedControl, CheckRow, CategoryIcon, AIButton,
} from '@/components/ui';
import { Spacing, Radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/store/useAppStore';
import { todayISO, addDays, timeToMins, formatTimeLabel } from '@/lib/dates';
import { confirmFullyDone } from '@/lib/confirm';
import { Todo } from '@/types';

const STATUS_TABS = [
  { key: 'todo', label: 'To do' },
  { key: 'completed', label: 'Completed' },
  { key: 'pending', label: 'Pending' },
];

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildWeek(selectedDate: string) {
  const today = todayISO();
  // Anchor the strip to the Monday of the week containing `today`.
  const todayDow = new Date(today + 'T00:00:00').getDay(); // 0=Sun
  const mondayOffset = todayDow === 0 ? -6 : 1 - todayDow;
  const monday = addDays(today, mondayOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    const dow = new Date(date + 'T00:00:00').getDay();
    return {
      key: date,
      dayLabel: DOW_LABELS[dow],
      dateLabel: String(Number(date.slice(8, 10))),
      isSelected: date === selectedDate,
      isToday: date === today,
    };
  });
}

function formatSlotRange(startTime?: string, endTime?: string) {
  if (!startTime || !endTime) return null;
  return `${formatTimeLabel(startTime)} - ${formatTimeLabel(endTime)}`;
}

function todoSortValue(todo: Todo) {
  return todo.order ?? todo.updatedAt ?? todo.createdAt;
}

export default function TodayScreen() {
  const store = useAppStore();
  const colors = useTheme();
  const dragLib = Platform.OS === 'web' ? null : require('react-native-draggable-flatlist');
  const ScaleDecorator: any = dragLib?.ScaleDecorator;
  const NestableDraggableFlatList: any = dragLib?.NestableDraggableFlatList;
  const NestableScrollContainer: any = dragLib?.NestableScrollContainer;
  const [quickAddText, setQuickAddText] = useState('');
  const [quickStartTime, setQuickStartTime] = useState('');
  const [quickEndTime, setQuickEndTime] = useState('');
  const [statusTab, setStatusTab] = useState('todo');
  const today = todayISO();
  const [selectedDate, setSelectedDate] = useState(today);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const week = useMemo(() => buildWeek(selectedDate), [selectedDate]);

  const dayPlan = store.dayPlans.find((dp) => dp.date === selectedDate);
  const dateTodos = useMemo(
    () => [...store.todos].filter((t) => t.dueDate === selectedDate).sort((a, b) => todoSortValue(a) - todoSortValue(b)),
    [store.todos, selectedDate]
  );

  const filteredTodos = dateTodos.filter((t) => {
    if (statusTab === 'completed') return t.status === 'done';
    if (statusTab === 'pending') return t.status === 'needs_review' || t.status === 'skipped';
    return t.status === 'pending' || t.status === 'in_progress' || t.status === 'shifted';
  });

  const timeSlotById = new Map((dayPlan?.timeSlots ?? []).map((s) => [s.id, s]));

  const groups: Record<string, Todo[]> = { Morning: [], Workload: [], Night: [] };
  for (const t of filteredTodos) {
    const slot = t.timeSlotId ? timeSlotById.get(t.timeSlotId) : undefined;
    const bucket = slot ? (timeToMins(slot.startTime) < 12 * 60 ? 'Morning' : timeToMins(slot.startTime) < 18 * 60 ? 'Workload' : 'Night') : 'Workload';
    groups[bucket].push(t);
  }

  const todoListItems = filteredTodos;

  const topicsOnTodoDate = useMemo(() => {
    if (!selectedTodo || !selectedTodo.dueDate) return [];
    return store.roadmapNodes.filter((node) => {
      if (node.categoryId !== selectedTodo.categoryId) return false;
      const dateStr = selectedTodo.dueDate;
      if (node.startDate && node.completeDate) {
        return dateStr >= node.startDate && dateStr <= node.completeDate;
      }
      if (node.completeDate) {
        return dateStr === node.completeDate;
      }
      if (node.startDate) {
        return dateStr === node.startDate;
      }
      return false;
    });
  }, [selectedTodo, store.roadmapNodes]);

  const totalTodos = dateTodos.length;
  const doneTodos = dateTodos.filter((t) => t.status === 'done').length;
  const completionPct = totalTodos === 0 ? 0 : Math.round((doneTodos / totalTodos) * 100);

  const greetingName = store.user?.email ? store.user.email.split('@')[0] : 'there';

  const addQuickTodo = () => {
    if (!quickAddText.trim()) return;

    let fullTitle = quickAddText.trim();
    if (quickStartTime.trim() && quickEndTime.trim()) {
      fullTitle = `${fullTitle} ${quickStartTime.trim()} - ${quickEndTime.trim()}`;
    }

    store.addManualTodo({
      categoryId: store.categories[0]?.id || '',
      roadmapNodeId: null,
      title: fullTitle,
      description: '',
      status: 'pending',
      priority: 'medium',
      dueDate: selectedDate,
      timeSlotId: null,
      shiftCount: 0,
      checklist: [],
    });

    setQuickAddText('');
    setQuickStartTime('');
    setQuickEndTime('');
  };

  const handleToggleTodo = async (todo: Todo) => {
    if (todo.status === 'done') {
      store.setTodoStatus(todo.id, 'pending');
      return;
    }
    if (store.topicFitsSlot(todo.id)) {
      store.resolveTodoCompletion(todo.id, true);
      return;
    }
    const node = todo.roadmapNodeId
      ? store.roadmapNodes.find((n) => n.id === todo.roadmapNodeId)
      : undefined;
    const fullyDone = await confirmFullyDone(node?.title || todo.title);
    store.resolveTodoCompletion(todo.id, fullyDone);
  };

  const openEditTodo = (todo: Todo) => {
    setEditingTodo(todo);
    setEditTitle(todo.title);
    setEditDescription(todo.description);
  };

  const openTodoDetails = (todo: Todo) => {
    setSelectedTodo(todo);
  };

  const saveTodoEdit = () => {
    if (!editingTodo || !editTitle.trim()) return;
    store.updateTodo(editingTodo.id, {
      title: editTitle.trim(),
      description: editDescription.trim(),
    });
    setEditingTodo(null);
  };

  const confirmDeleteTodo = (todo: Todo) => {
    const message = `Delete "${todo.title}"? This cannot be undone.`;
    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        store.deleteTodo(todo.id);
      }
      return;
    }
    Alert.alert('Delete todo', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => store.deleteTodo(todo.id) },
    ]);
  };

  const renderTodoRow = (
    todo: Todo,
    drag: () => void,
    isActive: boolean,
  ) => {
    const category = store.categories.find((c) => c.id === todo.categoryId);
    const node = todo.roadmapNodeId
      ? store.roadmapNodes.find((n) => n.id === todo.roadmapNodeId)
      : undefined;
    const slot = todo.timeSlotId ? timeSlotById.get(todo.timeSlotId) : undefined;
    const slotRange = slot ? formatSlotRange(slot.startTime, slot.endTime) : todo.description;
    const subtitleParts: string[] = slotRange ? [slotRange] : [];
    if (node && node.title !== todo.title) {
      subtitleParts.push(`↳ ${node.title}`);
    }
    return (
      <ScaleDecorator>
        <View style={{ opacity: isActive ? 0.9 : 1 }}>
          <CheckRow
            emoji={category?.icon}
            label={todo.title}
            subtitle={subtitleParts.join(' • ')}
            done={todo.status === 'done'}
            onToggle={() => handleToggleTodo(todo)}
            onLabelPress={() => openTodoDetails(todo)}
            onLongPress={drag}
            rightActions={
              <>
                <IconButton
                  label="Edit todo"
                  onPress={() => openEditTodo(todo)}
                  icon={<EditCircleIcon />}
                />
                <IconButton
                  label="Delete todo"
                  onPress={() => confirmDeleteTodo(todo)}
                  icon={<TrashIcon />}
                />
              </>
            }
          />
        </View>
      </ScaleDecorator>
    );
  };

  const renderGroup = (name: string, items: Todo[]) => {
    if (items.length === 0) return null;
    return (
      <Card key={name} style={{ marginBottom: Spacing.two }}>
        <ThemedText type="bodyBold" style={{ marginBottom: 2 }}>{name}</ThemedText>
        <View>
          {items.map((todo) => {
            const category = store.categories.find((c) => c.id === todo.categoryId);
            const node = todo.roadmapNodeId
              ? store.roadmapNodes.find((n) => n.id === todo.roadmapNodeId)
              : undefined;
            const slot = todo.timeSlotId ? timeSlotById.get(todo.timeSlotId) : undefined;
            const slotRange = slot ? formatSlotRange(slot.startTime, slot.endTime) : todo.description;
            const subtitleParts: string[] = slotRange ? [slotRange] : [];
            if (node && node.title !== todo.title) {
              subtitleParts.push(`↳ ${node.title}`);
            }
            return (
              <CheckRow
                key={todo.id}
                emoji={category?.icon}
                label={todo.title}
                subtitle={subtitleParts.join(' • ') || undefined}
                done={todo.status === 'done'}
                onToggle={() => handleToggleTodo(todo)}
                onLabelPress={() => openTodoDetails(todo)}
                rightActions={
                  <>
                    <IconButton
                      label="Edit todo"
                      onPress={() => openEditTodo(todo)}
                      icon={<EditCircleIcon />}
                    />
                    <IconButton
                      label="Delete todo"
                      onPress={() => confirmDeleteTodo(todo)}
                      icon={<TrashIcon />}
                    />
                  </>
                }
              />
            );
          })}
        </View>
      </Card>
    );
  };

  const renderTodoDraggableList = () => {
    if (todoListItems.length === 0) {
      return (
        <Card>
          <EmptyState
            title="Nothing here"
            subtitle="Drag tasks here once you create them"
          />
        </Card>
      );
    }

    if (Platform.OS === 'web') {
      return (
        <Card>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.one }}>
            <ThemedText type="bodyBold">To do</ThemedText>
            <Row style={{ gap: Spacing.two, alignItems: 'center' }}>
              <Button
                small
                variant="secondary"
                title="⏱ Auto Arrange"
                onPress={() => store.autoArrangeTodosByTime(selectedDate)}
              />
              <ThemedText type="small" themeColor="textSecondary">
                Drag to reorder is available on mobile
              </ThemedText>
            </Row>
          </Row>
          <View>
            {todoListItems.map((todo) => {
              const category = store.categories.find((c) => c.id === todo.categoryId);
              const node = todo.roadmapNodeId
                ? store.roadmapNodes.find((n) => n.id === todo.roadmapNodeId)
                : undefined;
              const slot = todo.timeSlotId ? timeSlotById.get(todo.timeSlotId) : undefined;
              const slotRange = slot ? formatSlotRange(slot.startTime, slot.endTime) : todo.description;
              const subtitleParts: string[] = slotRange ? [slotRange] : [];
              if (node && node.title !== todo.title) {
                subtitleParts.push(`↳ ${node.title}`);
              }
              return (
                <CheckRow
                  key={todo.id}
                  emoji={category?.icon}
                  label={todo.title}
                  subtitle={subtitleParts.join(' • ') || undefined}
                  done={todo.status === 'done'}
                  onToggle={() => handleToggleTodo(todo)}
                  onLabelPress={() => openTodoDetails(todo)}
                  rightActions={
                    <>
                      <IconButton
                        label="Edit todo"
                        onPress={() => openEditTodo(todo)}
                        icon={<EditCircleIcon />}
                      />
                      <IconButton
                        label="Delete todo"
                        onPress={() => confirmDeleteTodo(todo)}
                        icon={<TrashIcon />}
                      />
                    </>
                  }
                />
              );
            })}
          </View>
        </Card>
      );
    }

    return (
      <Card>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <ThemedText type="bodyBold">To do</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Long press and drag to reorder
          </ThemedText>
        </Row>

        <NestableDraggableFlatList
          data={todoListItems}
          keyExtractor={(item: Todo) => item.id}
          activationDistance={12}
          renderItem={({ item, drag, isActive }: { item: Todo; drag: () => void; isActive: boolean }) => renderTodoRow(item, drag, isActive)}
          onDragEnd={({ data }: { data: Todo[] }) => store.reorderTodos(selectedDate, data.map((todo: Todo) => todo.id))}
        />
      </Card>
    );
  };

  const hasAnyGroupItems = Object.values(groups).some((g) => g.length > 0);

  const screenContent = (
    <>

        {/* ─── Greeting header ─── */}
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: Spacing.one }}>
          <View>
            <ThemedText type="heading" style={{ textTransform: 'capitalize' }}>
              Hey, {greetingName} 👋
            </ThemedText>
            <ThemedText type="body" themeColor="textSecondary" style={{ fontStyle: 'italic', marginTop: 2 }}>
              Let's make progress today!
            </ThemedText>
          </View>
          <View style={[styles.sunBadge, { backgroundColor: colors.surface }]}>
            <ThemedText style={{ fontSize: 20 }}>☀️</ThemedText>
          </View>
        </Row>

        {/* ─── Date strip ─── */}
        <DateStrip days={week} onSelect={setSelectedDate} />

        {/* ─── Progress summary ─── */}
        <Card>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <ThemedText type="heading" style={{ fontSize: 24 }}>
                {completionPct}%
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {doneTodos} / {totalTodos} tasks done
              </ThemedText>
            </View>
            <View style={styles.streakBadge}>
              <ThemedText style={{ fontSize: 22 }}>🔥</ThemedText>
              <ThemedText type="small" style={{ color: '#D97706', fontWeight: '700' }}>
                {store.getStreak()} day streak
              </ThemedText>
            </View>
          </Row>
        </Card>

        {/* ─── Segmented status tabs ─── */}
        <SegmentedControl options={STATUS_TABS} value={statusTab} onChange={setStatusTab} />

        {/* ─── Grouped todo lists ─── */}
        {statusTab === 'todo' ? (
          renderTodoDraggableList()
        ) : hasAnyGroupItems ? (
          <>
            {renderGroup('Morning', groups.Morning)}
            {renderGroup('Workload', groups.Workload)}
            {renderGroup('Night', groups.Night)}
          </>
        ) : (
          <Card>
            <EmptyState
              title="Nothing here"
              subtitle={
                totalTodos === 0
                  ? "Go to the Timetable tab and tap 'Allocate Today' to populate your day"
                  : 'No tasks in this view'
              }
            />
          </Card>
        )}

        {/* ─── Quick Add ─── */}
        <SectionHeader title="Quick Add" />
        <Card>
          <Input
            value={quickAddText}
            onChangeText={setQuickAddText}
            placeholder="Add a quick todo…"
          />
          <Row style={{ gap: Spacing.two, marginTop: Spacing.two }}>
            <View style={{ flex: 1 }}>
              <Input
                value={quickStartTime}
                onChangeText={setQuickStartTime}
                placeholder="Start (e.g. 8:00 AM)"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                value={quickEndTime}
                onChangeText={setQuickEndTime}
                placeholder="End (e.g. 9:30 AM)"
              />
            </View>
          </Row>
          <Row style={{ marginTop: 8, gap: 8, alignItems: 'center' }}>
            <Button title="Add" onPress={addQuickTodo} disabled={!quickAddText.trim()} />
            <AIButton
              title="Generate from roadmap"
              onPress={() => store.generateToday()}
            />
          </Row>
        </Card>
    </>
  );

  return (
    <ThemedView style={{ flex: 1 }}>
      {Platform.OS === 'web' ? (
        <ScrollView contentContainerStyle={styles.content}>{screenContent}</ScrollView>
      ) : (
        <NestableScrollContainer contentContainerStyle={styles.content}>{screenContent}</NestableScrollContainer>
      )}

      <Modal
        visible={Boolean(editingTodo)}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingTodo(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}> 
            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit todo</Text>
            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Title</Text>
            <Input value={editTitle} onChangeText={setEditTitle} placeholder="Todo title" />
            <Text style={[styles.modalLabel, { color: colors.textSecondary, marginTop: 10 }]}>Description</Text>
            <Input
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder="Add details"
              multiline
              style={{ minHeight: 96 }}
            />
            <Row style={{ justifyContent: 'flex-end', marginTop: 14 }}>
              <Button title="Cancel" variant="secondary" onPress={() => setEditingTodo(null)} />
              <Button title="Save" onPress={saveTodoEdit} disabled={!editTitle.trim()} />
            </Row>
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(selectedTodo)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedTodo(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}> 
            <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <ThemedText type="title">{selectedTodo?.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {selectedTodo ? selectedDate : ''}
                </ThemedText>
              </View>
              <TouchableOpacity onPress={() => setSelectedTodo(null)}>
                <ThemedText style={{ color: colors.error, fontWeight: '700' }}>Close</ThemedText>
              </TouchableOpacity>
            </Row>

            {selectedTodo ? (
              <View style={{ gap: 10, marginTop: 8 }}>
                <Card>
                  <ThemedText type="small" themeColor="textSecondary">Status</ThemedText>
                  <ThemedText type="bodyBold">{selectedTodo.status}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 6 }}>Priority</ThemedText>
                  <ThemedText type="bodyBold">{selectedTodo.priority}</ThemedText>
                </Card>

                <Card>
                  <ThemedText type="small" themeColor="textSecondary">Category</ThemedText>
                  <ThemedText type="bodyBold">
                    {store.categories.find((cat) => cat.id === selectedTodo.categoryId)?.name || 'Unassigned'}
                  </ThemedText>

                  <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 6 }}>Schedule</ThemedText>
                  <ThemedText type="bodyBold">
                    {selectedTodo.timeSlotId
                      ? (() => {
                          const slot = dayPlan?.timeSlots.find((timeSlot) => timeSlot.id === selectedTodo.timeSlotId);
                          return slot ? `${formatSlotRange(slot.startTime, slot.endTime)}${slot.label ? ` • ${slot.label}` : ''}` : 'No slot';
                        })()
                      : 'No slot'}
                  </ThemedText>

                  <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 6 }}>Linked Topic</ThemedText>
                  <ThemedText type="bodyBold">
                    {selectedTodo.roadmapNodeId
                      ? store.roadmapNodes.find((node) => node.id === selectedTodo.roadmapNodeId)?.title || 'Topic not found'
                      : 'Manual todo'}
                  </ThemedText>

                  {topicsOnTodoDate.length > 0 && (
                    <>
                      <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 6 }}>Topics to cover on this date</ThemedText>
                      <View style={{ gap: 4, marginTop: 2 }}>
                        {topicsOnTodoDate.map((topic) => (
                          <ThemedText key={topic.id} type="bodyBold" style={{ color: '#4F46E5' }}>
                            📚 {topic.title}
                          </ThemedText>
                        ))}
                      </View>
                    </>
                  )}

                  <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 6 }}>Description</ThemedText>
                  <ThemedText>
                    {selectedTodo.description || 'No description'}
                  </ThemedText>
                </Card>

                <Card>
                  <ThemedText type="small" themeColor="textSecondary">Checklist</ThemedText>
                  {selectedTodo.checklist.length === 0 ? (
                    <ThemedText style={{ marginTop: 4 }}>No checklist items</ThemedText>
                  ) : (
                    <View style={{ gap: 4, marginTop: 4 }}>
                      {selectedTodo.checklist.map((item) => (
                        <ThemedText key={item.id}>
                          {item.done ? '✓' : '○'} {item.text}
                        </ThemedText>
                      ))}
                    </View>
                  )}
                </Card>

                <Card>
                  <ThemedText type="small" themeColor="textSecondary">Progress</ThemedText>
                  <ThemedText type="bodyBold">
                    {selectedTodo.checklist.length === 0
                      ? selectedTodo.status === 'done' ? 'Completed' : 'Not started'
                      : `${Math.round((selectedTodo.checklist.filter((item) => item.done).length / selectedTodo.checklist.length) * 100)}% checklist done`}
                  </ThemedText>
                </Card>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

function IconButton({ label, onPress, icon }: { label: string; onPress: () => void; icon: React.ReactNode }) {
  const colors = useTheme();
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.iconButton, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
    >
      {icon}
    </TouchableOpacity>
  );
}

function EditCircleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <Path d="M12 15l8.385 -8.415a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3" />
      <Path d="M16 5l3 3" />
      <Path d="M9 7.07a7 7 0 0 0 1 13.93a7 7 0 0 0 6.929 -6" />
    </Svg>
  );
}

function TrashIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <Path d="M4 7l16 0" />
      <Path d="M10 11l0 6" />
      <Path d="M14 11l0 6" />
      <Path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
      <Path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.three, gap: Spacing.three, paddingBottom: 140 },

  sunBadge: {
    width: 44,
    height: 44,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  streakBadge: {
    alignItems: 'center',
    gap: 2,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
  },

  modalCard: {
    width: '100%',
    borderRadius: Radii.lg,
    padding: Spacing.three,
    gap: Spacing.one,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },

  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },

  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  draggableList: {
    marginTop: Spacing.one,
  },
});
