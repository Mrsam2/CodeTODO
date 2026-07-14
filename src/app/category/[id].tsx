import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Input, ProgressBar, Row, SectionHeader } from '@/components/ui';
import { RoadmapTree } from '@/components/roadmap-tree';
import { Spacing } from '@/constants/theme';
import { categoryCompletionPct } from '@/lib/roadmap';
import { useAppStore } from '@/store/useAppStore';

export default function CategoryDetailScreen() {
  const { id } = useLocalSearchParams() as { id: string };
  const store = useAppStore();
  const category = store.categories.find((c) => c.id === id);
  const [topicTitle, setTopicTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!category) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText>Category not found</ThemedText>
      </ThemedView>
    );
  }

  const pct = categoryCompletionPct(store.roadmapNodes, id);
  const categoryNodes = store.roadmapNodes.filter((n) => n.categoryId === id);

  const addTopic = () => {
    if (!topicTitle.trim()) return;
    store.addRoadmapNode({
      categoryId: id,
      title: topicTitle.trim(),
      description: '',
      estimatedDurationMins: 60,
      status: 'pending',
      parentId: null,
      order: 0,
    });
    setTopicTitle('');
  };

  const generateAIRoadmap = async () => {
    setIsGenerating(true);
    try {
      await store.generateAndImportRoadmap(id);
    } catch (e) {
      console.warn('Failed to generate AI roadmap:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={{ gap: Spacing.two, marginBottom: Spacing.three }}>
          <Row>
            <ThemedText style={{ fontSize: 32 }}>{category.icon}</ThemedText>
            <View style={{ flex: 1, gap: Spacing.one }}>
              <ThemedText type="title">{category.name}</ThemedText>
              {category.description ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {category.description}
                </ThemedText>
              ) : null}
            </View>
          </Row>
        </View>

        <ProgressBar pct={pct} color={category.color} />
        <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: Spacing.three }}>
          {pct}% complete
        </ThemedText>

        <SectionHeader title="Add Topic Manually" />
        <Card>
          <Input
            value={topicTitle}
            onChangeText={setTopicTitle}
            placeholder="Add a main topic manually…"
            editable={!isGenerating}
          />
          <Button title="Add" onPress={addTopic} disabled={!topicTitle.trim() || isGenerating} />
        </Card>

        <SectionHeader title="Roadmap" />
        {categoryNodes.length === 0 ? (
          <Card style={{ padding: Spacing.three, alignItems: 'center', gap: Spacing.two }}>
            <ThemedText style={{ fontSize: 24 }}>🪄</ThemedText>
            <ThemedText type="bodyBold">Auto-generate Roadmap with AI</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center', paddingHorizontal: Spacing.two }}>
              Let Gemini AI build a structured study roadmap based on your track details.
            </ThemedText>
            {isGenerating ? (
              <ActivityIndicator size="small" color="#14161A" style={{ marginVertical: Spacing.one }} />
            ) : (
              <Button title="Generate with Gemini" onPress={generateAIRoadmap} />
            )}
          </Card>
        ) : (
          <RoadmapTree categoryId={id} nodes={store.roadmapNodes} />
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: 120 },
});
