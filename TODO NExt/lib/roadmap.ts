import { RoadmapNode, NestedRoadmapNode, MAX_ROADMAP_DEPTH } from '@/types';

export function traversalOrder(nodes: RoadmapNode[], categoryId: string): RoadmapNode[] {
  const categoryNodes = nodes.filter((n) => n.categoryId === categoryId);
  const result: RoadmapNode[] = [];
  const rootNodes = categoryNodes.filter((n) => n.parentId === null).sort((a, b) => a.order - b.order);

  function dfs(node: RoadmapNode) {
    result.push(node);
    const children = categoryNodes
      .filter((n) => n.parentId === node.id)
      .sort((a, b) => a.order - b.order);
    children.forEach(dfs);
  }

  rootNodes.forEach(dfs);
  return result;
}

export function childrenOf(nodes: RoadmapNode[], parentId: string | null): RoadmapNode[] {
  return nodes.filter((n) => n.parentId === parentId).sort((a, b) => a.order - b.order);
}

export function subtreeIds(nodes: RoadmapNode[], nodeId: string): string[] {
  const result = [nodeId];
  const children = childrenOf(nodes, nodeId);
  children.forEach((child) => {
    result.push(...subtreeIds(nodes, child.id));
  });
  return result;
}

export function nodeDepth(nodes: RoadmapNode[], nodeId: string): number {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node || !node.parentId) return 0;
  return 1 + nodeDepth(nodes, node.parentId);
}

export function findFirstUnlockedIncompleteNode(
  nodes: RoadmapNode[],
  categoryId: string
): RoadmapNode | null {
  const categoryNodes = nodes.filter((n) => n.categoryId === categoryId);
  const order = traversalOrder(categoryNodes, categoryId);

  for (const node of order) {
    if (node.status === 'done') continue;
    if (node.status === 'locked') continue;

    const parent = categoryNodes.find((n) => n.id === node.parentId);
    if (parent && parent.status !== 'done') continue;

    const siblings = childrenOf(categoryNodes, node.parentId);
    if (siblings.some((s) => s.id !== node.id && s.status !== 'done')) continue;

    return node;
  }

  return null;
}

export function recomputeStatuses(nodes: RoadmapNode[], categoryId: string): RoadmapNode[] {
  const categoryNodes = nodes.filter((n) => n.categoryId === categoryId);
  const updated = [...nodes];

  const rootNodes = childrenOf(categoryNodes, null);
  rootNodes.forEach((root) => {
    updateNodeRecursive(updated, root.id, categoryId);
  });

  return updated;
}

function updateNodeRecursive(nodes: RoadmapNode[], nodeId: string, categoryId: string) {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return;

  const categoryNodes = nodes.filter((n) => n.categoryId === categoryId);
  const children = childrenOf(categoryNodes, nodeId);

  if (node.status === 'done') {
    children.forEach((child) => {
      updateNodeRecursive(nodes, child.id, categoryId);
    });
    return;
  }

  const parent = categoryNodes.find((n) => n.id === node.parentId);
  if (parent && parent.status !== 'done') {
    const idx = nodes.findIndex((n) => n.id === nodeId);
    if (idx >= 0) {
      nodes[idx] = { ...node, status: 'locked' };
    }
    return;
  }

  const siblings = childrenOf(categoryNodes, node.parentId);
  const incompleteSiblingsExist = siblings.some((s) => s.id !== nodeId && s.status !== 'done');
  if (incompleteSiblingsExist) {
    const idx = nodes.findIndex((n) => n.id === nodeId);
    if (idx >= 0) {
      nodes[idx] = { ...node, status: 'locked' };
    }
    return;
  }

  const idx = nodes.findIndex((n) => n.id === nodeId);
  if (idx >= 0 && nodes[idx].status === 'locked') {
    nodes[idx] = { ...node, status: 'pending' };
  }

  children.forEach((child) => {
    updateNodeRecursive(nodes, child.id, categoryId);
  });
}

export function flattenNestedTree(
  nestedNodes: NestedRoadmapNode[],
  categoryId: string,
  parentId: string | null = null,
  depth: number = 0
): RoadmapNode[] {
  if (depth >= MAX_ROADMAP_DEPTH) return [];

  const result: RoadmapNode[] = [];
  nestedNodes.forEach((nested, idx) => {
    const id = `node-${Date.now()}-${Math.random()}`;
    result.push({
      id,
      categoryId,
      title: nested.title,
      description: nested.description,
      estimatedDurationMins: nested.estimatedDurationMins,
      status: 'pending',
      parentId,
      order: idx,
      createdAt: Date.now(),
    });

    if (nested.subtopics && depth < MAX_ROADMAP_DEPTH - 1) {
      result.push(...flattenNestedTree(nested.subtopics, categoryId, id, depth + 1));
    }
  });

  return result;
}

export function categoryCompletionPct(nodes: RoadmapNode[], categoryId: string): number {
  const categoryNodes = nodes.filter((n) => n.categoryId === categoryId);
  if (categoryNodes.length === 0) return 0;
  const done = categoryNodes.filter((n) => n.status === 'done').length;
  return Math.round((done / categoryNodes.length) * 100);
}
