'use client';

import { useMemo, useState } from 'react';
import { DndContext, DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, Card, Input, Row, SectionHeader, EmptyState, DateStrip, SegmentedControl, CheckRow, AIButton } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { todayISO, addDays, timeToMins, formatTimeLabel } from '@/lib/dates';
import { confirmFullyDone } from '@/lib/confirm';
import { Todo } from '@/types';
import styles from './page.module.css';

const STATUS_TABS = [
  { key: 'todo', label: 'To do' },
  { key: 'completed', label: 'Completed' },
  { key: 'pending', label: 'Pending' },
];

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildWeek(selectedDate: string) {
  const today = todayISO();
  const todayDow = new Date(today + 'T00:00:00').getDay();
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

function EditCircleIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12 15l8.385 -8.415a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3" />
      <path d="M16 5l3 3" />
      <path d="M9 7.07a7 7 0 0 0 1 13.93a7 7 0 0 0 6.929 -6" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M4 7l16 0" />
      <path d="M10 11l0 6" />
      <path d="M14 11l0 6" />
      <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
      <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
    </svg>
  );
}

function IconButton({ label, onPress, icon }: { label: string; onPress: () => void; icon: React.ReactNode }) {
  return (
    <button aria-label={label} onClick={onPress} className={styles.iconButton} suppressHydrationWarning>
      {icon}
    </button>
  );
}

function SortableTodoRow({
  todo,
  subtitle,
  onToggle,
  onLabelPress,
  onEdit,
  onDelete,
  emoji,
}: {
  todo: Todo;
  subtitle: string;
  onToggle: () => void;
  onLabelPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  emoji?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: todo.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <CheckRow
        emoji={emoji}
        label={todo.title}
        subtitle={subtitle || undefined}
        done={todo.status === 'done'}
        onToggle={onToggle}
        onLabelPress={onLabelPress}
        rightActions={
          <>
            <IconButton label="Edit todo" onPress={onEdit} icon={<EditCircleIcon />} />
            <IconButton label="Delete todo" onPress={onDelete} icon={<TrashIcon />} />
          </>
        }
      />
    </div>
  );
}

export default function TodayPage() {
  const store = useAppStore();
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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

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
  const todoListIds = todoListItems.map((t) => t.id);

  const topicsOnTodoDate = useMemo(() => {
    if (!selectedTodo || !selectedTodo.dueDate) return [];
    return store.roadmapNodes.filter((node) => {
      if (node.categoryId !== selectedTodo.categoryId) return false;
      const dateStr = selectedTodo.dueDate;
      if (node.startDate && node.completeDate) return dateStr >= node.startDate && dateStr <= node.completeDate;
      if (node.completeDate) return dateStr === node.completeDate;
      if (node.startDate) return dateStr === node.startDate;
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
    const node = todo.roadmapNodeId ? store.roadmapNodes.find((n) => n.id === todo.roadmapNodeId) : undefined;
    const fullyDone = await confirmFullyDone(node?.title || todo.title);
    store.resolveTodoCompletion(todo.id, fullyDone);
  };

  const openEditTodo = (todo: Todo) => {
    setEditingTodo(todo);
    setEditTitle(todo.title);
    setEditDescription(todo.description);
  };

  const openTodoDetails = (todo: Todo) => setSelectedTodo(todo);

  const saveTodoEdit = () => {
    if (!editingTodo || !editTitle.trim()) return;
    store.updateTodo(editingTodo.id, { title: editTitle.trim(), description: editDescription.trim() });
    setEditingTodo(null);
  };

  const confirmDeleteTodo = (todo: Todo) => {
    if (window.confirm(`Delete "${todo.title}"? This cannot be undone.`)) {
      store.deleteTodo(todo.id);
    }
  };

  const subtitleFor = (todo: Todo) => {
    const node = todo.roadmapNodeId ? store.roadmapNodes.find((n) => n.id === todo.roadmapNodeId) : undefined;
    const slot = todo.timeSlotId ? timeSlotById.get(todo.timeSlotId) : undefined;
    const slotRange = slot ? formatSlotRange(slot.startTime, slot.endTime) : todo.description;
    const subtitleParts: string[] = slotRange ? [slotRange] : [];
    if (node && node.title !== todo.title) subtitleParts.push(`↳ ${node.title}`);
    return subtitleParts.join(' • ');
  };

  const renderGroup = (name: string, items: Todo[]) => {
    if (items.length === 0) return null;
    return (
      <Card key={name} style={{ marginBottom: 8 }}>
        <span style={{ fontWeight: 700, marginBottom: 2, display: 'block' }}>{name}</span>
        <div>
          {items.map((todo) => (
            <CheckRow
              key={todo.id}
              emoji={store.categories.find((c) => c.id === todo.categoryId)?.icon}
              label={todo.title}
              subtitle={subtitleFor(todo) || undefined}
              done={todo.status === 'done'}
              onToggle={() => handleToggleTodo(todo)}
              onLabelPress={() => openTodoDetails(todo)}
              rightActions={
                <>
                  <IconButton label="Edit todo" onPress={() => openEditTodo(todo)} icon={<EditCircleIcon />} />
                  <IconButton label="Delete todo" onPress={() => confirmDeleteTodo(todo)} icon={<TrashIcon />} />
                </>
              }
            />
          ))}
        </div>
      </Card>
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = todoListIds.indexOf(active.id as string);
    const newIndex = todoListIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(todoListIds, oldIndex, newIndex);
    store.reorderTodos(selectedDate, reordered);
  };

  const renderTodoDraggableList = () => {
    if (todoListItems.length === 0) {
      return (
        <Card>
          <EmptyState title="Nothing here" subtitle="Drag tasks here once you create them" />
        </Card>
      );
    }

    return (
      <Card>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontWeight: 700 }}>To do</span>
          <Row style={{ gap: 8, alignItems: 'center' }}>
            <Button small variant="secondary" title="⏱ Auto Arrange" onPress={() => store.autoArrangeTodosByTime(selectedDate)} />
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Drag to reorder</span>
          </Row>
        </Row>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={todoListIds} strategy={verticalListSortingStrategy}>
            <div>
              {todoListItems.map((todo) => (
                <SortableTodoRow
                  key={todo.id}
                  todo={todo}
                  subtitle={subtitleFor(todo)}
                  onToggle={() => handleToggleTodo(todo)}
                  onLabelPress={() => openTodoDetails(todo)}
                  onEdit={() => openEditTodo(todo)}
                  onDelete={() => confirmDeleteTodo(todo)}
                  emoji={store.categories.find((c) => c.id === todo.categoryId)?.icon}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </Card>
    );
  };

  const hasAnyGroupItems = Object.values(groups).some((g) => g.length > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start', padding: '0 4px' }}>
        <div>
          <span style={{ fontSize: 'var(--font-size-heading)', fontWeight: 800, textTransform: 'capitalize', display: 'block' }}>
            Hey, {greetingName} 👋
          </span>
          <span style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic', marginTop: 2, display: 'block' }}>
            Let&apos;s make progress today!
          </span>
        </div>
        <div className={styles.sunBadge}>
          <span style={{ fontSize: 20 }}>☀️</span>
        </div>
      </Row>

      <DateStrip days={week} onSelect={setSelectedDate} />

      <Card>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 24, fontWeight: 800, display: 'block' }}>{completionPct}%</span>
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
              {doneTodos} / {totalTodos} tasks done
            </span>
          </div>
          <div className={styles.streakBadge}>
            <span style={{ fontSize: 22 }}>🔥</span>
            <span style={{ fontSize: 12, color: '#D97706', fontWeight: 700 }}>{store.getStreak()} day streak</span>
          </div>
        </Row>
      </Card>

      <SegmentedControl options={STATUS_TABS} value={statusTab} onChange={setStatusTab} />

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
            subtitle={totalTodos === 0 ? "Go to the Timetable tab and tap 'Allocate Today' to populate your day" : 'No tasks in this view'}
          />
        </Card>
      )}

      <SectionHeader title="Quick Add" />
      <Card>
        <Input value={quickAddText} onChangeText={setQuickAddText} placeholder="Add a quick todo…" />
        <Row style={{ gap: 8, marginTop: 8 }}>
          <div style={{ flex: 1 }}>
            <Input value={quickStartTime} onChangeText={setQuickStartTime} placeholder="Start (e.g. 8:00 AM)" />
          </div>
          <div style={{ flex: 1 }}>
            <Input value={quickEndTime} onChangeText={setQuickEndTime} placeholder="End (e.g. 9:30 AM)" />
          </div>
        </Row>
        <Row style={{ marginTop: 8, gap: 8, alignItems: 'center' }}>
          <Button title="Add" onPress={addQuickTodo} disabled={!quickAddText.trim()} />
          <AIButton title="Generate from roadmap" onPress={() => store.generateToday()} />
        </Row>
      </Card>

      {editingTodo && (
        <div className={styles.modalBackdrop} onClick={() => setEditingTodo(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <span className={styles.modalTitle}>Edit todo</span>
            <span className={styles.modalLabel}>Title</span>
            <Input value={editTitle} onChangeText={setEditTitle} placeholder="Todo title" />
            <span className={styles.modalLabel} style={{ marginTop: 10 }}>Description</span>
            <Input value={editDescription} onChangeText={setEditDescription} placeholder="Add details" multiline style={{ minHeight: 96 }} />
            <Row style={{ justifyContent: 'flex-end', marginTop: 14, gap: 8 }}>
              <Button title="Cancel" variant="secondary" onPress={() => setEditingTodo(null)} />
              <Button title="Save" onPress={saveTodoEdit} disabled={!editTitle.trim()} />
            </Row>
          </div>
        </div>
      )}

      {selectedTodo && (
        <div className={styles.modalBackdrop} onClick={() => setSelectedTodo(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 'var(--font-size-title)', fontWeight: 700, display: 'block' }}>{selectedTodo.title}</span>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{selectedDate}</span>
              </div>
              <button onClick={() => setSelectedTodo(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <span style={{ color: 'var(--color-error)', fontWeight: 700 }}>Close</span>
              </button>
            </Row>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              {(() => {
                const expiringTopics = topicsOnTodoDate.filter((topic) => topic.completeDate === selectedTodo.dueDate);
                if (expiringTopics.length === 0) return null;
                return (
                  <div style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid var(--color-error)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4
                  }}>
                    <span style={{ color: 'var(--color-error)', fontWeight: 700, fontSize: 13 }}>
                      ⚠️ Expiring Topic Alert
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--color-text)' }}>
                      Today is the final day to cover: <strong style={{ textDecoration: 'underline' }}>{expiringTopics.map(t => t.title).join(', ')}</strong>.
                    </span>
                  </div>
                );
              })()}
              <Card>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Status</span>
                <span style={{ fontWeight: 700, display: 'block' }}>{selectedTodo.status}</span>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 6, display: 'block' }}>Priority</span>
                <span style={{ fontWeight: 700, display: 'block' }}>{selectedTodo.priority}</span>
              </Card>

              <Card>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Category</span>
                <span style={{ fontWeight: 700, display: 'block' }}>
                  {store.categories.find((cat) => cat.id === selectedTodo.categoryId)?.name || 'Unassigned'}
                </span>

                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 6, display: 'block' }}>Schedule</span>
                <span style={{ fontWeight: 700, display: 'block' }}>
                  {selectedTodo.timeSlotId
                    ? (() => {
                        const slot = dayPlan?.timeSlots.find((timeSlot) => timeSlot.id === selectedTodo.timeSlotId);
                        return slot ? `${formatSlotRange(slot.startTime, slot.endTime)}${slot.label ? ` • ${slot.label}` : ''}` : 'No slot';
                      })()
                    : 'No slot'}
                </span>

                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 6, display: 'block' }}>Linked Topic</span>
                <span style={{ fontWeight: 700, display: 'block' }}>
                  {selectedTodo.roadmapNodeId
                    ? store.roadmapNodes.find((node) => node.id === selectedTodo.roadmapNodeId)?.title || 'Topic not found'
                    : 'Manual todo'}
                </span>

                {topicsOnTodoDate.length > 0 && (
                  <>
                    <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 6, display: 'block' }}>
                      Topics to cover on this date
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 2 }}>
                      {topicsOnTodoDate.map((topic) => {
                        const isExpiring = topic.completeDate === selectedTodo.dueDate;
                        return (
                          <div key={topic.id} style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '6px 8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-surface-muted)' }}>
                            <span style={{ fontWeight: 700, color: '#4F46E5', display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                              📚 {topic.title}
                              {isExpiring && (
                                <span style={{ color: 'var(--color-error)', fontSize: 10, fontWeight: 700, marginLeft: 8, padding: '2px 6px', borderRadius: 4, backgroundColor: 'rgba(239, 68, 68, 0.12)' }}>
                                  ⚠️ Expires today!
                                </span>
                              )}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                              <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Completion:</span>
                              <input
                                type="date"
                                value={topic.completeDate || ''}
                                onChange={(e) => {
                                  const newDate = e.target.value;
                                  if (newDate) {
                                    store.updateRoadmapNode(topic.id, { completeDate: newDate });
                                  }
                                }}
                                style={{
                                  border: '1px solid var(--color-border)',
                                  borderRadius: 4,
                                  padding: '2px 4px',
                                  fontSize: 11,
                                  backgroundColor: 'var(--color-surface)',
                                  color: 'var(--color-text)',
                                }}
                                suppressHydrationWarning
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 6, display: 'block' }}>Description</span>
                <span>{selectedTodo.description || 'No description'}</span>
              </Card>

              <Card>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Checklist</span>
                {selectedTodo.checklist.length === 0 ? (
                  <span style={{ marginTop: 4, display: 'block' }}>No checklist items</span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                    {selectedTodo.checklist.map((item) => (
                      <span key={item.id}>
                        {item.done ? '✓' : '○'} {item.text}
                      </span>
                    ))}
                  </div>
                )}
              </Card>

              <Card>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Progress</span>
                <span style={{ fontWeight: 700, display: 'block' }}>
                  {selectedTodo.checklist.length === 0
                    ? selectedTodo.status === 'done'
                      ? 'Completed'
                      : 'Not started'
                    : `${Math.round((selectedTodo.checklist.filter((item) => item.done).length / selectedTodo.checklist.length) * 100)}% checklist done`}
                </span>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
