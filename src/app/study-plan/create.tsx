import React, { useState } from "react";
import {
  ScrollView, View, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Card, Button, Input, Row, AIButton } from "@/components/ui";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useAppStore } from "@/store/useAppStore";
import { todayISO, addDays } from "@/lib/dates";
import { slotDuration, timeToMins, parseTimeToHHMM, parsePastedTimetable } from "@/lib/timetable";
import { SlotType, DayOfWeek } from "@/types";

const SLOT_TYPES: { key: SlotType; label: string; desc: string; color: string }[] = [
  { key: "big",      label: "Big Topic",  desc: "3+ hrs - deep work on a major topic", color: "#EF4444" },
  { key: "medium",   label: "Medium",     desc: "1.5-3 hrs - sub-topics and concepts", color: "#F59E0B" },
  { key: "revision", label: "Revision",   desc: "Any duration - revisit past topics",  color: "#8B5CF6" },
  { key: "break",    label: "Break/Rest", desc: "Rest, leisure, meals",                color: "#10B981" },
  { key: "other",    label: "Other",      desc: "Morning routine, gym, etc.",          color: "#6B7280" },
];

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: "mon", label: "M" }, { key: "tue", label: "T" }, { key: "wed", label: "W" },
  { key: "thu", label: "T" }, { key: "fri", label: "F" }, { key: "sat", label: "S" },
  { key: "sun", label: "S" },
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
  { label: "Wake Up & Morning Routine", startTime: "07:00", endTime: "09:00", slotType: "other",    categoryIds: [], daysOfWeek: [] },
  { label: "Slot 1 - Deep Study",       startTime: "09:00", endTime: "12:00", slotType: "big",      categoryIds: [], daysOfWeek: [] },
  { label: "Lunch Break",               startTime: "12:00", endTime: "13:00", slotType: "break",    categoryIds: [], daysOfWeek: [] },
  { label: "Slot 2 - Study",            startTime: "15:00", endTime: "17:00", slotType: "medium",   categoryIds: [], daysOfWeek: [] },
  { label: "Revision Block",            startTime: "17:00", endTime: "20:00", slotType: "revision", categoryIds: [], daysOfWeek: [] },
  { label: "Dinner & Wind Down",        startTime: "20:00", endTime: "22:00", slotType: "break",    categoryIds: [], daysOfWeek: [] },
];

export default function CreateStudyPlanScreen() {
  const colors = useTheme();
  const router = useRouter();
  const store = useAppStore();

  const [step, setStep] = useState(1);
  const [planName, setPlanName] = useState("");
  const [durationMonths, setDurationMonths] = useState("3");
  const [slots, setSlots] = useState<DraftSlot[]>(defaultSlots);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPlanSummary, setAiPlanSummary] = useState("");
  const [pastedText, setPastedText] = useState("");

  const today = todayISO();
  const months = parseInt(durationMonths) || 3;
  const endDate = addDays(today, months * 30);

  const updateSlot = (idx: number, updates: Partial<DraftSlot>) => {
    setSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, ...updates } : s)));
  };

  const addSlot = () => {
    setSlots((prev) => [
      ...prev,
      { label: "New Slot", startTime: "10:00", endTime: "12:00", slotType: "medium", categoryIds: [], daysOfWeek: [] },
    ]);
    setEditingIdx(slots.length);
  };

  const removeSlot = (idx: number) => {
    setSlots((prev) => prev.filter((_, i) => i !== idx));
    setEditingIdx(null);
  };

  const toggleDayOnSlot = (idx: number, dow: DayOfWeek) => {
    const slot = slots[idx];
    const has = slot.daysOfWeek.includes(dow);
    updateSlot(idx, {
      daysOfWeek: has
        ? slot.daysOfWeek.filter((d) => d !== dow)
        : [...slot.daysOfWeek, dow],
    });
  };

  const toggleCatOnSlot = (idx: number, catId: string) => {
    const slot = slots[idx];
    const has = slot.categoryIds.includes(catId);
    updateSlot(idx, {
      categoryIds: has
        ? slot.categoryIds.filter((c) => c !== catId)
        : [...slot.categoryIds, catId],
    });
  };

  const generateSmartSlots = async () => {
    if (!aiPrompt.trim()) {
      Alert.alert("Prompt Required", "Please describe your schedule or goals first.");
      return;
    }
    setIsGenerating(true);
    setAiPlanSummary("");
    try {
      const response = await fetch(
        `${store.settings.aiBackendUrl}/generate-timetable-slots`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userPrompt: aiPrompt,
            planName: planName || "My Study Plan",
            durationMonths: months,
            categories: store.categories,
          }),
        }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      if (data.slots && Array.isArray(data.slots)) {
        const generatedSlots: DraftSlot[] = data.slots.map((s: any) => {
          const categoryIds: string[] = [];
          if (s.categoryNames && Array.isArray(s.categoryNames)) {
            s.categoryNames.forEach((name: string) => {
              const matched = store.categories.find(
                (c) => c.name.toLowerCase().trim() === name.toLowerCase().trim()
              );
              if (matched) {
                categoryIds.push(matched.id);
              }
            });
          }
          return {
            label: s.label || "Study Slot",
            startTime: s.startTime || "09:00",
            endTime: s.endTime || "10:00",
            slotType: (s.slotType as SlotType) || "medium",
            categoryIds,
            daysOfWeek: s.daysOfWeek || [],
          };
        });
        setSlots(generatedSlots);
        setAiPlanSummary(data.planSummary || "");
        setEditingIdx(null);
      }
    } catch (err) {
      console.warn("Smart slot generation failed:", err);
      Alert.alert("Generation Failed", "Could not generate slots. Check your connection and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const inferSlotType = (label: string, durMins: number): SlotType => {
    const lower = label.toLowerCase();
    if (lower.includes("break") || lower.includes("rest") || lower.includes("lunch") || lower.includes("dinner") || lower.includes("meal") || lower.includes("bath") || lower.includes("freshen")) {
      return "break";
    }
    if (lower.includes("revision") || lower.includes("review") || lower.includes("planning") || lower.includes("reflect")) {
      return "revision";
    }
    if (lower.includes("wake") || lower.includes("morning") || lower.includes("meditation") || lower.includes("ready") || lower.includes("sleep") || lower.includes("routine")) {
      return "other";
    }
    if (durMins >= 150) {
      return "big";
    }
    return "medium";
  };

  const handleImportPasted = () => {
    if (!pastedText.trim()) {
      Alert.alert("Text Required", "Please paste your table or list of activities first.");
      return;
    }
    const parsed = parsePastedTimetable(pastedText);
    if (parsed.length === 0) {
      Alert.alert("No Slots Found", "We couldn't extract any times and activities from your text. Please verify the format.");
      return;
    }

    const imported: DraftSlot[] = parsed.map(p => {
      const dur = slotDuration(p.startTime, p.endTime);
      return {
        label: p.label,
        startTime: p.startTime,
        endTime: p.endTime,
        slotType: inferSlotType(p.label, dur),
        categoryIds: [],
        daysOfWeek: [],
      };
    });

    setSlots(imported);
    setPastedText("");
    Alert.alert("Import Successful", `Successfully imported ${imported.length} slots from your text!`);
  };

  const handleSave = () => {
    if (!planName.trim()) {
      Alert.alert("Required", "Please enter a plan name on Step 1.");
      setStep(1);
      return;
    }

    // Validate slots one final time
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
      if (!timeRegex.test(s.startTime) || !timeRegex.test(s.endTime)) {
        Alert.alert(
          "Invalid Time Format",
          `Slot "${s.label || `Slot ${i + 1}`}" has an invalid time format. Please use HH:MM (24-hour, e.g. 09:00).`
        );
        setStep(2);
        setEditingIdx(i);
        return;
      }
      
      const startMins = timeToMins(s.startTime);
      const endMins = timeToMins(s.endTime);
      if (startMins >= endMins) {
        Alert.alert(
          "Invalid Time Range",
          `Slot "${s.label || `Slot ${i + 1}`}" start time must be before end time.`
        );
        setStep(2);
        setEditingIdx(i);
        return;
      }
    }

    const planId = store.createStudyPlan({
      name: planName.trim(),
      durationMonths: months,
      startDate: today,
      endDate,
      slotTemplates: [],
    });

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

    router.replace("/(tabs)/timetable" as any);
  };

  const stepColor = (s: number) =>
    step >= s ? colors.primary : colors.border;

  return (
    <ThemedView style={{ flex: 1 }}>
      {/* Step indicator */}
      <View style={[styles.stepRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {[1, 2, 3].map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => {
              if (s > 1 && !planName.trim()) {
                Alert.alert("Required", "Please enter a plan name first.");
                return;
              }
              if (s > 2 && slots.length === 0) {
                Alert.alert("Required", "Please add at least one daily slot first.");
                return;
              }
              setStep(s);
            }}
            style={styles.stepItem}
          >
            <View style={[styles.stepCircle, { backgroundColor: stepColor(s) }]}>
              <ThemedText style={{ color: "#FFF", fontWeight: "700", fontSize: 13 }}>{s}</ThemedText>
            </View>
            <ThemedText type="small" style={{ color: stepColor(s), marginTop: 2 }}>
              {s === 1 ? "Info" : s === 2 ? "Slots" : "Assign"}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <ThemedText type="heading">Create Study Plan</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: 8 }}>
              Define your study plan name and duration.
            </ThemedText>

            <Card>
              <ThemedText type="bodyBold" style={{ marginBottom: 6 }}>Plan Name</ThemedText>
              <Input
                value={planName}
                onChangeText={setPlanName}
                placeholder="e.g. 3 Month DSA Prep, English Speaking Plan"
              />

              <ThemedText type="bodyBold" style={{ marginTop: 14, marginBottom: 6 }}>
                Duration (months)
              </ThemedText>
              <Row style={{ flexWrap: "wrap", gap: 8 }}>
                {[1, 2, 3, 4, 5, 6].map((m) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setDurationMonths(String(m))}
                    style={[
                      styles.durationChip,
                      {
                        backgroundColor: months === m ? colors.primary : colors.surface,
                        borderColor: months === m ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <ThemedText style={{ color: months === m ? "#FFF" : colors.text, fontWeight: "600" }}>
                      {m}M
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </Row>

              <View style={[styles.dateRow, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "44" }]}>
                <ThemedText type="small" style={{ color: colors.primary }}>
                  {today} to {endDate}  ({months} months)
                </ThemedText>
              </View>
            </Card>

            <Button
              title="Next: Set Time Slots"
              onPress={() => {
                if (!planName.trim()) {
                  Alert.alert("Required", "Please enter a plan name first.");
                  return;
                }
                setStep(2);
              }}
            />
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <ThemedText type="heading">Daily Time Slots</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: 8 }}>
              Build your day schedule manually, or let AI generate it from your description.
            </ThemedText>

            {/* ── AI Smart Generation Card ── */}
            <View style={[styles.aiGenCard, { backgroundColor: colors.primary + "0D", borderColor: colors.primary + "55" }]}>
              <Row style={{ marginBottom: 8, gap: 8 }}>
                <ThemedText style={{ fontSize: 20 }}>🤖</ThemedText>
                <View style={{ flex: 1 }}>
                  <ThemedText type="bodyBold" style={{ color: colors.primary }}>AI Smart Schedule Generator</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Describe your routine and goals — Gemini builds your slots.
                  </ThemedText>
                </View>
              </Row>

              <Input
                value={aiPrompt}
                onChangeText={setAiPrompt}
                multiline
                placeholder={`e.g. "I wake up at 7am. I'm preparing for DSA in 3 months. I study best in mornings. I need 3 hrs for coding, 1 hr for theory, evening revision. Weekends extra 1 hour."`}
              />

              <AIButton
                title="Generate Smart Slots"
                onPress={generateSmartSlots}
                loading={isGenerating}
              />

              {aiPlanSummary ? (
                <View style={[styles.summaryBadge, { backgroundColor: colors.success + "18", borderColor: colors.success + "44" }]}>
                  <ThemedText style={{ fontSize: 12, color: colors.success, fontStyle: "italic" }}>
                    ✅ {aiPlanSummary}
                  </ThemedText>
                </View>
              ) : null}
            </View>

            {/* ── Copied Timetable Import Card ── */}
            <View style={[styles.aiGenCard, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 12, marginBottom: 12 }]}>
              <Row style={{ marginBottom: 8, gap: 8 }}>
                <ThemedText style={{ fontSize: 20 }}>📋</ThemedText>
                <View style={{ flex: 1 }}>
                  <ThemedText type="bodyBold" style={{ color: colors.primary }}>Import Copied Table / Text</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Paste a schedule table or routine (e.g. from ChatGPT) to extract slots instantly.
                  </ThemedText>
                </View>
              </Row>

              <Input
                value={pastedText}
                onChangeText={setPastedText}
                multiline
                numberOfLines={6}
                style={{ minHeight: 100, textAlignVertical: "top" }}
                placeholder={`Paste your table here, for example:\n| 6:15 AM - 6:20 AM | Freshen up |\n| 7:45 AM - 9:15 AM | Study Session |\n| 11:30 AM - 10:00 PM | Office |`}
              />

              <TouchableOpacity
                onPress={handleImportPasted}
                style={[
                  styles.generateBtn,
                  {
                    backgroundColor: colors.primary,
                  },
                ]}
              >
                <ThemedText style={{ color: "#FFF", fontWeight: "700", textAlign: "center" }}>
                  Import Pasted Table
                </ThemedText>
              </TouchableOpacity>
            </View>

            <Row style={{ alignItems: "center", gap: 8, marginBottom: 4 }}>
              <View style={[styles.divLine, { backgroundColor: colors.border }]} />
              <ThemedText type="small" themeColor="textSecondary">or edit manually</ThemedText>
              <View style={[styles.divLine, { backgroundColor: colors.border }]} />
            </Row>

            {slots.map((slot, idx) => {
              const cfg = SLOT_TYPES.find((t) => t.key === slot.slotType) ?? SLOT_TYPES[4];
              const dur = slotDuration(slot.startTime, slot.endTime);
              const isOpen = editingIdx === idx;

              return (
                <Card key={idx} style={{ marginBottom: 4 }}>
                  <Row style={{ justifyContent: "space-between", alignItems: "center" }}>
                    <TouchableOpacity
                      style={{ flex: 1, marginRight: 8 }}
                      onPress={() => setEditingIdx(isOpen ? null : idx)}
                    >
                      <View>
                        <ThemedText type="bodyBold" numberOfLines={1}>{slot.label}</ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {slot.startTime} - {slot.endTime}  ({dur} min)
                        </ThemedText>
                      </View>
                    </TouchableOpacity>

                    <Row style={{ alignItems: "center", gap: 10 }}>
                      <View style={[styles.slotTypeDot, { backgroundColor: cfg.color }]} />
                      
                      <TouchableOpacity onPress={() => setEditingIdx(isOpen ? null : idx)}>
                        <ThemedText style={{ color: colors.primary, fontSize: 13, fontWeight: "600" }}>
                          {isOpen ? "Close" : "Edit"}
                        </ThemedText>
                      </TouchableOpacity>

                      <TouchableOpacity onPress={() => removeSlot(idx)}>
                        <ThemedText style={{ color: colors.error, fontSize: 13, fontWeight: "600" }}>
                          Delete
                        </ThemedText>
                      </TouchableOpacity>
                    </Row>
                  </Row>

                  {isOpen && (
                    <View style={{ marginTop: 10, gap: 10 }}>
                      <Input
                        value={slot.label}
                        onChangeText={(v) => updateSlot(idx, { label: v })}
                        placeholder="Slot label"
                      />

                      <Row style={{ gap: 8 }}>
                        <View style={{ flex: 1 }}>
                          <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: 4 }}>Start</ThemedText>
                          <Input
                            value={slot.startTime}
                            onChangeText={(v) => updateSlot(idx, { startTime: v })}
                            placeholder="HH:MM"
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: 4 }}>End</ThemedText>
                          <Input
                            value={slot.endTime}
                            onChangeText={(v) => updateSlot(idx, { endTime: v })}
                            placeholder="HH:MM"
                          />
                        </View>
                      </Row>

                      <ThemedText type="small" themeColor="textSecondary">Type</ThemedText>
                      <Row style={{ flexWrap: "wrap", gap: 6 }}>
                        {SLOT_TYPES.map((t) => (
                          <TouchableOpacity
                            key={t.key}
                            onPress={() => updateSlot(idx, { slotType: t.key })}
                            style={[
                              styles.typeChip,
                              {
                                backgroundColor: slot.slotType === t.key ? t.color : t.color + "18",
                                borderColor: t.color,
                              },
                            ]}
                          >
                            <ThemedText style={{
                              fontSize: 11,
                              color: slot.slotType === t.key ? "#FFF" : t.color,
                              fontWeight: "600",
                            }}>
                              {t.label}
                            </ThemedText>
                          </TouchableOpacity>
                        ))}
                      </Row>

                      <ThemedText type="small" themeColor="textSecondary">Days (empty = all days)</ThemedText>
                      <Row style={{ gap: 4 }}>
                        {DAYS.map((d) => {
                          const active = slot.daysOfWeek.includes(d.key);
                          return (
                            <TouchableOpacity
                              key={d.key}
                              onPress={() => toggleDayOnSlot(idx, d.key)}
                              style={[
                                styles.dayChip,
                                {
                                  backgroundColor: active ? colors.primary : colors.surface,
                                  borderColor: active ? colors.primary : colors.border,
                                },
                              ]}
                            >
                              <ThemedText style={{
                                fontSize: 11, fontWeight: "700",
                                color: active ? "#FFF" : colors.text,
                              }}>
                                {d.label}
                              </ThemedText>
                            </TouchableOpacity>
                          );
                        })}
                      </Row>

                      <Button
                        small
                        title="Remove Slot"
                        onPress={() => removeSlot(idx)}
                        variant="ghost"
                      />
                    </View>
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
                    Alert.alert("Required", "Please add at least one slot first.");
                    return;
                  }
                  const updatedSlots = [...slots];
                  for (let i = 0; i < slots.length; i++) {
                    const s = slots[i];
                    const formattedStart = parseTimeToHHMM(s.startTime);
                    const formattedEnd = parseTimeToHHMM(s.endTime);
                    if (!formattedStart || !formattedEnd) {
                      Alert.alert(
                        "Invalid Time Format",
                        `Slot "${s.label || `Slot ${i + 1}`}" has an invalid time format. Use HH:MM format (e.g. 09:00 or 9:00 AM).`
                      );
                      setEditingIdx(i);
                      return;
                    }
                    const startMins = timeToMins(formattedStart);
                    const endMins = timeToMins(formattedEnd);
                    if (startMins >= endMins) {
                      Alert.alert(
                        "Invalid Time Range",
                        `Slot "${s.label || `Slot ${i + 1}`}" start time must be before end time.`
                      );
                      setEditingIdx(i);
                      return;
                    }
                    updatedSlots[i] = {
                      ...s,
                      startTime: formattedStart,
                      endTime: formattedEnd,
                    };
                  }
                  setSlots(updatedSlots);
                  setStep(3);
                }}
              />
            </Row>
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <>
            <ThemedText type="heading">Assign Categories</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: 8 }}>
              For each study slot, pick which subjects to cover.
            </ThemedText>

            {slots
              .filter((s) => s.slotType !== "break" && s.slotType !== "other")
              .map((slot, listIdx) => {
                const realIdx = slots.findIndex((s) => s === slot);
                const cfg = SLOT_TYPES.find((t) => t.key === slot.slotType) ?? SLOT_TYPES[4];

                return (
                  <Card key={listIdx} style={{ marginBottom: 4 }}>
                    <Row style={{ marginBottom: 8 }}>
                      <View style={[styles.slotTypeDot, { backgroundColor: cfg.color, marginRight: 8 }]} />
                      <View>
                        <ThemedText type="bodyBold">{slot.label}</ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {slot.startTime}-{slot.endTime}  ({slotDuration(slot.startTime, slot.endTime)} min)
                        </ThemedText>
                      </View>
                    </Row>

                    {store.categories.length === 0 ? (
                      <ThemedText type="small" themeColor="textSecondary" style={{ fontStyle: "italic" }}>
                        No categories yet. Create some in the Categories tab first.
                      </ThemedText>
                    ) : (
                      <View style={{ gap: 6 }}>
                        {store.categories.map((cat) => {
                          const selected = slot.categoryIds.includes(cat.id);
                          return (
                            <TouchableOpacity
                              key={cat.id}
                              onPress={() => toggleCatOnSlot(realIdx, cat.id)}
                              style={[
                                styles.catRow,
                                {
                                  backgroundColor: selected ? colors.primary + "15" : colors.surface,
                                  borderColor: selected ? colors.primary : colors.border,
                                },
                              ]}
                            >
                              <ThemedText style={{ fontSize: 18 }}>{cat.icon}</ThemedText>
                              <View style={{ flex: 1 }}>
                                <ThemedText type="small" style={{ fontWeight: "600" }}>{cat.name}</ThemedText>
                                <ThemedText style={{ fontSize: 10, color: colors.textSecondary }}>
                                  {cat.description}
                                </ThemedText>
                              </View>
                              <View style={[styles.checkbox, {
                                backgroundColor: selected ? colors.primary : "transparent",
                                borderColor: selected ? colors.primary : colors.border,
                              }]}>
                                {selected && (
                                  <ThemedText style={{ color: "#FFF", fontSize: 10, fontWeight: "700" }}>OK</ThemedText>
                                )}
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
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

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  stepRow: {
    flexDirection: "row", justifyContent: "center", gap: 32,
    paddingVertical: 12, borderBottomWidth: 1,
  },
  stepItem: { alignItems: "center", gap: 4 },
  stepCircle: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  content: { padding: Spacing.three, gap: Spacing.two },
  durationChip: {
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 14,
    paddingVertical: 6, minWidth: 44, alignItems: "center",
  },
  dateRow: { borderWidth: 1, borderRadius: 8, padding: 10, marginTop: 12 },
  slotTypeDot: { width: 10, height: 10, borderRadius: 5 },
  typeChip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  dayChip: {
    width: 30, height: 30, borderRadius: 15, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  catRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderRadius: 10, padding: 10,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 4, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center",
  },
  aiGenCard: {
    borderWidth: 1.5, borderRadius: 14, padding: Spacing.three,
    gap: Spacing.two,
  },
  generateBtn: {
    borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20,
    alignItems: "center", justifyContent: "center",
    marginTop: 4,
  },
  summaryBadge: {
    borderWidth: 1, borderRadius: 8, padding: 10, marginTop: 4,
  },
  divLine: {
    flex: 1, height: 1, borderRadius: 1,
  },
});
