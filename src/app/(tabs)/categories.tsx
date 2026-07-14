import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, Alert, Platform } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button, Card, Chip, EmptyState, Input, ProgressBar, Row, SectionHeader } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { categoryCompletionPct } from '@/lib/roadmap';
import { useAppStore } from '@/store/useAppStore';
import { Category } from '@/types';

const PALETTE = ['#2563EB', '#D97706', '#059669', '#DC2626', '#7C3AED', '#DB2777', '#0891B2'];
const ICONS = ['📘', '🧠', '💬', '💻', '🏋️', '🎯', '🎨'];

export default function CategoriesScreen() {
  const store = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PALETTE[0]);
  const [icon, setIcon] = useState(ICONS[0]);
  const [pace, setPace] = useState('60');

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editColor, setEditColor] = useState(PALETTE[0]);
  const [editIcon, setEditIcon] = useState(ICONS[0]);
  const [editPace, setEditPace] = useState('60');

  const add = () => {
    if (!name.trim()) return;
    store.addCategory({
      name: name.trim(),
      description: description.trim(),
      color,
      icon,
      targetPacePerDayMins: Number(pace) || 60,
    });
    setName('');
    setDescription('');
    setShowForm(false);
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditDescription(category.description || '');
    setEditColor(category.color);
    setEditIcon(category.icon || ICONS[0]);
    setEditPace(String(category.targetPacePerDayMins || 60));
  };

  const saveEdit = () => {
    if (!editingId || !editName.trim()) return;
    store.updateCategory(editingId, {
      name: editName.trim(),
      description: editDescription.trim(),
      color: editColor,
      icon: editIcon,
      targetPacePerDayMins: Number(editPace) || 60,
    });
    setEditingId(null);
  };

  const confirmDelete = (categoryId: string, categoryName: string) => {
    const message = `Are you sure you want to delete "${categoryName}"? This will permanently delete all associated topics, roadmaps, and schedule slots.`;
    
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(message);
      if (confirmed) {
        store.deleteCategory(categoryId);
      }
    } else {
      Alert.alert(
        'Delete Category',
        message,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => store.deleteCategory(categoryId),
          },
        ]
      );
    }
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader
          title="Learning tracks"
          right={<Button small variant="ghost" title={showForm ? 'Cancel' : '+ Category'} onPress={() => setShowForm((v) => !v)} />}
        />

        {showForm ? (
          <Card>
            <Input value={name} onChangeText={setName} placeholder="Name (e.g. DSA)" />
            <Input value={description} onChangeText={setDescription} placeholder="What are you trying to achieve?" />
            <Input value={pace} onChangeText={setPace} placeholder="Target minutes/day" keyboardType="numeric" />
            <Row style={{ flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {PALETTE.map((c) => (
                <Chip key={c} label={c === color ? '● picked' : '●'} color={c} selected={c === color} onPress={() => setColor(c)} />
              ))}
            </Row>
            <Row style={{ flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {ICONS.map((i) => (
                <Chip key={i} label={i} selected={i === icon} onPress={() => setIcon(i)} />
              ))}
            </Row>
            <Button title="Create category" onPress={add} disabled={!name.trim()} />
          </Card>
        ) : null}

        {store.categories.length === 0 ? (
          <EmptyState title="No categories yet" subtitle="Create a track like DSA, English Speaking, or LeetCode." />
        ) : (
          store.categories.map((category) => {
            const pct = categoryCompletionPct(store.roadmapNodes, category.id);
            const nodeCount = store.roadmapNodes.filter((n) => n.categoryId === category.id).length;
            const isEditing = editingId === category.id;

            return (
              <Card key={category.id}>
                {isEditing ? (
                  <View style={{ gap: Spacing.two }}>
                    <ThemedText type="smallBold">Edit Track</ThemedText>
                    <Input value={editName} onChangeText={setEditName} placeholder="Name" />
                    <Input value={editDescription} onChangeText={setEditDescription} placeholder="Description" />
                    <Input value={editPace} onChangeText={setEditPace} placeholder="Target minutes/day" keyboardType="numeric" />
                    <Row style={{ flexWrap: 'wrap', gap: 6 }}>
                      {PALETTE.map((c) => (
                        <Chip key={c} label={c === editColor ? '● picked' : '●'} color={c} selected={c === editColor} onPress={() => setEditColor(c)} />
                      ))}
                    </Row>
                    <Row style={{ flexWrap: 'wrap', gap: 6 }}>
                      {ICONS.map((i) => (
                        <Chip key={i} label={i} selected={i === editIcon} onPress={() => setEditIcon(i)} />
                      ))}
                    </Row>
                    <Row style={{ gap: Spacing.two, marginTop: 4 }}>
                      <Button title="Cancel" variant="ghost" onPress={() => setEditingId(null)} />
                      <Button title="Save Changes" onPress={saveEdit} disabled={!editName.trim()} />
                    </Row>
                  </View>
                ) : (
                  <View>
                    <Pressable
                      onPress={() => router.push({ pathname: '/category/[id]', params: { id: category.id } })}
                    >
                      <Row style={{ justifyContent: 'space-between' }}>
                        <Row>
                          <ThemedText style={{ fontSize: 18 }}>{category.icon}</ThemedText>
                          <ThemedText type="smallBold">{category.name}</ThemedText>
                        </Row>
                        <ThemedText type="small" themeColor="textSecondary">
                          {nodeCount ? `${pct}% · ${nodeCount} topics` : 'No roadmap yet'}
                        </ThemedText>
                      </Row>
                      <ProgressBar pct={pct} color={category.color} />
                      {category.description ? (
                        <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 4 }}>
                          {category.description}
                        </ThemedText>
                      ) : null}
                    </Pressable>

                    <Row style={{ justifyContent: 'flex-end', gap: Spacing.two, marginTop: 8, borderTopWidth: 1, borderTopColor: '#ECECE9', paddingTop: 8 }}>
                      <Button small variant="secondary" title="Edit" onPress={() => startEdit(category)} />
                      <Button small variant="ghost" title="Delete" onPress={() => confirmDelete(category.id, category.name)} />
                    </Row>
                  </View>
                )}
              </Card>
            );
          })
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: 120 },
});
