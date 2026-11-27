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
  const snapshot = () => [...maxHeap, ...minHeap].sort((a, b) => a - b);
  const pushStep = (step: Omit<AlgorithmStep, 'id'>) => steps.push({ id: stepId++, ...step });
  
  // 堆操作辅助函数
  const pushMaxHeap = (arr: number[], val: number): Array<{ child: number; parent: number; heap: number[] }> => {
    const swaps: Array<{ child: number; parent: number; heap: number[] }> = [];
    arr.push(val);
    swaps.push({ child: arr.length - 1, parent: -1, heap: [...arr] });
    let i = arr.length - 1;
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (arr[parent] < arr[i]) {
        [arr[parent], arr[i]] = [arr[i], arr[parent]];
        swaps.push({ child: i, parent, heap: [...arr] });
        i = parent;
      } else break;
    }
    return swaps;
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
  
  const pushMinHeap = (arr: number[], val: number): Array<{ child: number; parent: number; heap: number[] }> => {
    const swaps: Array<{ child: number; parent: number; heap: number[] }> = [];
    arr.push(val);
    swaps.push({ child: arr.length - 1, parent: -1, heap: [...arr] });
    let i = arr.length - 1;
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (arr[parent] > arr[i]) {
        [arr[parent], arr[i]] = [arr[i], arr[parent]];
        swaps.push({ child: i, parent, heap: [...arr] });
        i = parent;
      } else break;
    }
    return swaps;
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
    description: '先把数字分成左右两半：左边放较小的数，右边放较大的数。两个堆分别帮我们快速找到中间边界。',
    codeLines: { java: [1, 2, 3], python: [1, 2, 3], golang: [1, 2, 3, 4], javascript: [1, 2, 3] },
    maxHeap: [],
    minHeap: [],
    sortedValues: [],
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
      pushStep({
        description: `新数字 ${num} 到达数据流，先和中间边界比较，再决定放到哪一半。`,
        codeLines: { java: [5], python: [5], golang: [8], javascript: [5] },
        maxHeap: [...maxHeap],
        minHeap: [...minHeap],
        currentNum: num,
        narratedValue: num,
        sortedValues: [...maxHeap, ...minHeap].sort((a, b) => a - b),
        action: 'add',
        variables: { num, 'maxHeap.size': maxHeap.length, 'minHeap.size': minHeap.length },
        annotations: [
          { id: `add-${stepId}`, type: 'text', text: `新数字: ${num}`, position: 'top' },
        ],
      });
      
      // 先说明新数字与左右边界的比较结果。
      const goesLeft = maxHeap.length === 0 || num <= maxHeap[0];
      pushStep({
        title: '判断新数字属于哪一半',
        description: maxHeap.length === 0
          ? `左边还没有边界值，先把 ${num} 放进较小的一半。`
          : `${num} ${goesLeft ? '≤' : '>'} 左边最大值 ${maxHeap[0]}，因此放入${goesLeft ? '较小' : '较大'}的一半。`,
        codeLines: { java: [11], python: [41], golang: [69], javascript: [96] },
        maxHeap: [...maxHeap], minHeap: [...minHeap], currentNum: num, narratedValue: num,
        focusHeap: maxHeap.length ? 'max' : undefined, focusIndices: maxHeap.length ? [0] : undefined,
        sortedValues: snapshot(), action: 'compare',
        variables: { num, 'maxHeap.top': maxHeap[0] ?? '空' }, annotations: [],
      });
      if (goesLeft) {
        const maxSwaps = pushMaxHeap(maxHeap, num);
        const placedHeap = [...maxHeap];
        maxSwaps.forEach(({ child, parent, heap }, swapIndex) => {
          if (parent === -1) {
            pushStep({
              title: '放到大顶堆末尾',
              description: `先把 ${num} 放进下一个空位置（堆内位置 ${child}），再从底向上检查父节点。`,
              codeLines: { java: [6], python: [6], golang: [9], javascript: [6] },
              maxHeap: heap, minHeap: [...minHeap], focusHeap: 'max', focusIndices: [child],
              narratedValue: num, targetHeap: 'max', sortedValues: snapshot(), action: 'insert',
              variables: { num, child, 'maxHeap.size': heap.length }, annotations: [],
            });
            return;
          }
          pushStep({
            title: `恢复大顶堆顺序（第 ${swapIndex} 次交换）`,
            description: `子节点 ${heap[child]} 大于父节点 ${heap[parent]}，交换位置 ${child} 和 ${parent}，让较大的值向堆顶移动。`,
            codeLines: { java: [6], python: [6], golang: [9], javascript: [6] },
            maxHeap: heap, minHeap: [...minHeap], focusHeap: 'max', focusIndices: [parent], compareIndices: [child, parent],
            narratedValue: num, targetHeap: 'max', sortedValues: snapshot(), action: 'swap',
            variables: { num, child, parent, 'maxHeap.top': heap[0] }, annotations: [],
          });
        });
        pushStep({
          title: '放入较小的一半',
          description: maxHeap.length === 1
            ? `左边还没有数字，先把 ${num} 放在左边，作为当前中间边界。`
            : `${num} 不大于左边最大值 ${maxHeap[0]}，所以 ${num} 属于较小的一半。`,
          codeLines: { java: [6, 7], python: [6, 7], golang: [9, 10], javascript: [6, 7] },
          maxHeap: placedHeap,
          minHeap: [...minHeap],
          currentNum: num,
          narratedValue: num,
          targetHeap: 'max',
          sortedValues: [...maxHeap, ...minHeap].sort((a, b) => a - b),
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
            description: `左边比右边多出 2 个，把左边最大的 ${moved} 移到右边；分界仍有序，两边数量恢复接近。`,
            codeLines: { java: [8, 9, 10], python: [8, 9], golang: [11, 12, 13], javascript: [8, 9, 10] },
            maxHeap: [...maxHeap],
            minHeap: [...minHeap],
            narratedValue: moved,
            sourceHeap: 'max',
            targetHeap: 'min',
            sortedValues: [...maxHeap, ...minHeap].sort((a, b) => a - b),
            action: 'balance',
            variables: { moved, 'maxHeap.size': maxHeap.length, 'minHeap.size': minHeap.length },
            annotations: [
              { id: `balance-${stepId}`, type: 'edge', text: `移动 ${moved}`, position: 'top' },
            ],
          });
        }
      } else {
        const insertionIndex = minHeap.length;
        const minSwaps = pushMinHeap(minHeap, num);
        pushStep({
          title: '放入较大的一半',
          description: `新数字 ${num} 大于左边最大值 ${maxHeap[0]}，先放到右边；右堆目前有 ${minHeap.length} 个数。`,
          codeLines: { java: [12, 13], python: [11, 12], golang: [15, 16], javascript: [12, 13] },
          maxHeap: [...maxHeap], minHeap: [...minHeap], currentNum: num, narratedValue: num, targetHeap: 'min',
          focusHeap: 'min', focusIndices: [insertionIndex], sortedValues: [...maxHeap, ...minHeap].sort((a, b) => a - b), action: 'insert',
          variables: { num, 'maxHeap.top': maxHeap[0], 'minHeap.size': minHeap.length }, annotations: [],
        });
        minSwaps.forEach(({ child, parent, heap }, swapIndex) => {
          if (parent === -1) {
            pushStep({
              title: '放到小顶堆末尾',
              description: `先把 ${num} 放进右堆下一个空位置（堆内位置 ${child}），再向上检查是否需要交换。`,
              codeLines: { java: [12], python: [11], golang: [15], javascript: [12] },
              maxHeap: [...maxHeap], minHeap: heap, focusHeap: 'min', focusIndices: [child],
              narratedValue: num, targetHeap: 'min', sortedValues: [...maxHeap, ...heap].sort((a, b) => a - b), action: 'insert',
              variables: { num, child, 'minHeap.size': heap.length }, annotations: [],
            });
            return;
          }
          pushStep({
            title: `恢复小顶堆顺序（第 ${swapIndex} 次交换）`,
            description: `子节点 ${heap[child]} 小于父节点 ${heap[parent]}，交换位置 ${child} 和 ${parent}，让较小值向堆顶移动。`,
            codeLines: { java: [12], python: [11], golang: [15], javascript: [12] },
            maxHeap: [...maxHeap], minHeap: heap, focusHeap: 'min', focusIndices: [parent], compareIndices: [child, parent],
            narratedValue: num, targetHeap: 'min', sortedValues: snapshot(), action: 'swap',
            variables: { num, child, parent, 'minHeap.top': heap[0] }, annotations: [],
          });
        });
        steps.push({
          id: stepId++,
          description: `${num} 大于左边最大值 ${maxHeap[0]}，所以 ${num} 属于较大的一半，放入右边。`,
          codeLines: { java: [12, 13], python: [11, 12], golang: [15, 16], javascript: [12, 13] },
          maxHeap: [...maxHeap],
          minHeap: [...minHeap],
          currentNum: num,
          narratedValue: num,
          targetHeap: 'min',
          sortedValues: [...maxHeap, ...minHeap].sort((a, b) => a - b),
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
            description: `右边比左边多出 1 个，把右边最小的 ${moved} 移到左边；较小与较大的分界没有被破坏。`,
            codeLines: { java: [14, 15, 16], python: [13, 14], golang: [17, 18, 19], javascript: [14, 15, 16] },
            maxHeap: [...maxHeap],
            minHeap: [...minHeap],
            narratedValue: moved,
            sourceHeap: 'min',
            targetHeap: 'max',
            sortedValues: [...maxHeap, ...minHeap].sort((a, b) => a - b),
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
      pushStep({
        title: `查询前已有 ${totalSize} 个数字`,
        description: `findMedian 不修改堆，只读取边界。先数清左右两堆各有多少个数字，再判断中间位置落在哪里。`,
        codeLines: { java: [24, 25], python: [50, 51], golang: [82, 83], javascript: [109, 110] },
        maxHeap: [...maxHeap], minHeap: [...minHeap], sortedValues: snapshot(), action: 'compare',
        variables: { 'maxHeap.size': maxHeap.length, 'minHeap.size': minHeap.length, totalSize }, annotations: [],
      });
      let median: number;
      
      if (maxHeap.length > minHeap.length) {
        median = maxHeap[0];
        pushStep({
          title: '总数为奇数，读取左堆顶',
          description: `左边有 ${maxHeap.length} 个、右边有 ${minHeap.length} 个；左边多一个，因此左边最大值 ${median} 就在正中间。`,
          codeLines: { java: [28, 29], python: [51, 52], golang: [83, 84], javascript: [110, 111] },
          maxHeap: [...maxHeap], minHeap: [...minHeap], sortedValues: snapshot(), median,
          focusHeap: 'max', focusIndices: [0], action: 'compare',
          variables: { 'maxHeap.size': maxHeap.length, 'minHeap.size': minHeap.length, 'maxHeap.top': median }, annotations: [],
        });
        steps.push({
          id: stepId++,
          description: `现在有 ${totalSize} 个数，左边比右边多 1 个；左边最大值 ${median} 正好位于正中间。`,
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
        pushStep({
          title: '总数为偶数，取两个边界的平均值',
          description: `两边各有 ${maxHeap.length} 个数字，中间落在边界之间；取左边最大值 ${maxHeap[0]} 与右边最小值 ${minHeap[0]} 的平均值。`,
          codeLines: { java: [31], python: [53], golang: [86], javascript: [113] },
          maxHeap: [...maxHeap], minHeap: [...minHeap], sortedValues: snapshot(), median,
          focusHeap: 'max', focusIndices: [0], compareIndices: [0], action: 'compare',
          variables: { 'maxHeap.top': maxHeap[0], 'minHeap.top': minHeap[0], median }, annotations: [],
        });
        steps.push({
          id: stepId++,
          description: `现在有 ${totalSize} 个数，中间落在两数之间；取左边最大值 ${maxHeap[0]} 和右边最小值 ${minHeap[0]} 的平均数 ${median}。`,
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
