import type { AlgorithmStep, DataExample } from '../types';

// 数据样例
export const dataExamples: DataExample[] = [
  {
    name: '示例1',
    operations: ['MedianFinder', 'addNum', 'addNum', 'findMedian', 'addNum', 'findMedian'],
    values: [[], [1], [2], [], [3], []],
  },
  {
    name: '示例2',
    operations: ['MedianFinder', 'addNum', 'addNum', 'addNum', 'addNum', 'findMedian'],
    values: [[], [5], [2], [8], [1], []],
  },
  {
    name: '示例3',
    operations: ['MedianFinder', 'addNum', 'findMedian', 'addNum', 'findMedian', 'addNum', 'findMedian'],
    values: [[], [6], [], [10], [], [2], []],
  },
];

// 生成随机合法数据
export const generateRandomData = (): { operations: string[]; values: (number | null)[][] } => {
  const operations: string[] = ['MedianFinder'];
  const values: (number | null)[][] = [[]];
  
  const numOps = Math.floor(Math.random() * 6) + 4; // 4-9个操作
  let addCount = 0;
  
  for (let i = 0; i < numOps; i++) {
    // 确保至少有一个addNum后才能findMedian
    if (addCount === 0 || Math.random() > 0.3) {
      operations.push('addNum');
      const num = Math.floor(Math.random() * 201) - 100; // -100 到 100
      values.push([num]);
      addCount++;
    } else {
      operations.push('findMedian');
      values.push([]);
    }
  }
  
  // 确保最后有一个findMedian
  if (operations[operations.length - 1] !== 'findMedian') {
    operations.push('findMedian');
    values.push([]);
  }
  
  return { operations, values };
};

// 验证输入数据
export const validateInput = (operations: string[], values: (number | null)[][]): string | null => {
  if (operations.length === 0) {
    return '操作序列不能为空';
  }
  
  if (operations[0] !== 'MedianFinder') {
    return '第一个操作必须是 MedianFinder';
  }
  
  if (operations.length !== values.length) {
    return '操作数量与参数数量不匹配';
  }
  
  let addCount = 0;
  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    const val = values[i];
    
    if (op === 'MedianFinder') {
      if (val.length !== 0) {
        return 'MedianFinder 不需要参数';
      }
    } else if (op === 'addNum') {
      if (val.length !== 1 || typeof val[0] !== 'number') {
        return `addNum 需要一个数字参数，位置 ${i}`;
      }
      const num = val[0];
      if (num < -100000 || num > 100000) {
        return `数字必须在 -10^5 到 10^5 范围内，位置 ${i}`;
      }
      addCount++;
    } else if (op === 'findMedian') {
      if (val.length !== 0) {
        return 'findMedian 不需要参数';
      }
      if (addCount === 0) {
        return `findMedian 之前必须至少有一个 addNum，位置 ${i}`;
      }
    } else {
      return `未知操作: ${op}`;
    }
  }
  
  return null;
};

// 生成算法步骤
export const generateSteps = (operations: string[], values: (number | null)[][]): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepId = 0;
  
  // 大顶堆（存储较小的一半）
  const maxHeap: number[] = [];
  // 小顶堆（存储较大的一半）
  const minHeap: number[] = [];
  
  // 堆操作辅助函数
  const pushMaxHeap = (arr: number[], val: number) => {
    arr.push(val);
    let i = arr.length - 1;
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (arr[parent] < arr[i]) {
        [arr[parent], arr[i]] = [arr[i], arr[parent]];
        i = parent;
      } else break;
    }
  };
  
  const popMaxHeap = (arr: number[]): number => {
    const result = arr[0];
    const last = arr.pop()!;
    if (arr.length > 0) {
      arr[0] = last;
      let i = 0;
      while (true) {
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        let largest = i;
        if (left < arr.length && arr[left] > arr[largest]) largest = left;
        if (right < arr.length && arr[right] > arr[largest]) largest = right;
        if (largest !== i) {
          [arr[i], arr[largest]] = [arr[largest], arr[i]];
          i = largest;
        } else break;
      }
    }
    return result;
  };
  
  const pushMinHeap = (arr: number[], val: number) => {
    arr.push(val);
    let i = arr.length - 1;
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (arr[parent] > arr[i]) {
        [arr[parent], arr[i]] = [arr[i], arr[parent]];
        i = parent;
      } else break;
    }
  };
  
  const popMinHeap = (arr: number[]): number => {
    const result = arr[0];
    const last = arr.pop()!;
    if (arr.length > 0) {
      arr[0] = last;
      let i = 0;
      while (true) {
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        let smallest = i;
        if (left < arr.length && arr[left] < arr[smallest]) smallest = left;
        if (right < arr.length && arr[right] < arr[smallest]) smallest = right;
        if (smallest !== i) {
          [arr[i], arr[smallest]] = [arr[smallest], arr[i]];
          i = smallest;
        } else break;
      }
    }
    return result;
  };
  
  // 初始化步骤
  steps.push({
    id: stepId++,
    description: '初始化 MedianFinder，创建两个堆：maxHeap（大顶堆，存储较小的一半）和 minHeap（小顶堆，存储较大的一半）',
    codeLines: { java: [1, 2, 3], python: [1, 2, 3], golang: [1, 2, 3, 4], javascript: [1, 2, 3] },
    maxHeap: [],
    minHeap: [],
    action: 'init',
    variables: { 'maxHeap.size': 0, 'minHeap.size': 0 },
    annotations: [
      { id: 'init-1', type: 'text', text: '大顶堆 maxHeap 初始化为空', position: 'top' },
      { id: 'init-2', type: 'text', text: '小顶堆 minHeap 初始化为空', position: 'top' },
    ],
  });
  
  for (let i = 1; i < operations.length; i++) {
    const op = operations[i];
    const val = values[i];
    
    if (op === 'addNum') {
      const num = val[0] as number;
      
      // 步骤1: 显示要添加的数字
      steps.push({
        id: stepId++,
        description: `调用 addNum(${num})，准备将 ${num} 添加到数据结构中`,
        codeLines: { java: [5], python: [5], golang: [8], javascript: [5] },
        maxHeap: [...maxHeap],
        minHeap: [...minHeap],
        currentNum: num,
        action: 'add',
        variables: { num, 'maxHeap.size': maxHeap.length, 'minHeap.size': minHeap.length },
        annotations: [
          { id: `add-${stepId}`, type: 'text', text: `新数字: ${num}`, position: 'top' },
        ],
      });
      
      // 步骤2: 判断并添加
      if (maxHeap.length === 0 || num <= maxHeap[0]) {
        pushMaxHeap(maxHeap, num);
        steps.push({
          id: stepId++,
          description: maxHeap.length === 1 
            ? `maxHeap 为空，将 ${num} 添加到 maxHeap` 
            : `${num} <= maxHeap 堆顶 ${maxHeap[0]}，将 ${num} 添加到 maxHeap`,
          codeLines: { java: [6, 7], python: [6, 7], golang: [9, 10], javascript: [6, 7] },
          maxHeap: [...maxHeap],
          minHeap: [...minHeap],
          currentNum: num,
          action: 'add',
          variables: { num, 'maxHeap.top': maxHeap[0], 'maxHeap.size': maxHeap.length, 'minHeap.size': minHeap.length },
          annotations: [
            { id: `add-max-${stepId}`, type: 'node', target: 'maxHeap-0', text: `添加 ${num}`, position: 'top' },
          ],
        });
        
        // 步骤3: 平衡检查
        if (maxHeap.length > minHeap.length + 1) {
          const moved = popMaxHeap(maxHeap);
          pushMinHeap(minHeap, moved);
          steps.push({
            id: stepId++,
            description: `maxHeap 大小 (${maxHeap.length + 1}) > minHeap 大小 + 1 (${minHeap.length})，需要平衡：将 maxHeap 堆顶 ${moved} 移动到 minHeap`,
            codeLines: { java: [8, 9, 10], python: [8, 9], golang: [11, 12, 13], javascript: [8, 9, 10] },
            maxHeap: [...maxHeap],
            minHeap: [...minHeap],
            action: 'balance',
            variables: { moved, 'maxHeap.size': maxHeap.length, 'minHeap.size': minHeap.length },
            annotations: [
              { id: `balance-${stepId}`, type: 'edge', text: `移动 ${moved}`, position: 'top' },
            ],
          });
        }
      } else {
        pushMinHeap(minHeap, num);
        steps.push({
          id: stepId++,
          description: `${num} > maxHeap 堆顶 ${maxHeap[0]}，将 ${num} 添加到 minHeap`,
          codeLines: { java: [12, 13], python: [11, 12], golang: [15, 16], javascript: [12, 13] },
          maxHeap: [...maxHeap],
          minHeap: [...minHeap],
          currentNum: num,
          action: 'add',
          variables: { num, 'maxHeap.top': maxHeap[0], 'maxHeap.size': maxHeap.length, 'minHeap.size': minHeap.length },
          annotations: [
            { id: `add-min-${stepId}`, type: 'node', target: 'minHeap-0', text: `添加 ${num}`, position: 'top' },
          ],
        });
        
        // 步骤3: 平衡检查
        if (minHeap.length > maxHeap.length) {
          const moved = popMinHeap(minHeap);
          pushMaxHeap(maxHeap, moved);
          steps.push({
            id: stepId++,
            description: `minHeap 大小 (${minHeap.length + 1}) > maxHeap 大小 (${maxHeap.length - 1})，需要平衡：将 minHeap 堆顶 ${moved} 移动到 maxHeap`,
            codeLines: { java: [14, 15, 16], python: [13, 14], golang: [17, 18, 19], javascript: [14, 15, 16] },
            maxHeap: [...maxHeap],
            minHeap: [...minHeap],
            action: 'balance',
            variables: { moved, 'maxHeap.size': maxHeap.length, 'minHeap.size': minHeap.length },
            annotations: [
              { id: `balance-${stepId}`, type: 'edge', text: `移动 ${moved}`, position: 'top' },
            ],
          });
        }
      }
    } else if (op === 'findMedian') {
      const totalSize = maxHeap.length + minHeap.length;
      let median: number;
      
      if (maxHeap.length > minHeap.length) {
        median = maxHeap[0];
        steps.push({
          id: stepId++,
          description: `调用 findMedian()：总元素数 ${totalSize} 为奇数，中位数 = maxHeap 堆顶 = ${median}`,
          codeLines: { java: [20, 21], python: [17, 18], golang: [23, 24], javascript: [20, 21] },
          maxHeap: [...maxHeap],
          minHeap: [...minHeap],
          median,
          action: 'findMedian',
          variables: { 'maxHeap.top': maxHeap[0], 'maxHeap.size': maxHeap.length, 'minHeap.size': minHeap.length, median },
          annotations: [
            { id: `median-${stepId}`, type: 'node', target: 'maxHeap-0', text: `中位数: ${median}`, position: 'top' },
          ],
        });
      } else {
        median = (maxHeap[0] + minHeap[0]) / 2;
        steps.push({
          id: stepId++,
          description: `调用 findMedian()：总元素数 ${totalSize} 为偶数，中位数 = (maxHeap 堆顶 ${maxHeap[0]} + minHeap 堆顶 ${minHeap[0]}) / 2 = ${median}`,
          codeLines: { java: [23], python: [19], golang: [26], javascript: [23] },
          maxHeap: [...maxHeap],
          minHeap: [...minHeap],
          median,
          action: 'findMedian',
          variables: { 'maxHeap.top': maxHeap[0], 'minHeap.top': minHeap[0], 'maxHeap.size': maxHeap.length, 'minHeap.size': minHeap.length, median },
          annotations: [
            { id: `median-max-${stepId}`, type: 'node', target: 'maxHeap-0', text: `${maxHeap[0]}`, position: 'top' },
            { id: `median-min-${stepId}`, type: 'node', target: 'minHeap-0', text: `${minHeap[0]}`, position: 'top' },
            { id: `median-result-${stepId}`, type: 'text', text: `中位数: ${median}`, position: 'bottom' },
          ],
        });
      }
    }
  }
  
  // 完成步骤
  steps.push({
    id: stepId++,
    description: '算法演示完成！',
    codeLines: { java: [], python: [], golang: [], javascript: [] },
    maxHeap: [...maxHeap],
    minHeap: [...minHeap],
    action: 'complete',
    variables: { 'maxHeap.size': maxHeap.length, 'minHeap.size': minHeap.length },
    annotations: [],
  });
  
  return steps;
};
