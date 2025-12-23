import type { ProgrammingLanguage } from '../types';

export const codeSnippets: Record<ProgrammingLanguage, string> = {
  java: `class MedianFinder {
    PriorityQueue<Integer> maxHeap; // 大顶堆，存较小的一半
    PriorityQueue<Integer> minHeap; // 小顶堆，存较大的一半

    public MedianFinder() {
        maxHeap = new PriorityQueue<>((a, b) -> b - a);
        minHeap = new PriorityQueue<>();
    }

    public void addNum(int num) {
        if (maxHeap.isEmpty() || num <= maxHeap.peek()) {
            maxHeap.offer(num);
            if (maxHeap.size() > minHeap.size() + 1) {
                minHeap.offer(maxHeap.poll());
            }
        } else {
            minHeap.offer(num);
            if (minHeap.size() > maxHeap.size()) {
                maxHeap.offer(minHeap.poll());
            }
        }
    }

    public double findMedian() {
        if (maxHeap.size() > minHeap.size()) {
            return maxHeap.peek();
        }
        return (maxHeap.peek() + minHeap.peek()) / 2.0;
    }
}`,

  python: `class MedianFinder:
    def __init__(self):
        self.max_heap = []  # 大顶堆，存较小的一半（取负数模拟）
        self.min_heap = []  # 小顶堆，存较大的一半

    def addNum(self, num: int) -> None:
        if not self.max_heap or num <= -self.max_heap[0]:
            heapq.heappush(self.max_heap, -num)
            if len(self.max_heap) > len(self.min_heap) + 1:
                heapq.heappush(self.min_heap, -heapq.heappop(self.max_heap))
        else:
            heapq.heappush(self.min_heap, num)
            if len(self.min_heap) > len(self.max_heap):
                heapq.heappush(self.max_heap, -heapq.heappop(self.min_heap))

    def findMedian(self) -> float:
        if len(self.max_heap) > len(self.min_heap):
            return -self.max_heap[0]
        return (-self.max_heap[0] + self.min_heap[0]) / 2`,

  golang: `type MedianFinder struct {
    maxHeap *IntHeap // 大顶堆，存较小的一半
    minHeap *IntHeap // 小顶堆，存较大的一半
}

func Constructor() MedianFinder {
    max := &IntHeap{isMax: true}
    min := &IntHeap{isMax: false}
    heap.Init(max)
    heap.Init(min)
    return MedianFinder{maxHeap: max, minHeap: min}
}

func (mf *MedianFinder) AddNum(num int) {
    if mf.maxHeap.Len() == 0 || num <= (*mf.maxHeap)[0] {
        heap.Push(mf.maxHeap, num)
        if mf.maxHeap.Len() > mf.minHeap.Len()+1 {
            heap.Push(mf.minHeap, heap.Pop(mf.maxHeap).(int))
        }
    } else {
        heap.Push(mf.minHeap, num)
        if mf.minHeap.Len() > mf.maxHeap.Len() {
            heap.Push(mf.maxHeap, heap.Pop(mf.minHeap).(int))
        }
    }
}

func (mf *MedianFinder) FindMedian() float64 {
    if mf.maxHeap.Len() > mf.minHeap.Len() {
        return float64((*mf.maxHeap)[0])
    }
    return float64((*mf.maxHeap)[0]+(*mf.minHeap)[0]) / 2.0
}`,

  javascript: `class MedianFinder {
    constructor() {
        this.maxHeap = new MaxHeap(); // 大顶堆，存较小的一半
        this.minHeap = new MinHeap(); // 小顶堆，存较大的一半
    }

    addNum(num) {
        if (this.maxHeap.isEmpty() || num <= this.maxHeap.peek()) {
            this.maxHeap.push(num);
            if (this.maxHeap.size() > this.minHeap.size() + 1) {
                this.minHeap.push(this.maxHeap.pop());
            }
        } else {
            this.minHeap.push(num);
            if (this.minHeap.size() > this.maxHeap.size()) {
                this.maxHeap.push(this.minHeap.pop());
            }
        }
    }

    findMedian() {
        if (this.maxHeap.size() > this.minHeap.size()) {
            return this.maxHeap.peek();
        }
        return (this.maxHeap.peek() + this.minHeap.peek()) / 2;
    }
}`,
};

export const algorithmExplanation = `## 双堆法解题思路

### 核心思想
使用两个堆来维护数据流的中位数：
- **大顶堆 (maxHeap)**：存储较小的一半数字，堆顶是这一半中最大的
- **小顶堆 (minHeap)**：存储较大的一半数字，堆顶是这一半中最小的

### 关键性质
1. maxHeap 的大小要么等于 minHeap，要么比 minHeap 多 1
2. maxHeap 中所有元素 ≤ minHeap 中所有元素

### 添加数字 addNum(num)
1. 如果 maxHeap 为空，或 num ≤ maxHeap 堆顶：
   - 将 num 加入 maxHeap
   - 如果 maxHeap 大小 > minHeap 大小 + 1，将 maxHeap 堆顶移到 minHeap
2. 否则：
   - 将 num 加入 minHeap
   - 如果 minHeap 大小 > maxHeap 大小，将 minHeap 堆顶移到 maxHeap

### 获取中位数 findMedian()
- 如果总数为奇数：返回 maxHeap 堆顶
- 如果总数为偶数：返回两个堆顶的平均值

### 复杂度分析
- **时间复杂度**：addNum O(log n)，findMedian O(1)
- **空间复杂度**：O(n)
`;
