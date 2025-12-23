import { useState } from 'react';
import styles from './WeChatFloat.module.css';
import wechatQR from '../assets/images/wechat-qr.png';

export const WeChatFloat: React.FC = () => {
  const [showQR, setShowQR] = useState(false);

  return (
    <div className={styles.container}>
      <button
        className={styles.floatBtn}
        onMouseEnter={() => setShowQR(true)}
        onMouseLeave={() => setShowQR(false)}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M8.5 11.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm-6.5 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
          <path d="M12 2C6.48 2 2 5.58 2 10c0 2.03.94 3.89 2.5 5.29V20l3.5-2c1.24.46 2.58.71 4 .71 5.52 0 10-3.58 10-8S17.52 2 12 2zm0 14c-1.13 0-2.2-.18-3.18-.5L6 17v-2.35C4.14 13.44 3 11.82 3 10c0-3.31 4.03-6 9-6s9 2.69 9 6-4.03 6-9 6z"/>
        </svg>
        <span>交流群</span>
      </button>
      
      {showQR && (
        <div className={styles.qrPopup}>
          <img src={wechatQR} alt="微信二维码" className={styles.qrImage} />
          <p className={styles.qrHint}>
            微信扫码发送 <strong>"leetcode"</strong><br />
            加入算法交流群
          </p>
        </div>
      )}
    </div>
  );
};
