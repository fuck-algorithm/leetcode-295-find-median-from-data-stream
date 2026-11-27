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

interface SortedValueData {
  id: string;
  value: number;
  index: number;
  x: number;
  y: number;
  isMedian: boolean;
  isIncoming: boolean;
}

const nodeRadius = 25;
const levelGap = 68;
const colors = {
  max: '#19866a',
  min: '#3478a8',
  current: '#e9ad43',
  ink: '#182b37',
  muted: '#667985',
};

function layoutHeap(heap: number[], side: 'max' | 'min', center: number, ids: string[]): HeapNodeData[] {
  if (!heap.length) return [];
  const levels = Math.ceil(Math.log2(heap.length + 1));
  return heap.map((value, index) => {
    const level = Math.floor(Math.log2(index + 1));
    const position = index - (2 ** level - 1);
    const width = Math.min(360, 2 ** (levels - 1) * 76);
    const pitch = width / 2 ** level;
    return {
      id: ids[index], heap: side, value, index,
      x: center + pitch * (position + 0.5) - width / 2,
      y: 308 + level * levelGap,
      status: 'idle',
    };
  });
}

function stableIds(side: 'max' | 'min', values: number[], previous: Map<string, string>): { ids: string[]; next: Map<string, string> } {
  const counts = new Map<number, number>();
  const next = new Map(previous);
  const ids = values.map(value => {
    const occurrence = counts.get(value) ?? 0;
    counts.set(value, occurrence + 1);
    const key = `${side}:${value}:${occurrence}`;
    const id = previous.get(key) ?? `${side}-${value}-${occurrence}`;
    next.set(key, id);
    return id;
  });
  return { ids, next };
}

export const Canvas: React.FC<CanvasProps> = ({ currentStep }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeIdsRef = useRef(new Map<string, string>());
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
      root.append('g').attr('class', 'layer-arrows');
      root.append('g').attr('class', 'layer-nodes');
      root.append('g').attr('class', 'layer-labels');
      root.append('g').attr('class', 'layer-teaching');
    }

    const laneWidth = width * 0.43;
    const maxCenter = width * 0.27;
    const minCenter = width * 0.73;
    const ordered = currentStep.sortedValues ?? [...currentStep.maxHeap, ...currentStep.minHeap].sort((a, b) => a - b);
    const maxStable = stableIds('max', currentStep.maxHeap, nodeIdsRef.current);
    const minStable = stableIds('min', currentStep.minHeap, maxStable.next);
    nodeIdsRef.current = minStable.next;
    const maxNodes = layoutHeap(currentStep.maxHeap, 'max', maxCenter, maxStable.ids);
    const minNodes = layoutHeap(currentStep.minHeap, 'min', minCenter, minStable.ids);
    const incoming = currentStep.currentNum ?? (currentStep.action === 'add' || currentStep.action === 'insert' || currentStep.action === 'remove' ? currentStep.narratedValue : undefined);
    const moved = currentStep.action === 'balance' ? currentStep.narratedValue : currentStep.action === 'swap' ? currentStep.narratedValue : undefined;
    const nodes = [...maxNodes, ...minNodes];
    const transitionMs = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 240;

    if (currentStep.focusHeap && currentStep.focusIndices) {
      nodes.forEach(node => {
        if (node.heap === currentStep.focusHeap && currentStep.focusIndices?.includes(node.index)) node.status = 'current';
        if (node.heap === currentStep.focusHeap && currentStep.compareIndices?.includes(node.index)) node.status = 'boundary';
      });
    }
    if (incoming !== undefined) {
      const targetHeap = currentStep.targetHeap ?? (currentStep.maxHeap.length === 0 || incoming <= currentStep.maxHeap[0] ? 'max' : 'min');
      const target = nodes.find(node => node.value === incoming && node.heap === targetHeap);
      if (target) target.status = 'current';
    }
    if (moved !== undefined) {
      const target = nodes.find(node => node.value === moved && node.heap === currentStep.targetHeap)
        ?? nodes.find(node => node.value === moved && node.heap === currentStep.sourceHeap);
      if (target) target.status = 'current';
    }
    if (currentStep.median !== undefined && currentStep.median !== null) {
      nodes.forEach(node => {
        if (node.index === 0 && (node.heap === 'max' || currentStep.maxHeap.length === currentStep.minHeap.length)) node.status = 'boundary';
      });
    }

    const containers = root.select<SVGGElement>('.layer-containers');
    const lanes = [
      { id: 'max-lane', x: maxCenter, fill: '#edf6f2', stroke: '#c6e2d8' },
      { id: 'min-lane', x: minCenter, fill: '#edf4f8', stroke: '#c8dbe8' },
    ];
    containers.selectAll<SVGRectElement, typeof lanes[number]>('rect.heap-lane')
      .data(lanes, datum => datum.id)
      .join('rect').attr('class', 'heap-lane')
      .attr('x', datum => datum.x - laneWidth / 2).attr('y', 32).attr('width', laneWidth)
      .attr('height', Math.max(145, height - 112)).attr('rx', 16)
      .attr('fill', datum => datum.fill).attr('stroke', datum => datum.stroke);

    const edgeLayer = root.select<SVGGElement>('.layer-edges');
    const edges = nodes.filter(node => node.index > 0).map(node => {
      const parent = nodes.find(candidate => candidate.heap === node.heap && candidate.index === Math.floor((node.index - 1) / 2));
      return { id: `${node.heap}-edge-${node.id}`, fromX: parent?.x ?? node.x, fromY: parent?.y ?? node.y, toX: node.x, toY: node.y, color: node.heap === 'max' ? colors.max : colors.min };
    });
    edgeLayer.selectAll<SVGLineElement, typeof edges[number]>('line')
      .data(edges, datum => datum.id).join('line')
      .attr('x1', datum => datum.fromX).attr('y1', datum => datum.fromY)
      .attr('x2', datum => datum.toX).attr('y2', datum => datum.toY)
      .attr('stroke', datum => datum.color).attr('stroke-width', 2).attr('opacity', 0.42);

    const nodeLayer = root.select<SVGGElement>('.layer-nodes');
    const groups = nodeLayer.selectAll<SVGGElement, HeapNodeData>('g.heap-node')
      .data(nodes, datum => datum.id)
      .join(
        enter => {
          const group = enter.append('g').attr('class', 'heap-node').attr('opacity', 0);
          group.append('circle');
          group.append('text').attr('class', 'value');
          group.append('text').attr('class', 'index');
          group.append('title');
          return group;
        },
        update => update,
        exit => exit.transition('exit').duration(140).attr('opacity', 0).remove(),
      );
    groups.interrupt('move').interrupt('exit')
      .transition('move').duration(transitionMs)
      .attr('transform', datum => `translate(${datum.x}, ${datum.y})`).attr('opacity', 1);
    if (currentStep.action !== 'swap') root.select('.layer-arrows').selectAll('*').remove();
    if (currentStep.action === 'swap' && currentStep.focusHeap && currentStep.compareIndices?.length === 2) {
      const [childIndex, parentIndex] = currentStep.compareIndices;
      const child = nodes.find(node => node.heap === currentStep.focusHeap && node.index === childIndex);
      const parent = nodes.find(node => node.heap === currentStep.focusHeap && node.index === parentIndex);
      if (child && parent) {
        const arrowLayer = root.select<SVGGElement>('.layer-arrows');
        const swaps = [{ id: 'heap-swap', from: child, to: parent }];
        arrowLayer.selectAll<SVGLineElement, typeof swaps[number]>('line.heap-swap')
          .data(swaps, datum => datum.id)
          .join('line').attr('class', 'heap-swap')
          .attr('x1', datum => datum.from.x).attr('y1', datum => datum.from.y)
          .attr('x2', datum => datum.from.x).attr('y2', datum => datum.from.y)
          .attr('stroke', colors.current).attr('stroke-width', 3).attr('marker-end', 'url(#arrow)')
          .transition('swap').duration(transitionMs)
          .attr('x2', datum => datum.to.x).attr('y2', datum => datum.to.y);
      }
    }
    groups.select('circle').attr('r', nodeRadius)
      .attr('fill', datum => datum.status === 'current' ? colors.current : datum.heap === 'max' ? colors.max : colors.min)
      .attr('stroke', datum => datum.status === 'boundary' ? '#e9ad43' : '#ffffff')
      .attr('stroke-width', datum => datum.status === 'boundary' ? 5 : 2);
    groups.select<SVGTextElement>('text.value').attr('text-anchor', 'middle').attr('dy', '0.35em')
      .attr('font-size', 17).attr('font-weight', 700)
      .attr('fill', datum => datum.status === 'current' ? colors.ink : '#ffffff').text(datum => datum.value);
    groups.select<SVGTextElement>('text.index').attr('text-anchor', 'middle').attr('y', 42)
      .attr('font-size', 10).attr('fill', colors.muted).text(datum => `堆内位置 ${datum.index}`);
    groups.select('title').text(datum => `${datum.heap === 'max' ? '较小的一半' : '较大的一半'}：${datum.value}，堆内位置 ${datum.index}${datum.index === 0 ? '，堆顶' : ''}`);

    const teaching = root.select<SVGGElement>('.layer-teaching');
    const texts = [
      { id: 'left-title', x: maxCenter, y: 62, size: 18, weight: 700, fill: colors.max, text: '较小的一半' },
      { id: 'left-subtitle', x: maxCenter, y: 84, size: 12, weight: 400, fill: colors.muted, text: '大顶堆：堆顶是左边最大值' },
      { id: 'left-count', x: maxCenter, y: 112, size: 13, weight: 500, fill: colors.ink, text: currentStep.maxHeap.length ? `堆顶 ${currentStep.maxHeap[0]} | ${currentStep.maxHeap.length} 个数` : '还没有数字' },
      { id: 'right-title', x: minCenter, y: 62, size: 18, weight: 700, fill: colors.min, text: '较大的一半' },
      { id: 'right-subtitle', x: minCenter, y: 84, size: 12, weight: 400, fill: colors.muted, text: '小顶堆：堆顶是右边最小值' },
      { id: 'right-count', x: minCenter, y: 112, size: 13, weight: 500, fill: colors.ink, text: currentStep.minHeap.length ? `堆顶 ${currentStep.minHeap[0]} | ${currentStep.minHeap.length} 个数` : '还没有数字' },
    ];
    teaching.selectAll<SVGTextElement, typeof texts[number]>('text.heap-heading')
      .data(texts, datum => datum.id).join('text').attr('class', 'heap-heading')
      .attr('x', datum => datum.x).attr('y', datum => datum.y).attr('text-anchor', 'middle')
      .attr('font-size', datum => datum.size).attr('font-weight', datum => datum.weight)
      .attr('fill', datum => datum.fill).text(datum => datum.text);

    const listLabelY = 146;
    teaching.selectAll<SVGTextElement, { id: string; x: number; y: number; text: string }>('text.sorted-label')
      .data([{ id: 'sorted-label', x: width / 2, y: listLabelY, text: '先看整体顺序：左边所有数 ≤ 右边所有数' }], datum => datum.id)
      .join('text').attr('class', 'sorted-label').attr('x', datum => datum.x).attr('y', datum => datum.y)
      .attr('text-anchor', 'middle').attr('font-size', 11).attr('font-weight', 600).attr('fill', colors.ink).text(datum => datum.text);

    const visibleValues = [...ordered];
    if (currentStep.action === 'compare' && incoming !== undefined && !visibleValues.includes(incoming)) visibleValues.push(incoming);
    visibleValues.sort((a, b) => a - b);
    const railWidth = Math.min(width - 48, 560);
    const gap = 6;
    const pillWidth = Math.min(42, Math.max(24, (railWidth - gap * Math.max(0, visibleValues.length - 1)) / Math.max(1, visibleValues.length)));
    const totalWidth = visibleValues.length * pillWidth + Math.max(0, visibleValues.length - 1) * gap;
    const middleLeft = Math.floor((visibleValues.length - 1) / 2);
    const middleRight = Math.floor(visibleValues.length / 2);
    const isQuery = currentStep.action === 'findMedian' && currentStep.median !== undefined && currentStep.median !== null;
    const rail: SortedValueData[] = visibleValues.map((value, index) => ({
      id: `${value}:${visibleValues.slice(0, index).filter(item => item === value).length}`,
      value, index, x: width / 2 - totalWidth / 2 + index * (pillWidth + gap) + pillWidth / 2,
      y: 176, isMedian: isQuery && (index === middleLeft || index === middleRight), isIncoming: value === incoming,
    }));
    const sortedLayer = root.select<SVGGElement>('.layer-labels');
    const pills = sortedLayer.selectAll<SVGGElement, SortedValueData>('g.sorted-value')
      .data(rail, datum => datum.id)
      .join(enter => {
        const group = enter.append('g').attr('class', 'sorted-value');
        group.append('rect'); group.append('text'); group.append('title'); return group;
      }, update => update, exit => exit.transition('exit').duration(100).attr('opacity', 0).remove());
    pills.interrupt('move').transition('move').duration(window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 220)
      .attr('transform', datum => `translate(${datum.x},${datum.y})`).attr('opacity', 1);
    pills.select('rect').attr('x', -pillWidth / 2).attr('y', -13).attr('width', pillWidth).attr('height', 26).attr('rx', 8)
      .attr('fill', datum => datum.isIncoming ? '#fff0c8' : datum.index < Math.ceil(visibleValues.length / 2) ? '#dff0e9' : '#e2eef5')
      .attr('stroke', datum => datum.isMedian ? '#d79520' : datum.isIncoming ? '#d79520' : '#ffffff')
      .attr('stroke-width', datum => datum.isMedian || datum.isIncoming ? 2 : 1);
    pills.select('text').attr('text-anchor', 'middle').attr('dy', '0.35em').attr('font-size', 12).attr('font-weight', 700)
      .attr('fill', colors.ink).text(datum => datum.value);
    const valueVerb = currentStep.action === 'remove' ? '正在移除' : '正在插入';
    pills.select('title').text(datum => `${datum.value}${datum.isMedian ? '，中间位置' : ''}${datum.isIncoming ? `，${valueVerb}` : ''}`);

    const railSplit = visibleValues.length % 2 ? Math.ceil(visibleValues.length / 2) : visibleValues.length / 2;
    const splitX = railSplit < rail.length ? (rail[railSplit - 1].x + rail[railSplit].x) / 2 : width / 2;
    teaching.selectAll<SVGLineElement, { id: string; x: number }>('line.sorted-divider')
      .data(visibleValues.length > 1 ? [{ id: 'sorted-divider', x: splitX }] : [], datum => datum.id)
      .join('line').attr('class', 'sorted-divider').attr('x1', datum => datum.x).attr('x2', datum => datum.x)
      .attr('y1', 156).attr('y2', 196).attr('stroke', '#526873').attr('stroke-width', 1.5);

    const hint = currentStep.action === 'balance' && currentStep.narratedValue !== undefined
      ? `把 ${currentStep.narratedValue} 从${currentStep.sourceHeap === 'max' ? '左边' : '右边'}移到${currentStep.targetHeap === 'max' ? '左边' : '右边'}，让两边数量接近。`
      : currentStep.action === 'remove'
        ? currentStep.description
        : currentStep.action === 'compare' && currentStep.currentNum !== undefined
          ? currentStep.description
          : currentStep.action === 'swap'
        ? (currentStep.compareIndices?.[0] === currentStep.focusIndices?.[0] ? currentStep.description : `比较堆中位置 ${currentStep.compareIndices?.join(' 和 ')}，交换后父节点继续保持堆顶规则。`)
        : currentStep.action === 'insert' || (currentStep.action === 'compare' && currentStep.currentNum === undefined)
          ? currentStep.description
          : incoming !== undefined
            ? (currentStep.maxHeap.length ? `${incoming} ${incoming <= currentStep.maxHeap[0] ? '≤' : '>'} 左边最大值 ${currentStep.maxHeap[0]}，放到${incoming <= currentStep.maxHeap[0] ? '左' : '右'}边。` : `左边还没有数，先把 ${incoming} 放到左边。`)
            : currentStep.description;
    const explanationY = height - 58;
    const cards = [{ id: 'explanation', y: explanationY, height: 40, fill: '#fff8e8', stroke: '#f0d799' }];
    teaching.selectAll<SVGRectElement, typeof cards[number]>('rect.teaching-card')
      .data(cards, datum => datum.id).join('rect').attr('class', 'teaching-card')
      .attr('x', 18).attr('y', datum => datum.y).attr('width', width - 36).attr('height', datum => datum.height)
      .attr('rx', 10).attr('fill', datum => datum.fill).attr('stroke', datum => datum.stroke);
    const operationText: Record<AlgorithmStep['action'], string> = {
      init: '先分成两半', add: currentStep.title ?? '放入新数字', insert: currentStep.title ?? '放入堆底', remove: currentStep.title ?? '移出堆顶', compare: currentStep.action === 'compare' && currentStep.title ? currentStep.title : currentStep.currentNum === undefined ? '判断中间位置' : '比较边界值', swap: currentStep.title ?? '交换以恢复堆序', balance: currentStep.title ?? '移动边界数', findMedian: currentStep.title ?? '读取中位数', complete: '完成',
    };
    const narration = [
      { id: 'action', x: 32, y: explanationY + 24, text: operationText[currentStep.action], fill: '#8a5c08', weight: 700 },
      { id: 'why', x: 130, y: explanationY + 24, text: hint.length > 100 ? `${hint.slice(0, 97)}…` : hint, fill: colors.ink, weight: 600 },
    ];
    teaching.selectAll<SVGTextElement, typeof narration[number]>('text.narration')
      .data(narration, datum => datum.id).join('text').attr('class', 'narration')
      .attr('x', datum => datum.x).attr('y', datum => datum.y).attr('font-size', 12)
      .attr('font-weight', datum => datum.weight).attr('fill', datum => datum.fill).text(datum => datum.text);
    teaching.selectAll<SVGTextElement, { id: string; x: number; y: number; text: string }>('text.rule')
      .data([{ id: 'rule', x: width / 2, y: height - 12, text: '一直记住：左边不大于右边 | 两边数量最多差 1 个' }], datum => datum.id)
      .join('text').attr('class', 'rule').attr('x', datum => datum.x).attr('y', datum => datum.y)
      .attr('text-anchor', 'middle').attr('font-size', 10).attr('fill', colors.muted).text(datum => datum.text);

    const medianLabel = currentStep.action !== 'findMedian' || currentStep.median === undefined || currentStep.median === null ? [] : [{
      id: 'median',
      text: currentStep.maxHeap.length === currentStep.minHeap.length
        ? `中位数 = (${currentStep.maxHeap[0]} + ${currentStep.minHeap[0]}) ÷ 2 = ${currentStep.median}`
        : `中位数 = 左边堆顶 ${currentStep.median}`,
    }];
    const median = teaching.selectAll<SVGTextElement, typeof medianLabel[number]>('text.median-result')
      .data(medianLabel, datum => datum.id)
      .join(enter => {
        const group = enter.append('g');
        group.append('rect'); group.append('text'); return group;
      });
    median.select('rect').attr('x', width / 2 - 150).attr('y', height - 108).attr('width', 300).attr('height', 32).attr('rx', 16)
      .attr('fill', '#fff1cf').attr('stroke', '#e9ad43');
    median.select('text').attr('x', width / 2).attr('y', height - 87).attr('text-anchor', 'middle').attr('font-size', 13)
      .attr('font-weight', 700).attr('fill', colors.ink).text(datum => datum.text);

    if (svg.select('defs').empty()) {
      svg.append('defs').append('marker').attr('id', 'arrow').attr('viewBox', '0 0 10 10')
        .attr('refX', 9).attr('refY', 5).attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
        .append('path').attr('d', 'M 0 0 L 10 5 L 0 10 z').attr('fill', colors.ink);
    }
    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.7, 2.5])
      .on('zoom', event => root.attr('transform', event.transform.toString()));
    svg.call(zoom);
  }, [currentStep, dimensions]);

  return (
    <div ref={containerRef} className={styles.container}>
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className={styles.svg} />
      <div className={styles.hint}>绿：较小的一半 | 蓝：较大的一半 | 上方数字行展示整体顺序</div>
    </div>
  );
};
