import { useState, useEffect, useCallback } from 'react';
import { getSetting, saveSetting } from '../utils/indexedDB';
import styles from './ControlPanel.module.css';

interface ControlPanelProps {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPlayPause: () => void;
  onReset: () => void;
  onSeek: (step: number) => void;
  onSpeedChange: (speed: number) => void;
}

const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];

export const ControlPanel: React.FC<ControlPanelProps> = ({
  currentStep,
  totalSteps,
  isPlaying,
  onPrev,
  onNext,
  onPlayPause,
  onReset,
  onSeek,
  onSpeedChange,
}) => {
  const [speed, setSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  useEffect(() => {
    getSetting<number>('playbackSpeed', 1).then(s => {
      setSpeed(s);
      onSpeedChange(s);
    });
  }, [onSpeedChange]);

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
    saveSetting('playbackSpeed', newSpeed);
    onSpeedChange(newSpeed);
    setShowSpeedMenu(false);
  }, [onSpeedChange]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          onPrev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onNext();
          break;
        case ' ':
          e.preventDefault();
          onPlayPause();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          onReset();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPrev, onNext, onPlayPause, onReset]);

  const progress = totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 0;

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const step = Math.round(percentage * (totalSteps - 1));
    onSeek(Math.max(0, Math.min(totalSteps - 1, step)));
  }, [totalSteps, onSeek]);

  const handleProgressDrag = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    handleProgressClick(e);
  }, [handleProgressClick]);

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <button 
          className={styles.btn} 
          onClick={onPrev}
          disabled={currentStep === 0}
          title="上一步 (←)"
        >
          ⏮ 上一步 <span className={styles.shortcut}>←</span>
        </button>
        
        <button 
          className={`${styles.btn} ${styles.playBtn}`}
          onClick={onPlayPause}
          title="播放/暂停 (空格)"
        >
          {isPlaying ? '⏸ 暂停' : '▶ 播放'} <span className={styles.shortcut}>Space</span>
        </button>
        
        <button 
          className={styles.btn}
          onClick={onNext}
          disabled={currentStep >= totalSteps - 1}
          title="下一步 (→)"
        >
          下一步 ⏭ <span className={styles.shortcut}>→</span>
        </button>
        
        <button 
          className={styles.btn}
          onClick={onReset}
          title="重置 (R)"
        >
          ↺ 重置 <span className={styles.shortcut}>R</span>
        </button>
        
        <div className={styles.speedControl}>
          <button 
            className={styles.speedBtn}
            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
          >
            {speed}x 速度 ▾
          </button>
          {showSpeedMenu && (
            <div className={styles.speedMenu}>
              {speedOptions.map(s => (
                <button
                  key={s}
                  className={`${styles.speedOption} ${speed === s ? styles.active : ''}`}
                  onClick={() => handleSpeedChange(s)}
                >
                  {s}x
                </button>
              ))}
            </div>
          )}
        </div>
        
        <span className={styles.stepInfo}>
          步骤 {currentStep + 1} / {totalSteps}
        </span>
      </div>
      
      <div 
        className={styles.progressBar}
        onClick={handleProgressClick}
        onMouseMove={handleProgressDrag}
      >
        <div 
          className={styles.progressFill}
          style={{ width: `${progress}%` }}
        />
        <div 
          className={styles.progressHandle}
          style={{ left: `${progress}%` }}
        />
      </div>
    </div>
  );
};
