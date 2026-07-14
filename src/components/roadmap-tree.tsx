import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedText } from './themed-text';
import { Button, Card, Row } from './ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { RoadmapNode } from '@/types';
import { childrenOf } from '@/lib/roadmap';
import { useAppStore } from '@/store/useAppStore';

interface RoadmapTreeProps {
  categoryId: string;
  nodes: RoadmapNode[];
  onNodeSelect?: (nodeId: string) => void;
}

export function RoadmapTree({ categoryId, nodes, onNodeSelect }: RoadmapTreeProps) {
  const colors = useTheme();
  const store = useAppStore();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const categoryNodes = nodes.filter((n) => n.categoryId === categoryId);
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

  function renderNode(node: RoadmapNode, depth: number = 0) {
    const children = childrenOf(categoryNodes, node.id);
    const isExpanded = expanded.has(node.id);

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
        >
          <Card>
            <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Row style={{ flex: 1 }}>
                {children.length > 0 && (
                  <TouchableOpacity onPress={() => toggleExpanded(node.id)}>
                    <ThemedText style={{ fontSize: 16 }}>
                      {isExpanded ? '▼' : '▶'}
                    </ThemedText>
                  </TouchableOpacity>
                )}
                {children.length === 0 && <ThemedText style={{ width: 16 }} />}
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: statusColor,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ThemedText style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>
                    {statusIcon}
                  </ThemedText>
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText type="bodyBold" numberOfLines={1}>
                    {node.title}
                  </ThemedText>
                  {node.description && (
                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                      {node.description}
                    </ThemedText>
                  )}
                </View>
              </Row>
              <Button
                small
                title={node.status === 'done' ? 'Undo' : 'Done'}
                onPress={() => store.setNodeCompleted(node.id, node.status !== 'done')}
              />
            </Row>
          </Card>
        </TouchableOpacity>

        {isExpanded &&
          children.map((child) => renderNode(child, depth + 1))}
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ gap: Spacing.two, paddingBottom: 100 }}>
      {roots.length === 0 ? (
        <ThemedText themeColor="textSecondary">No topics yet</ThemedText>
      ) : (
        roots.map((root) => renderNode(root))
      )}
    </ScrollView>
  );
}
