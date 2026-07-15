import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button, Card, Chip, EmptyState, Input, ProgressBar, Row, SectionHeader, CategoryIcon } from '@/components/ui';
import { Spacing, Radii } from '@/constants/theme';
import { categoryCompletionPct } from '@/lib/roadmap';
import { useAppStore } from '@/store/useAppStore';
import { Category } from '@/types';

const PALETTE = ['#2563EB', '#D97706', '#059669', '#DC2626', '#7C3AED', '#DB2777', '#0891B2'];
const ICONS = ['📘', '🧠', '💬', '💻', '🏋️', '🎯', '🎨'];

function BrandIconPreview({ slug, size = 14 }: { slug: string; size?: number }) {
  const url = `https://thesvg.org/icons/${slug}/default.svg`;
  if (Platform.OS === 'web') {
    return (
      <img
        src={url}
        style={{ width: size, height: size, objectFit: 'contain', marginRight: 4 }}
        alt=""
      />
    );
  }
  return <Text style={{ fontSize: size, marginRight: 4 }}>🏷️</Text>;
}

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

  // theSVG brand icon search states
  const [brandSearch, setBrandSearch] = useState('');
  const [loadingBrand, setLoadingBrand] = useState(false);
  const [brandPreviewSvg, setBrandPreviewSvg] = useState('');
  const [searchResults, setSearchResults] = useState<{ slug: string; title: string }[]>([]);

  const handleBrandSearchChange = async (text: string) => {
    setBrandSearch(text);
    if (text.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`https://thesvg.org/api/icons?q=${encodeURIComponent(text.trim())}&limit=8`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setSearchResults(data.map((item: any) => ({
            slug: item.slug || item.id || '',
            title: item.title || item.name || '',
          })));
        } else if (data && Array.isArray(data.icons)) {
          setSearchResults(data.icons.map((item: any) => ({
            slug: item.slug || item.id || '',
            title: item.title || item.name || '',
          })));
        }
      }
    } catch (err) {
      console.warn("Failed to fetch search results:", err);
    }
  };

  const applySearchedIcon = async (slug: string) => {
    setLoadingBrand(true);
    try {
      const response = await fetch(`https://thesvg.org/icons/${slug}/default.svg`);
      if (response.ok) {
        const svgXml = await response.text();
        if (editingId) {
          setEditIcon(svgXml);
        } else {
          setIcon(svgXml);
        }
        setBrandSearch('');
        setSearchResults([]);
        setBrandPreviewSvg('');
      } else {
        Alert.alert('Error', 'Failed to retrieve icon from CDN.');
      }
    } catch (err) {
      console.warn("Failed to fetch brand SVG:", err);
      Alert.alert('Error', 'Failed to retrieve icon from CDN.');
    } finally {
      setLoadingBrand(false);
    }
  };

  const fetchBrandIcon = async (slug: string, isEdit: boolean) => {
    if (!slug.trim()) return;
    setLoadingBrand(true);
    try {
      const response = await fetch(`https://thesvg.org/icons/${slug.toLowerCase().trim()}/default.svg`);
      if (response.ok) {
        const svgXml = await response.text();
        setBrandPreviewSvg(svgXml);
      } else {
        setBrandPreviewSvg('');
        Alert.alert('Not Found', `Brand "${slug}" was not found on thesvg.org.`);
      }
    } catch (err) {
      console.warn("Failed to fetch from thesvg CDN:", err);
      setBrandPreviewSvg('');
      Alert.alert('Error', 'Failed to connect to thesvg.org CDN.');
    } finally {
      setLoadingBrand(false);
    }
  };
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
            <Row style={{ marginTop: 4, gap: 8, alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Input
                  value={brandSearch}
                  onChangeText={handleBrandSearchChange}
                  placeholder="Search brand icon (e.g. leet)"
                />
              </View>
              <Button
                small
                title={loadingBrand ? "..." : "Get SVG"}
                onPress={() => fetchBrandIcon(brandSearch, false)}
              />
            </Row>
            {searchResults.length > 0 && (
              <View style={{ marginTop: 4, marginBottom: 8 }}>
                <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: 4 }}>
                  Matching brand icons (tap to apply):
                </ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 6 }}>
                  {searchResults.map((result) => (
                    <TouchableOpacity
                      key={result.slug}
                      onPress={() => applySearchedIcon(result.slug)}
                      style={{
                        paddingHorizontal: Spacing.three,
                        paddingVertical: Spacing.one + 2,
                        borderRadius: Radii.pill,
                        backgroundColor: '#EEF2F6',
                        borderColor: '#4F46E5',
                        borderWidth: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                    >
                      <BrandIconPreview slug={result.slug} size={14} />
                      <ThemedText style={{ fontSize: 12, fontWeight: '700', color: '#4F46E5' }}>
                        {result.title}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            {brandPreviewSvg && (
              <Row style={{ gap: 8, alignItems: 'center', marginTop: 4 }}>
                <ThemedText type="small">Preview:</ThemedText>
                <CategoryIcon icon={brandPreviewSvg} size={24} />
                <Button
                  small
                  variant="secondary"
                  title="Apply SVG"
                  onPress={() => {
                    setIcon(brandPreviewSvg);
                    setBrandPreviewSvg('');
                    setBrandSearch('');
                  }}
                />
              </Row>
            )}
            <Button style={{ marginTop: 8 }} title="Create category" onPress={add} disabled={!name.trim()} />
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
                    <Row style={{ marginTop: 4, gap: 8, alignItems: 'center' }}>
                      <View style={{ flex: 1 }}>
                        <Input
                          value={brandSearch}
                          onChangeText={handleBrandSearchChange}
                          placeholder="Search brand icon (e.g. leet)"
                        />
                      </View>
                      <Button
                        small
                        title={loadingBrand ? "..." : "Get SVG"}
                        onPress={() => fetchBrandIcon(brandSearch, true)}
                      />
                    </Row>
                    {searchResults.length > 0 && (
                      <View style={{ marginTop: 4, marginBottom: 8 }}>
                        <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: 4 }}>
                          Matching brand icons (tap to apply):
                        </ThemedText>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 6 }}>
                          {searchResults.map((result) => (
                            <TouchableOpacity
                              key={result.slug}
                              onPress={() => applySearchedIcon(result.slug)}
                              style={{
                                paddingHorizontal: Spacing.three,
                                paddingVertical: Spacing.one + 2,
                                borderRadius: Radii.pill,
                                backgroundColor: '#EEF2F6',
                                borderColor: '#4F46E5',
                                borderWidth: 1,
                                flexDirection: 'row',
                                alignItems: 'center',
                              }}
                            >
                              <BrandIconPreview slug={result.slug} size={14} />
                              <ThemedText style={{ fontSize: 12, fontWeight: '700', color: '#4F46E5' }}>
                                {result.title}
                              </ThemedText>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                    {brandPreviewSvg && (
                      <Row style={{ gap: 8, alignItems: 'center', marginTop: 4 }}>
                        <ThemedText type="small">Preview:</ThemedText>
                        <CategoryIcon icon={brandPreviewSvg} size={24} />
                        <Button
                          small
                          variant="secondary"
                          title="Apply SVG"
                          onPress={() => {
                            setEditIcon(brandPreviewSvg);
                            setBrandPreviewSvg('');
                            setBrandSearch('');
                          }}
                        />
                      </Row>
                    )}
                    <Row style={{ gap: Spacing.two, marginTop: 8 }}>
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
                          <CategoryIcon icon={category.icon} size={18} />
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
