import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

interface AlgorithmVisualizerDB extends DBSchema {
  settings: {
    key: string;
    value: {
      key: string;
      value: string | number;
      updatedAt: number;
    };
  };
  cache: {
    key: string;
    value: {
      key: string;
      data: unknown;
      expireAt: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<AlgorithmVisualizerDB>> | null = null;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<AlgorithmVisualizerDB>('algorithm-visualizer', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
};

// 保存设置
export const saveSetting = async (key: string, value: string | number): Promise<void> => {
  const db = await getDB();
  await db.put('settings', {
    key,
    value,
    updatedAt: Date.now(),
  });
};

// 获取设置
export const getSetting = async <T extends string | number>(key: string, defaultValue: T): Promise<T> => {
  try {
    const db = await getDB();
    const result = await db.get('settings', key);
    return (result?.value as T) ?? defaultValue;
  } catch {
    return defaultValue;
  }
};

// 保存缓存（带过期时间）
export const saveCache = async (key: string, data: unknown, ttlMs: number): Promise<void> => {
  const db = await getDB();
  await db.put('cache', {
    key,
    data,
    expireAt: Date.now() + ttlMs,
  });
};

// 获取缓存
export const getCache = async <T>(key: string): Promise<T | null> => {
  try {
    const db = await getDB();
    const result = await db.get('cache', key);
    if (!result) return null;
    if (Date.now() > result.expireAt) {
      // 缓存过期，但仍返回数据作为备用
      return result.data as T;
    }
    return result.data as T;
  } catch {
    return null;
  }
};

// 检查缓存是否有效（未过期）
export const isCacheValid = async (key: string): Promise<boolean> => {
  try {
    const db = await getDB();
    const result = await db.get('cache', key);
    if (!result) return false;
    return Date.now() <= result.expireAt;
  } catch {
    return false;
  }
};
