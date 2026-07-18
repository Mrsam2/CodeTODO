'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input, Row, AIButton } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { todayISO, addDays } from '@/lib/dates';
import { slotDuration, timeToMins, parseTimeToHHMM, parsePastedTimetable } from '@/lib/timetable';
import { SlotType, DayOfWeek } from '@/types';
import styles from './page.module.css';
import { CategoryIcon } from '@/components/CategoryIcon';

const SLOT_TYPES: { key: SlotType; label: string; desc: string; color: string }[] = [
  { key: 'big', label: 'Big Topic', desc: '3+ hrs - deep work on a major topic', color: '#EF4444' },
  { key: 'medium', label: 'Medium', desc: '1.5-3 hrs - sub-topics and concepts', color: '#F59E0B' },
  { key: 'revision', label: 'Revision', desc: 'Any duration - revisit past topics', color: '#8B5CF6' },
  { key: 'break', label: 'Break/Rest', desc: 'Rest, leisure, meals', color: '#10B981' },
  { key: 'other', label: 'Other', desc: 'Morning routine, gym, etc.', color: '#6B7280' },
];

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'mon', label: 'M' },
  { key: 'tue', label: 'T' },
  { key: 'wed', label: 'W' },
  { key: 'thu', label: 'T' },
  { key: 'fri', label: 'F' },
  { key: 'sat', label: 'S' },
  { key: 'sun', label: 'S' },
];

interface DraftSlot {
  label: string;
  startTime: string;
  endTime: string;
  slotType: SlotType;
  categoryIds: string[];
  daysOfWeek: DayOfWeek[];
}

const defaultSlots: DraftSlot[] = [
  { label: 'Wake Up & Morning Routine', startTime: '07:00', endTime: '09:00', slotType: 'other', categoryIds: [], daysOfWeek: [] },
  { label: 'Slot 1 - Deep Study', startTime: '09:00', endTime: '12:00', slotType: 'big', categoryIds: [], daysOfWeek: [] },
  { label: 'Lunch Break', startTime: '12:00', endTime: '13:00', slotType: 'break', categoryIds: [], daysOfWeek: [] },
  { label: 'Slot 2 - Study', startTime: '15:00', endTime: '17:00', slotType: 'medium', categoryIds: [], daysOfWeek: [] },
  { label: 'Revision Block', startTime: '17:00', endTime: '20:00', slotType: 'revision', categoryIds: [], daysOfWeek: [] },
  { label: 'Dinner & Wind Down', startTime: '20:00', endTime: '22:00', slotType: 'break', categoryIds: [], daysOfWeek: [] },
];

function inferSlotType(label: string, durMins: number): SlotType {
  const lower = label.toLowerCase();
  if (lower.includes('break') || lower.includes('rest') || lower.includes('lunch') || lower.includes('dinner') || lower.includes('meal') || lower.includes('bath') || lower.includes('freshen')) {
    return 'break';
  }
  if (lower.includes('revision') || lower.includes('review') || lower.includes('planning') || lower.includes('reflect')) {
    return 'revision';
  }
  if (lower.includes('wake') || lower.includes('morning') || lower.includes('meditation') || lower.includes('ready') || lower.includes('sleep') || lower.includes('routine')) {
    return 'other';
  }
  if (durMins >= 150) return 'big';
  return 'medium';
}

export default function CreateStudyPlanPage() {
  const router = useRouter();
  const store = useAppStore();

  const [step, setStep] = useState(1);
  const [planName, setPlanName] = useState('');
  const [durationMonths, setDurationMonths] = useState('3');
  const [slots, setSlots] = useState<DraftSlot[]>(defaultSlots);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPlanSummary, setAiPlanSummary] = useState('');
  const [pastedText, setPastedText] = useState('');

  const today = todayISO();
  const months = parseInt(durationMonths) || 3;
  const endDate = addDays(today, months * 30);

  const updateSlot = (idx: number, updates: Partial<DraftSlot>) => {
    setSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, ...updates } : s)));
  };

  const addSlot = () => {
    setSlots((prev) => [...prev, { label: 'New Slot', startTime: '10:00', endTime: '12:00', slotType: 'medium', categoryIds: [], daysOfWeek: [] }]);
    setEditingIdx(slots.length);
  };

  const removeSlot = (idx: number) => {
    setSlots((prev) => prev.filter((_, i) => i !== idx));
    setEditingIdx(null);
  };

  const toggleDayOnSlot = (idx: number, dow: DayOfWeek) => {
    const slot = slots[idx];
    const has = slot.daysOfWeek.includes(dow);
    updateSlot(idx, { daysOfWeek: has ? slot.daysOfWeek.filter((d) => d !== dow) : [...slot.daysOfWeek, dow] });
  };

  const toggleCatOnSlot = (idx: number, catId: string) => {
    const slot = slots[idx];
    const has = slot.categoryIds.includes(catId);
    updateSlot(idx, { categoryIds: has ? slot.categoryIds.filter((c) => c !== catId) : [...slot.categoryIds, catId] });
  };

  const generateSmartSlots = async () => {
    if (!aiPrompt.trim()) {
      window.alert('Please describe your schedule or goals first.');
      return;
    }
    setIsGenerating(true);
    setAiPlanSummary('');
    try {
      const response = await fetch(`${store.settings.aiBackendUrl}/api/ai/generate-timetable-slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userPrompt: aiPrompt, planName: planName || 'My Study Plan', durationMonths: months, categories: store.categories }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      if (data.slots && Array.isArray(data.slots)) {
        const generatedSlots: DraftSlot[] = data.slots.map((s: { label?: string; startTime?: string; endTime?: string; slotType?: string; categoryNames?: string[]; daysOfWeek?: DayOfWeek[] }) => {
          const categoryIds: string[] = [];
          if (s.categoryNames && Array.isArray(s.categoryNames)) {
            s.categoryNames.forEach((name: string) => {
              const matched = store.categories.find((c) => c.name.toLowerCase().trim() === name.toLowerCase().trim());
              if (matched) categoryIds.push(matched.id);
            });
          }
          return {
            label: s.label || 'Study Slot',
            startTime: s.startTime || '09:00',
            endTime: s.endTime || '10:00',
            slotType: (s.slotType as SlotType) || 'medium',
            categoryIds,
            daysOfWeek: s.daysOfWeek || [],
          };
        });
        setSlots(generatedSlots);
        setAiPlanSummary(data.planSummary || '');
        setEditingIdx(null);
      }
    } catch (err) {
      console.warn('Smart slot generation failed:', err);
      window.alert('Could not generate slots. Check your connection and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImportPasted = () => {
    if (!pastedText.trim()) {
      window.alert('Please paste your table or list of activities first.');
      return;
    }
    const parsed = parsePastedTimetable(pastedText);
    if (parsed.length === 0) {
      window.alert("We couldn't extract any times and activities from your text. Please verify the format.");
      return;
    }

    const imported: DraftSlot[] = parsed.map((p) => {
      const dur = slotDuration(p.startTime, p.endTime);
      return { label: p.label, startTime: p.startTime, endTime: p.endTime, slotType: inferSlotType(p.label, dur), categoryIds: [], daysOfWeek: [] };
    });

    setSlots(imported);
    setPastedText('');
    window.alert(`Successfully imported ${imported.length} slots from your text!`);
  };

  const handleSave = () => {
    if (!planName.trim()) {
      window.alert('Please enter a plan name on Step 1.');
      setStep(1);
      return;
    }

    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
      if (!timeRegex.test(s.startTime) || !timeRegex.test(s.endTime)) {
        window.alert(`Slot "${s.label || `Slot ${i + 1}`}" has an invalid time format. Please use HH:MM (24-hour, e.g. 09:00).`);
        setStep(2);
        setEditingIdx(i);
        return;
      }

      const startMins = timeToMins(s.startTime);
      const endMins = timeToMins(s.endTime);
      if (startMins >= endMins) {
        window.alert(`Slot "${s.label || `Slot ${i + 1}`}" start time must be before end time.`);
        setStep(2);
        setEditingIdx(i);
        return;
      }
    }

    const planId = store.createStudyPlan({ name: planName.trim(), durationMonths: months, startDate: today, endDate, slotTemplates: [] });

    store.updateStudyPlan(planId, {
      slotTemplates: slots.map((s, i) => ({
        id: `slot-${planId}-${i}`,
        studyPlanId: planId,
        label: s.label,
        startTime: s.startTime,
        endTime: s.endTime,
        durationMins: slotDuration(s.startTime, s.endTime),
        slotType: s.slotType,
        categoryIds: s.categoryIds,
        daysOfWeek: s.daysOfWeek,
      })),
    });

    router.replace('/timetable');
  };

  const stepColor = (s: number) => (step >= s ? 'var(--color-primary)' : 'var(--color-border)');

  return (
    <div>
      <div className={styles.stepRow}>
        {[1, 2, 3].map((s) => (
          <button
            key={s}
            onClick={() => {
              if (s > 1 && !planName.trim()) {
                window.alert('Please enter a plan name first.');
                return;
              }
              if (s > 2 && slots.length === 0) {
                window.alert('Please add at least one daily slot first.');
                return;
              }
              setStep(s);
            }}
            className={styles.stepItem}
          >
            <div className={styles.stepCircle} style={{ backgroundColor: stepColor(s) }}>
              <span style={{ color: '#FFF', fontWeight: 700, fontSize: 13 }}>{s}</span>
            </div>
            <span style={{ fontSize: 12, color: stepColor(s), marginTop: 2 }}>{s === 1 ? 'Info' : s === 2 ? 'Slots' : 'Assign'}</span>
          </button>
        ))}
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 640, margin: '0 auto' }}>
        {step === 1 && (
          <>
            <span style={{ fontSize: 'var(--font-size-heading)', fontWeight: 800 }}>Create Study Plan</span>
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Define your study plan name and duration.</span>

            <Card>
              <span style={{ fontWeight: 700, marginBottom: 6, display: 'block' }}>Plan Name</span>
              <Input value={planName} onChangeText={setPlanName} placeholder="e.g. 3 Month DSA Prep, English Speaking Plan" />

              <span style={{ fontWeight: 700, marginTop: 14, marginBottom: 6, display: 'block' }}>Duration (months)</span>
              <Row style={{ flexWrap: 'wrap', gap: 8 }}>
                {[1, 2, 3, 4, 5, 6].map((m) => (
                  <button
                    key={m}
                    onClick={() => setDurationMonths(String(m))}
                    className={styles.durationChip}
                    style={{ backgroundColor: months === m ? 'var(--color-primary)' : 'var(--color-surface)', borderColor: months === m ? 'var(--color-primary)' : 'var(--color-border)' }}
                  >
                    <span style={{ color: months === m ? '#FFF' : 'var(--color-text)', fontWeight: 600 }}>{m}M</span>
                  </button>
                ))}
              </Row>

              <div className={styles.dateRow} style={{ backgroundColor: 'var(--color-primary)12', borderColor: 'var(--color-primary)44' }}>
                <span style={{ fontSize: 12, color: 'var(--color-primary)' }}>
                  {today} to {endDate} ({months} months)
                </span>
              </div>
            </Card>

            <Button
              title="Next: Set Time Slots"
              onPress={() => {
                if (!planName.trim()) {
                  window.alert('Please enter a plan name first.');
                  return;
                }
                setStep(2);
              }}
            />
          </>
        )}

        {step === 2 && (
          <>
            <span style={{ fontSize: 'var(--font-size-heading)', fontWeight: 800 }}>Daily Time Slots</span>
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
              Build your day schedule manually, or let AI generate it from your description.
            </span>

            <div className={styles.aiGenCard} style={{ backgroundColor: 'var(--color-primary)0D', borderColor: 'var(--color-primary)55' }}>
              <Row style={{ marginBottom: 8, gap: 8 }}>
                <span style={{ fontSize: 20 }}>🤖</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>AI Smart Schedule Generator</span>
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'block' }}>
                    Describe your routine and goals — Gemini builds your slots.
                  </span>
                </div>
              </Row>

              <Input
                value={aiPrompt}
                onChangeText={setAiPrompt}
                multiline
                placeholder={`e.g. "I wake up at 7am. I'm preparing for DSA in 3 months. I study best in mornings. I need 3 hrs for coding, 1 hr for theory, evening revision. Weekends extra 1 hour."`}
              />

              <AIButton title="Generate Smart Slots" onPress={generateSmartSlots} loading={isGenerating} />

              {aiPlanSummary ? (
                <div className={styles.summaryBadge} style={{ backgroundColor: 'var(--color-success)18', borderColor: 'var(--color-success)44' }}>
                  <span style={{ fontSize: 12, color: 'var(--color-success)', fontStyle: 'italic' }}>✅ {aiPlanSummary}</span>
                </div>
              ) : null}
            </div>

            <div className={styles.aiGenCard} style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', marginTop: 12, marginBottom: 12 }}>
              <Row style={{ marginBottom: 8, gap: 8 }}>
                <span style={{ fontSize: 20 }}>📋</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>Import Copied Table / Text</span>
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'block' }}>
                    Paste a schedule table or routine (e.g. from ChatGPT) to extract slots instantly.
                  </span>
                </div>
              </Row>

              <Input
                value={pastedText}
                onChangeText={setPastedText}
                multiline
                numberOfLines={6}
                style={{ minHeight: 100 }}
                placeholder={`Paste your table here, for example:\n| 6:15 AM - 6:20 AM | Freshen up |\n| 7:45 AM - 9:15 AM | Study Session |\n| 11:30 AM - 10:00 PM | Office |`}
              />

              <button onClick={handleImportPasted} className={styles.generateBtn} style={{ backgroundColor: 'var(--color-primary)' }}>
                <span style={{ color: '#FFF', fontWeight: 700, textAlign: 'center' }}>Import Pasted Table</span>
              </button>
            </div>

            <Row style={{ alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div className={styles.divLine} />
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>or edit manually</span>
              <div className={styles.divLine} />
            </Row>

            {slots.map((slot, idx) => {
              const cfg = SLOT_TYPES.find((t) => t.key === slot.slotType) ?? SLOT_TYPES[4];
              const dur = slotDuration(slot.startTime, slot.endTime);
              const isOpen = editingIdx === idx;

              return (
                <Card key={idx} style={{ marginBottom: 4 }}>
                  <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      style={{ flex: 1, marginRight: 8, border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer' }}
                      onClick={() => setEditingIdx(isOpen ? null : idx)}
                    >
                      <span style={{ fontWeight: 700, display: 'block' }}>{slot.label}</span>
                      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                        {slot.startTime} - {slot.endTime} ({dur} min)
                      </span>
                    </button>

                    <Row style={{ alignItems: 'center', gap: 10 }}>
                      <div className={styles.slotTypeDot} style={{ backgroundColor: cfg.color }} />
                      <button onClick={() => setEditingIdx(isOpen ? null : idx)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                        <span style={{ color: 'var(--color-primary)', fontSize: 13, fontWeight: 600 }}>{isOpen ? 'Close' : 'Edit'}</span>
                      </button>
                      <button onClick={() => removeSlot(idx)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                        <span style={{ color: 'var(--color-error)', fontSize: 13, fontWeight: 600 }}>Delete</span>
                      </button>
                    </Row>
                  </Row>

                  {isOpen && (
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <Input value={slot.label} onChangeText={(v) => updateSlot(idx, { label: v })} placeholder="Slot label" />

                      <Row style={{ gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' }}>Start</span>
                          <Input value={slot.startTime} onChangeText={(v) => updateSlot(idx, { startTime: v })} placeholder="HH:MM" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' }}>End</span>
                          <Input value={slot.endTime} onChangeText={(v) => updateSlot(idx, { endTime: v })} placeholder="HH:MM" />
                        </div>
                      </Row>

                      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Type</span>
                      <Row style={{ flexWrap: 'wrap', gap: 6 }}>
                        {SLOT_TYPES.map((t) => (
                          <button
                            key={t.key}
                            onClick={() => updateSlot(idx, { slotType: t.key })}
                            className={styles.typeChip}
                            style={{ backgroundColor: slot.slotType === t.key ? t.color : t.color + '18', borderColor: t.color }}
                          >
                            <span style={{ fontSize: 11, color: slot.slotType === t.key ? '#FFF' : t.color, fontWeight: 600 }}>{t.label}</span>
                          </button>
                        ))}
                      </Row>

                      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Days (empty = all days)</span>
                      <Row style={{ gap: 4 }}>
                        {DAYS.map((d) => {
                          const active = slot.daysOfWeek.includes(d.key);
                          return (
                            <button
                              key={d.key}
                              onClick={() => toggleDayOnSlot(idx, d.key)}
                              className={styles.dayChip}
                              style={{ backgroundColor: active ? 'var(--color-primary)' : 'var(--color-surface)', borderColor: active ? 'var(--color-primary)' : 'var(--color-border)' }}
                            >
                              <span style={{ fontSize: 11, fontWeight: 700, color: active ? '#FFF' : 'var(--color-text)' }}>{d.label}</span>
                            </button>
                          );
                        })}
                      </Row>

                      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Assign Categories</span>
                      {store.categories.length === 0 ? (
                        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                          No categories created yet.
                        </span>
                      ) : (
                        <Row style={{ flexWrap: 'wrap', gap: 6 }}>
                          {store.categories.map((cat) => {
                            const active = slot.categoryIds.includes(cat.id);
                            return (
                              <button
                                key={cat.id}
                                onClick={() => toggleCatOnSlot(idx, cat.id)}
                                className={styles.typeChip}
                                style={{
                                  backgroundColor: active ? cat.color || 'var(--color-primary)' : 'transparent',
                                  borderColor: cat.color || 'var(--color-primary)',
                                  opacity: active ? 1 : 0.6,
                                }}
                              >
                                <span style={{ fontSize: 10, color: active ? '#FFF' : cat.color || 'var(--color-primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <CategoryIcon icon={cat.icon} size={10} />
                                  {cat.name}
                                </span>
                              </button>
                            );
                          })}
                        </Row>
                      )}

                      <Button small title="Remove Slot" onPress={() => removeSlot(idx)} variant="ghost" />
                    </div>
                  )}
                </Card>
              );
            })}

            <Button title="+ Add Slot" onPress={addSlot} variant="secondary" />

            <Row style={{ gap: 8, marginTop: 8 }}>
              <Button title="Back" onPress={() => setStep(1)} variant="ghost" />
              <Button
                title="Next: Assign Categories"
                onPress={() => {
                  if (slots.length === 0) {
                    window.alert('Please add at least one slot first.');
                    return;
                  }
                  const updatedSlots = [...slots];
                  for (let i = 0; i < slots.length; i++) {
                    const s = slots[i];
                    const formattedStart = parseTimeToHHMM(s.startTime);
                    const formattedEnd = parseTimeToHHMM(s.endTime);
                    if (!formattedStart || !formattedEnd) {
                      window.alert(`Slot "${s.label || `Slot ${i + 1}`}" has an invalid time format. Use HH:MM format (e.g. 09:00 or 9:00 AM).`);
                      setEditingIdx(i);
                      return;
                    }
                    const startMins = timeToMins(formattedStart);
                    const endMins = timeToMins(formattedEnd);
                    if (startMins >= endMins) {
                      window.alert(`Slot "${s.label || `Slot ${i + 1}`}" start time must be before end time.`);
                      setEditingIdx(i);
                      return;
                    }
                    updatedSlots[i] = { ...s, startTime: formattedStart, endTime: formattedEnd };
                  }
                  setSlots(updatedSlots);
                  setStep(3);
                }}
              />
            </Row>
          </>
        )}

        {step === 3 && (
          <>
            <span style={{ fontSize: 'var(--font-size-heading)', fontWeight: 800 }}>Assign Categories</span>
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>For each study slot, pick which subjects to cover.</span>

            {slots
              .filter((s) => s.slotType !== 'break' && s.slotType !== 'other')
              .map((slot, listIdx) => {
                const realIdx = slots.findIndex((s) => s === slot);
                const cfg = SLOT_TYPES.find((t) => t.key === slot.slotType) ?? SLOT_TYPES[4];

                return (
                  <Card key={listIdx} style={{ marginBottom: 4 }}>
                    <Row style={{ marginBottom: 8 }}>
                      <div className={styles.slotTypeDot} style={{ backgroundColor: cfg.color, marginRight: 8 }} />
                      <div>
                        <span style={{ fontWeight: 700, display: 'block' }}>{slot.label}</span>
                        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                          {slot.startTime}-{slot.endTime} ({slotDuration(slot.startTime, slot.endTime)} min)
                        </span>
                      </div>
                    </Row>

                    {store.categories.length === 0 ? (
                      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                        No categories yet. Create some in the Categories tab first.
                      </span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {store.categories.map((cat) => {
                          const selected = slot.categoryIds.includes(cat.id);
                          return (
                            <button
                              key={cat.id}
                              onClick={() => toggleCatOnSlot(realIdx, cat.id)}
                              className={styles.catRow}
                              style={{ backgroundColor: selected ? 'var(--color-primary)15' : 'var(--color-surface)', borderColor: selected ? 'var(--color-primary)' : 'var(--color-border)' }}
                            >
                              <CategoryIcon icon={cat.icon} size={18} />
                              <div style={{ flex: 1 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, display: 'block' }}>{cat.name}</span>
                                <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>{cat.description}</span>
                              </div>
                              <div className={styles.checkbox} style={{ backgroundColor: selected ? 'var(--color-primary)' : 'transparent', borderColor: selected ? 'var(--color-primary)' : 'var(--color-border)' }}>
                                {selected && <span style={{ color: '#FFF', fontSize: 10, fontWeight: 700 }}>OK</span>}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                );
              })}

            <Row style={{ gap: 8, marginTop: 8 }}>
              <Button title="Back" onPress={() => setStep(2)} variant="ghost" />
              <Button title="Save Plan" onPress={handleSave} />
            </Row>
          </>
        )}
      </div>
    </div>
  );
}
