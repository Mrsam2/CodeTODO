import {
  traversalOrder,
  findFirstUnlockedIncompleteNode,
  recomputeStatuses,
  flattenNestedTree,
  categoryCompletionPct,
  childrenOf,
  subtreeIds,
} from '../roadmap';
import { RoadmapNode, NestedRoadmapNode } from '@/types';

describe('roadmap engine', () => {
  const catId = 'cat-1';

  it('traversalOrder returns depth-first traversal', () => {
    const nodes: RoadmapNode[] = [
      {
        id: 'n1',
        categoryId: catId,
        title: 'Root 1',
        description: '',
        estimatedDurationMins: 60,
        status: 'pending',
        parentId: null,
        order: 0,
        createdAt: 0,
      },
      {
        id: 'n1-1',
        categoryId: catId,
        title: 'Child 1.1',
        description: '',
        estimatedDurationMins: 30,
        status: 'pending',
        parentId: 'n1',
        order: 0,
        createdAt: 0,
      },
      {
        id: 'n2',
        categoryId: catId,
        title: 'Root 2',
        description: '',
        estimatedDurationMins: 60,
        status: 'pending',
        parentId: null,
        order: 1,
        createdAt: 0,
      },
    ];

    const order = traversalOrder(nodes, catId);
    expect(order.map((n) => n.id)).toEqual(['n1', 'n1-1', 'n2']);
  });

  it('findFirstUnlockedIncompleteNode finds first available node', () => {
    const nodes: RoadmapNode[] = [
      {
        id: 'n1',
        categoryId: catId,
        title: 'Root',
        description: '',
        estimatedDurationMins: 60,
        status: 'pending',
        parentId: null,
        order: 0,
        createdAt: 0,
      },
      {
        id: 'n2',
        categoryId: catId,
        title: 'Child',
        description: '',
        estimatedDurationMins: 30,
        status: 'locked',
        parentId: 'n1',
        order: 0,
        createdAt: 0,
      },
    ];

    const first = findFirstUnlockedIncompleteNode(nodes, catId);
    expect(first?.id).toBe('n1');
  });

  it('recomputeStatuses locks children of incomplete nodes', () => {
    let nodes: RoadmapNode[] = [
      {
        id: 'n1',
        categoryId: catId,
        title: 'Root',
        description: '',
        estimatedDurationMins: 60,
        status: 'pending',
        parentId: null,
        order: 0,
        createdAt: 0,
      },
      {
        id: 'n2',
        categoryId: catId,
        title: 'Child',
        description: '',
        estimatedDurationMins: 30,
        status: 'pending',
        parentId: 'n1',
        order: 0,
        createdAt: 0,
      },
    ];

    nodes = recomputeStatuses(nodes, catId);
    const child = nodes.find((n) => n.id === 'n2');
    expect(child?.status).toBe('locked');
  });

  it('flattenNestedTree converts nested structure to flat with depth limit', () => {
    const nested: NestedRoadmapNode[] = [
      {
        title: 'Level 1',
        description: '',
        estimatedDurationMins: 60,
        subtopics: [
          {
            title: 'Level 2',
            description: '',
            estimatedDurationMins: 30,
            subtopics: [
              {
                title: 'Level 3',
                description: '',
                estimatedDurationMins: 15,
              },
            ],
          },
        ],
      },
    ];

    const flat = flattenNestedTree(nested, catId);
    expect(flat.length).toBeGreaterThan(1);
    expect(flat[0].parentId).toBeNull();
    expect(flat[1].parentId).toBe(flat[0].id);
  });

  it('categoryCompletionPct calculates percentage correctly', () => {
    const nodes: RoadmapNode[] = [
      {
        id: 'n1',
        categoryId: catId,
        title: 'Done',
        description: '',
        estimatedDurationMins: 60,
        status: 'done',
        parentId: null,
        order: 0,
        createdAt: 0,
      },
      {
        id: 'n2',
        categoryId: catId,
        title: 'Pending',
        description: '',
        estimatedDurationMins: 60,
        status: 'pending',
        parentId: null,
        order: 1,
        createdAt: 0,
      },
    ];

    const pct = categoryCompletionPct(nodes, catId);
    expect(pct).toBe(50);
  });

  it('childrenOf filters and sorts children', () => {
    const nodes: RoadmapNode[] = [
      {
        id: 'n1',
        categoryId: catId,
        title: 'Child 1',
        description: '',
        estimatedDurationMins: 30,
        status: 'pending',
        parentId: 'parent',
        order: 1,
        createdAt: 0,
      },
      {
        id: 'n2',
        categoryId: catId,
        title: 'Child 2',
        description: '',
        estimatedDurationMins: 30,
        status: 'pending',
        parentId: 'parent',
        order: 0,
        createdAt: 0,
      },
    ];

    const children = childrenOf(nodes, 'parent');
    expect(children.length).toBe(2);
    expect(children[0].id).toBe('n2');
  });

  it('subtreeIds returns all descendant ids', () => {
    const nodes: RoadmapNode[] = [
      {
        id: 'n1',
        categoryId: catId,
        title: 'Root',
        description: '',
        estimatedDurationMins: 60,
        status: 'pending',
        parentId: null,
        order: 0,
        createdAt: 0,
      },
      {
        id: 'n1-1',
        categoryId: catId,
        title: 'Child',
        description: '',
        estimatedDurationMins: 30,
        status: 'pending',
        parentId: 'n1',
        order: 0,
        createdAt: 0,
      },
      {
        id: 'n1-1-1',
        categoryId: catId,
        title: 'Grandchild',
        description: '',
        estimatedDurationMins: 15,
        status: 'pending',
        parentId: 'n1-1',
        order: 0,
        createdAt: 0,
      },
    ];

    const ids = subtreeIds(nodes, 'n1');
    expect(ids).toEqual(['n1', 'n1-1', 'n1-1-1']);
  });

  it('finds first unlocked node when siblings exist', () => {
    const nodes: RoadmapNode[] = [
      {
        id: 'n1',
        categoryId: catId,
        title: 'Root',
        description: '',
        estimatedDurationMins: 60,
        status: 'pending',
        parentId: null,
        order: 0,
        createdAt: 0,
      },
      {
        id: 'n2',
        categoryId: catId,
        title: 'Sibling 1',
        description: '',
        estimatedDurationMins: 30,
        status: 'pending',
        parentId: 'n1',
        order: 0,
        createdAt: 0,
      },
      {
        id: 'n3',
        categoryId: catId,
        title: 'Sibling 2',
        description: '',
        estimatedDurationMins: 30,
        status: 'pending',
        parentId: 'n1',
        order: 1,
        createdAt: 0,
      },
    ];

    const first = findFirstUnlockedIncompleteNode(nodes, catId);
    expect(first?.id).toBe('n1');
  });
});
