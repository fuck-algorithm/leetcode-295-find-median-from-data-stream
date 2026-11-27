import { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import type { AlgorithmStep } from '../types';
import styles from './Canvas.module.css';

interface CanvasProps {
  currentStep: AlgorithmStep | null;
}

interface HeapNodeData {
  id: string;
  heap: 'max' | 'min';
  value: number;
  index: number;
  x: number;
  y: number;
  status: 'idle' | 'current' | 'boundary';
}

const nodeRadius = 25;
const levelGap = 78;
const colors = {
  max: '#19866a',
  min: '#3478a8',
  current: '#e9ad43',
  ink: '#182b37',
  muted: '#667985',
  line: '#d9e3e4',
};

function layoutHeap(heap: number[], side: 'max' | 'min', center: number): HeapNodeData[] {
  if (!heap.length) return [];
  const levels = Math.ceil(Math.log2(heap.length + 1));
  return heap.map((value, index) => {
    const level = Math.floor(Math.log2(index + 1));
    const position = index - (2 ** level - 1);
    const width = Math.min(460, 2 ** (levels - 1) * 80);
    const pitch = width / 2 ** level;
    return {
      id: `${side}-${index}`,
      heap: side,
      value,
      index,
      x: center + pitch * (position + 0.5) - width / 2,
      y: 200 + level * levelGap,
      status: 'idle',
    };
  });
}

export const Canvas: React.FC<CanvasProps> = ({ currentStep }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => {
      setDimensions({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = svgRef.current;
    if (!element || !currentStep) return;
    const { width, height } = dimensions;
    const svg = d3.select(element).attr('viewBox', `0 0 ${width} ${height}`);
    let root = svg.select<SVGGElement>('.zoom-layer');
    if (root.empty()) {
      root = svg.append('g').attr('class', 'zoom-layer');
      root.append('g').attr('class', 'layer-containers');
      root.append('g').attr('class', 'layer-edges');
      root.append('g').attr('class', 'layer-nodes');
      root.append('g').attr('class', 'layer-labels');
      root.append('g').attr('class', 'layer-teaching');
    }

    const laneWidth = width * 0.43;
    const maxCenter = width * 0.27;
    const minCenter = width * 0.73;
    const maxNodes = layoutHeap(currentStep.maxHeap, 'max', maxCenter);
    const minNodes = layoutHeap(currentStep.minHeap, 'min', minCenter);
    const isArrival = currentStep.action === 'add' && currentStep.codeLines.java.includes(5);
    const incoming = isArrival && (currentStep.maxHeap.length > 0 || currentStep.minHeap.length > 0)
      ? currentStep.currentNum : undefined;
    const moved = currentStep.action === 'balance' ? currentStep.variables.moved : undefined;
    const nodes = [...maxNodes, ...minNodes];

    if (incoming !== undefined) {
      const targetHeap = currentStep.maxHeap.length === 0 || incoming <= currentStep.maxHeap[0] ? 'max' : 'min';
      const target = [...nodes].reverse().find(node => node.heap === targetHeap && node.value === incoming);
      if (target) target.status = 'current';
    }
    if (moved !== undefined) {
      const target = nodes.find(node => node.value === moved);
      if (target) target.status = 'current';
    }
    if (currentStep.median !== undefined && currentStep.median !== null) {
      nodes.forEach(node => {
        if (node.index === 0 && (node.heap === 'max' || currentStep.maxHeap.length === currentStep.minHeap.length)) node.status = 'boundary';
      });
    }

    const edgeLayer = root.select<SVGGElement>('.layer-edges');
    const edges = nodes.filter(node => node.index > 0).map(node => ({
      id: `${node.heap}-edge-${node.index}`,
      fromX: nodes.find(parent => parent.heap === node.heap && parent.index === Math.floor((node.index - 1) / 2))?.x ?? node.x,
      fromY: nodes.find(parent => parent.heap === node.heap && parent.index === Math.floor((node.index - 1) / 2))?.y ?? node.y,
      toX: node.x,
      toY: node.y,
      color: node.heap === 'max' ? colors.max : colors.min,
    }));
    edgeLayer.selectAll<SVGLineElement, typeof edges[number]>('line')
      .data(edges, datum => datum.id)
      .join('line')
      .attr('x1', datum => datum.fromX).attr('y1', datum => datum.fromY)
      .attr('x2', datum => datum.toX).attr('y2', datum => datum.toY)
      .attr('stroke', datum => datum.color).attr('stroke-width', 2).attr('opacity', 0.4);

    const nodeLayer = root.select<SVGGElement>('.layer-nodes');
    const groups = nodeLayer.selectAll<SVGGElement, HeapNodeData>('g.heap-node')
      .data(nodes, datum => datum.id)
      .join(
        enter => {
          const group = enter.append('g').attr('class', 'heap-node').attr('opacity', 0);
          group.append('circle');
          group.append('text').attr('class', 'value');
          group.append('text').attr('class', 'index');
          return group;
        },
        update => update,
        exit => exit.transition('exit').duration(140).attr('opacity', 0).remove(),
      );
    groups.interrupt('move').interrupt('exit')
      .transition('move').duration(window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 240)
      .attr('transform', datum => `translate(${datum.x}, ${datum.y})`).attr('opacity', 1);
    groups.select('circle').attr('r', nodeRadius)
      .attr('fill', datum => datum.status === 'current' ? colors.current : datum.heap === 'max' ? colors.max : colors.min)
      .attr('stroke', datum => datum.status === 'boundary' ? '#e9ad43' : '#ffffff')
      .attr('stroke-width', datum => datum.status === 'boundary' ? 5 : 2);
    groups.selectAll<SVGTextElement, HeapNodeData>('text.boundary-tag').remove();
    groups.filter(datum => datum.status === 'boundary').append('text').attr('class', 'boundary-tag')
      .attr('text-anchor', 'middle').attr('y', -nodeRadius - 10).attr('font-size', 10).attr('font-weight', 700)
      .attr('fill', '#8a5c08').text('中间边界');
    groups.select< SVGTextElement>('text.value').attr('text-anchor', 'middle').attr('dy', '0.35em')
      .attr('font-size', 17).attr('font-weight', 700)
      .attr('fill', datum => datum.status === 'current' ? colors.ink : '#ffffff')
      .text(datum => datum.value);
    groups.select<SVGTextElement>('text.index').attr('text-anchor', 'middle').attr('y', 42)
      .attr('font-size', 10).attr('fill', colors.muted).text(datum => `堆内位置 ${datum.index}`);

    const containers = root.select<SVGGElement>('.layer-containers');
    containers.selectAll('*').remove();
    const teaching = root.select<SVGGElement>('.layer-teaching');
    teaching.selectAll('*').remove();
    const lane = (x: number, title: string, subtitle: string, count: number, top: number | undefined, side: 'max' | 'min') => {
      containers.append('rect').attr('x', x - laneWidth / 2).attr('y', 32).attr('width', laneWidth).attr('height', Math.max(145, height - 90))
        .attr('rx', 16).attr('fill', side === 'max' ? '#edf6f2' : '#edf4f8').attr('stroke', side === 'max' ? '#c6e2d8' : '#c8dbe8');
      teaching.append('text').attr('x', x).attr('y', 62).attr('text-anchor', 'middle').attr('font-size', 18).attr('font-weight', 700)
        .attr('fill', side === 'max' ? colors.max : colors.min).text(title);
      teaching.append('text').attr('x', x).attr('y', 84).attr('text-anchor', 'middle').attr('font-size', 12).attr('fill', colors.muted).text(subtitle);
      teaching.append('text').attr('x', x).attr('y', 119).attr('text-anchor', 'middle').attr('font-size', 13).attr('fill', colors.ink)
        .text(top === undefined ? '堆顶：空' : `堆顶：${top} | ${count} 个数`);
      if (!count) teaching.append('text').attr('x', x).attr('y', height / 2).attr('text-anchor', 'middle').attr('font-size', 14).attr('fill', colors.muted).text('等待数据进入');
    };
    lane(maxCenter, '较小的一半', '大顶堆：顶部是这一半中最大的数', currentStep.maxHeap.length, currentStep.maxHeap[0], 'max');
    lane(minCenter, '较大的一半', '小顶堆：顶部是这一半中最小的数', currentStep.minHeap.length, currentStep.minHeap[0], 'min');

    const dividerY = 132;
    teaching.append('line').attr('x1', maxCenter + laneWidth / 2 + 8).attr('x2', minCenter - laneWidth / 2 - 8)
      .attr('y1', dividerY).attr('y2', dividerY).attr('stroke', colors.ink).attr('stroke-width', 2).attr('marker-end', 'url(#arrow)');
    teaching.append('text').attr('x', width / 2).attr('y', dividerY - 9).attr('text-anchor', 'middle').attr('font-size', 11)
      .attr('fill', colors.muted).text('从小到大');

    if (incoming !== undefined) {
      const goesLeft = currentStep.maxHeap.length === 0 || incoming <= currentStep.maxHeap[0];
      const targetX = goesLeft ? maxCenter : minCenter;
      teaching.append('rect').attr('x', width / 2 - 88).attr('y', 151).attr('width', 176).attr('height', 40).attr('rx', 20)
        .attr('fill', '#fff0c8').attr('stroke', '#e9ad43').attr('stroke-width', 2);
      teaching.append('text').attr('x', width / 2).attr('y', 176).attr('text-anchor', 'middle').attr('font-size', 15).attr('font-weight', 700)
        .attr('fill', colors.ink).text(`新数字 ${incoming}`);
      teaching.append('line').attr('x1', width / 2 + (targetX < width / 2 ? -92 : 92)).attr('x2', targetX)
        .attr('y1', 171).attr('y2', 171).attr('stroke', '#e9ad43').attr('stroke-width', 3).attr('marker-end', 'url(#arrow)');
      teaching.append('text').attr('x', width / 2).attr('y', 210).attr('text-anchor', 'middle').attr('font-size', 11)
        .attr('fill', colors.muted).text(currentStep.maxHeap.length ? `和左边最大值 ${currentStep.maxHeap[0]} 比较` : '左边还没有数字，先放入左边');
    }

    const explanation = currentStep.description;
    const operationText: Record<AlgorithmStep['action'], string> = {
      init: '建立两半', add: '放入新数', balance: '移动边界数', findMedian: '读取中位数', complete: '完成',
    };
    teaching.append('rect').attr('x', 18).attr('y', height - 62).attr('width', width - 36).attr('height', 46).attr('rx', 10)
      .attr('fill', '#fff8e8').attr('stroke', '#f0d799');
    teaching.append('text').attr('x', 32).attr('y', height - 34).attr('font-size', 12).attr('font-weight', 700)
      .attr('fill', '#8a5c08').text(operationText[currentStep.action]);
    teaching.append('text').attr('x', 120).attr('y', height - 34).attr('font-size', 12).attr('font-weight', 600)
      .attr('fill', colors.ink).text(explanation.length > 110 ? `${explanation.slice(0, 107)}…` : explanation);
    teaching.append('text').attr('x', width / 2).attr('y', height - 12).attr('text-anchor', 'middle').attr('font-size', 10)
      .attr('fill', colors.muted).text('始终保持：左边所有数 ≤ 右边所有数；两边数量最多相差 1');

    if (currentStep.median !== undefined && currentStep.median !== null) {
      const label = currentStep.maxHeap.length === currentStep.minHeap.length
        ? `中位数 = (${currentStep.maxHeap[0]} + ${currentStep.minHeap[0]}) ÷ 2 = ${currentStep.median}`
        : `中位数 = 左堆顶 ${currentStep.median}`;
      teaching.append('rect').attr('x', width / 2 - 150).attr('y', height - 104).attr('width', 300).attr('height', 34).attr('rx', 17)
        .attr('fill', '#fff1cf').attr('stroke', '#e9ad43');
      teaching.append('text').attr('x', width / 2).attr('y', height - 82).attr('text-anchor', 'middle').attr('font-size', 14).attr('font-weight', 700)
        .attr('fill', colors.ink).text(label);
    }

    if (svg.select('defs').empty()) {
      svg.append('defs').append('marker').attr('id', 'arrow').attr('viewBox', '0 0 10 10')
        .attr('refX', 9).attr('refY', 5).attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto-start-reverse')
        .append('path').attr('d', 'M 0 0 L 10 5 L 0 10 z').attr('fill', colors.ink);
    }

    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.7, 2.5])
      .on('zoom', event => root.attr('transform', event.transform.toString()));
    svg.call(zoom);
  }, [currentStep, dimensions]);

  return (
    <div ref={containerRef} className={styles.container}>
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className={styles.svg} />
      <div className={styles.hint}>绿色：较小的一半 | 蓝色：较大的一半 | 拖拽平移，滚轮缩放</div>
    </div>
  );
};
