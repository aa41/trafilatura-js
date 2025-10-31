/**
 * URL处理工具函数
 * 
 * 对应Python模块中的URL处理功能
 * 
 * @module utils/url
 */

/**
 * 从URL提取域名
 * 对应Python中的extract_domain功能
 * 
 * @param {string} url - URL字符串
 * @param {boolean} fast - 是否使用快速模式（只提取hostname）
 * @returns {string|null} 域名
 * 
 * @example
 * extractDomain('https://www.example.com/path')  // 'example.com'
 * extractDomain('https://blog.example.com')      // 'example.com'
 */
export function extractDomain(url, fast = false) {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    if (fast) {
      return hostname;
    }

    // 提取主域名（移除www和子域名）
    // example: www.blog.example.com -> example.com
    const parts = hostname.split('.');
    
    // 如果是IP地址，直接返回
    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      return hostname;
    }

    // 处理常见的顶级域名
    if (parts.length >= 2) {
      // 特殊处理：co.uk, com.cn等
      const twoLevelTLDs = ['co.uk', 'com.cn', 'com.au', 'co.jp', 'gov.uk'];
      const lastTwo = parts.slice(-2).join('.');
      
      if (twoLevelTLDs.includes(lastTwo) && parts.length >= 3) {
        return parts.slice(-3).join('.');
      }
      
      // 标准情况：返回最后两部分
      return parts.slice(-2).join('.');
    }

    return hostname;
  } catch (error) {
    console.warn('Failed to extract domain from URL:', url, error);
    return null;
  }
}

/**
 * 获取基础URL（协议+域名）
 * 
 * @param {string} url - 完整URL
 * @returns {string|null} 基础URL
 * 
 * @example
 * getBaseUrl('https://example.com/path/page.html')  // 'https://example.com'
 */
export function getBaseUrl(url) {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.host}`;
  } catch (error) {
    return null;
  }
}

/**
 * 标准化URL
 * 处理相对URL，移除fragment等
 * 
 * @param {string} url - URL字符串
 * @param {string} baseUrl - 基础URL（用于相对路径）
 * @returns {string|null} 标准化后的URL
 * 
 * @example
 * normalizeUrl('/path', 'https://example.com')  // 'https://example.com/path'
 * normalizeUrl('page.html', 'https://example.com/dir/')  // 'https://example.com/dir/page.html'
 */
export function normalizeUrl(url, baseUrl = null) {
  if (!url) return null;

  try {
    // 如果已经是完整URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const urlObj = new URL(url);
      // 移除fragment和query（可选）
      return `${urlObj.origin}${urlObj.pathname}`;
    }

    // 相对URL需要基础URL
    if (!baseUrl) {
      return null;
    }

    const urlObj = new URL(url, baseUrl);
    return `${urlObj.origin}${urlObj.pathname}`;
  } catch (error) {
    return null;
  }
}

/**
 * 验证URL是否有效
 * 
 * @param {string} url - URL字符串
 * @returns {boolean} 是否有效
 * 
 * @example
 * isValidUrl('https://example.com')  // true
 * isValidUrl('not a url')            // false
 */
export function isValidUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);
    // 只接受http和https协议
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

/**
 * 解析URL为组件
 * 
 * @param {string} url - URL字符串
 * @returns {Object|null} URL组件对象
 * 
 * @example
 * parseUrl('https://example.com/path?q=1#hash')
 * // {
 * //   protocol: 'https:',
 * //   hostname: 'example.com',
 * //   port: '',
 * //   pathname: '/path',
 * //   search: '?q=1',
 * //   hash: '#hash',
 * //   origin: 'https://example.com'
 * // }
 */
export function parseUrl(url) {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
    return {
      protocol: urlObj.protocol,
      hostname: urlObj.hostname,
      host: urlObj.host,
      port: urlObj.port,
      pathname: urlObj.pathname,
      search: urlObj.search,
      searchParams: Object.fromEntries(urlObj.searchParams),
      hash: urlObj.hash,
      origin: urlObj.origin,
      href: urlObj.href
    };
  } catch (error) {
    return null;
  }
}

/**
 * 从URL中提取文件名
 * 
 * @param {string} url - URL字符串
 * @returns {string|null} 文件名
 * 
 * @example
 * getFilename('https://example.com/images/photo.jpg')  // 'photo.jpg'
 */
export function getFilename(url) {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const parts = pathname.split('/');
    return parts[parts.length - 1] || null;
  } catch (error) {
    return null;
  }
}

/**
 * 从URL中提取路径
 * 
 * @param {string} url - URL字符串
 * @returns {string|null} 路径
 * 
 * @example
 * getPath('https://example.com/path/to/page.html')  // '/path/to/page.html'
 */
export function getPath(url) {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
    return urlObj.pathname;
  } catch (error) {
    return null;
  }
}

/**
 * 检查URL是否是同一域名
 * 
 * @param {string} url1 - 第一个URL
 * @param {string} url2 - 第二个URL
 * @returns {boolean} 是否同域
 */
export function isSameDomain(url1, url2) {
  const domain1 = extractDomain(url1);
  const domain2 = extractDomain(url2);
  return domain1 !== null && domain1 === domain2;
}

/**
 * 构建完整URL
 * 
 * @param {Object} components - URL组件
 * @returns {string|null} 完整URL
 */
export function buildUrl(components) {
  if (!components || !components.protocol || !components.hostname) {
    return null;
  }

  try {
    let url = `${components.protocol}//${components.hostname}`;
    
    if (components.port) {
      url += `:${components.port}`;
    }
    
    if (components.pathname) {
      url += components.pathname;
    }
    
    if (components.search) {
      url += components.search;
    }
    
    if (components.hash) {
      url += components.hash;
    }

    return url;
  } catch (error) {
    return null;
  }
}

/**
 * 清理URL（移除tracking参数等）
 * 
 * @param {string} url - URL字符串
 * @param {Array<string>} paramsToRemove - 要移除的参数名列表
 * @returns {string|null} 清理后的URL
 */
export function cleanUrl(url, paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign', 'fbclid']) {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
    
    // 移除指定的查询参数
    paramsToRemove.forEach(param => {
      urlObj.searchParams.delete(param);
    });

    // 移除hash
    urlObj.hash = '';

    return urlObj.toString();
  } catch (error) {
    return null;
  }
}

/**
 * 对应Python: URL_BLACKLIST_REGEX
 * 用于过滤URL
 */
export const URL_BLACKLIST_REGEX = /^https?:\/\/|\/+$/;

/**
 * 检查URL是否在黑名单中
 * 
 * @param {string} url - URL字符串
 * @returns {boolean} 是否在黑名单
 */
export function isBlacklistedUrl(url) {
  if (!url) return true;
  return URL_BLACKLIST_REGEX.test(url);
}

