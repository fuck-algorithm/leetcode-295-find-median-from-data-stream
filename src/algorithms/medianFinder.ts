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
  const emitPopSteps = (
    side: 'max' | 'min',
    value: number,
    states: Array<{ heap: number[]; beforeHeap: number[]; from: number; to: number; swapped: boolean }>,
    otherHeap: number[],
  ) => {
    states.forEach((state, index) => {
      const removingOnlyRoot = index === 0 && state.to === -1;
      const replacingRoot = index === 0 && !removingOnlyRoot;
      const finalCheck = index === states.length - 1 && state.from === state.to && index > 0;
      const operation = removingOnlyRoot || replacingRoot ? 'remove' : state.swapped ? 'swap' : 'compare';
      const leftHeap = side === 'max' ? state.heap : otherHeap;
      const rightHeap = side === 'min' ? state.heap : otherHeap;
      const beforeLeftHeap = side === 'max' ? state.beforeHeap : otherHeap;
      const beforeRightHeap = side === 'min' ? state.beforeHeap : otherHeap;
      const relation = side === 'max' ? '更大' : '更小';
      const narration = removingOnlyRoot
        ? `堆里只有 ${value}，移除后${side === 'max' ? '左' : '右'}边为空。`
        : replacingRoot
        ? `移出堆顶 ${value}，把末尾值 ${state.heap[0]} 暂放到根位置，接下来向下检查。`
        : state.swapped
          ? `比较位置 ${state.from} 的 ${state.beforeHeap[state.from]} 和位置 ${state.to} 的 ${state.beforeHeap[state.to]}，${relation}的值上移一步。`
          : `检查根位置 ${state.from} 与子节点；当前节点已满足堆序，不再下沉。`;
      pushStep({
        title: removingOnlyRoot || replacingRoot ? `删除${side === 'max' ? '左' : '右'}堆顶` : finalCheck ? '确认堆序恢复' : state.swapped ? '向下恢复堆序' : '下沉结束',
        description: narration,
        codeLines: { java: side === 'max' ? [9] : [19], python: side === 'max' ? [9] : [18], golang: side === 'max' ? [12] : [22], javascript: side === 'max' ? [9] : [104] },
        maxHeap: [...leftHeap], minHeap: [...rightHeap], currentNum: value, narratedValue: value,
        sourceHeap: side, targetHeap: side === 'max' ? 'min' : 'max', focusHeap: side,
        focusIndices: [state.from], compareIndices: state.from === state.to ? undefined : [state.from, state.to],
        sortedValues: removingOnlyRoot || replacingRoot
          ? [...beforeLeftHeap, ...beforeRightHeap].sort((a, b) => a - b)
          : [...leftHeap, ...rightHeap].sort((a, b) => a - b),
        action: removingOnlyRoot || replacingRoot ? 'remove' : operation,
        variables: { moved: value, index: state.from, child: state.to, swapped: state.swapped ? '是' : '否' },
        annotations: [],
      });
    });
  };
  
  // 堆操作辅助函数
  const pushMaxHeap = (arr: number[], val: number): Array<{ child: number; parent: number; heap: number[]; beforeHeap: number[]; kind: 'insert' | 'compare' | 'swap'; swapped: boolean }> => {
    const swaps: Array<{ child: number; parent: number; heap: number[]; beforeHeap: number[]; kind: 'insert' | 'compare' | 'swap'; swapped: boolean }> = [];
    arr.push(val);
    swaps.push({ child: arr.length - 1, parent: -1, heap: [...arr], beforeHeap: arr.slice(0, -1), kind: 'insert', swapped: false });
    let i = arr.length - 1;
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      const beforeHeap = [...arr];
      const shouldSwap = arr[parent] < arr[i];
      if (shouldSwap) [arr[parent], arr[i]] = [arr[i], arr[parent]];
      swaps.push({ child: i, parent, heap: [...arr], beforeHeap, kind: shouldSwap ? 'swap' : 'compare', swapped: shouldSwap });
      if (shouldSwap) i = parent;
      else break;
    }
    return swaps;
  };
  
  const popMaxHeap = (arr: number[]): { value: number; states: Array<{ heap: number[]; beforeHeap: number[]; from: number; to: number; swapped: boolean }> } => {
    const beforeRemoval = [...arr];
    const value = arr[0];
    const last = arr.pop()!;
    const states: Array<{ heap: number[]; beforeHeap: number[]; from: number; to: number; swapped: boolean }> = [];
    if (arr.length === 0) states.push({ heap: [], beforeHeap: beforeRemoval, from: 0, to: -1, swapped: false });
    if (arr.length > 0) {
      const beforeHeap = [...arr];
      arr[0] = last;
      states.push({ heap: [...arr], beforeHeap: [...beforeHeap], from: arr.length, to: 0, swapped: false });
      let i = 0;
      while (true) {
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        let largest = i;
        if (left < arr.length && arr[left] > arr[largest]) largest = left;
        if (right < arr.length && arr[right] > arr[largest]) largest = right;
        if (largest !== i) {
          const beforeHeap = [...arr];
          [arr[i], arr[largest]] = [arr[largest], arr[i]];
          states.push({ heap: [...arr], beforeHeap: [...beforeHeap], from: i, to: largest, swapped: true });
          i = largest;
        } else {
          states.push({ heap: [...arr], beforeHeap: [...arr], from: i, to: i, swapped: false });
          break;
        }
      }
    }
    return { value, states };
  };
  
  const pushMinHeap = (arr: number[], val: number): Array<{ child: number; parent: number; heap: number[]; beforeHeap: number[]; kind: 'insert' | 'compare' | 'swap'; swapped: boolean }> => {
    const swaps: Array<{ child: number; parent: number; heap: number[]; beforeHeap: number[]; kind: 'insert' | 'compare' | 'swap'; swapped: boolean }> = [];
    arr.push(val);
    swaps.push({ child: arr.length - 1, parent: -1, heap: [...arr], beforeHeap: arr.slice(0, -1), kind: 'insert', swapped: false });
    let i = arr.length - 1;
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      const beforeHeap = [...arr];
      const shouldSwap = arr[parent] > arr[i];
      if (shouldSwap) [arr[parent], arr[i]] = [arr[i], arr[parent]];
      swaps.push({ child: i, parent, heap: [...arr], beforeHeap, kind: shouldSwap ? 'swap' : 'compare', swapped: shouldSwap });
      if (shouldSwap) i = parent;
      else break;
    }
    return swaps;
  };
  
  const popMinHeap = (arr: number[]): { value: number; states: Array<{ heap: number[]; beforeHeap: number[]; from: number; to: number; swapped: boolean }> } => {
    const beforeRemoval = [...arr];
    const value = arr[0];
    const last = arr.pop()!;
    const states: Array<{ heap: number[]; beforeHeap: number[]; from: number; to: number; swapped: boolean }> = [];
    if (arr.length === 0) states.push({ heap: [], beforeHeap: beforeRemoval, from: 0, to: -1, swapped: false });
    if (arr.length > 0) {
      const beforeHeap = [...arr];
      arr[0] = last;
      states.push({ heap: [...arr], beforeHeap: [...beforeHeap], from: arr.length, to: 0, swapped: false });
      let i = 0;
      while (true) {
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        let smallest = i;
        if (left < arr.length && arr[left] < arr[smallest]) smallest = left;
        if (right < arr.length && arr[right] < arr[smallest]) smallest = right;
        if (smallest !== i) {
          const beforeHeap = [...arr];
          [arr[i], arr[smallest]] = [arr[smallest], arr[i]];
          states.push({ heap: [...arr], beforeHeap: [...beforeHeap], from: i, to: smallest, swapped: true });
          i = smallest;
        } else {
          states.push({ heap: [...arr], beforeHeap: [...arr], from: i, to: i, swapped: false });
          break;
        }
      }
    }
    return { value, states };
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
        maxSwaps.forEach(({ child, parent, heap, beforeHeap, kind, swapped }, swapIndex) => {
          const indices = parent < 0 ? [child] : [child, parent];
          if (swapped && parent >= 0) pushStep({
            title: `比较父子节点 ${beforeHeap[child]} 与 ${beforeHeap[parent]}`,
            description: `新值 ${beforeHeap[child]} 大于父节点 ${beforeHeap[parent]}，违反大顶堆顺序，下一步要交换。`,
            codeLines: { java: [6], python: [6], golang: [9], javascript: [6] },
            maxHeap: beforeHeap, minHeap: [...minHeap], focusHeap: 'max', focusIndices: [child], compareIndices: indices,
            narratedValue: num, targetHeap: 'max', sortedValues: [...beforeHeap, ...minHeap].sort((a, b) => a - b),
            action: 'compare', variables: { num, child, parent, 'maxHeap.top': beforeHeap[0] }, annotations: [],
          });
          pushStep({
            title: parent < 0 ? '放到大顶堆末尾' : swapped ? `恢复大顶堆顺序（第 ${swapIndex} 次交换）` : '父子顺序正确，不必交换',
            description: parent < 0
              ? `先把 ${num} 放进下一个空位置（堆内位置 ${child}），再从底向上检查父节点。`
              : swapped
                ? `子节点 ${beforeHeap[child]} 大于父节点 ${beforeHeap[parent]}，交换位置 ${child} 和 ${parent}，让较大的值向堆顶移动。`
                : `比较子节点 ${beforeHeap[child]} 与父节点 ${beforeHeap[parent]}；父节点更大，满足大顶堆规则，停止上滤。`,
            codeLines: { java: [6], python: [6], golang: [9], javascript: [6] },
            maxHeap: kind === 'compare' ? beforeHeap : heap, minHeap: [...minHeap], focusHeap: 'max', focusIndices: swapped && parent >= 0 ? [parent] : [child],
            compareIndices: parent >= 0 ? indices : undefined, narratedValue: num, targetHeap: 'max',
            sortedValues: [...(kind === 'compare' ? beforeHeap : heap), ...minHeap].sort((a, b) => a - b), action: kind,
            variables: { num, child, parent, 'maxHeap.top': heap[0], swapped: swapped ? '是' : '否' }, annotations: [],
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
          const { value: moved, states: popStates } = popMaxHeap(maxHeap);
          pushStep({
            title: '检查数量：左边多了两个',
            description: `左边 ${maxHeap.length} 个、右边 ${minHeap.length} 个，左边超过右边不止 1 个，需要移动一个边界数。`,
            codeLines: { java: [8], python: [8], golang: [11], javascript: [8] },
            maxHeap: [...maxHeap], minHeap: [...minHeap], sortedValues: snapshot(), action: 'compare',
            variables: { 'maxHeap.size': maxHeap.length, 'minHeap.size': minHeap.length }, annotations: [],
          });
          emitPopSteps('max', moved, popStates, minHeap);
          const minSwaps = pushMinHeap(minHeap, moved);
          minSwaps.forEach(({ child, parent, heap, beforeHeap, kind, swapped }, swapIndex) => {
            const indices = parent < 0 ? [child] : [child, parent];
            if (swapped && parent >= 0) pushStep({ title: `比较右堆父子节点 ${beforeHeap[child]} 与 ${beforeHeap[parent]}`, description: `子节点 ${beforeHeap[child]} 小于父节点 ${beforeHeap[parent]}，下一步交换以恢复小顶堆。`, codeLines: { java: [10], python: [9], golang: [13], javascript: [10] }, maxHeap: [...maxHeap], minHeap: beforeHeap, focusHeap: 'min', focusIndices: [child], compareIndices: [child, parent], narratedValue: moved, sourceHeap: 'max', targetHeap: 'min', sortedValues: [...maxHeap, ...beforeHeap].sort((a, b) => a - b), action: 'compare', variables: { moved, child, parent }, annotations: [] });
            pushStep({
              title: parent < 0 ? `把 ${moved} 放到右堆末尾` : swapped ? `恢复右堆顺序（第 ${swapIndex} 次交换）` : '父子顺序正确，不必交换',
              description: parent < 0
                ? `从左堆取出的 ${moved} 先占据右堆下一个空位置。`
                : swapped
                  ? `子节点 ${beforeHeap[child]} 小于父节点 ${beforeHeap[parent]}，交换后继续向堆顶调整。`
                  : `比较子节点 ${beforeHeap[child]} 和父节点 ${beforeHeap[parent]}；无需交换，右堆已满足小顶堆规则。`,
              codeLines: { java: [10], python: [9], golang: [13], javascript: [10] },
              maxHeap: [...maxHeap], minHeap: heap, focusHeap: 'min', focusIndices: swapped && parent >= 0 ? [parent] : [child],
              compareIndices: parent >= 0 ? indices : undefined, narratedValue: moved, sourceHeap: 'max', targetHeap: 'min',
              sortedValues: [...maxHeap, ...heap].sort((a, b) => a - b), action: kind,
              variables: { moved, child, parent, swapped: swapped ? '是' : '否' }, annotations: [],
            });
          });
          steps.push({
            id: stepId++,
            description: `边界数 ${moved} 已移动到右边；此时左边 ${maxHeap.length} 个、右边 ${minHeap.length} 个，数量关系恢复有效。`,
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
        const minSwaps = pushMinHeap(minHeap, num);
        minSwaps.forEach(({ child, parent, heap, beforeHeap, kind, swapped }, swapIndex) => {
          const indices = parent < 0 ? [child] : [child, parent];
          if (swapped && parent >= 0) pushStep({
            title: `比较右堆父子节点 ${beforeHeap[child]} 与 ${beforeHeap[parent]}`,
            description: `右堆子节点 ${beforeHeap[child]} 小于父节点 ${beforeHeap[parent]}，违反小顶堆顺序，下一步要交换。`,
            codeLines: { java: [12], python: [11], golang: [15], javascript: [12] },
            maxHeap: [...maxHeap], minHeap: beforeHeap, focusHeap: 'min', focusIndices: [child], compareIndices: indices,
            narratedValue: num, targetHeap: 'min', sortedValues: [...maxHeap, ...beforeHeap].sort((a, b) => a - b),
            action: 'compare', variables: { num, child, parent, 'minHeap.top': beforeHeap[0] }, annotations: [],
          });
          pushStep({
            title: parent < 0 ? '放到小顶堆末尾' : swapped ? `恢复小顶堆顺序（第 ${swapIndex} 次交换）` : '父子顺序正确，不必交换',
            description: parent < 0
              ? `先把 ${num} 放进右堆下一个空位置（堆内位置 ${child}），再向上检查是否需要交换。`
              : swapped
                ? `子节点 ${beforeHeap[child]} 小于父节点 ${beforeHeap[parent]}，交换位置 ${child} 和 ${parent}，让较小值向堆顶移动。`
                : `比较子节点 ${beforeHeap[child]} 与父节点 ${beforeHeap[parent]}；父节点更小，满足小顶堆规则，停止上滤。`,
            codeLines: { java: [12], python: [11], golang: [15], javascript: [12] },
            maxHeap: [...maxHeap], minHeap: kind === 'compare' ? beforeHeap : heap, focusHeap: 'min', focusIndices: swapped && parent >= 0 ? [parent] : [child],
            compareIndices: parent >= 0 ? indices : undefined, narratedValue: num, targetHeap: 'min',
            sortedValues: [...maxHeap, ...(kind === 'compare' ? beforeHeap : heap)].sort((a, b) => a - b), action: kind,
            variables: { num, child, parent, 'minHeap.top': heap[0], swapped: swapped ? '是' : '否' }, annotations: [],
          });
        });
        pushStep({
          title: '放入较大的一半',
          description: `${num} 大于左边最大值 ${maxHeap[0]}，所以 ${num} 属于较大的一半。`,
          codeLines: { java: [12, 13], python: [11, 12], golang: [15, 16], javascript: [12, 13] },
          maxHeap: [...maxHeap], minHeap: [...minHeap], currentNum: num, narratedValue: num, targetHeap: 'min',
          sortedValues: snapshot(), action: 'add',
          variables: { num, 'maxHeap.top': maxHeap[0], 'minHeap.size': minHeap.length }, annotations: [],
        });
        steps.push({
          id: stepId++,
          description: `${num} 已进入右边，接下来检查两堆的数量是否仍然平衡。`,
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
          const { value: moved, states: popStates } = popMinHeap(minHeap);
          pushStep({
            title: '检查数量：右边多了一个',
            description: `左边 ${maxHeap.length} 个，右边 ${minHeap.length} 个；允许左边比右边多 1 个，不允许右边反而更多。`,
            codeLines: { java: [18], python: [17], golang: [21], javascript: [103] },
            maxHeap: [...maxHeap], minHeap: [...minHeap], sortedValues: snapshot(), action: 'compare',
            variables: { 'maxHeap.size': maxHeap.length, 'minHeap.size': minHeap.length }, annotations: [],
          });
          emitPopSteps('min', moved, popStates, maxHeap);
          const maxSwaps = pushMaxHeap(maxHeap, moved);
          maxSwaps.forEach(({ child, parent, heap, beforeHeap, swapped, kind }, swapIndex) => {
            const indices = parent < 0 ? [child] : [child, parent];
            if (swapped && parent >= 0) pushStep({ title: `比较左堆父子节点 ${beforeHeap[child]} 与 ${beforeHeap[parent]}`, description: `子节点 ${beforeHeap[child]} 大于父节点 ${beforeHeap[parent]}，下一步交换以恢复大顶堆。`, codeLines: { java: [19], python: [18], golang: [22], javascript: [104] }, maxHeap: heap, minHeap: [...minHeap], focusHeap: 'max', focusIndices: [child], compareIndices: [child, parent], narratedValue: moved, sourceHeap: 'min', targetHeap: 'max', sortedValues: [...heap, ...minHeap].sort((a, b) => a - b), action: 'compare', variables: { moved, child, parent }, annotations: [] });
            pushStep({
              title: parent < 0 ? `把 ${moved} 放到左堆末尾` : swapped ? `恢复左堆顺序（第 ${swapIndex} 次交换）` : '左堆父子顺序正确',
              description: parent < 0
                ? `从右堆取出的 ${moved} 先占据左堆下一个空位置。`
                : swapped
                  ? `左堆子节点 ${beforeHeap[child]} 大于父节点 ${beforeHeap[parent]}，交换后继续检查。`
                  : `比较左堆子节点 ${beforeHeap[child]} 与父节点 ${beforeHeap[parent]}；无需交换，大顶堆规则已满足。`,
              codeLines: { java: [19], python: [18], golang: [22], javascript: [104] },
              maxHeap: heap, minHeap: [...minHeap], focusHeap: 'max', focusIndices: swapped && parent >= 0 ? [parent] : [child],
              compareIndices: parent >= 0 ? indices : undefined, narratedValue: moved, sourceHeap: 'min', targetHeap: 'max',
              sortedValues: [...heap, ...minHeap].sort((a, b) => a - b), action: kind,
              variables: { moved, child, parent, swapped: swapped ? '是' : '否' }, annotations: [],
            });
          });
          steps.push({
            id: stepId++,
            description: `边界数 ${moved} 已移动到左边；此时左边 ${maxHeap.length} 个、右边 ${minHeap.length} 个，两边数量有效。`,
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
          title: '读取左边中间边界',
          description: `左边有 ${maxHeap.length} 个、右边有 ${minHeap.length} 个；左边多一个，因此读取左堆顶 ${median} 作为中位数。`,
          codeLines: { java: [29], python: [52], golang: [84], javascript: [111] },
          maxHeap: [...maxHeap], minHeap: [...minHeap], sortedValues: snapshot(), median,
          currentNum: median, focusHeap: 'max', focusIndices: [0], action: 'compare',
          variables: { 'maxHeap.size': maxHeap.length, 'minHeap.size': minHeap.length, 'maxHeap.top': median }, annotations: [],
        });
        pushStep({ title: '返回中位数', description: `中间只有一个数，所以直接返回左堆顶 ${median}。`, codeLines: { java: [29], python: [52], golang: [84], javascript: [111] }, maxHeap: [...maxHeap], minHeap: [...minHeap], sortedValues: snapshot(), median, currentNum: median, focusHeap: 'max', focusIndices: [0], action: 'return', variables: { median, 'maxHeap.top': median }, annotations: [] });
        steps.push({
          id: stepId++,
          description: `现在有 ${totalSize} 个数，左边比右边多 1 个；左边最大值 ${median} 正好位于正中间。`,
          codeLines: { java: [20, 21], python: [17, 18], golang: [23, 24], javascript: [20, 21] },
          maxHeap: [...maxHeap],
          minHeap: [...minHeap],
          sortedValues: snapshot(),
          median,
          action: 'findMedian',
          variables: { 'maxHeap.top': maxHeap[0], 'maxHeap.size': maxHeap.length, 'minHeap.size': minHeap.length, median },
          annotations: [
            { id: `median-${stepId}`, type: 'node', target: 'maxHeap-0', text: `中位数: ${median}`, position: 'top' },
          ],
        });
      } else {
        median = (maxHeap[0] + minHeap[0]) / 2;
        pushStep({ title: '读取左边界值', description: `左边有序区的最大值是 ${maxHeap[0]}；偶数个数字时，它是两个中间值中的较小者。`, codeLines: { java: [31], python: [53], golang: [86], javascript: [113] }, maxHeap: [...maxHeap], minHeap: [...minHeap], sortedValues: snapshot(), currentNum: maxHeap[0], focusHeap: 'max', focusIndices: [0], action: 'compare', variables: { 'maxHeap.top': maxHeap[0] }, annotations: [] });
        pushStep({ title: '读取右边界值', description: `右边有序区的最小值是 ${minHeap[0]}；它是紧挨着左边界的另一个中间值。`, codeLines: { java: [31], python: [53], golang: [86], javascript: [113] }, maxHeap: [...maxHeap], minHeap: [...minHeap], sortedValues: snapshot(), currentNum: minHeap[0], focusHeap: 'min', focusIndices: [0], action: 'compare', variables: { 'minHeap.top': minHeap[0] }, annotations: [] });
        pushStep({ title: '计算两个边界的平均值', description: `偶数个数没有唯一中点，所以计算 (${maxHeap[0]} + ${minHeap[0]}) ÷ 2 = ${median}。`, codeLines: { java: [31], python: [53], golang: [86], javascript: [113] }, maxHeap: [...maxHeap], minHeap: [...minHeap], sortedValues: snapshot(), median, action: 'compare', variables: { left: maxHeap[0], right: minHeap[0], median }, annotations: [] });
        pushStep({ title: '返回中位数', description: `把刚才得到的平均值 ${median} 作为当前数据流的中位数返回。`, codeLines: { java: [31], python: [53], golang: [86], javascript: [113] }, maxHeap: [...maxHeap], minHeap: [...minHeap], sortedValues: snapshot(), median, action: 'return', variables: { median }, annotations: [] });
        steps.push({
          id: stepId++,
          description: `现在有 ${totalSize} 个数，中间落在两数之间；取左边最大值 ${maxHeap[0]} 和右边最小值 ${minHeap[0]} 的平均数 ${median}。`,
          codeLines: { java: [23], python: [19], golang: [26], javascript: [23] },
          maxHeap: [...maxHeap],
          minHeap: [...minHeap],
          sortedValues: snapshot(),
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
    sortedValues: snapshot(),
    action: 'complete',
    variables: { 'maxHeap.size': maxHeap.length, 'minHeap.size': minHeap.length },
    annotations: [],
  });
  
  return steps;
};
