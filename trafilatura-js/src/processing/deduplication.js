/**
 * 去重模块
 * 对应 Python: trafilatura/deduplication.py
 * 
 * 功能：
 * - 检测重复内容
 * - LRU 缓存实现
 */

/**
 * LRU 缓存类
 * 用于存储已见过的文本指纹
 */
class LRUCache {
  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  /**
   * 获取缓存项
   */
  get(key) {
    if (!this.cache.has(key)) {
      return undefined;
    }
    // 移动到末尾（最近使用）
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  /**
   * 设置缓存项
   */
  set(key, value) {
    // 如果已存在，先删除
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // 如果超出大小，删除最旧的项
    else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  /**
   * 检查是否存在
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * 清空缓存
   */
  clear() {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   */
  get size() {
    return this.cache.size;
  }
}

// 全局去重缓存
const DEDUP_STORE = new LRUCache(1000);

/**
 * 生成文本指纹（简单哈希）
 * 
 * @param {string} text - 文本内容
 * @returns {string} 指纹字符串
 */
function generateFingerprint(text) {
  if (!text) return '';
  
  // 简单的哈希函数
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  
  return hash.toString(36);
}

/**
 * 检测重复内容
 * 对应 Python: duplicate_test()
 * 
 * @param {Element} element - 要检查的元素
 * @param {Extractor} options - 提取选项
 * @returns {boolean} 是否为重复内容
 */
export function duplicateTest(element, options) {
  if (!options || !options.dedup) {
    return false;
  }

  // 获取文本内容
  const text = element.textContent ? element.textContent.trim() : '';
  
  // 太短的文本不检查
  if (text.length < 10) {
    return false;
  }

  // 生成指纹
  const fingerprint = generateFingerprint(text);

  // 检查是否已存在
  if (DEDUP_STORE.has(fingerprint)) {
    return true; // 重复
  }

  // 添加到缓存
  DEDUP_STORE.set(fingerprint, true);
  
  return false;
}

/**
 * 清空去重缓存
 */
export function clearDedupStore() {
  DEDUP_STORE.clear();
}

/**
 * 获取去重缓存大小
 */
export function getDedupStoreSize() {
  return DEDUP_STORE.size;
}

export default {
  duplicateTest,
  clearDedupStore,
  getDedupStoreSize,
  LRUCache,
};

