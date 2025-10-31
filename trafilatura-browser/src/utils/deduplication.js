/**
 * 去重和文本相似度检测模块
 * 
 * 对应Python模块: trafilatura/deduplication.py
 * 
 * @module utils/deduplication
 */

import { trim } from './text.js';

/**
 * 简单的Simhash实现
 * 对应Python: Simhash类
 * 
 * 用于计算文本的相似度哈希
 */
class Simhash {
  constructor(inputString = '', length = 64) {
    this.length = length;
    this.hash = this.createHash(inputString);
  }
  
  /**
   * 简单的字符串哈希函数
   */
  _hash(inputString) {
    let hash = 0;
    for (let i = 0; i < inputString.length; i++) {
      const char = inputString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
  
  /**
   * 将文本分词并采样
   */
  sampleTokens(inputString, length = 64) {
    // 移除标点符号并分词
    const tokens = inputString
      .split(/\s+/)
      .map(token => token.replace(/[^\w]/g, ''))
      .filter(token => token && /\w/.test(token));
    
    // 按长度筛选
    for (let minLen = 4; minLen >= 0; minLen--) {
      const sample = tokens.filter(t => t.length > minLen);
      if (sample.length >= length / 2) {
        return sample;
      }
    }
    
    return tokens;
  }
  
  /**
   * 创建Simhash
   */
  createHash(inputString) {
    const vector = new Array(this.length).fill(0);
    const tokens = this.sampleTokens(inputString, this.length);
    
    for (const token of tokens) {
      const tokenHash = this._hash(token);
      
      for (let i = 0; i < this.length; i++) {
        const bit = (tokenHash & (1 << i)) ? 1 : -1;
        vector[i] += bit;
      }
    }
    
    // 生成最终哈希
    let hash = 0;
    for (let i = 0; i < this.length; i++) {
      if (vector[i] >= 0) {
        hash |= (1 << i);
      }
    }
    
    return hash;
  }
  
  /**
   * 转换为十六进制字符串
   */
  toHex() {
    return this.hash.toString(16);
  }
  
  /**
   * 计算汉明距离
   */
  hammingDistance(otherHash) {
    let xor = this.hash ^ otherHash.hash;
    let distance = 0;
    
    while (xor) {
      distance += xor & 1;
      xor >>= 1;
    }
    
    return distance;
  }
  
  /**
   * 计算相似度
   */
  similarity(otherHash) {
    return (this.length - this.hammingDistance(otherHash)) / this.length;
  }
}

/**
 * 计算内容指纹
 * 对应Python: content_fingerprint() - deduplication.py:165-167
 * 
 * @param {string} content - 内容文本
 * @returns {string} Simhash十六进制字符串
 * 
 * @example
 * const fingerprint = contentFingerprint('This is some text');
 */
export function contentFingerprint(content) {
  return new Simhash(content).toHex();
}

/**
 * LRU缓存实现
 * 对应Python: LRUCache类
 */
class LRUCache {
  constructor(maxsize = 128) {
    this.maxsize = maxsize;
    this.cache = new Map();
  }
  
  get(key) {
    if (!this.cache.has(key)) {
      return -1;
    }
    
    // 移到最前面（最近使用）
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }
  
  put(key, value) {
    // 如果key已存在，先删除
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    
    // 添加到末尾（最新）
    this.cache.set(key, value);
    
    // 如果超过最大大小，删除最旧的（第一个）
    if (this.cache.size > this.maxsize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }
  
  clear() {
    this.cache.clear();
  }
}

/**
 * 全局LRU测试缓存
 * 对应Python: LRU_TEST
 */
const LRU_TEST = new LRUCache(1000); // LRU_SIZE默认值

/**
 * 将字符串放入缓存
 * 对应Python: put_in_cache() - deduplication.py:259-264
 */
function putInCache(testString) {
  const cacheVal = LRU_TEST.get(testString);
  const value = cacheVal !== -1 ? cacheVal + 1 : 1;
  LRU_TEST.put(testString, value);
}

/**
 * 检测重复文本
 * 对应Python: duplicate_test() - deduplication.py:267-278
 * 
 * 使用LRU缓存检查文本是否重复出现过多次
 * 
 * @param {Element} element - 要检查的DOM元素
 * @param {Extractor} options - 提取选项（需要min_duplcheck_size和max_repetitions）
 * @returns {boolean} 是否为重复内容
 * 
 * @example
 * const isDuplicate = duplicateTest(element, options);
 * if (isDuplicate) {
 *   // 跳过这个元素
 * }
 */
export function duplicateTest(element, options) {
  if (!element || !options) {
    return false;
  }
  
  // 获取元素的文本内容
  const testString = trim(element.textContent || '');
  
  // 只检查足够长的文本
  if (testString.length > options.min_duplcheck_size) {
    // 从缓存中检索
    const cacheVal = LRU_TEST.get(testString);
    
    // 如果重复次数超过阈值
    if (cacheVal > options.max_repetitions) {
      LRU_TEST.put(testString, cacheVal + 1);
      return true;
    }
  }
  
  // 放入缓存
  putInCache(testString);
  return false;
}

/**
 * 清除去重缓存
 * 用于测试或重置状态
 */
export function clearDuplicateCache() {
  LRU_TEST.clear();
}

/**
 * 导出所有函数
 */
export default {
  contentFingerprint,
  duplicateTest,
  clearDuplicateCache,
  Simhash
};

