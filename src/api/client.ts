import { NestedRoadmapNode } from '@/types';

export interface RoadmapGenerationRequest {
  categoryName: string;
  description: string;
  userLevel?: string;
  targetPacePerDayMins?: number;
}

export interface RoadmapGenerationResponse {
  roadmap: NestedRoadmapNode[];
}

export interface DailyTodoGenerationRequest {
  title: string;
  description: string;
  slotDurationMins: number;
}

export interface DailyTodoGenerationResponse {
  text: string;
}

export class AIClient {
  constructor(private backendUrl: string) {}

  async generateRoadmap(req: RoadmapGenerationRequest): Promise<NestedRoadmapNode[]> {
    try {
      const response = await fetch(`${this.backendUrl}/generate-roadmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as RoadmapGenerationResponse;
      return data.roadmap || [];
    } catch (error) {
      console.error('Failed to generate roadmap:', error);
      return [];
    }
  }

  async generateDailyTodos(req: DailyTodoGenerationRequest): Promise<string> {
    try {
      const response = await fetch(`${this.backendUrl}/generate-daily-todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as DailyTodoGenerationResponse;
      return data.text || '';
    } catch (error) {
      console.error('Failed to generate daily todos:', error);
      return '';
    }
  }
}

export function createAIClient(backendUrl: string): AIClient {
  return new AIClient(backendUrl);
}
