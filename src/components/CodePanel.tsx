import { useState, useEffect, useCallback } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import type { ProgrammingLanguage, AlgorithmStep } from '../types';
import { codeSnippets } from '../algorithms/codeSnippets';
import { getSetting, saveSetting } from '../utils/indexedDB';
import styles from './CodePanel.module.css';

interface CodePanelProps {
  currentStep: AlgorithmStep | null;
}

const languageLabels: Record<ProgrammingLanguage, string> = {
  java: 'Java',
  python: 'Python',
  golang: 'Go',
  javascript: 'JavaScript',
};

export const CodePanel: React.FC<CodePanelProps> = ({ currentStep }) => {
  const [language, setLanguage] = useState<ProgrammingLanguage>('java');

  useEffect(() => {
    getSetting<string>('codeLanguage', 'java').then(lang => {
      setLanguage(lang as ProgrammingLanguage);
    });
  }, []);

  const handleLanguageChange = useCallback((lang: ProgrammingLanguage) => {
    setLanguage(lang);
    saveSetting('codeLanguage', lang);
  }, []);

  const highlightedLines = currentStep?.codeLines[language] || [];
  const code = codeSnippets[language];
  const variables = currentStep?.variables || {};

  // 获取变量显示信息
  const getVariableDisplay = (lineNum: number): string | null => {
    if (!currentStep) return null;
    
    // 根据当前步骤和行号显示变量值
    const varDisplayMap: Record<number, string[]> = {
      // Java 行号映射
      6: ['num'],
      7: ['maxHeap.top', 'maxHeap.size'],
      8: ['maxHeap.size', 'minHeap.size'],
      13: ['num'],
      14: ['minHeap.size', 'maxHeap.size'],
      21: ['maxHeap.top'],
      23: ['maxHeap.top', 'minHeap.top', 'median'],
    };

    const varsToShow = varDisplayMap[lineNum];
    if (!varsToShow) return null;

    const displays = varsToShow
      .filter(v => variables[v] !== undefined)
      .map(v => `${v}=${variables[v]}`);
    
    return displays.length > 0 ? displays.join(', ') : null;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>代码</span>
        <div className={styles.languageTabs}>
          {(Object.keys(languageLabels) as ProgrammingLanguage[]).map(lang => (
            <button
              key={lang}
              className={`${styles.tab} ${language === lang ? styles.active : ''}`}
              onClick={() => handleLanguageChange(lang)}
            >
              {languageLabels[lang]}
            </button>
          ))}
        </div>
      </div>
      
      <div className={styles.codeWrapper}>
        <Highlight
          theme={themes.github}
          code={code}
          language={language === 'golang' ? 'go' : language}
        >
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre className={`${className} ${styles.pre}`} style={style}>
              {tokens.map((line, i) => {
                const lineNum = i + 1;
                const isHighlighted = highlightedLines.includes(lineNum);
                const varDisplay = getVariableDisplay(lineNum);
                
                return (
                  <div
                    key={i}
                    {...getLineProps({ line })}
                    className={`${styles.line} ${isHighlighted ? styles.highlighted : ''}`}
                  >
                    <span className={styles.lineNumber}>{lineNum}</span>
                    <span className={styles.lineContent}>
                      {line.map((token, key) => (
                        <span key={key} {...getTokenProps({ token })} />
                      ))}
                    </span>
                    {isHighlighted && varDisplay && (
                      <span className={styles.varDisplay}>// {varDisplay}</span>
                    )}
                  </div>
                );
              })}
            </pre>
          )}
        </Highlight>
      </div>
    </div>
  );
};
