// 算法步骤类型
export interface AlgorithmStep {
  id: number;
  description: string;
  codeLines: {
    java: number[];
    python: number[];
    golang: number[];
    javascript: number[];
  };
  maxHeap: number[];
  minHeap: number[];
  currentNum?: number;
  median?: number | null;
  narratedValue?: number;
  sourceHeap?: 'max' | 'min';
  targetHeap?: 'max' | 'min';
  sortedValues?: number[];
  action: 'init' | 'add' | 'balance' | 'findMedian' | 'complete';
  variables: Record<string, string | number | null>;
  annotations: Annotation[];
}

// 标注类型
export interface Annotation {
  id: string;
  type: 'node' | 'edge' | 'text';
  target?: string;
  text: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

// 堆节点类型
export interface HeapNode {
  value: number;
  index: number;
  x: number;
  y: number;
  highlighted: boolean;
  isNew?: boolean;
  isMoving?: boolean;
}

// 数据样例类型
export interface DataExample {
  name: string;
  operations: string[];
  values: (number | null)[][];
}

// 编程语言类型
export type ProgrammingLanguage = 'java' | 'python' | 'golang' | 'javascript';

// 播放状态类型
export interface PlaybackState {
  isPlaying: boolean;
  currentStep: number;
  totalSteps: number;
  speed: number;
}
