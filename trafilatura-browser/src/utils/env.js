/**
 * 环境检测工具
 * 
 * 提供浏览器和Node.js通用的环境检测
 * 
 * @module utils/env
 */

/**
 * 检测是否为浏览器环境
 */
export function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * 检测是否为Node.js环境
 */
export function isNode() {
  try {
    return typeof process !== 'undefined' && 
           process.versions != null && 
           process.versions.node != null;
  } catch (e) {
    return false;
  }
}

/**
 * 安全地获取环境变量
 * 在浏览器中返回默认值，在Node.js中读取process.env
 * 
 * @param {string} key - 环境变量名
 * @param {string} defaultValue - 默认值
 * @returns {string} 环境变量值
 */
export function getEnv(key, defaultValue = '') {
  if (isNode()) {
    return process.env[key] || defaultValue;
  }
  return defaultValue;
}

/**
 * 检测是否为开发模式
 * 
 * @returns {boolean} 是否为开发模式
 */
export function isDevelopment() {
  // Node.js环境检查
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.NODE_ENV === 'development';
    }
  } catch (e) {
    // process不存在或不可访问
  }
  
  // 浏览器环境：检查URL参数或localStorage
  if (isBrowser()) {
    // 检查URL参数
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has('debug')) {
        return true;
      }
    } catch (e) {
      // URL解析失败，继续
    }
    
    // 检查localStorage
    try {
      return localStorage.getItem('TRAFILATURA_DEBUG') === 'true';
    } catch (e) {
      // localStorage不可用，继续
    }
  }
  
  // 默认为生产模式
  return false;
}

/**
 * 检测是否为生产模式
 * 
 * @returns {boolean} 是否为生产模式
 */
export function isProduction() {
  return !isDevelopment();
}

/**
 * 日志函数 - 只在开发模式下输出
 * 
 * @param {...any} args - 日志参数
 */
export function debugLog(...args) {
  if (isDevelopment()) {
    console.debug('[Trafilatura]', ...args);
  }
}

/**
 * 警告日志 - 总是输出
 * 
 * @param {...any} args - 日志参数
 */
export function warnLog(...args) {
  console.warn('[Trafilatura]', ...args);
}

/**
 * 错误日志 - 总是输出
 * 
 * @param {...any} args - 日志参数
 */
export function errorLog(...args) {
  console.error('[Trafilatura]', ...args);
}

/**
 * 设置调试模式（仅浏览器）
 * 
 * @param {boolean} enabled - 是否启用调试
 */
export function setDebugMode(enabled) {
  if (isBrowser()) {
    try {
      if (enabled) {
        localStorage.setItem('TRAFILATURA_DEBUG', 'true');
      } else {
        localStorage.removeItem('TRAFILATURA_DEBUG');
      }
    } catch (e) {
      console.warn('无法设置调试模式:', e.message);
    }
  }
}

