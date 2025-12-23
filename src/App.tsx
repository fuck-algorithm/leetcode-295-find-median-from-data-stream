import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Header } from './components/Header';
import { DataInput } from './components/DataInput';
import { CodePanel } from './components/CodePanel';
import { Canvas } from './components/Canvas';
import { ControlPanel } from './components/ControlPanel';
import { WeChatFloat } from './components/WeChatFloat';
import { generateSteps, dataExamples } from './algorithms/medianFinder';
import type { AlgorithmStep } from './types';
import './styles/global.css';
import styles from './App.module.css';

// 初始化默认步骤
const getInitialSteps = () => {
  const defaultExample = dataExamples[0];
  return generateSteps(defaultExample.operations, defaultExample.values);
};

function App() {
  const initialSteps = useMemo(() => getInitialSteps(), []);
  const [steps, setSteps] = useState<AlgorithmStep[]>(initialSteps);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const playIntervalRef = useRef<number | null>(null);

  // 处理数据变化
  const handleDataChange = useCallback((operations: string[], values: (number | null)[][]) => {
    const newSteps = generateSteps(operations, values);
    setSteps(newSteps);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, []);

  // 播放控制
  useEffect(() => {
    if (isPlaying && steps.length > 0) {
      playIntervalRef.current = window.setInterval(() => {
        setCurrentStepIndex(prev => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1500 / playbackSpeed);
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, steps.length, playbackSpeed]);

  const handlePrev = useCallback(() => {
    setCurrentStepIndex(prev => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentStepIndex(prev => Math.min(steps.length - 1, prev + 1));
  }, [steps.length]);

  const handlePlayPause = useCallback(() => {
    if (currentStepIndex >= steps.length - 1) {
      setCurrentStepIndex(0);
    }
    setIsPlaying(prev => !prev);
  }, [currentStepIndex, steps.length]);

  const handleReset = useCallback(() => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, []);

  const handleSeek = useCallback((step: number) => {
    setCurrentStepIndex(step);
  }, []);

  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
  }, []);

  const currentStep = steps[currentStepIndex] || null;

  return (
    <div className={styles.app}>
      <Header />
      <DataInput onDataChange={handleDataChange} />
      
      <div className={styles.mainContent}>
        <div className={styles.codeSection}>
          <CodePanel currentStep={currentStep} />
        </div>
        
        <div className={styles.canvasSection}>
          <Canvas currentStep={currentStep} />
        </div>
      </div>
      
      <ControlPanel
        currentStep={currentStepIndex}
        totalSteps={steps.length}
        isPlaying={isPlaying}
        onPrev={handlePrev}
        onNext={handleNext}
        onPlayPause={handlePlayPause}
        onReset={handleReset}
        onSeek={handleSeek}
        onSpeedChange={handleSpeedChange}
      />
      
      <WeChatFloat />
    </div>
  );
}

export default App;
