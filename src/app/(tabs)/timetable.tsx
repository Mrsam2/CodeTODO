import React, { useState, useCallback } from "react";
import {
  ScrollView, View, TouchableOpacity, ActivityIndicator, Modal,
  StyleSheet, Animated, Alert, Platform, useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Card, Button, SectionHeader, Row, Input, ProgressBar, CategoryIcon } from "@/components/ui";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useAppStore } from "@/store/useAppStore";
import { todayISO } from "@/lib/dates";
import { todaySlots, overallProgress, timeToMins, slotDuration, parseTimeToHHMM } from "@/lib/timetable";
import { categoryCompletionPct, findFirstUnlockedIncompleteNode } from "@/lib/roadmap";
import { StudyPlan, AISuggestion, SlotTemplate, SlotType, RoadmapNode } from "@/types";

const SLOT_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  big:      { label: "3 Hrs — Big Topic",    color: "#EF4444", bg: "#FEF2F2" },
  medium:   { label: "2 Hrs — Medium Topic", color: "#F59E0B", bg: "#FFFBEB" },
  revision: { label: "Revision",             color: "#8B5CF6", bg: "#F5F3FF" },
  break:    { label: "Break / Rest",         color: "#10B981", bg: "#ECFDF5" },
  other:    { label: "Other",                color: "#6B7280", bg: "#F9FAFB" },
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
  if (Number.isInteger(hrs)) {
    return `[${hrs} ${hrs === 1 ? 'HR' : 'HRS'}]`;
  }
  return `[${hrs.toFixed(1)} HRS]`;
}

function buildSlotTopicPreviews(
  slot: SlotTemplate,
  roadmapNodes: RoadmapNode[],
  categories: { id: string; name: string; color: string; icon: string }[]
) {
  return slot.categoryIds
    .map((categoryId) => {
      const category = categories.find((cat) => cat.id === categoryId);
      if (!category) return null;

      return {
        category,
        pct: categoryCompletionPct(roadmapNodes, categoryId),
        nextTopic: findFirstUnlockedIncompleteNode(roadmapNodes, categoryId),
      };
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
  categories: { id: string; name: string; color: string; icon: string }[];
  topicPreviews: { category: { id: string; name: string; color: string; icon: string }; pct: number; nextTopic: RoadmapNode | null }[];
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
  const colors = useTheme();
  const cfg = SLOT_TYPE_CONFIG[slot.slotType] ?? SLOT_TYPE_CONFIG.other;
  const assignedCats = categories.filter((c) => slot.categoryIds.includes(c.id));
  const isStudy = slot.slotType !== "break" && slot.slotType !== "other";

  // Local state for inline editing
  const [editLabel, setEditLabel] = useState(slot.label);
  const [editStart, setEditStart] = useState(slot.startTime);
  const [editEnd, setEditEnd] = useState(slot.endTime);
  const [editType, setEditType] = useState<SlotType>(slot.slotType);
  const [editCatIds, setEditCatIds] = useState<string[]>(slot.categoryIds);

  const toggleCat = (catId: string) => {
    setEditCatIds(prev => prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]);
  };

  const handleSave = () => {
    if (!editLabel.trim() || !editStart.trim() || !editEnd.trim()) {
      Alert.alert("Required", "Please fill in all fields.");
      return;
    }
    const formattedStart = parseTimeToHHMM(editStart);
    const formattedEnd = parseTimeToHHMM(editEnd);
    if (!formattedStart || !formattedEnd) {
      Alert.alert("Invalid Format", "Use HH:MM format for times (e.g. 09:00 or 9:00 AM).");
      return;
    }
    if (timeToMins(formattedStart) >= timeToMins(formattedEnd)) {
      Alert.alert("Invalid Range", "Start time must be before end time.");
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
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.96}
      style={[
      styles.tableRow,
      { borderColor: colors.border },
      !isLast && { borderBottomWidth: 1.5 }
    ]}
    >
      {/* Time column (Left cell) */}
      <View style={[
        styles.tableTimeCell,
        {
          borderColor: colors.border,
          backgroundColor: colors.surface,
          borderLeftWidth: 4,
          borderLeftColor: cfg.color
        }
      ]}>
        {isEditing ? (
          <View style={{ gap: 6, width: "100%", paddingHorizontal: 6 }}>
            <Input value={editStart} onChangeText={setEditStart} placeholder="Start" style={{ fontSize: 11, paddingHorizontal: 4, minHeight: 30 }} />
            <ThemedText style={{ fontSize: 10, alignSelf: "center", opacity: 0.5 }}>To</ThemedText>
            <Input value={editEnd} onChangeText={setEditEnd} placeholder="End" style={{ fontSize: 11, paddingHorizontal: 4, minHeight: 30 }} />
          </View>
        ) : (
          <>
            <ThemedText style={styles.tableTimeText}>{formatTimeTo12Hour(slot.startTime)}</ThemedText>
            <ThemedText style={styles.tableTimeToText}>To</ThemedText>
            <ThemedText style={styles.tableTimeText}>{formatTimeTo12Hour(slot.endTime)}</ThemedText>
          </>
        )}
      </View>

      {/* Content column (Right cell) */}
      <View style={[styles.tableContentCell, { backgroundColor: colors.surface }]}>
        {isEditing ? (
          <View style={{ gap: 8 }}>
            <Input value={editLabel} onChangeText={setEditLabel} placeholder="Slot Label" style={{ minHeight: 35 }} />
            
            <ThemedText type="small" themeColor="textSecondary">Slot Type</ThemedText>
            <Row style={{ flexWrap: 'wrap', gap: 4 }}>
              {Object.entries(SLOT_TYPE_CONFIG).map(([typeKey, val]) => (
                <TouchableOpacity
                  key={typeKey}
                  onPress={() => setEditType(typeKey as SlotType)}
                  style={[
                    styles.legendChip,
                    {
                      backgroundColor: editType === typeKey ? val.color : val.color + "12",
                      borderColor: val.color,
                      paddingVertical: 4,
                    }
                  ]}
                >
                  <ThemedText style={{ fontSize: 10, color: editType === typeKey ? "#FFF" : val.color, fontWeight: "600" }}>
                    {val.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </Row>

            <ThemedText type="small" themeColor="textSecondary">Assign Categories</ThemedText>
            <Row style={{ flexWrap: 'wrap', gap: 4 }}>
              {categories.map((cat) => {
                const active = editCatIds.includes(cat.id);
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => toggleCat(cat.id)}
                    style={[
                      styles.catChip,
                      {
                        backgroundColor: active ? cat.color || colors.primary : "transparent",
                        borderColor: cat.color || colors.primary,
                        opacity: active ? 1 : 0.6,
                      }
                    ]}
                  >
                    <Row style={{ gap: 4, alignItems: 'center' }}>
                      <CategoryIcon icon={cat.icon} size={9} />
                      <ThemedText style={{ fontSize: 9, color: active ? "#FFF" : cat.color || colors.primary, fontWeight: "600" }}>
                        {cat.name}
                      </ThemedText>
                    </Row>
                  </TouchableOpacity>
                );
              })}
            </Row>

            <Row style={{ gap: 6, marginTop: 4 }}>
              <Button small title="Cancel" variant="secondary" onPress={onCancelEdit} />
              <Button small title="Save" onPress={handleSave} />
            </Row>
          </View>
        ) : (
          <>
            <View style={styles.cellHeaderRow}>
              <ThemedText style={[styles.cellTitle, { color: colors.text }]} numberOfLines={2}>
                {slot.label.toUpperCase()}
              </ThemedText>
              <ThemedText style={[styles.cellDuration, { color: cfg.color }]}>
                {formatDuration(slot.durationMins)}
              </ThemedText>
            </View>

            {/* Category tags */}
            {assignedCats.length > 0 && (
              <View style={{ gap: 8, marginTop: 6 }}>
                {assignedCats.map((cat) => {
                  const preview = topicPreviews.find((item) => item.category.id === cat.id);
                  return (
                    <View key={cat.id} style={{ gap: 4 }}>
                      <View style={[styles.catChip, { alignSelf: "flex-start", borderColor: cat.color || colors.primary }]}>
                        <Row style={{ gap: 4, alignItems: 'center' }}>
                          <CategoryIcon icon={cat.icon} size={10} />
                          <ThemedText style={{ fontSize: 10, color: cat.color || colors.primary, fontWeight: "600" }}>
                            {cat.name}
                          </ThemedText>
                        </Row>
                      </View>
                      <ThemedText style={{ fontSize: 12, fontWeight: "700", color: colors.text }} numberOfLines={2}>
                        {preview?.nextTopic?.title ?? "All topics complete"}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {preview ? `${preview.pct}% complete` : "No roadmap topic found"}
                      </ThemedText>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Actions inside cell */}
            <Row style={{ marginTop: 8, justifyContent: 'space-between', width: '100%' }}>
              <Row style={{ gap: 6 }}>
                {isStudy && (
                  isAllocating ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionBtn, { borderColor: colors.primary, backgroundColor: colors.primary + "12" }]}
                      onPress={() => onAllocate(slot)}
                    >
                      <ThemedText style={{ color: colors.primary, fontSize: 10, fontWeight: "700" }}>
                        Create Todo
                      </ThemedText>
                    </TouchableOpacity>
                  )
                )}
              </Row>
              <Row style={{ gap: 6 }}>
                <TouchableOpacity
                  style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                  onPress={onStartEdit}
                >
                  <ThemedText style={{ color: colors.text, fontSize: 10, fontWeight: "700" }}>
                    Edit
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { borderColor: colors.error, backgroundColor: colors.error + "12" }]}
                  onPress={onDelete}
                >
                  <ThemedText style={{ color: colors.error, fontSize: 10, fontWeight: "700" }}>
                    Delete
                  </ThemedText>
                </TouchableOpacity>
              </Row>
            </Row>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

function AISuggestionsPanel({
  suggestion,
  onRefresh,
  isLoading,
}: {
  suggestion: AISuggestion | undefined;
  onRefresh: () => void;
  isLoading: boolean;
}) {
  const colors = useTheme();

  return (
    <View style={[styles.aiPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header */}
      <Row style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <View style={styles.aiHeaderRow}>
          <ThemedText style={styles.aiIcon}>🧠</ThemedText>
          <ThemedText type="bodyBold" style={{ color: colors.text }}>
            Things to Keep in Mind
          </ThemedText>
        </View>
        <TouchableOpacity
          onPress={onRefresh}
          disabled={isLoading}
          style={[styles.refreshBtn, { borderColor: colors.border }]}
        >
          {isLoading
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <ThemedText style={{ fontSize: 12, color: colors.primary }}>↺ Refresh</ThemedText>
          }
        </TouchableOpacity>
      </Row>

      {/* Overall message */}
      {suggestion?.overallMessage ? (
        <View style={[styles.overallMsg, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "44" }]}>
          <ThemedText type="small" style={{ color: colors.primary, fontWeight: "600", fontStyle: "italic" }}>
            "{suggestion.overallMessage}"
          </ThemedText>
        </View>
      ) : null}

      {/* Numbered tips */}
      {suggestion?.suggestions?.length ? (
        <View style={{ gap: 10, marginTop: 8 }}>
          {suggestion.suggestions.map((tip, i) => (
            <Row key={i} style={{ alignItems: "flex-start", gap: 10 }}>
              <View style={[styles.tipNum, { backgroundColor: colors.primary }]}>
                <ThemedText style={{ color: "#FFF", fontSize: 11, fontWeight: "700" }}>
                  {i + 1}
                </ThemedText>
              </View>
              <ThemedText type="small" style={{ flex: 1, color: colors.text, lineHeight: 18 }}>
                {tip}
              </ThemedText>
            </Row>
          ))}
        </View>
      ) : (
        <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 8, fontStyle: "italic" }}>
          Tap "↺ Refresh" to get personalized study tips from Gemini AI.
        </ThemedText>
      )}

      {suggestion?.generatedAt ? (
        <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 10, fontSize: 10 }}>
          Generated {new Date(suggestion.generatedAt).toLocaleString()}
        </ThemedText>
      ) : null}
    </View>
  );
}

export default function TimetableScreen() {
  const colors = useTheme();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const router = useRouter();
  const store = useAppStore();
  const [allocatingSlotId, setAllocatingSlotId] = useState<string | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotTemplate | null>(null);

  // Edit / Add Slot states
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addLabel, setAddLabel] = useState("");
  const [addStartTime, setAddStartTime] = useState("09:00");
  const [addEndTime, setAddEndTime] = useState("10:00");
  const [addSlotType, setAddSlotType] = useState<SlotType>("medium");
  const [addCategoryIds, setAddCategoryIds] = useState<string[]>([]);

  const activePlan: StudyPlan | undefined = store.studyPlans[store.studyPlans.length - 1];
  const suggestion: AISuggestion | undefined = activePlan
    ? store.aiSuggestions.find((s) => s.studyPlanId === activePlan.id)
    : undefined;

  // Display ALL slots of the plan, sorted by start time
  const slots = activePlan
    ? [...activePlan.slotTemplates].sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime))
    : [];
  const allCatIds = activePlan
    ? [...new Set(activePlan.slotTemplates.flatMap((s) => s.categoryIds))]
    : [];
  const progress = overallProgress(store.roadmapNodes, allCatIds);
  const selectedSlotPreviews = selectedSlot
    ? buildSlotTopicPreviews(selectedSlot, store.roadmapNodes, store.categories)
    : [];

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

  // Direct Slot CRUD handlers
  const handleAddSlot = () => {
    if (!activePlan) return;
    if (!addLabel.trim() || !addStartTime.trim() || !addEndTime.trim()) {
      Alert.alert("Required", "Please fill in all fields.");
      return;
    }
    const formattedStart = parseTimeToHHMM(addStartTime);
    const formattedEnd = parseTimeToHHMM(addEndTime);
    if (!formattedStart || !formattedEnd) {
      Alert.alert("Invalid Format", "Use HH:MM format for times (e.g. 09:00 or 9:00 AM).");
      return;
    }
    if (timeToMins(formattedStart) >= timeToMins(formattedEnd)) {
      Alert.alert("Invalid Range", "Start time must be before end time.");
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
    
    // Reset add states
    setAddLabel("");
    setAddStartTime("09:00");
    setAddEndTime("10:00");
    setAddSlotType("medium");
    setAddCategoryIds([]);
    setShowAddForm(false);
  };

  const handleSaveEdit = (slotId: string, updatedFields: Partial<SlotTemplate>) => {
    if (!activePlan) return;
    const updated = activePlan.slotTemplates.map(s => 
      s.id === slotId ? { ...s, ...updatedFields } : s
    ).sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime));
    store.updateStudyPlan(activePlan.id, { slotTemplates: updated });
    setEditingSlotId(null);
  };

  const handleDeleteSlot = (slotId: string, label: string) => {
    if (!activePlan) return;
    const confirmed = Platform.OS === 'web'
      ? window.confirm(`Are you sure you want to delete the slot "${label}"?`)
      : true; // Bypass on mobile or let Alert handle it if needed
    if (confirmed) {
      const updated = activePlan.slotTemplates.filter(s => s.id !== slotId);
      store.updateStudyPlan(activePlan.id, { slotTemplates: updated });
    }
  };

  const handleDeletePlan = () => {
    if (!activePlan) return;
    const confirmed = Platform.OS === 'web'
      ? window.confirm(`Are you sure you want to delete the entire timetable "${activePlan.name}"?`)
      : true;
    if (confirmed) {
      store.deleteStudyPlan(activePlan.id);
    }
  };

  const toggleAddCategory = (catId: string) => {
    setAddCategoryIds(prev => prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]);
  };

  if (!activePlan) {
    return (
      <ThemedView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.emptyContainer}>
          <ThemedText style={styles.emptyEmoji}>📅</ThemedText>
          <ThemedText type="heading" style={{ textAlign: "center", marginBottom: 8 }}>
            No Study Plan Yet
          </ThemedText>
          <ThemedText type="body" themeColor="textSecondary" style={{ textAlign: "center", marginBottom: 32, lineHeight: 22 }}>
            Create a structured timetable — set time slots, assign your categories, and let AI build your daily todo list automatically.
          </ThemedText>

          {/* Legend preview */}
          <Card style={{ width: "100%", marginBottom: 24 }}>
            <ThemedText type="bodyBold" style={{ marginBottom: 12 }}>Slot Types</ThemedText>
            {Object.entries(SLOT_TYPE_CONFIG).filter(([k]) => k !== "other").map(([key, cfg]) => (
              <Row key={key} style={{ marginBottom: 6, gap: 8 }}>
                <View style={[styles.legendDot, { backgroundColor: cfg.color }]} />
                <ThemedText type="small">{cfg.label}</ThemedText>
              </Row>
            ))}
          </Card>

          <Button
            title="+ Create Study Plan"
            onPress={() => router.push("/study-plan/create" as any)}
          />
        </ScrollView>
      </ThemedView>
    );
  }

  // Active plan view
  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>

        <View style={isLargeScreen ? styles.desktopContainer : styles.mobileContainer}>
          {/* Left Column */}
          <View style={isLargeScreen ? styles.desktopLeftCol : styles.mobileCol}>
            {/* Plan Header */}
            <Card style={{ marginBottom: 4 }}>
              <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <ThemedText type="title">{activePlan.name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {activePlan.durationMonths} month plan • {activePlan.startDate} → {activePlan.endDate}
                  </ThemedText>
                </View>
                <View style={[styles.progressBadge, { backgroundColor: colors.primary + "20", borderColor: colors.primary }]}>
                  <ThemedText style={{ color: colors.primary, fontWeight: "700", fontSize: 18 }}>
                    {progress}%
                  </ThemedText>
                  <ThemedText style={{ color: colors.primary, fontSize: 10 }}>done</ThemedText>
                </View>
              </Row>

              {/* Progress bar */}
              <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                <View style={[styles.progressFill, { width: `${progress}%` as any, backgroundColor: colors.primary }]} />
              </View>

              <Row style={{ marginTop: 10, gap: 8 }}>
                <Button
                  small
                  title={showAddForm ? "Cancel Add" : "+ Add Slot"}
                  onPress={() => setShowAddForm(prev => !prev)}
                  variant="secondary"
                />
                <Button
                  small
                  title="Allocate Today"
                  onPress={() => store.allocateTodosFromPlan(activePlan.id, todayISO())}
                />
                <Button
                  small
                  title="Delete Plan"
                  variant="ghost"
                  onPress={handleDeletePlan}
                />
              </Row>
            </Card>

            {/* Inline Add Slot Form Card */}
            {showAddForm && (
              <Card style={{ marginBottom: 4 }}>
                <ThemedText type="bodyBold" style={{ marginBottom: 8 }}>Add New Time Slot</ThemedText>
                <Input value={addLabel} onChangeText={setAddLabel} placeholder="Slot Label (e.g. DSA Coding Practice)" />
                
                <Row style={{ gap: 8, marginTop: 4 }}>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: 4 }}>Start Time</ThemedText>
                    <Input value={addStartTime} onChangeText={setAddStartTime} placeholder="HH:MM" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: 4 }}>End Time</ThemedText>
                    <Input value={addEndTime} onChangeText={setAddEndTime} placeholder="HH:MM" />
                  </View>
                </Row>

                <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 6 }}>Slot Type</ThemedText>
                <Row style={{ flexWrap: 'wrap', gap: 4 }}>
                  {Object.entries(SLOT_TYPE_CONFIG).map(([typeKey, val]) => (
                    <TouchableOpacity
                      key={typeKey}
                      onPress={() => setAddSlotType(typeKey as SlotType)}
                      style={[
                        styles.legendChip,
                        {
                          backgroundColor: addSlotType === typeKey ? val.color : val.color + "12",
                          borderColor: val.color,
                          paddingVertical: 4,
                        }
                      ]}
                    >
                      <ThemedText style={{ fontSize: 10, color: addSlotType === typeKey ? "#FFF" : val.color, fontWeight: "600" }}>
                        {val.label}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </Row>

                <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 6 }}>Assign Categories</ThemedText>
                <Row style={{ flexWrap: 'wrap', gap: 4 }}>
                  {store.categories.map((cat) => {
                    const active = addCategoryIds.includes(cat.id);
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => toggleAddCategory(cat.id)}
                        style={[
                          styles.catChip,
                          {
                            backgroundColor: active ? cat.color || colors.primary : "transparent",
                            borderColor: cat.color || colors.primary,
                            opacity: active ? 1 : 0.6,
                          }
                        ]}
                      >
                        <ThemedText style={{ fontSize: 9, color: active ? "#FFF" : cat.color || colors.primary, fontWeight: "600" }}>
                          {cat.icon} {cat.name}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </Row>

                <Button title="Save Slot" onPress={handleAddSlot} style={{ marginTop: 10 }} />
              </Card>
            )}

            {/* Master Timetable Section */}
            <SectionHeader title="Timetable Slots" />
            {slots.length === 0 ? (
              <Card>
                <ThemedText type="small" themeColor="textSecondary" style={{ fontStyle: "italic" }}>
                  No slots configured. Tap "+ Add Slot" to begin defining your schedule.
                </ThemedText>
              </Card>
            ) : (
              <View style={[styles.tableContainer, { borderColor: colors.border }]}>
                {slots.map((slot, index) => (
                  <SlotRow
                    key={slot.id}
                    slot={slot}
                    categories={store.categories}
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
              </View>
            )}
          </View>

          {/* Right Column */}
          <View style={isLargeScreen ? styles.desktopRightCol : styles.mobileCol}>
            {/* Legend box */}
            <Card style={{ marginBottom: 4 }}>
              <ThemedText type="bodyBold" style={{ marginBottom: 8 }}>Slot Guide</ThemedText>
              <Row style={{ flexWrap: "wrap", gap: 8 }}>
                {Object.entries(SLOT_TYPE_CONFIG).filter(([k]) => k !== "other").map(([key, cfg]) => (
                  <View key={key} style={[styles.legendChip, { backgroundColor: cfg.color + "18", borderColor: cfg.color + "44" }]}>
                    <View style={[styles.legendDot, { backgroundColor: cfg.color }]} />
                    <ThemedText style={{ color: cfg.color, fontSize: 11, fontWeight: "600" }}>{cfg.label}</ThemedText>
                  </View>
                ))}
              </Row>
            </Card>

            {/* AI Suggestions */}
            <SectionHeader title="AI Coach" style={isLargeScreen ? { marginTop: 0 } : { marginTop: 16 }} />
            <AISuggestionsPanel
              suggestion={suggestion}
              onRefresh={handleRefreshSuggestions}
              isLoading={loadingSuggestions}
            />

            {store.studyPlans.length > 1 && (
              <Card style={{ marginTop: 8 }}>
                <ThemedText type="bodyBold" style={{ marginBottom: 8 }}>All Plans</ThemedText>
                {store.studyPlans.map((plan) => (
                  <Row key={plan.id} style={{ justifyContent: "space-between", marginBottom: 6 }}>
                    <ThemedText type="small">{plan.name} ({plan.durationMonths}M)</ThemedText>
                    <TouchableOpacity onPress={() => store.deleteStudyPlan(plan.id)}>
                      <ThemedText type="small" style={{ color: colors.error }}>Delete</ThemedText>
                    </TouchableOpacity>
                  </Row>
                ))}
              </Card>
            )}
          </View>
        </View>

      </ScrollView>

      <Modal
        visible={Boolean(selectedSlot)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedSlot(null)}
      >
        <View style={styles.detailBackdrop}>
          <View style={[styles.detailCard, { backgroundColor: colors.surface }]}> 
            <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <ThemedText type="title">{selectedSlot?.label ?? 'Slot details'}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {selectedSlot ? `${formatTimeTo12Hour(selectedSlot.startTime)} - ${formatTimeTo12Hour(selectedSlot.endTime)}` : ''}
                </ThemedText>
              </View>
              <TouchableOpacity onPress={() => setSelectedSlot(null)}>
                <ThemedText style={{ color: colors.error, fontWeight: '700' }}>Close</ThemedText>
              </TouchableOpacity>
            </Row>

            {selectedSlotPreviews.length === 0 ? (
              <Card style={{ marginTop: 12 }}>
                <ThemedText type="small" themeColor="textSecondary">
                  This slot has no category assigned yet.
                </ThemedText>
              </Card>
            ) : (
              <View style={{ gap: 12, marginTop: 12 }}>
                {selectedSlotPreviews.map(({ category, pct, nextTopic }) => (
                  <Card key={category.id}>
                    <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="bodyBold">
                          {category.icon} {category.name}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {pct}% complete
                        </ThemedText>
                      </View>
                      <TouchableOpacity onPress={() => router.push(`/category/${category.id}` as any)}>
                        <ThemedText style={{ color: category.color, fontWeight: '700' }}>Open</ThemedText>
                      </TouchableOpacity>
                    </Row>

                    <View style={{ marginTop: 10 }}>
                      <ThemedText type="small" themeColor="textSecondary">
                        Current topic
                      </ThemedText>
                      <ThemedText type="bodyBold" style={{ marginTop: 2 }}>
                        {nextTopic ? nextTopic.title : 'All topics complete'}
                      </ThemedText>
                    </View>

                    <ProgressBar pct={pct} color={category.color} />

                    {pct < 100 ? (
                      <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 4, fontStyle: 'italic' }}>
                        This slot keeps repeating {nextTopic ? nextTopic.title : 'the next unlocked topic'} until the category reaches 100%.
                      </ThemedText>
                    ) : (
                      <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 4, fontStyle: 'italic' }}>
                        Category complete. This slot is now marked complete for the category.
                      </ThemedText>
                    )}
                  </Card>
                ))}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  desktopContainer: {
    flexDirection: "row",
    gap: 24,
    alignItems: "flex-start",
  },
  desktopLeftCol: {
    flex: 1.3,
    gap: 16,
  },
  desktopRightCol: {
    flex: 1,
    gap: 16,
    minWidth: 320,
  },
  mobileContainer: {
    flexDirection: "column",
    gap: 16,
  },
  mobileCol: {
    gap: 16,
  },
  content: { padding: Spacing.three, gap: Spacing.three },
  emptyContainer: {
    flex: 1, padding: Spacing.three, alignItems: "center", justifyContent: "center",
  },
  emptyEmoji: { fontSize: 64, textAlign: "center", marginBottom: 16 },

  tableContainer: {
    borderWidth: 1.5,
    borderRadius: 12,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
  },
  tableTimeCell: {
    width: 90,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRightWidth: 1.5,
  },
  tableTimeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  tableTimeToText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    opacity: 0.5,
    marginVertical: 2,
  },
  tableContentCell: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  cellHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  cellTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
  },
  cellDuration: {
    fontSize: 11,
    fontWeight: "800",
  },
  catChip: {
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 8,
    paddingVertical: 2,
  },
  actionBtn: {
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 10,
    paddingVertical: 4,
  },

  progressBadge: {
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12,
    paddingVertical: 6, alignItems: "center", minWidth: 56,
  },
  progressTrack: {
    height: 6, borderRadius: 3, marginTop: 10, overflow: "hidden",
  },
  progressFill: { height: 6, borderRadius: 3 },

  legendChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
  },
  legendDot: { width: 8, height: 8, borderRadius: 4 },

  aiPanel: {
    borderWidth: 1, borderRadius: 16, padding: Spacing.three,
  },
  aiHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  aiIcon: { fontSize: 20 },
  refreshBtn: {
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 10,
    paddingVertical: 4, minWidth: 80, alignItems: "center",
  },
  overallMsg: {
    borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 4,
  },
  tipNum: {
    width: 22, height: 22, borderRadius: 11, alignItems: "center",
    justifyContent: "center", flexShrink: 0,
  },

  detailBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  detailCard: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.two,
  },
});
