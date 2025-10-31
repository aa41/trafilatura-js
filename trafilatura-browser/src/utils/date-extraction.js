/**
 * 日期提取模块
 * 
 * 简化版的日期提取功能，专注于最常见的日期来源
 * 对应Python: htmldate库的核心功能
 * 
 * @module utils/date-extraction
 */

/**
 * 日期正则表达式模式
 */
const DATE_PATTERNS = {
  // ISO 8601: 2023-10-30, 2023-10-30T18:30:00Z
  iso: /(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{3}))?(?:Z|([+-]\d{2}):?(\d{2}))?)?/,
  
  // RFC 2822: Mon, 30 Oct 2023 18:30:00 GMT
  rfc2822: /(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s+(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/i,
  
  // 常见格式: 30/10/2023, 10/30/2023, 30.10.2023
  common: /(\d{1,2})[\.\/-](\d{1,2})[\.\/-](\d{4})/,
  
  // 美国格式: October 30, 2023
  us: /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})/i,
  
  // URL中的日期: /2023/10/30/
  url: /\/(\d{4})\/(\d{1,2})\/(\d{1,2})\//
};

/**
 * 月份名称映射
 */
const MONTH_NAMES = {
  'jan': 0, 'january': 0,
  'feb': 1, 'february': 1,
  'mar': 2, 'march': 2,
  'apr': 3, 'april': 3,
  'may': 4,
  'jun': 5, 'june': 5,
  'jul': 6, 'july': 6,
  'aug': 7, 'august': 7,
  'sep': 8, 'september': 8,
  'oct': 9, 'october': 9,
  'nov': 10, 'november': 10,
  'dec': 11, 'december': 11
};

/**
 * 解析ISO日期字符串
 */
function parseISODate(dateStr) {
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return formatDate(date);
    }
  } catch (e) {
    // 忽略解析错误
  }
  return null;
}

/**
 * 格式化日期为YYYY-MM-DD
 */
function formatDate(date) {
  if (!date || isNaN(date.getTime())) {
    return null;
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // 验证日期合理性（1995-2030之间）
  if (year < 1995 || year > 2030) {
    return null;
  }
  
  return `${year}-${month}-${day}`;
}

/**
 * 从meta标签提取日期
 */
function extractDateFromMeta(tree) {
  const metaTags = tree.querySelectorAll('meta[property], meta[name], meta[itemprop]');
  
  // 优先级顺序的日期属性
  const dateAttributes = [
    // OpenGraph
    'article:published_time',
    'article:modified_time',
    'og:published_time',
    'og:updated_time',
    
    // Schema.org
    'datePublished',
    'dateModified',
    'dateCreated',
    
    // Twitter
    'twitter:published_time',
    
    // Dublin Core
    'dc.date',
    'dc.date.created',
    'dcterms.created',
    'dcterms.modified',
    
    // 通用
    'date',
    'pubdate',
    'publishdate',
    'published',
    'last-modified',
    'parsely-pub-date'
  ];
  
  for (const attr of dateAttributes) {
    for (const meta of metaTags) {
      const property = meta.getAttribute('property') || 
                      meta.getAttribute('name') || 
                      meta.getAttribute('itemprop');
      
      if (property && property.toLowerCase() === attr.toLowerCase()) {
        const content = meta.getAttribute('content');
        if (content) {
          const date = parseISODate(content);
          if (date) {
            return date;
          }
        }
      }
    }
  }
  
  return null;
}

/**
 * 从time标签提取日期
 */
function extractDateFromTime(tree) {
  const timeTags = tree.querySelectorAll('time[datetime], time[pubdate]');
  
  for (const timeTag of timeTags) {
    const datetime = timeTag.getAttribute('datetime');
    if (datetime) {
      const date = parseISODate(datetime);
      if (date) {
        return date;
      }
    }
  }
  
  return null;
}

/**
 * 从URL提取日期
 */
function extractDateFromUrl(url) {
  if (!url) {
    return null;
  }
  
  // 尝试URL模式: /2023/10/30/
  const match = url.match(DATE_PATTERNS.url);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);
    
    try {
      const date = new Date(year, month - 1, day);
      return formatDate(date);
    } catch (e) {
      // 忽略
    }
  }
  
  return null;
}

/**
 * 从文本内容提取日期
 */
function extractDateFromText(text) {
  if (!text || text.length > 200) {
    return null; // 限制文本长度以提高性能
  }
  
  // 尝试ISO格式
  let match = text.match(DATE_PATTERNS.iso);
  if (match) {
    try {
      const date = new Date(match[0]);
      return formatDate(date);
    } catch (e) {
      // 忽略
    }
  }
  
  // 尝试美国格式: October 30, 2023
  match = text.match(DATE_PATTERNS.us);
  if (match) {
    const monthName = match[1].toLowerCase().substring(0, 3);
    const month = MONTH_NAMES[monthName];
    const day = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    
    if (month !== undefined) {
      try {
        const date = new Date(year, month, day);
        return formatDate(date);
      } catch (e) {
        // 忽略
      }
    }
  }
  
  return null;
}

/**
 * 从JSON-LD提取日期
 */
function extractDateFromJsonLd(tree) {
  const scripts = tree.querySelectorAll('script[type="application/ld+json"]');
  
  for (const script of scripts) {
    try {
      const content = script.textContent.replace(/^\s*<!\[CDATA\[|\]\]>\s*$/g, '');
      const data = JSON.parse(content);
      
      // 可能是数组
      let article = data;
      if (Array.isArray(data)) {
        article = data.find(item => item['@type'] && 
          /Article|NewsArticle|BlogPosting/.test(item['@type']));
      }
      
      if (!article) {
        continue;
      }
      
      // 尝试提取日期
      const dateFields = ['datePublished', 'dateModified', 'dateCreated', 'uploadDate'];
      for (const field of dateFields) {
        if (article[field]) {
          const date = parseISODate(article[field]);
          if (date) {
            return date;
          }
        }
      }
    } catch (e) {
      // JSON解析失败，继续下一个
      continue;
    }
  }
  
  return null;
}

/**
 * 主日期提取函数
 * 对应Python: htmldate.find_date()
 * 
 * @param {Element} tree - HTML DOM树
 * @param {Object} options - 提取选项
 * @param {string} options.url - 文档URL
 * @param {boolean} options.extensive_search - 是否进行扩展搜索
 * @param {Date} options.min_date - 最小日期
 * @param {Date} options.max_date - 最大日期
 * @returns {string|null} 格式化的日期字符串 (YYYY-MM-DD) 或 null
 * 
 * @example
 * const date = findDate(tree, { url: 'https://example.com/2023/10/30/post' });
 * // 返回: '2023-10-30'
 */
export function findDate(tree, options = {}) {
  if (!tree) {
    return null;
  }
  
  let date = null;
  
  // 1. 优先从meta标签提取
  date = extractDateFromMeta(tree);
  if (date) {
    console.debug('Date found in meta tags:', date);
    return date;
  }
  
  // 2. 从JSON-LD提取
  date = extractDateFromJsonLd(tree);
  if (date) {
    console.debug('Date found in JSON-LD:', date);
    return date;
  }
  
  // 3. 从time标签提取
  date = extractDateFromTime(tree);
  if (date) {
    console.debug('Date found in time tags:', date);
    return date;
  }
  
  // 4. 从URL提取
  if (options.url) {
    date = extractDateFromUrl(options.url);
    if (date) {
      console.debug('Date found in URL:', date);
      return date;
    }
  }
  
  // 5. 扩展搜索：从页面文本提取
  if (options.extensive_search) {
    // 查找发布日期相关的文本
    const dateContainers = tree.querySelectorAll(
      '[class*="date"], [class*="time"], [class*="publish"], ' +
      '[id*="date"], [id*="time"], [id*="publish"]'
    );
    
    for (const container of dateContainers) {
      const text = container.textContent.substring(0, 200);
      date = extractDateFromText(text);
      if (date) {
        console.debug('Date found in page text:', date);
        return date;
      }
    }
  }
  
  console.debug('No date found');
  return null;
}

/**
 * 导出所有函数
 */
export default {
  findDate,
  parseISODate,
  formatDate
};

