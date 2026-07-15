import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView, Modal, StyleSheet, Alert, TextInput } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { ThemedText } from './themed-text';
import { Button, Card, Input, Row } from './ui';
import { Spacing, Radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { RoadmapNode } from '@/types';
import { childrenOf, subtreeIds } from '@/lib/roadmap';
import { useAppStore } from '@/store/useAppStore';
import { todayISO } from '@/lib/dates';

// Custom SVG Edit Icon provided by the user
const EditIcon = ({ color }: { color: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <Path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" />
    <Path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415" />
    <Path d="M16 5l3 3" />
  </Svg>
);

// Custom SVG Calendar Week Icon provided by the user
const CalendarIcon = ({ color }: { color: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <Path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12" />
    <Path d="M16 3v4" />
    <Path d="M8 3v4" />
    <Path d="M4 11h16" />
    <Path d="M7 14h.013" />
    <Path d="M10.01 14h.005" />
    <Path d="M13.01 14h.005" />
    <Path d="M16.015 14h.005" />
    <Path d="M13.015 17h.005" />
    <Path d="M7.01 17h.005" />
    <Path d="M10.01 17h.005" />
  </Svg>
);

// Web-safe Touchable to bypass TypeScript warnings for onMouseEnter/onMouseLeave in React Native Web
const WebTouchable = TouchableOpacity as any;

interface RoadmapTreeProps {
  categoryId: string;
  nodes: RoadmapNode[];
  onNodeSelect?: (nodeId: string) => void;
}

export function RoadmapTree({ categoryId, nodes, onNodeSelect }: RoadmapTreeProps) {
  const colors = useTheme();
  const store = useAppStore();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Modal Editing States
  const [editingNode, setEditingNode] = useState<RoadmapNode | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editCompleteDate, setEditCompleteDate] = useState('');
  const [editParentId, setEditParentId] = useState<string | null>(null);
  const [subtopicTitle, setSubtopicTitle] = useState('');

  // Calendar Visibility & Month States
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const categoryNodes = nodes.filter((n) => n.categoryId === categoryId);
  const category = store.categories.find((c) => c.id === categoryId);
  const roots = childrenOf(categoryNodes, null);

  function toggleExpanded(nodeId: string) {
    const newExp = new Set(expanded);
    if (newExp.has(nodeId)) {
      newExp.delete(nodeId);
    } else {
      newExp.add(nodeId);
    }
    setExpanded(newExp);
  }

  // Calculate days late
  function getDaysLate(node: RoadmapNode): number {
    if (node.status === 'done' || !node.completeDate) return 0;
    const todayStr = todayISO(); // YYYY-MM-DD
    if (todayStr > node.completeDate) {
      const todayDate = new Date(todayStr);
      const completeDate = new Date(node.completeDate);
      const diffTime = todayDate.getTime() - completeDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    }
    return 0;
  }

  // Get other topics scheduled on a date in this category
  function getTopicsOnDate(dateStr: string): RoadmapNode[] {
    return categoryNodes.filter((node) => {
      // Skip the node currently being edited
      if (editingNode && node.id === editingNode.id) return false;
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
  }

  // Open edit modal & prefill local states
  function openEditModal(node: RoadmapNode) {
    setEditingNode(node);
    setEditTitle(node.title);
    setEditDescription(node.description || '');
    setEditStartDate(node.startDate || '');
    setEditCompleteDate(node.completeDate || '');
    setEditParentId(node.parentId);
    setSubtopicTitle('');
    setShowCalendar(false); // keep calendar picker closed by default
    setHoveredDate(null);
    // Focus calendar picker month on target completion date if exists, else current month
    if (node.completeDate) {
      setCalendarMonth(new Date(node.completeDate));
    } else {
      setCalendarMonth(new Date());
    }
  }

  // Save topic updates
  function handleSaveNode() {
    if (!editingNode) return;
    if (!editTitle.trim()) {
      Alert.alert('Error', 'Topic title is required');
      return;
    }

    // Validate date format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (editStartDate.trim() && !dateRegex.test(editStartDate.trim())) {
      Alert.alert('Invalid Date', 'Start Date must be in YYYY-MM-DD format');
      return;
    }
    if (editCompleteDate.trim() && !dateRegex.test(editCompleteDate.trim())) {
      Alert.alert('Invalid Date', 'Complete Date must be in YYYY-MM-DD format');
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

  // Add subtopic
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
    // Expand parent node so subtopic is visible immediately
    const newExp = new Set(expanded);
    newExp.add(editingNode.id);
    setExpanded(newExp);
  }

  // Move node position (Up / Down sibling swap)
  function handleMoveNode(direction: 'up' | 'down') {
    if (!editingNode) return;
    const siblings = childrenOf(categoryNodes, editingNode.parentId);
    
    // Assign consecutive orders first to ensure clean swaps
    siblings.forEach((s, idx) => {
      if (s.order !== idx) {
        store.updateRoadmapNode(s.id, { order: idx });
      }
    });

    const currentIdx = siblings.findIndex((s) => s.id === editingNode.id);
    if (currentIdx === -1) return;

    const targetIdx = direction === 'up' ? currentIdx - 1 : currentIdx + 1;
    if (targetIdx >= 0 && targetIdx < siblings.length) {
      const current = siblings[currentIdx];
      const target = siblings[targetIdx];

      // Swap orders
      store.updateRoadmapNode(current.id, { order: targetIdx });
      store.updateRoadmapNode(target.id, { order: currentIdx });

      // Refresh editing node reference state
      setEditingNode({ ...editingNode, order: targetIdx });
    }
  }

  // Delete node subtree
  function handleDeleteNode() {
    if (!editingNode) return;
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this topic and all its sub-topics?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            store.deleteRoadmapSubtree(editingNode.id);
            setEditingNode(null);
          },
        },
      ]
    );
  }

  // Helper functions for Custom Range Calendar picker
  function getDaysInMonth(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0-6
    const numDays = new Date(year, month + 1, 0).getDate();

    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= numDays; i++) {
      days.push(new Date(year, month, i));
    }
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
      // We have a start date but no complete date
      if (dateStr < editStartDate) {
        // If clicked date is before start date, make it the new start date
        setEditStartDate(dateStr);
      } else {
        setEditCompleteDate(dateStr);
      }
    }
  };

  const nextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const calendarHeaderText = `${monthNames[calendarMonth.getMonth()]} ${calendarMonth.getFullYear()}`;

  const days = getDaysInMonth(calendarMonth);
  const rows: (Date | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    rows.push(days.slice(i, i + 7));
  }

  function renderNode(node: RoadmapNode, depth: number = 0) {
    const children = childrenOf(categoryNodes, node.id);
    const isExpanded = expanded.has(node.id);
    const daysLate = getDaysLate(node);

    const statusIcon =
      node.status === 'done'
        ? '✓'
        : node.status === 'in_progress'
          ? '◐'
          : node.status === 'locked'
            ? '🔒'
            : '○';

    const statusColor =
      node.status === 'done'
        ? '#059669'
        : node.status === 'in_progress'
          ? '#2563EB'
          : node.status === 'locked'
            ? '#999999'
            : '#D97706';

    return (
      <View key={node.id} style={{ marginLeft: depth * Spacing.three }}>
        <TouchableOpacity
          onPress={() => onNodeSelect?.(node.id)}
          style={{ marginVertical: Spacing.one }}
          activeOpacity={0.8}
        >
          <Card>
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Row style={{ flex: 1, gap: Spacing.two }}>
                {children.length > 0 && (
                  <TouchableOpacity onPress={() => toggleExpanded(node.id)} style={{ padding: Spacing.one }}>
                    <ThemedText style={{ fontSize: 16, color: colors.textSecondary }}>
                      {isExpanded ? '▼' : '▶'}
                    </ThemedText>
                  </TouchableOpacity>
                )}
                {children.length === 0 && <View style={{ width: 28 }} />}
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: statusColor,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ThemedText style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold' }}>
                    {statusIcon}
                  </ThemedText>
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText type="bodyBold" numberOfLines={1}>
                    {node.title}
                  </ThemedText>
                  {node.description ? (
                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                      {node.description}
                    </ThemedText>
                  ) : null}

                  {/* Dates Display */}
                  {(node.startDate || node.completeDate) && (
                    <Row style={{ marginTop: Spacing.one, gap: Spacing.two, flexWrap: 'wrap', alignItems: 'center' }}>
                      <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
                        📅 {node.startDate || '?'} to {node.completeDate || '?'}
                      </ThemedText>
                      {daysLate > 0 && (
                        <ThemedText style={{ color: '#DC2626', fontSize: 11, fontWeight: '700' }}>
                          ⚠️ {daysLate} {daysLate === 1 ? 'day' : 'days'} late
                        </ThemedText>
                      )}
                    </Row>
                  )}
                </View>
              </Row>
              <Row style={{ gap: Spacing.one, alignItems: 'center' }}>
                <TouchableOpacity
                  onPress={() => openEditModal(node)}
                  style={{
                    padding: Spacing.two,
                    borderRadius: 8,
                    backgroundColor: colors.surfaceMuted,
                  }}
                >
                  <EditIcon color={colors.textSecondary} />
                </TouchableOpacity>
                <Button
                  small
                  title={node.status === 'done' ? 'Undo' : 'Done'}
                  onPress={() => store.setNodeCompleted(node.id, node.status !== 'done')}
                />
              </Row>
            </Row>
          </Card>
        </TouchableOpacity>

        {isExpanded &&
          children.map((child) => renderNode(child, depth + 1))}
      </View>
    );
  }

  // Find all valid parents to prevent hierarchy cycles
  const descendants = editingNode ? subtreeIds(categoryNodes, editingNode.id) : [];
  const validParents = editingNode
    ? categoryNodes.filter((n) => n.id !== editingNode.id && !descendants.includes(n.id))
    : [];

  // Determine date to query scheduled topics conflicts
  const activeQueryDate = hoveredDate || editStartDate || editCompleteDate;
  const scheduledTopics = activeQueryDate ? getTopicsOnDate(activeQueryDate) : [];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ gap: Spacing.two, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {roots.length === 0 ? (
          <ThemedText themeColor="textSecondary">No topics yet</ThemedText>
        ) : (
          roots.map((root) => renderNode(root))
        )}
      </ScrollView>

      {/* Edit Modal */}
      {editingNode && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setEditingNode(null)}
        >
          <View style={styles.modalOverlay}>
            <Card style={styles.modalContent}>
              <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <ThemedText style={styles.modalTitle}>Edit Topic</ThemedText>

                {/* Edit Fields */}
                <ThemedText style={styles.sectionLabel}>Title</ThemedText>
                <Input value={editTitle} onChangeText={setEditTitle} placeholder="Topic Title" />

                <ThemedText style={styles.sectionLabel}>Description</ThemedText>
                <Input value={editDescription} onChangeText={setEditDescription} placeholder="Topic Description" />

                {/* Dates Section Header with Toggle Calendar Icon */}
                <Row style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.two }}>
                  <ThemedText style={styles.sectionLabel}>Dates</ThemedText>
                  <TouchableOpacity
                    onPress={() => setShowCalendar((prev) => !prev)}
                    style={{
                      padding: Spacing.one + 2,
                      borderRadius: 6,
                      backgroundColor: showCalendar ? '#EEF2FF' : colors.surfaceMuted,
                      borderColor: showCalendar ? '#4F46E5' : 'transparent',
                      borderWidth: 1,
                    }}
                  >
                    <CalendarIcon color={showCalendar ? '#4F46E5' : colors.textSecondary} />
                  </TouchableOpacity>
                </Row>

                <Row style={{ gap: Spacing.two }}>
                  <View style={{ flex: 1 }}>
                    <Input value={editStartDate} onChangeText={setEditStartDate} placeholder="Start: YYYY-MM-DD" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input value={editCompleteDate} onChangeText={setEditCompleteDate} placeholder="End: YYYY-MM-DD" />
                  </View>
                </Row>

                {/* Custom Date Range Calendar Picker (Toggleable) */}
                {showCalendar && (
                  <View style={styles.calendarContainer}>
                    <Row style={styles.calendarHeader}>
                      <TouchableOpacity onPress={prevMonth} style={{ padding: 4 }}>
                        <ThemedText style={{ fontSize: 14 }}>◀</ThemedText>
                      </TouchableOpacity>
                      <ThemedText type="bodyBold" style={{ fontSize: 13 }}>{calendarHeaderText}</ThemedText>
                      <TouchableOpacity onPress={nextMonth} style={{ padding: 4 }}>
                        <ThemedText style={{ fontSize: 14 }}>▶</ThemedText>
                      </TouchableOpacity>
                    </Row>

                    <Row style={{ justifyContent: 'space-around', marginBottom: 6 }}>
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <ThemedText key={i} style={styles.weekdayText}>{d}</ThemedText>
                      ))}
                    </Row>

                    {rows.map((row, rowIdx) => (
                      <Row key={rowIdx} style={{ justifyContent: 'space-around', marginVertical: 2 }}>
                        {row.map((day, dayIdx) => {
                          if (!day) return <View key={dayIdx} style={{ width: 28, height: 28 }} />;
                          const dateStr = formatDate(day);
                          const isStart = dateStr === editStartDate;
                          const isEnd = dateStr === editCompleteDate;
                          const isBetween = !!(editStartDate && editCompleteDate && dateStr > editStartDate && dateStr < editCompleteDate);
                          const topicsOnDate = getTopicsOnDate(dateStr);

                          return (
                            <WebTouchable
                              key={dayIdx}
                              onPress={() => handleDayPress(day)}
                              // Web-only hover compatibility (ignored on native)
                              onMouseEnter={() => setHoveredDate(dateStr)}
                              onMouseLeave={() => setHoveredDate(null)}
                              style={[
                                styles.calendarDay,
                                isStart && styles.calendarDayStart,
                                isEnd && styles.calendarDayEnd,
                                isBetween && styles.calendarDayBetween,
                              ]}
                            >
                              <ThemedText
                                style={{
                                  fontSize: 11,
                                  color: (isStart || isEnd) ? '#FFF' : colors.text,
                                  fontWeight: (isStart || isEnd) ? 'bold' : 'normal',
                                }}
                              >
                                {day.getDate()}
                              </ThemedText>
                              {/* Dot indicator if other topics are scheduled on this date */}
                              {topicsOnDate.length > 0 && (
                                <View
                                  style={{
                                    width: 4,
                                    height: 4,
                                    borderRadius: 2,
                                    backgroundColor: (isStart || isEnd) ? '#FFF' : (category?.color || '#4F46E5'),
                                    marginTop: 2,
                                  }}
                                />
                              )}
                            </WebTouchable>
                          );
                        })}
                      </Row>
                    ))}
                  </View>
                )}

                {/* Scheduled/Conflicting Topics on Date Display */}
                {showCalendar && (
                  <View style={styles.conflictsContainer}>
                    <ThemedText style={styles.conflictsTitle}>
                      {hoveredDate
                        ? `Scheduled on ${hoveredDate} (Hovered):`
                        : editStartDate
                          ? `Scheduled on ${editStartDate} (Start Date):`
                          : 'Hover or tap a date to check scheduling conflicts'}
                    </ThemedText>
                    {activeQueryDate ? (
                      scheduledTopics.length > 0 ? (
                        scheduledTopics.map((topic) => (
                          <Row key={topic.id} style={styles.conflictItem}>
                            <View
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: category?.color || '#4F46E5',
                              }}
                            />
                            <ThemedText type="small" style={{ fontWeight: '600', flex: 1, color: colors.text }}>
                              {topic.title}
                            </ThemedText>
                            <ThemedText type="small" themeColor="textSecondary">
                              {topic.startDate || '?'} to {topic.completeDate || '?'}
                            </ThemedText>
                          </Row>
                        ))
                      ) : (
                        <ThemedText type="small" themeColor="textSecondary">
                          No other topics scheduled on this date.
                        </ThemedText>
                      )
                    ) : null}
                  </View>
                )}

                {/* Move & Order Controls */}
                <ThemedText style={styles.sectionLabel}>Position / Order</ThemedText>
                <Row style={{ gap: Spacing.two }}>
                  <Button style={{ flex: 1 }} variant="secondary" title="▲ Move Up" onPress={() => handleMoveNode('up')} />
                  <Button style={{ flex: 1 }} variant="secondary" title="▼ Move Down" onPress={() => handleMoveNode('down')} />
                </Row>

                {/* Parent / Hierarchy Selector */}
                <ThemedText style={styles.sectionLabel}>Parent Topic</ThemedText>
                <ScrollView style={styles.parentPickerScroll} nestedScrollEnabled={true} showsVerticalScrollIndicator={false}>
                  <TouchableOpacity
                    style={[styles.parentItem, editParentId === null && styles.parentItemActive]}
                    onPress={() => setEditParentId(null)}
                  >
                    <ThemedText type="small" style={{ fontWeight: editParentId === null ? 'bold' : 'normal' }}>
                      None (Root Topic)
                    </ThemedText>
                  </TouchableOpacity>
                  {validParents.map((parent) => (
                    <TouchableOpacity
                      key={parent.id}
                      style={[styles.parentItem, editParentId === parent.id && styles.parentItemActive]}
                      onPress={() => setEditParentId(parent.id)}
                    >
                      <ThemedText type="small" style={{ fontWeight: editParentId === parent.id ? 'bold' : 'normal' }}>
                        {parent.title}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Subtopic Creator */}
                <View style={styles.subtopicSection}>
                  <ThemedText style={styles.sectionLabel}>Add Sub-topic</ThemedText>
                  <Row style={{ gap: Spacing.two }}>
                    <Input
                      style={{ flex: 1 }}
                      value={subtopicTitle}
                      onChangeText={setSubtopicTitle}
                      placeholder="Add subtopic..."
                    />
                    <Button small title="Add" onPress={handleAddSubtopic} disabled={!subtopicTitle.trim()} />
                  </Row>
                </View>

                {/* Bottom Action buttons */}
                <View style={{ marginTop: Spacing.four, gap: Spacing.two }}>
                  <Row style={{ gap: Spacing.two }}>
                    <Button style={{ flex: 1 }} title="Save Changes" onPress={handleSaveNode} />
                    <Button style={{ flex: 1 }} variant="secondary" title="Cancel" onPress={() => setEditingNode(null)} />
                  </Row>
                  <Button variant="ghost" title="🗑 Delete Topic" onPress={handleDeleteNode} />
                </View>
              </ScrollView>
            </Card>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  modalContent: {
    maxHeight: '85%',
    borderRadius: Radii.lg,
    padding: Spacing.four,
  },
  modalScroll: {
    gap: Spacing.two,
    paddingBottom: Spacing.four,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4B5563',
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
  },
  parentPickerScroll: {
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: Spacing.one,
    backgroundColor: '#F9FAFB',
  },
  parentItem: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 6,
    marginBottom: 4,
    backgroundColor: '#FFFFFF',
  },
  parentItemActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
    borderWidth: 1,
  },
  subtopicSection: {
    marginTop: Spacing.three,
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
    paddingTop: Spacing.two,
  },
  // Calendar Styling
  calendarContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: Spacing.three,
    backgroundColor: '#F9FAFB',
    marginBottom: Spacing.two,
  },
  calendarHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  weekdayText: {
    width: 28,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  calendarDay: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayStart: {
    backgroundColor: '#4F46E5',
  },
  calendarDayEnd: {
    backgroundColor: '#4F46E5',
  },
  calendarDayBetween: {
    backgroundColor: '#EEF2FF',
    borderRadius: 4,
  },
  // Conflict Checker Styling
  conflictsContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: Spacing.two,
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
  },
  conflictsTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#4B5563',
    marginBottom: Spacing.one,
  },
  conflictItem: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: 4,
  },
});
