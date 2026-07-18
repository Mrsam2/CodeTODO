'use client';

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, Card, Input, Row } from './ui';
import { RoadmapNode } from '@/types';
import { childrenOf, subtreeIds } from '@/lib/roadmap';
import { useAppStore } from '@/store/useAppStore';
import { todayISO } from '@/lib/dates';
import styles from './RoadmapTree.module.css';

const EditIcon = ({ color }: { color: string }) => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" />
    <path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415" />
    <path d="M16 5l3 3" />
  </svg>
);

const CalendarIcon = ({ color }: { color: string }) => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12" />
    <path d="M16 3v4" />
    <path d="M8 3v4" />
    <path d="M4 11h16" />
    <path d="M7 14h.013" />
    <path d="M10.01 14h.005" />
    <path d="M13.01 14h.005" />
    <path d="M16.015 14h.005" />
    <path d="M13.015 17h.005" />
    <path d="M7.01 17h.005" />
    <path d="M10.01 17h.005" />
  </svg>
);

interface RoadmapTreeProps {
  categoryId: string;
  nodes: RoadmapNode[];
  onNodeSelect?: (nodeId: string) => void;
}

function SortableNode({ id, children }: { id: string; children: (dragHandleProps: Record<string, unknown>) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style}>
      {children({ ...attributes, ...listeners } as Record<string, unknown>)}
    </div>
  );
}

export function RoadmapTree({ categoryId, nodes, onNodeSelect }: RoadmapTreeProps) {
  const store = useAppStore();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [editingNode, setEditingNode] = useState<RoadmapNode | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editCompleteDate, setEditCompleteDate] = useState('');
  const [editParentId, setEditParentId] = useState<string | null>(null);
  const [subtopicTitle, setSubtopicTitle] = useState('');

  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const categoryNodes = nodes.filter((n) => n.categoryId === categoryId);
  const category = store.categories.find((c) => c.id === categoryId);
  const roots = childrenOf(categoryNodes, null);

  function toggleExpanded(nodeId: string) {
    const newExp = new Set(expanded);
    if (newExp.has(nodeId)) newExp.delete(nodeId);
    else newExp.add(nodeId);
    setExpanded(newExp);
  }

  function getDaysLate(node: RoadmapNode): number {
    if (node.status === 'done' || !node.completeDate) return 0;
    const todayStr = todayISO();
    if (todayStr > node.completeDate) {
      const todayDate = new Date(todayStr);
      const completeDate = new Date(node.completeDate);
      const diffTime = todayDate.getTime() - completeDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    }
    return 0;
  }

  function getTopicsOnDate(dateStr: string): RoadmapNode[] {
    return categoryNodes.filter((node) => {
      if (editingNode && node.id === editingNode.id) return false;
      if (node.startDate && node.completeDate) return dateStr >= node.startDate && dateStr <= node.completeDate;
      if (node.completeDate) return dateStr === node.completeDate;
      if (node.startDate) return dateStr === node.startDate;
      return false;
    });
  }

  function openEditModal(node: RoadmapNode) {
    setEditingNode(node);
    setEditTitle(node.title);
    setEditDescription(node.description || '');
    setEditStartDate(node.startDate || '');
    setEditCompleteDate(node.completeDate || '');
    setEditParentId(node.parentId);
    setSubtopicTitle('');
    setShowCalendar(false);
    setHoveredDate(null);
    setCalendarMonth(node.completeDate ? new Date(node.completeDate) : new Date());
  }

  function handleSaveNode() {
    if (!editingNode) return;
    if (!editTitle.trim()) {
      window.alert('Topic title is required');
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (editStartDate.trim() && !dateRegex.test(editStartDate.trim())) {
      window.alert('Start Date must be in YYYY-MM-DD format');
      return;
    }
    if (editCompleteDate.trim() && !dateRegex.test(editCompleteDate.trim())) {
      window.alert('Complete Date must be in YYYY-MM-DD format');
      return;
    }

    store.updateRoadmapNode(editingNode.id, {
      title: editTitle.trim(),
      description: editDescription.trim(),
      startDate: editStartDate.trim() || null,
      completeDate: editCompleteDate.trim() || null,
      parentId: editParentId,
    });

    setEditingNode(null);
  }

  function handleAddSubtopic() {
    if (!editingNode || !subtopicTitle.trim()) return;
    store.addRoadmapNode({
      categoryId,
      title: subtopicTitle.trim(),
      description: '',
      estimatedDurationMins: 60,
      status: 'pending',
      parentId: editingNode.id,
      order: 0,
    });
    setSubtopicTitle('');
    const newExp = new Set(expanded);
    newExp.add(editingNode.id);
    setExpanded(newExp);
  }

  function handleMoveNode(direction: 'up' | 'down') {
    if (!editingNode) return;
    const siblings = childrenOf(categoryNodes, editingNode.parentId);

    siblings.forEach((s, idx) => {
      if (s.order !== idx) store.updateRoadmapNode(s.id, { order: idx });
    });

    const currentIdx = siblings.findIndex((s) => s.id === editingNode.id);
    if (currentIdx === -1) return;

    const targetIdx = direction === 'up' ? currentIdx - 1 : currentIdx + 1;
    if (targetIdx >= 0 && targetIdx < siblings.length) {
      const current = siblings[currentIdx];
      const target = siblings[targetIdx];
      store.updateRoadmapNode(current.id, { order: targetIdx });
      store.updateRoadmapNode(target.id, { order: currentIdx });
      setEditingNode({ ...editingNode, order: targetIdx });
    }
  }

  function handleDeleteNode() {
    if (!editingNode) return;
    if (window.confirm('Are you sure you want to delete this topic and all its sub-topics?')) {
      store.deleteRoadmapSubtree(editingNode.id);
      setEditingNode(null);
    }
  }

  function handleDragEnd(event: DragEndEvent, siblingIds: string[], parentId: string | null) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = siblingIds.indexOf(active.id as string);
    const newIndex = siblingIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...siblingIds];
    reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, active.id as string);

    reordered.forEach((id, idx) => {
      store.updateRoadmapNode(id, { order: idx });
    });
    void parentId;
  }

  function getDaysInMonth(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const numDays = new Date(year, month + 1, 0).getDate();

    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= numDays; i++) days.push(new Date(year, month, i));
    return days;
  }

  function formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const handleDayPress = (day: Date) => {
    const dateStr = formatDate(day);
    if (!editStartDate || (editStartDate && editCompleteDate)) {
      setEditStartDate(dateStr);
      setEditCompleteDate('');
    } else {
      if (dateStr < editStartDate) {
        setEditStartDate(dateStr);
      } else {
        setEditCompleteDate(dateStr);
      }
    }
  };

  const nextMonth = () => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
  const prevMonth = () => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const calendarHeaderText = `${monthNames[calendarMonth.getMonth()]} ${calendarMonth.getFullYear()}`;

  const days = getDaysInMonth(calendarMonth);
  const rows: (Date | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7));

  function renderNodeCard(node: RoadmapNode, depth: number, dragHandleProps?: Record<string, unknown>) {
    const children = childrenOf(categoryNodes, node.id);
    const isExpanded = expanded.has(node.id);
    const daysLate = getDaysLate(node);

    const statusIcon = node.status === 'done' ? '✓' : node.status === 'in_progress' ? '◐' : node.status === 'locked' ? '🔒' : '○';
    const statusColor = node.status === 'done' ? '#059669' : node.status === 'in_progress' ? '#2563EB' : node.status === 'locked' ? '#999999' : '#D97706';

    return (
      <div key={node.id} style={{ marginLeft: depth * 16 }}>
        <div
          role="button"
          tabIndex={0}
          className={styles.nodeCard}
          onClick={() => onNodeSelect?.(node.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNodeSelect?.(node.id);
            }
          }}
          {...dragHandleProps}
        >
          <Card>
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Row style={{ flex: 1, gap: 8, minWidth: 0 }}>
                {children.length > 0 ? (
                  <button
                    className={styles.expandBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpanded(node.id);
                    }}
                  >
                    {isExpanded ? '▼' : '▶'}
                  </button>
                ) : (
                  <div style={{ width: 28 }} />
                )}
                <div className={styles.statusBadge} style={{ backgroundColor: statusColor }}>
                  {statusIcon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                    {node.title}
                  </span>
                  {node.description ? (
                    <span
                      style={{
                        fontSize: 12,
                        color: 'var(--color-text-secondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'block',
                      }}
                    >
                      {node.description}
                    </span>
                  ) : null}
                  {(node.startDate || node.completeDate) && (
                    <Row style={{ marginTop: 4, gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                        📅 {node.startDate || '?'} to {node.completeDate || '?'}
                      </span>
                      {daysLate > 0 && (
                        <span style={{ color: '#DC2626', fontSize: 11, fontWeight: 700 }}>
                          ⚠️ {daysLate} {daysLate === 1 ? 'day' : 'days'} late
                        </span>
                      )}
                    </Row>
                  )}
                </div>
              </Row>
              <Row style={{ gap: 4, alignItems: 'center' }}>
                <button
                  className={styles.editBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(node);
                  }}
                >
                  <EditIcon color="var(--color-text-secondary)" />
                </button>
                <Button
                  small
                  title={node.status === 'done' ? 'Undo' : 'Done'}
                  onPress={(e?: unknown) => {
                    (e as { stopPropagation?: () => void } | undefined)?.stopPropagation?.();
                    store.setNodeCompleted(node.id, node.status !== 'done');
                  }}
                />
              </Row>
            </Row>
          </Card>
        </div>

        {isExpanded && children.length > 0 && renderSiblingGroup(children, depth + 1, node.id)}
      </div>
    );
  }

  function renderSiblingGroup(siblings: RoadmapNode[], depth: number, parentId: string | null) {
    const siblingIds = siblings.map((s) => s.id);
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(e) => handleDragEnd(e, siblingIds, parentId)}
      >
        <SortableContext items={siblingIds} strategy={verticalListSortingStrategy}>
          {siblings.map((node) => (
            <SortableNode key={node.id} id={node.id}>
              {(dragHandleProps) => renderNodeCard(node, depth, dragHandleProps)}
            </SortableNode>
          ))}
        </SortableContext>
      </DndContext>
    );
  }

  const descendants = editingNode ? subtreeIds(categoryNodes, editingNode.id) : [];
  const validParents = editingNode ? categoryNodes.filter((n) => n.id !== editingNode.id && !descendants.includes(n.id)) : [];

  const activeQueryDate = hoveredDate || editStartDate || editCompleteDate;
  const scheduledTopics = activeQueryDate ? getTopicsOnDate(activeQueryDate) : [];

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingBottom: 100 }}>
        {roots.length === 0 ? <span style={{ color: 'var(--color-text-secondary)' }}>No topics yet</span> : renderSiblingGroup(roots, 0, null)}
      </div>

      {editingNode && (
        <div className={styles.overlay} onClick={() => setEditingNode(null)}>
          <Card style={{ maxHeight: '85vh', overflow: 'hidden' } as React.CSSProperties}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <span className={styles.modalTitle}>Edit Topic</span>

              <span className={styles.sectionLabel}>Title</span>
              <Input value={editTitle} onChangeText={setEditTitle} placeholder="Topic Title" />

              <span className={styles.sectionLabel}>Description</span>
              <Input value={editDescription} onChangeText={setEditDescription} placeholder="Topic Description" />

              <Row style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <span className={styles.sectionLabel} style={{ margin: 0 }}>Dates</span>
                <button
                  className={[styles.calendarIconBtn, showCalendar && styles.calendarIconBtnActive].filter(Boolean).join(' ')}
                  onClick={() => setShowCalendar((prev) => !prev)}
                >
                  <CalendarIcon color={showCalendar ? '#4F46E5' : 'var(--color-text-secondary)'} />
                </button>
              </Row>

              <Row style={{ gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <Input value={editStartDate} onChangeText={setEditStartDate} placeholder="Start: YYYY-MM-DD" />
                </div>
                <div style={{ flex: 1 }}>
                  <Input value={editCompleteDate} onChangeText={setEditCompleteDate} placeholder="End: YYYY-MM-DD" />
                </div>
              </Row>

              {showCalendar && (
                <div className={styles.calendarContainer}>
                  <Row className={styles.calendarHeader}>
                    <button onClick={prevMonth} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }}>◀</button>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{calendarHeaderText}</span>
                    <button onClick={nextMonth} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }}>▶</button>
                  </Row>

                  <Row style={{ justifyContent: 'space-around', marginBottom: 6 }}>
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                      <span key={i} className={styles.weekdayText}>{d}</span>
                    ))}
                  </Row>

                  {rows.map((row, rowIdx) => (
                    <Row key={rowIdx} style={{ justifyContent: 'space-around', margin: '2px 0' }}>
                      {row.map((day, dayIdx) => {
                        if (!day) return <div key={dayIdx} style={{ width: 28, height: 28 }} />;
                        const dateStr = formatDate(day);
                        const isStart = dateStr === editStartDate;
                        const isEnd = dateStr === editCompleteDate;
                        const isBetween = !!(editStartDate && editCompleteDate && dateStr > editStartDate && dateStr < editCompleteDate);
                        const topicsOnDate = getTopicsOnDate(dateStr);

                        return (
                          <button
                            key={dayIdx}
                            onClick={() => handleDayPress(day)}
                            onMouseEnter={() => setHoveredDate(dateStr)}
                            onMouseLeave={() => setHoveredDate(null)}
                            className={[styles.calendarDay, isStart && styles.calendarDayStart, isEnd && styles.calendarDayEnd, isBetween && styles.calendarDayBetween]
                              .filter(Boolean)
                              .join(' ')}
                          >
                            <span style={{ fontSize: 11, color: isStart || isEnd ? '#FFF' : 'var(--color-text)', fontWeight: isStart || isEnd ? 700 : 400 }}>
                              {day.getDate()}
                            </span>
                            {topicsOnDate.length > 0 && (
                              <div
                                style={{
                                  width: 4,
                                  height: 4,
                                  borderRadius: 2,
                                  backgroundColor: isStart || isEnd ? '#FFF' : category?.color || '#4F46E5',
                                  marginTop: 2,
                                }}
                              />
                            )}
                          </button>
                        );
                      })}
                    </Row>
                  ))}
                </div>
              )}

              {showCalendar && (
                <div className={styles.conflictsContainer}>
                  <span className={styles.conflictsTitle}>
                    {hoveredDate
                      ? `Scheduled on ${hoveredDate} (Hovered):`
                      : editStartDate
                        ? `Scheduled on ${editStartDate} (Start Date):`
                        : 'Hover or tap a date to check scheduling conflicts'}
                  </span>
                  {activeQueryDate ? (
                    scheduledTopics.length > 0 ? (
                      scheduledTopics.map((topic) => (
                        <Row key={topic.id} style={{ gap: 8, padding: '4px 0' }}>
                          <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: category?.color || '#4F46E5' }} />
                          <span style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>{topic.title}</span>
                          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                            {topic.startDate || '?'} to {topic.completeDate || '?'}
                          </span>
                        </Row>
                      ))
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>No other topics scheduled on this date.</span>
                    )
                  ) : null}
                </div>
              )}

              <span className={styles.sectionLabel}>Position / Order (or drag the card in the list)</span>
              <Row style={{ gap: 8 }}>
                <Button style={{ flex: 1 }} variant="secondary" title="▲ Move Up" onPress={() => handleMoveNode('up')} />
                <Button style={{ flex: 1 }} variant="secondary" title="▼ Move Down" onPress={() => handleMoveNode('down')} />
              </Row>

              <span className={styles.sectionLabel}>Parent Topic</span>
              <div className={styles.parentPickerScroll}>
                <button
                  className={[styles.parentItem, editParentId === null && styles.parentItemActive].filter(Boolean).join(' ')}
                  onClick={() => setEditParentId(null)}
                >
                  None (Root Topic)
                </button>
                {validParents.map((parent) => (
                  <button
                    key={parent.id}
                    className={[styles.parentItem, editParentId === parent.id && styles.parentItemActive].filter(Boolean).join(' ')}
                    onClick={() => setEditParentId(parent.id)}
                  >
                    {parent.title}
                  </button>
                ))}
              </div>

              <div className={styles.subtopicSection}>
                <span className={styles.sectionLabel}>Add Sub-topic</span>
                <Row style={{ gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <Input value={subtopicTitle} onChangeText={setSubtopicTitle} placeholder="Add subtopic..." />
                  </div>
                  <Button small title="Add" onPress={handleAddSubtopic} disabled={!subtopicTitle.trim()} />
                </Row>
              </div>

              <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Row style={{ gap: 8 }}>
                  <Button style={{ flex: 1 }} title="Save Changes" onPress={handleSaveNode} />
                  <Button style={{ flex: 1 }} variant="secondary" title="Cancel" onPress={() => setEditingNode(null)} />
                </Row>
                <Button variant="ghost" title="🗑 Delete Topic" onPress={handleDeleteNode} />
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
