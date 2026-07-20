'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { LottieLoader } from '@/components/LottieLoader';
import { Button, Card, Input, ProgressBar, Row, SectionHeader, CategoryIcon, AIButton } from '@/components/ui';
import { RoadmapTree } from '@/components/RoadmapTree';
import { categoryCompletionPct } from '@/lib/roadmap';
import { useAppStore } from '@/store/useAppStore';

export default function CategoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const store = useAppStore();

  useEffect(() => {
    store.syncWithCloud(['categories', 'roadmapNodes']);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const category = store.categories.find((c) => c.id === id && !c.isDeleted);
  const [topicTitle, setTopicTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!category) {
    if (store.loadingSections?.categories) {
      return <LottieLoader text="Loading Category Details..." size={120} />;
    }
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <span>Category not found</span>
      </div>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        <Row>
          <CategoryIcon icon={category.icon} size={32} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 'var(--font-size-title)', fontWeight: 700 }}>{category.name}</span>
            {category.description ? <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{category.description}</span> : null}
          </div>
        </Row>
      </div>

      <ProgressBar pct={pct} color={category.color} />
      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 16 }}>{pct}% complete</span>

      <SectionHeader title="Add Topic Manually" />
      <Card>
        <Input value={topicTitle} onChangeText={setTopicTitle} placeholder="Add a main topic manually…" editable={!isGenerating} />
        <Button title="Add" onPress={addTopic} disabled={!topicTitle.trim() || isGenerating} />
      </Card>

      <SectionHeader title="Roadmap" />
      {categoryNodes.length === 0 ? (
        <Card style={{ padding: 16, alignItems: 'center', gap: 8, textAlign: 'center' } as React.CSSProperties}>
          <span style={{ fontSize: 24 }}>🪄</span>
          <span style={{ fontWeight: 700 }}>Auto-generate Roadmap with AI</span>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', padding: '0 8px' }}>
            Let Gemini AI build a structured study roadmap based on your track details.
          </span>
          <AIButton title="Generate with Gemini" onPress={generateAIRoadmap} loading={isGenerating} />
        </Card>
      ) : (
        <RoadmapTree categoryId={id} nodes={store.roadmapNodes} />
      )}
    </div>
  );
}
