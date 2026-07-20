'use client';

import { useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LottieLoader } from '@/components/LottieLoader';
import { Card, Button, SectionHeader, Row, Input, ProgressBar, CategoryIcon } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { todayISO } from '@/lib/dates';
import { overallProgress, timeToMins, slotDuration, parseTimeToHHMM } from '@/lib/timetable';
import { categoryCompletionPct, findFirstUnlockedIncompleteNode } from '@/lib/roadmap';
import { StudyPlan, AISuggestion, SlotTemplate, SlotType, RoadmapNode, Category } from '@/types';
import styles from './page.module.css';

const SLOT_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  big: { label: '3 Hrs — Big Topic', color: '#EF4444', bg: '#FEF2F2' },
  medium: { label: '2 Hrs — Medium Topic', color: '#F59E0B', bg: '#FFFBEB' },
  revision: { label: 'Revision', color: '#8B5CF6', bg: '#F5F3FF' },
  break: { label: 'Break / Rest', color: '#10B981', bg: '#ECFDF5' },
  other: { label: 'Other', color: '#6B7280', bg: '#F9FAFB' },
};

function formatTimeTo12Hour(hhmm: string): string {
  try {
    const [hStr, mStr] = hhmm.split(':');
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    const minPart = m === 0 ? '' : `:${String(m).padStart(2, '0')}`;
    return `${h}${minPart} ${ampm}`;
  } catch {
    return hhmm;
  }
}

function formatDuration(mins: number): string {
  const hrs = mins / 60;
  if (Number.isInteger(hrs)) return `[${hrs} ${hrs === 1 ? 'HR' : 'HRS'}]`;
  return `[${hrs.toFixed(1)} HRS]`;
}

function buildSlotTopicPreviews(slot: SlotTemplate, roadmapNodes: RoadmapNode[], categories: Category[]) {
  return slot.categoryIds
    .map((categoryId) => {
      const category = categories.find((cat) => cat.id === categoryId);
      if (!category) return null;
      return { category, pct: categoryCompletionPct(roadmapNodes, categoryId), nextTopic: findFirstUnlockedIncompleteNode(roadmapNodes, categoryId) };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

function SlotRow({
  slot,
  categories,
  topicPreviews,
  onAllocate,
  isAllocating,
  isLast,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onPress,
}: {
  slot: SlotTemplate;
  categories: Category[];
  topicPreviews: { category: Category; pct: number; nextTopic: RoadmapNode | null }[];
  onAllocate: (slot: SlotTemplate) => void;
  isAllocating: boolean;
  isLast: boolean;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (updated: Partial<SlotTemplate>) => void;
  onDelete: () => void;
  onPress: () => void;
}) {
  const cfg = SLOT_TYPE_CONFIG[slot.slotType] ?? SLOT_TYPE_CONFIG.other;
  const assignedCats = categories.filter((c) => slot.categoryIds.includes(c.id));
  const isStudy = slot.slotType !== 'break' && slot.slotType !== 'other';

  const [editLabel, setEditLabel] = useState(slot.label);
  const [editStart, setEditStart] = useState(slot.startTime);
  const [editEnd, setEditEnd] = useState(slot.endTime);
  const [editType, setEditType] = useState<SlotType>(slot.slotType);
  const [editCatIds, setEditCatIds] = useState<string[]>(slot.categoryIds);

  const toggleCat = (catId: string) => {
    setEditCatIds((prev) => (prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]));
  };

  const handleSave = () => {
    if (!editLabel.trim() || !editStart.trim() || !editEnd.trim()) {
      window.alert('Please fill in all fields.');
      return;
    }
    const formattedStart = parseTimeToHHMM(editStart);
    const formattedEnd = parseTimeToHHMM(editEnd);
    if (!formattedStart || !formattedEnd) {
      window.alert('Use HH:MM format for times (e.g. 09:00 or 9:00 AM).');
      return;
    }
    if (timeToMins(formattedStart) >= timeToMins(formattedEnd)) {
      window.alert('Start time must be before end time.');
      return;
    }
    onSaveEdit({
      label: editLabel.trim(),
      startTime: formattedStart,
      endTime: formattedEnd,
      durationMins: slotDuration(formattedStart, formattedEnd),
      slotType: editType,
      categoryIds: editCatIds,
    });
  };

  return (
    <div className={[styles.tableRow, !isLast && styles.tableRowBorder].filter(Boolean).join(' ')} onClick={isEditing ? undefined : onPress}>
      <div className={styles.tableTimeCell} style={{ borderLeftColor: cfg.color }}>
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', padding: '0 6px' }}>
            <Input value={editStart} onChangeText={setEditStart} placeholder="Start" style={{ fontSize: 11, padding: '0 4px', minHeight: 30 }} />
            <span style={{ fontSize: 10, alignSelf: 'center', opacity: 0.5 }}>To</span>
            <Input value={editEnd} onChangeText={setEditEnd} placeholder="End" style={{ fontSize: 11, padding: '0 4px', minHeight: 30 }} />
          </div>
        ) : (
          <>
            <span className={styles.tableTimeText}>{formatTimeTo12Hour(slot.startTime)}</span>
            <span className={styles.tableTimeToText}>To</span>
            <span className={styles.tableTimeText}>{formatTimeTo12Hour(slot.endTime)}</span>
          </>
        )}
      </div>

      <div className={styles.tableContentCell}>
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} onClick={(e) => e.stopPropagation()}>
            <Input value={editLabel} onChangeText={setEditLabel} placeholder="Slot Label" style={{ minHeight: 35 }} />

            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Slot Type</span>
            <Row style={{ flexWrap: 'wrap', gap: 4 }}>
              {Object.entries(SLOT_TYPE_CONFIG).map(([typeKey, val]) => (
                <button
                  key={typeKey}
                  onClick={() => setEditType(typeKey as SlotType)}
                  className={styles.legendChip}
                  style={{ backgroundColor: editType === typeKey ? val.color : val.color + '12', borderColor: val.color, padding: '4px 8px' }}
                >
                  <span style={{ fontSize: 10, color: editType === typeKey ? '#FFF' : val.color, fontWeight: 600 }}>{val.label}</span>
                </button>
              ))}
            </Row>

            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Assign Categories</span>
            <Row style={{ flexWrap: 'wrap', gap: 4 }}>
              {categories.map((cat) => {
                const active = editCatIds.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCat(cat.id)}
                    className={styles.catChip}
                    style={{ backgroundColor: active ? cat.color || 'var(--color-primary)' : 'transparent', borderColor: cat.color || 'var(--color-primary)', opacity: active ? 1 : 0.6 }}
                  >
                    <Row style={{ gap: 4, alignItems: 'center' }}>
                      <CategoryIcon icon={cat.icon} size={9} />
                      <span style={{ fontSize: 9, color: active ? '#FFF' : cat.color || 'var(--color-primary)', fontWeight: 600 }}>{cat.name}</span>
                    </Row>
                  </button>
                );
              })}
            </Row>

            <Row style={{ gap: 6, marginTop: 4 }}>
              <Button small title="Cancel" variant="secondary" onPress={onCancelEdit} />
              <Button small title="Save" onPress={handleSave} />
            </Row>
          </div>
        ) : (
          <>
            <div className={styles.cellHeaderRow}>
              <span className={styles.cellTitle}>{slot.label.toUpperCase()}</span>
              <span className={styles.cellDuration} style={{ color: cfg.color }}>
                {formatDuration(slot.durationMins)}
              </span>
            </div>

            {assignedCats.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
                {assignedCats.map((cat) => {
                  const preview = topicPreviews.find((item) => item.category.id === cat.id);
                  return (
                    <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div className={styles.catChip} style={{ alignSelf: 'flex-start', borderColor: cat.color || 'var(--color-primary)' }}>
                        <Row style={{ gap: 4, alignItems: 'center' }}>
                          <CategoryIcon icon={cat.icon} size={10} />
                          <span style={{ fontSize: 10, color: cat.color || 'var(--color-primary)', fontWeight: 600 }}>{cat.name}</span>
                        </Row>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{preview?.nextTopic?.title ?? 'All topics complete'}</span>
                      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{preview ? `${preview.pct}% complete` : 'No roadmap topic found'}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <Row style={{ marginTop: 8, justifyContent: 'space-between', width: '100%' }} onClick={(e) => e.stopPropagation()}>
              <Row style={{ gap: 6 }}>
                {isStudy &&
                  (isAllocating ? (
                    <span style={{ fontSize: 11 }}>…</span>
                  ) : (
                    <button
                      className={styles.actionBtn}
                      style={{ borderColor: 'var(--color-primary)', backgroundColor: 'var(--color-primary)12', color: 'var(--color-primary)' }}
                      onClick={() => onAllocate(slot)}
                    >
                      Create Todo
                    </button>
                  ))}
              </Row>
              <Row style={{ gap: 6 }}>
                <button className={styles.actionBtn} style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} onClick={onStartEdit}>
                  Edit
                </button>
                <button className={styles.actionBtn} style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }} onClick={onDelete}>
                  Delete
                </button>
              </Row>
            </Row>
          </>
        )}
      </div>
    </div>
  );
}

function AISuggestionsPanel({ suggestion, onRefresh, isLoading }: { suggestion: AISuggestion | undefined; onRefresh: () => void; isLoading: boolean }) {
  return (
    <div className={styles.aiPanel}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className={styles.aiHeaderRow}>
          <span style={{ fontSize: 20 }}>🧠</span>
          <span style={{ fontWeight: 700 }}>Things to Keep in Mind</span>
        </div>
        <button onClick={onRefresh} disabled={isLoading} className={styles.refreshBtn}>
          {isLoading ? '…' : '↺ Refresh'}
        </button>
      </Row>

      {suggestion?.overallMessage ? (
        <div className={styles.overallMsg} style={{ backgroundColor: 'var(--color-primary)18', borderColor: 'var(--color-primary)44' }}>
          <span style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 600, fontStyle: 'italic' }}>&quot;{suggestion.overallMessage}&quot;</span>
        </div>
      ) : null}

      {suggestion?.suggestions?.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          {suggestion.suggestions.map((tip, i) => (
            <Row key={i} style={{ alignItems: 'flex-start', gap: 10 }}>
              <div className={styles.tipNum} style={{ backgroundColor: 'var(--color-primary)' }}>
                <span style={{ color: '#FFF', fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
              </div>
              <span style={{ fontSize: 12, flex: 1, lineHeight: '18px' }}>{tip}</span>
            </Row>
          ))}
        </div>
      ) : (
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 8, fontStyle: 'italic', display: 'block' }}>
          Tap &quot;↺ Refresh&quot; to get personalized study tips from Gemini AI.
        </span>
      )}

      {suggestion?.generatedAt ? (
        <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 10, display: 'block' }}>
          Generated {new Date(suggestion.generatedAt).toLocaleString()}
        </span>
      ) : null}
    </div>
  );
}

export default function TimetablePage() {
  const router = useRouter();
  const store = useAppStore();

  useEffect(() => {
    store.syncWithCloud(['studyPlans', 'aiSuggestions', 'categories']);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [allocatingSlotId, setAllocatingSlotId] = useState<string | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotTemplate | null>(null);

  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addLabel, setAddLabel] = useState('');
  const [addStartTime, setAddStartTime] = useState('09:00');
  const [addEndTime, setAddEndTime] = useState('10:00');
  const [addSlotType, setAddSlotType] = useState<SlotType>('medium');
  const [addCategoryIds, setAddCategoryIds] = useState<string[]>([]);

  const activePlan: StudyPlan | undefined = store.studyPlans[store.studyPlans.length - 1];
  const suggestion: AISuggestion | undefined = activePlan ? store.aiSuggestions.find((s) => s.studyPlanId === activePlan.id) : undefined;

  const slots = activePlan ? [...activePlan.slotTemplates].sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime)) : [];
  const allCatIds = activePlan ? [...new Set(activePlan.slotTemplates.flatMap((s) => s.categoryIds))] : [];
  const progress = overallProgress(store.roadmapNodes, allCatIds);
  const selectedSlotPreviews = selectedSlot ? buildSlotTopicPreviews(selectedSlot, store.roadmapNodes, store.categories) : [];

  const handleAllocate = useCallback(
    async (slot: SlotTemplate) => {
      if (!activePlan) return;
      setAllocatingSlotId(slot.id);
      await store.allocateTodosFromPlan(activePlan.id, todayISO());
      setAllocatingSlotId(null);
    },
    [activePlan, store]
  );

  const handleRefreshSuggestions = useCallback(async () => {
    if (!activePlan) return;
    setLoadingSuggestions(true);
    await store.generateAISuggestions(activePlan.id);
    setLoadingSuggestions(false);
  }, [activePlan, store]);

  const handleAddSlot = () => {
    if (!activePlan) return;
    if (!addLabel.trim() || !addStartTime.trim() || !addEndTime.trim()) {
      window.alert('Please fill in all fields.');
      return;
    }
    const formattedStart = parseTimeToHHMM(addStartTime);
    const formattedEnd = parseTimeToHHMM(addEndTime);
    if (!formattedStart || !formattedEnd) {
      window.alert('Use HH:MM format for times (e.g. 09:00 or 9:00 AM).');
      return;
    }
    if (timeToMins(formattedStart) >= timeToMins(formattedEnd)) {
      window.alert('Start time must be before end time.');
      return;
    }

    const newSlot: SlotTemplate = {
      id: `slot-${activePlan.id}-${Date.now()}`,
      studyPlanId: activePlan.id,
      label: addLabel.trim(),
      startTime: formattedStart,
      endTime: formattedEnd,
      durationMins: slotDuration(formattedStart, formattedEnd),
      slotType: addSlotType,
      categoryIds: addCategoryIds,
      daysOfWeek: [],
    };

    const updated = [...activePlan.slotTemplates, newSlot].sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime));
    store.updateStudyPlan(activePlan.id, { slotTemplates: updated });

    setAddLabel('');
    setAddStartTime('09:00');
    setAddEndTime('10:00');
    setAddSlotType('medium');
    setAddCategoryIds([]);
    setShowAddForm(false);
  };

  const handleSaveEdit = (slotId: string, updatedFields: Partial<SlotTemplate>) => {
    if (!activePlan) return;
    const updated = activePlan.slotTemplates
      .map((s) => (s.id === slotId ? { ...s, ...updatedFields } : s))
      .sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime));
    store.updateStudyPlan(activePlan.id, { slotTemplates: updated });
    setEditingSlotId(null);
  };

  const handleDeleteSlot = (slotId: string, label: string) => {
    if (!activePlan) return;
    if (window.confirm(`Are you sure you want to delete the slot "${label}"?`)) {
      const updated = activePlan.slotTemplates.filter((s) => s.id !== slotId);
      store.updateStudyPlan(activePlan.id, { slotTemplates: updated });
    }
  };

  const handleDeletePlan = () => {
    if (!activePlan) return;
    if (window.confirm(`Are you sure you want to delete the entire timetable "${activePlan.name}"?`)) {
      store.deleteStudyPlan(activePlan.id);
    }
  };

  const toggleAddCategory = (catId: string) => {
    setAddCategoryIds((prev) => (prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]));
  };

  if (!activePlan) {
    if (store.loadingSections?.studyPlans) {
      return (
        <div className={styles.emptyContainer} style={{ justifyContent: 'center', minHeight: '50vh' }}>
          <LottieLoader text="Syncing Timetable..." size={120} />
        </div>
      );
    }
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.emptyEmoji}>📅</div>
        <span style={{ fontSize: 'var(--font-size-heading)', fontWeight: 800, marginBottom: 8, display: 'block' }}>No Study Plan Yet</span>
        <span style={{ color: 'var(--color-text-secondary)', marginBottom: 32, lineHeight: '22px', display: 'block' }}>
          Create a structured timetable — set time slots, assign your categories, and let AI build your daily todo list automatically.
        </span>

        <Card style={{ width: '100%', marginBottom: 24, textAlign: 'left' } as React.CSSProperties}>
          <span style={{ fontWeight: 700, marginBottom: 12, display: 'block' }}>Slot Types</span>
          {Object.entries(SLOT_TYPE_CONFIG)
            .filter(([k]) => k !== 'other')
            .map(([key, cfg]) => (
              <Row key={key} style={{ marginBottom: 6, gap: 8 }}>
                <div className={styles.legendDot} style={{ backgroundColor: cfg.color }} />
                <span style={{ fontSize: 12 }}>{cfg.label}</span>
              </Row>
            ))}
        </Card>

        <Button title="+ Create Study Plan" onPress={() => router.push('/study-plan/create')} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.leftCol}>
        <Card style={{ marginBottom: 4 }}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 'var(--font-size-title)', fontWeight: 700, display: 'block' }}>{activePlan.name}</span>
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                {activePlan.durationMonths} month plan • {activePlan.startDate} → {activePlan.endDate}
              </span>
            </div>
            <div className={styles.progressBadge} style={{ borderColor: 'var(--color-primary)', backgroundColor: 'var(--color-primary)20' }}>
              <span style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: 18 }}>{progress}%</span>
              <span style={{ color: 'var(--color-primary)', fontSize: 10 }}>done</span>
            </div>
          </Row>

          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progress}%`, backgroundColor: 'var(--color-primary)' }} />
          </div>

          <Row style={{ marginTop: 10, gap: 8 }}>
            <Button small title={showAddForm ? 'Cancel Add' : '+ Add Slot'} onPress={() => setShowAddForm((prev) => !prev)} variant="secondary" />
            <Button small title="Allocate Today" onPress={() => store.allocateTodosFromPlan(activePlan.id, todayISO())} />
            <Button small title="Delete Plan" variant="ghost" onPress={handleDeletePlan} />
          </Row>
        </Card>

        {showAddForm && (
          <Card style={{ marginBottom: 4 }}>
            <span style={{ fontWeight: 700, marginBottom: 8, display: 'block' }}>Add New Time Slot</span>
            <Input value={addLabel} onChangeText={setAddLabel} placeholder="Slot Label (e.g. DSA Coding Practice)" />

            <Row style={{ gap: 8, marginTop: 4 }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' }}>Start Time</span>
                <Input value={addStartTime} onChangeText={setAddStartTime} placeholder="HH:MM" />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' }}>End Time</span>
                <Input value={addEndTime} onChangeText={setAddEndTime} placeholder="HH:MM" />
              </div>
            </Row>

            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 6, display: 'block' }}>Slot Type</span>
            <Row style={{ flexWrap: 'wrap', gap: 4 }}>
              {Object.entries(SLOT_TYPE_CONFIG).map(([typeKey, val]) => (
                <button
                  key={typeKey}
                  onClick={() => setAddSlotType(typeKey as SlotType)}
                  className={styles.legendChip}
                  style={{ backgroundColor: addSlotType === typeKey ? val.color : val.color + '12', borderColor: val.color, padding: '4px 8px' }}
                >
                  <span style={{ fontSize: 10, color: addSlotType === typeKey ? '#FFF' : val.color, fontWeight: 600 }}>{val.label}</span>
                </button>
              ))}
            </Row>

            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 6, display: 'block' }}>Assign Categories</span>
            <Row style={{ flexWrap: 'wrap', gap: 4 }}>
              {store.categories.filter(c => !c.isDeleted).map((cat) => {
                const active = addCategoryIds.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleAddCategory(cat.id)}
                    className={styles.catChip}
                    style={{ backgroundColor: active ? cat.color || 'var(--color-primary)' : 'transparent', borderColor: cat.color || 'var(--color-primary)', opacity: active ? 1 : 0.6 }}
                  >
                    <span style={{ fontSize: 9, color: active ? '#FFF' : cat.color || 'var(--color-primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <CategoryIcon icon={cat.icon} size={9} />
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </Row>

            <Button title="Save Slot" onPress={handleAddSlot} style={{ marginTop: 10 }} />
          </Card>
        )}

        <SectionHeader title="Timetable Slots" />
        {slots.length === 0 ? (
          <Card>
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
              No slots configured. Tap &quot;+ Add Slot&quot; to begin defining your schedule.
            </span>
          </Card>
        ) : (
          <div className={styles.tableContainer}>
            {slots.map((slot, index) => (
              <SlotRow
                key={slot.id}
                slot={slot}
                categories={store.categories.filter(c => !c.isDeleted)}
                topicPreviews={buildSlotTopicPreviews(slot, store.roadmapNodes, store.categories)}
                onAllocate={handleAllocate}
                isAllocating={allocatingSlotId === slot.id}
                isLast={index === slots.length - 1}
                isEditing={editingSlotId === slot.id}
                onStartEdit={() => setEditingSlotId(slot.id)}
                onCancelEdit={() => setEditingSlotId(null)}
                onSaveEdit={(updatedFields) => handleSaveEdit(slot.id, updatedFields)}
                onDelete={() => handleDeleteSlot(slot.id, slot.label)}
                onPress={() => setSelectedSlot(slot)}
              />
            ))}
          </div>
        )}
      </div>

      <div className={styles.rightCol}>
        <Card style={{ marginBottom: 4 }}>
          <span style={{ fontWeight: 700, marginBottom: 8, display: 'block' }}>Slot Guide</span>
          <Row style={{ flexWrap: 'wrap', gap: 8 }}>
            {Object.entries(SLOT_TYPE_CONFIG)
              .filter(([k]) => k !== 'other')
              .map(([key, cfg]) => (
                <div key={key} className={styles.legendChip} style={{ backgroundColor: cfg.color + '18', borderColor: cfg.color + '44' }}>
                  <div className={styles.legendDot} style={{ backgroundColor: cfg.color }} />
                  <span style={{ color: cfg.color, fontSize: 11, fontWeight: 600 }}>{cfg.label}</span>
                </div>
              ))}
          </Row>
        </Card>

        <SectionHeader title="AI Coach" />
        <AISuggestionsPanel suggestion={suggestion} onRefresh={handleRefreshSuggestions} isLoading={loadingSuggestions} />

        {store.studyPlans.length > 1 && (
          <Card style={{ marginTop: 8 }}>
            <span style={{ fontWeight: 700, marginBottom: 8, display: 'block' }}>All Plans</span>
            {store.studyPlans.map((plan) => (
              <Row key={plan.id} style={{ justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12 }}>
                  {plan.name} ({plan.durationMonths}M)
                </span>
                <button onClick={() => store.deleteStudyPlan(plan.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                  <span style={{ fontSize: 12, color: 'var(--color-error)' }}>Delete</span>
                </button>
              </Row>
            ))}
          </Card>
        )}
      </div>

      {selectedSlot && (
        <div className={styles.detailBackdrop} onClick={() => setSelectedSlot(null)}>
          <div className={styles.detailCard} onClick={(e) => e.stopPropagation()}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 'var(--font-size-title)', fontWeight: 700, display: 'block' }}>{selectedSlot?.label ?? 'Slot details'}</span>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  {selectedSlot ? `${formatTimeTo12Hour(selectedSlot.startTime)} - ${formatTimeTo12Hour(selectedSlot.endTime)}` : ''}
                </span>
              </div>
              <button onClick={() => setSelectedSlot(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <span style={{ color: 'var(--color-error)', fontWeight: 700 }}>Close</span>
              </button>
            </Row>

            {selectedSlotPreviews.length === 0 ? (
              <Card style={{ marginTop: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>This slot has no category assigned yet.</span>
              </Card>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                {selectedSlotPreviews.map(({ category, pct, nextTopic }) => (
                  <Card key={category.id}>
                    <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <CategoryIcon icon={category.icon} size={16} />
                          {category.name}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{pct}% complete</span>
                      </div>
                      <button onClick={() => router.push(`/category/${category.id}`)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                        <span style={{ color: category.color, fontWeight: 700 }}>Open</span>
                      </button>
                    </Row>

                    <div style={{ marginTop: 10 }}>
                      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Current topic</span>
                      <span style={{ fontWeight: 700, marginTop: 2, display: 'block' }}>{nextTopic ? nextTopic.title : 'All topics complete'}</span>
                    </div>

                    <ProgressBar pct={pct} color={category.color} />

                    {pct < 100 ? (
                      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4, fontStyle: 'italic', display: 'block' }}>
                        This slot keeps repeating {nextTopic ? nextTopic.title : 'the next unlocked topic'} until the category reaches 100%.
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4, fontStyle: 'italic', display: 'block' }}>
                        Category complete. This slot is now marked complete for the category.
                      </span>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
