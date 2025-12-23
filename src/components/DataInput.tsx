import { useState, useCallback } from 'react';
import { dataExamples, generateRandomData, validateInput } from '../algorithms/medianFinder';
import styles from './DataInput.module.css';

interface DataInputProps {
  onDataChange: (operations: string[], values: (number | null)[][]) => void;
}

export const DataInput: React.FC<DataInputProps> = ({ onDataChange }) => {
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const parseInput = useCallback((text: string): { operations: string[]; values: (number | null)[][] } | null => {
    try {
      // 尝试解析 JSON 格式
      const lines = text.trim().split('\n').filter(l => l.trim());
      if (lines.length >= 2) {
        const operations = JSON.parse(lines[0]);
        const values = JSON.parse(lines[1]);
        return { operations, values };
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const handleApply = useCallback(() => {
    const parsed = parseInput(inputText);
    if (!parsed) {
      setError('输入格式错误，请参考示例格式');
      return;
    }
    
    const validationError = validateInput(parsed.operations, parsed.values);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setError(null);
    onDataChange(parsed.operations, parsed.values);
  }, [inputText, parseInput, onDataChange]);

  const handleExampleClick = useCallback((example: typeof dataExamples[0]) => {
    const text = `${JSON.stringify(example.operations)}\n${JSON.stringify(example.values)}`;
    setInputText(text);
    setError(null);
    onDataChange(example.operations, example.values);
  }, [onDataChange]);

  const handleRandomClick = useCallback(() => {
    const { operations, values } = generateRandomData();
    const text = `${JSON.stringify(operations)}\n${JSON.stringify(values)}`;
    setInputText(text);
    setError(null);
    onDataChange(operations, values);
  }, [onDataChange]);

  return (
    <div className={styles.container}>
      <div className={styles.inputSection}>
        <label className={styles.label}>输入数据：</label>
        <textarea
          className={styles.textarea}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder={`["MedianFinder", "addNum", "addNum", "findMedian", "addNum", "findMedian"]\n[[], [1], [2], [], [3], []]`}
          rows={2}
        />
        <button className={styles.applyBtn} onClick={handleApply}>
          应用
        </button>
      </div>
      
      {error && <div className={styles.error}>{error}</div>}
      
      <div className={styles.examples}>
        <span className={styles.exampleLabel}>示例：</span>
        {dataExamples.map((example, i) => (
          <button
            key={i}
            className={styles.exampleBtn}
            onClick={() => handleExampleClick(example)}
          >
            {example.name}
          </button>
        ))}
        <button className={styles.randomBtn} onClick={handleRandomClick}>
          🎲 随机生成
        </button>
      </div>
    </div>
  );
};
