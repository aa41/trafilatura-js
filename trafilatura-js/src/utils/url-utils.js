/**
 * URL 处理工具函数
 * 对应 courlan 库的功能
 */

/**
 * 验证 URL 是否有效
 * 对应 courlan: is_valid_url()
 */
export function isValidUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') {
    return false;
  }

  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

/**
 * 验证并返回 URL 对象
 * 对应 courlan: validate_url()
 * 
 * @returns {[boolean, URL|null]} - [是否有效, URL对象]
 */
export function validateUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') {
    return [false, null];
  }

  try {
    const url = new URL(urlString);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return [true, url];
    }
    return [false, null];
  } catch (e) {
    return [false, null];
  }
}

/**
 * 标准化 URL
 * 对应 courlan: normalize_url()
 */
export function normalizeUrl(urlObj) {
  if (!urlObj) return null;

  try {
    let url;
    if (typeof urlObj === 'string') {
      url = new URL(urlObj);
    } else {
      url = urlObj;
    }

    // 移除 URL 片段
    url.hash = '';
    
    // 移除默认端口
    if (
      (url.protocol === 'http:' && url.port === '80') ||
      (url.protocol === 'https:' && url.port === '443')
    ) {
      url.port = '';
    }

    // 获取URL字符串并移除尾部斜杠（除了根路径）
    let urlString = url.toString();
    if (urlString.endsWith('/') && url.pathname !== '/') {
      urlString = urlString.slice(0, -1);
    }

    return urlString;
  } catch (e) {
    return null;
  }
}

/**
 * 提取域名
 * 对应 courlan: extract_domain()
 */
export function extractDomain(urlString, fast = false) {
  if (!urlString) return null;

  try {
    const url = typeof urlString === 'string' ? new URL(urlString) : urlString;
    
    if (fast) {
      return url.hostname;
    }

    // 移除 www. 前缀
    let hostname = url.hostname;
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }

    return hostname;
  } catch (e) {
    return null;
  }
}

/**
 * 获取基础 URL
 * 对应 courlan: get_base_url()
 */
export function getBaseUrl(urlString) {
  if (!urlString) return null;

  try {
    const url = new URL(urlString);
    return `${url.protocol}//${url.host}`;
  } catch (e) {
    return null;
  }
}

/**
 * 修复相对 URL
 * 对应 courlan: fix_relative_urls()
 */
export function fixRelativeUrls(baseUrl, relativeUrl) {
  if (!relativeUrl) return null;
  if (!baseUrl) return relativeUrl;

  try {
    // 如果已经是绝对 URL，直接返回
    if (isValidUrl(relativeUrl)) {
      return relativeUrl;
    }

    // 使用 URL 构造器处理相对路径
    const url = new URL(relativeUrl, baseUrl);
    return url.toString();
  } catch (e) {
    return relativeUrl;
  }
}

/**
 * 从 URL 提取路径部分
 */
export function getUrlPath(urlString) {
  if (!urlString) return null;

  try {
    const url = new URL(urlString);
    return url.pathname;
  } catch (e) {
    return null;
  }
}

/**
 * 从 URL 提取查询参数
 */
export function getUrlParams(urlString) {
  if (!urlString) return {};

  try {
    const url = new URL(urlString);
    const params = {};
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  } catch (e) {
    return {};
  }
}

/**
 * 检查是否为同源 URL
 */
export function isSameOrigin(url1, url2) {
  try {
    const u1 = new URL(url1);
    const u2 = new URL(url2);
    return u1.origin === u2.origin;
  } catch (e) {
    return false;
  }
}

/**
 * 清理 URL（移除跟踪参数等）
 */
export function cleanUrl(urlString) {
  if (!urlString) return null;

  try {
    const url = new URL(urlString);
    
    // 常见的跟踪参数
    const trackingParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'fbclid',
      'gclid',
      'msclkid',
      'mc_cid',
      'mc_eid',
    ];

    trackingParams.forEach(param => {
      url.searchParams.delete(param);
    });

    return url.toString();
  } catch (e) {
    return urlString;
  }
}

/**
 * 获取当前页面的 URL
 */
export function getCurrentUrl() {
  return window.location.href;
}

/**
 * 获取当前页面的基础 URL
 */
export function getCurrentBaseUrl() {
  return `${window.location.protocol}//${window.location.host}`;
}

/**
 * 获取当前页面的域名
 */
export function getCurrentDomain() {
  return window.location.hostname;
}

