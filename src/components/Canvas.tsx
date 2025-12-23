import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import type { AlgorithmStep } from '../types';
import styles from './Canvas.module.css';

interface CanvasProps {
  currentStep: AlgorithmStep | null;
}

interface HeapNodeData {
  value: number;
  index: number;
  x: number;
  y: number;
  isNew?: boolean;
}

export const Canvas: React.FC<CanvasProps> = ({ currentStep }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [transform, setTransform] = useState(d3.zoomIdentity);

  // 监听容器大小变化
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // 计算堆的树形布局
  const calculateHeapLayout = useCallback((
    heap: number[],
    startX: number,
    startY: number,
    nodeRadius: number,
    levelGap: number
  ): HeapNodeData[] => {
    if (heap.length === 0) return [];

    const nodes: HeapNodeData[] = [];
    const levels = Math.ceil(Math.log2(heap.length + 1));
    
    for (let i = 0; i < heap.length; i++) {
      const level = Math.floor(Math.log2(i + 1));
      const posInLevel = i - (Math.pow(2, level) - 1);
      const nodesInLevel = Math.pow(2, level);
      
      // 计算水平位置
      const levelWidth = Math.pow(2, levels - 1) * (nodeRadius * 2.5);
      const spacing = levelWidth / nodesInLevel;
      const x = startX + spacing * (posInLevel + 0.5) - levelWidth / 2;
      const y = startY + level * levelGap;

      nodes.push({
        value: heap[i],
        index: i,
        x,
        y,
        isNew: currentStep?.currentNum === heap[i] && currentStep?.action === 'add',
      });
    }

    return nodes;
  }, [currentStep]);

  // 绘制堆
  useEffect(() => {
    if (!svgRef.current || !currentStep) return;

    const svg = d3.select(svgRef.current);
    const { width, height } = dimensions;
    
    // 清除之前的内容
    svg.selectAll('*').remove();

    // 创建主容器
    const g = svg.append('g')
      .attr('transform', transform.toString());

    const nodeRadius = 24;
    const levelGap = 70;

    // 计算两个堆的布局
    const maxHeapX = width / 4;
    const minHeapX = (width * 3) / 4;
    const startY = 80;

    const maxHeapNodes = calculateHeapLayout(
      currentStep.maxHeap,
      maxHeapX,
      startY,
      nodeRadius,
      levelGap
    );

    const minHeapNodes = calculateHeapLayout(
      currentStep.minHeap,
      minHeapX,
      startY,
      nodeRadius,
      levelGap
    );

    // 绘制标题
    g.append('text')
      .attr('x', maxHeapX)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', '600')
      .attr('fill', 'var(--max-heap-color)')
      .text(`大顶堆 maxHeap (${currentStep.maxHeap.length})`);

    g.append('text')
      .attr('x', minHeapX)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', '600')
      .attr('fill', 'var(--min-heap-color)')
      .text(`小顶堆 minHeap (${currentStep.minHeap.length})`);

    // 绘制堆顶标签
    if (currentStep.maxHeap.length > 0) {
      g.append('text')
        .attr('x', maxHeapX)
        .attr('y', 50)
        .attr('text-anchor', 'middle')
        .attr('font-size', '11px')
        .attr('fill', 'var(--text-secondary)')
        .text(`堆顶: ${currentStep.maxHeap[0]}`);
    }

    if (currentStep.minHeap.length > 0) {
      g.append('text')
        .attr('x', minHeapX)
        .attr('y', 50)
        .attr('text-anchor', 'middle')
        .attr('font-size', '11px')
        .attr('fill', 'var(--text-secondary)')
        .text(`堆顶: ${currentStep.minHeap[0]}`);
    }

    // 绘制连接线的函数
    const drawEdges = (nodes: HeapNodeData[], color: string) => {
      nodes.forEach((node, i) => {
        if (i === 0) return;
        const parentIndex = Math.floor((i - 1) / 2);
        const parent = nodes[parentIndex];
        
        g.append('line')
          .attr('x1', parent.x)
          .attr('y1', parent.y)
          .attr('x2', node.x)
          .attr('y2', node.y)
          .attr('stroke', color)
          .attr('stroke-width', 2)
          .attr('opacity', 0.4);
      });
    };

    // 绘制节点的函数
    const drawNodes = (nodes: HeapNodeData[], color: string, isMaxHeap: boolean) => {
      const nodeGroup = g.selectAll(isMaxHeap ? '.max-node' : '.min-node')
        .data(nodes)
        .enter()
        .append('g')
        .attr('class', isMaxHeap ? 'max-node' : 'min-node')
        .attr('transform', d => `translate(${d.x}, ${d.y})`);

      // 节点圆圈
      nodeGroup.append('circle')
        .attr('r', nodeRadius)
        .attr('fill', d => d.isNew ? 'var(--new-node-color)' : color)
        .attr('stroke', d => d.index === 0 ? 'var(--accent-color)' : color)
        .attr('stroke-width', d => d.index === 0 ? 3 : 2)
        .attr('opacity', d => d.isNew ? 1 : 0.9);

      // 节点值
      nodeGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('font-size', '14px')
        .attr('font-weight', '600')
        .attr('fill', 'white')
        .text(d => d.value);

      // 索引标签
      nodeGroup.append('text')
        .attr('y', nodeRadius + 14)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', 'var(--text-secondary)')
        .text(d => `[${d.index}]`);

      // 新节点标签
      nodeGroup.filter(d => d.isNew === true)
        .append('text')
        .attr('y', -nodeRadius - 8)
        .attr('text-anchor', 'middle')
        .attr('font-size', '11px')
        .attr('fill', 'var(--new-node-color)')
        .attr('font-weight', '500')
        .text('新添加');
    };

    // 绘制 maxHeap
    drawEdges(maxHeapNodes, 'var(--max-heap-color)');
    drawNodes(maxHeapNodes, 'var(--max-heap-color)', true);

    // 绘制 minHeap
    drawEdges(minHeapNodes, 'var(--min-heap-color)');
    drawNodes(minHeapNodes, 'var(--min-heap-color)', false);

    // 绘制中位数显示
    if (currentStep.median !== undefined && currentStep.median !== null) {
      const medianY = height - 60;
      
      g.append('rect')
        .attr('x', width / 2 - 80)
        .attr('y', medianY - 20)
        .attr('width', 160)
        .attr('height', 40)
        .attr('rx', 8)
        .attr('fill', 'var(--accent-color)')
        .attr('opacity', 0.15);

      g.append('text')
        .attr('x', width / 2)
        .attr('y', medianY + 5)
        .attr('text-anchor', 'middle')
        .attr('font-size', '16px')
        .attr('font-weight', '600')
        .attr('fill', 'var(--accent-color)')
        .text(`中位数: ${currentStep.median}`);
    }

    // 绘制当前步骤描述
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height - 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '13px')
      .attr('fill', 'var(--text-secondary)')
      .text(currentStep.description);

    // 绘制分隔线
    g.append('line')
      .attr('x1', width / 2)
      .attr('y1', 60)
      .attr('x2', width / 2)
      .attr('y2', height - 100)
      .attr('stroke', 'var(--border-color)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4');

    // 设置缩放
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        setTransform(event.transform);
        g.attr('transform', event.transform.toString());
      });

    svg.call(zoom);

  }, [currentStep, dimensions, transform, calculateHeapLayout]);

  return (
    <div ref={containerRef} className={styles.container}>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className={styles.svg}
      />
      <div className={styles.hint}>
        拖拽平移 · 滚轮缩放
      </div>
    </div>
  );
};
