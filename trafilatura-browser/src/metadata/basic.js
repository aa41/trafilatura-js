/**
 * 基础元数据提取模块
 * 
 * 实现基本的元数据提取功能，包括标题、作者、URL、网站名称和描述
 * 对应Python模块: trafilatura/metadata.py
 * 
 * @module metadata/basic
 */

import { trim } from '../utils/text.js';
import { extractDomain } from '../utils/url.js';

/**
 * 清理文本内容
 * 移除多余空格和特殊字符
 * 
 * @param {string} text - 要清理的文本
 * @returns {string} 清理后的文本
 */
function cleanText(text) {
  if (!text) return null;
  
  // 使用trim工具函数
  const cleaned = trim(text);
  
  // 如果清理后为空或过短，返回null
  if (!cleaned || cleaned.length < 2) {
    return null;
  }
  
  return cleaned;
}

/**
 * 提取页面标题
 * 对应Python: extract_title() - metadata.py:245-285
 * 
 * 提取顺序（优先级从高到低）：
 * 1. OpenGraph og:title
 * 2. Meta标签 name="title"
 * 3. <title>标签（处理"标题 - 网站名"格式）
 * 4. <h1>标签
 * 5. JSON-LD headline（由调用者处理）
 * 
 * @param {Document|Element} tree - HTML文档树
 * @returns {string|null} 提取的标题
 * 
 * @example
 * const title = extractTitle(document);
 * console.log(title); // "文章标题"
 */
export function extractTitle(tree) {
  if (!tree) return null;
  
  // 1. 优先：OpenGraph og:title
  const ogTitle = tree.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    const content = ogTitle.getAttribute('content');
    const cleaned = cleanText(content);
    if (cleaned) {
      return cleaned;
    }
  }
  
  // 2. Meta标签 name="title"
  const metaTitle = tree.querySelector('meta[name="title"]');
  if (metaTitle) {
    const content = metaTitle.getAttribute('content');
    const cleaned = cleanText(content);
    if (cleaned) {
      return cleaned;
    }
  }
  
  // 3. <title>标签
  const titleElem = tree.querySelector('title');
  if (titleElem) {
    let title = titleElem.textContent.trim();
    
    // 处理"文章标题 - 网站名称"或"文章标题 | 网站名称"格式
    // 只取第一部分
    const separators = [' - ', ' – ', ' — ', ' | ', ' :: '];
    for (const sep of separators) {
      if (title.includes(sep)) {
        const parts = title.split(sep);
        if (parts.length > 1 && parts[0].trim().length >= 2) {
          // 降低长度要求从10到2，以支持短标题
          title = parts[0].trim();
          break;
        }
      }
    }
    
    const cleaned = cleanText(title);
    if (cleaned) {
      return cleaned;
    }
  }
  
  // 4. <h1>标签（最后的选择）
  const h1 = tree.querySelector('h1');
  if (h1) {
    const cleaned = cleanText(h1.textContent);
    if (cleaned) {
      return cleaned;
    }
  }
  
  return null;
}

/**
 * 提取作者信息
 * 对应Python: extract_author() - metadata.py:288-315
 * 
 * 提取顺序：
 * 1. Meta标签 name="author"
 * 2. Meta标签 property="author"
 * 3. 特定class/id的元素
 * 4. rel="author"链接
 * 5. itemprop="author"元素
 * 
 * @param {Document|Element} tree - HTML文档树
 * @returns {string|null} 提取的作者名称
 * 
 * @example
 * const author = extractAuthor(document);
 * console.log(author); // "张三"
 */
export function extractAuthor(tree) {
  if (!tree) return null;
  
  // 1. Meta标签 name="author"
  const authorMeta = tree.querySelector('meta[name="author"]');
  if (authorMeta) {
    const content = authorMeta.getAttribute('content');
    const cleaned = cleanText(content);
    if (cleaned) {
      // 移除常见前缀
      return cleaned.replace(/^(by|作者[:：]?)\s*/i, '');
    }
  }
  
  // 2. Meta标签 property="author"
  const authorProperty = tree.querySelector('meta[property="author"]');
  if (authorProperty) {
    const content = authorProperty.getAttribute('content');
    const cleaned = cleanText(content);
    if (cleaned) {
      return cleaned.replace(/^(by|作者[:：]?)\s*/i, '');
    }
  }
  
  // 3. 特定class/id的元素
  const selectors = [
    '.author',
    '.by-author',
    '.byline',
    '#author',
    '[itemprop="author"]',
    '[rel="author"]',
    '.article-author',
    '.post-author'
  ];
  
  for (const selector of selectors) {
    try {
      const elem = tree.querySelector(selector);
      if (elem) {
        const cleaned = cleanText(elem.textContent);
        if (cleaned) {
          // 移除常见前缀和后缀
          let author = cleaned.replace(/^(by|作者[:：]?)\s*/i, '');
          author = author.replace(/\s*(发布|撰写|编辑)于.*/i, '');
          if (author.length >= 2 && author.length <= 100) {
            return author;
          }
        }
      }
    } catch (e) {
      // 选择器可能无效，继续下一个
      continue;
    }
  }
  
  return null;
}

/**
 * 提取网站名称
 * 对应Python: extract_sitename() - metadata.py:318-340
 * 
 * 提取顺序：
 * 1. OpenGraph og:site_name
 * 2. Meta标签 name="application-name"
 * 3. 从<title>推断（取分隔符后的部分）
 * 4. Meta标签 property="og:site_name"
 * 
 * @param {Document|Element} tree - HTML文档树
 * @returns {string|null} 提取的网站名称
 * 
 * @example
 * const sitename = extractSitename(document);
 * console.log(sitename); // "新浪新闻"
 */
export function extractSitename(tree) {
  if (!tree) return null;
  
  // 1. OpenGraph og:site_name
  const ogSite = tree.querySelector('meta[property="og:site_name"]');
  if (ogSite) {
    const content = ogSite.getAttribute('content');
    const cleaned = cleanText(content);
    if (cleaned) {
      return cleaned;
    }
  }
  
  // 2. Meta标签 name="application-name"
  const appName = tree.querySelector('meta[name="application-name"]');
  if (appName) {
    const content = appName.getAttribute('content');
    const cleaned = cleanText(content);
    if (cleaned) {
      return cleaned;
    }
  }
  
  // 3. 从<title>推断（取最后一部分）
  const titleElem = tree.querySelector('title');
  if (titleElem) {
    const title = titleElem.textContent.trim();
    
    // 尝试各种分隔符
    const separators = [' - ', ' – ', ' — ', ' | ', ' :: '];
    for (const sep of separators) {
      if (title.includes(sep)) {
        const parts = title.split(sep);
        if (parts.length > 1) {
          const sitename = parts[parts.length - 1].trim();
          const cleaned = cleanText(sitename);
          // 网站名称通常不会太长
          if (cleaned && cleaned.length >= 2 && cleaned.length <= 50) {
            return cleaned;
          }
        }
      }
    }
  }
  
  return null;
}

/**
 * 提取页面描述
 * 对应Python: extract_description() - metadata.py:343-365
 * 
 * 提取顺序：
 * 1. OpenGraph og:description
 * 2. Meta标签 name="description"
 * 3. Meta标签 property="description"
 * 4. Meta标签 name="twitter:description"
 * 
 * @param {Document|Element} tree - HTML文档树
 * @returns {string|null} 提取的描述
 * 
 * @example
 * const description = extractDescription(document);
 * console.log(description); // "这是一篇关于..."
 */
export function extractDescription(tree) {
  if (!tree) return null;
  
  // 收集所有可能的描述，选择最长的
  const descriptions = [];
  
  /**
   * 计算字符串的有效长度
   * 中文字符计为2，英文字符计为1
   */
  function getEffectiveLength(str) {
    if (!str) return 0;
    let length = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      // 中文字符范围
      if (char >= 0x4e00 && char <= 0x9fff) {
        length += 2;
      } else {
        length += 1;
      }
    }
    return length;
  }
  
  // 1. OpenGraph og:description
  const ogDesc = tree.querySelector('meta[property="og:description"]');
  if (ogDesc) {
    const content = ogDesc.getAttribute('content');
    const cleaned = cleanText(content);
    // 使用有效长度判断（中文10个字符，英文20个字符）
    if (cleaned && getEffectiveLength(cleaned) >= 15) {
      descriptions.push(cleaned);
    }
  }
  
  // 2. Meta description
  const metaDesc = tree.querySelector('meta[name="description"]');
  if (metaDesc) {
    const content = metaDesc.getAttribute('content');
    const cleaned = cleanText(content);
    if (cleaned && getEffectiveLength(cleaned) >= 15) {
      descriptions.push(cleaned);
    }
  }
  
  // 3. Meta property="description"
  const propDesc = tree.querySelector('meta[property="description"]');
  if (propDesc) {
    const content = propDesc.getAttribute('content');
    const cleaned = cleanText(content);
    if (cleaned && getEffectiveLength(cleaned) >= 15) {
      descriptions.push(cleaned);
    }
  }
  
  // 4. Twitter description
  const twitterDesc = tree.querySelector('meta[name="twitter:description"]');
  if (twitterDesc) {
    const content = twitterDesc.getAttribute('content');
    const cleaned = cleanText(content);
    if (cleaned && getEffectiveLength(cleaned) >= 15) {
      descriptions.push(cleaned);
    }
  }
  
  // 选择最长的描述（通常更详细）
  if (descriptions.length > 0) {
    return descriptions.reduce((longest, current) => 
      current.length > longest.length ? current : longest
    );
  }
  
  return null;
}

/**
 * 提取URL
 * 对应Python: extract_url() - metadata.py:368-385
 * 
 * 提取顺序：
 * 1. Canonical链接
 * 2. OpenGraph og:url
 * 3. 传入的defaultUrl
 * 
 * @param {Document|Element} tree - HTML文档树
 * @param {string} defaultUrl - 默认URL（如果无法从HTML提取）
 * @returns {string|null} 提取的URL
 * 
 * @example
 * const url = extractUrl(document, 'https://example.com/article');
 * console.log(url); // "https://example.com/article"
 */
export function extractUrl(tree, defaultUrl = null) {
  if (!tree) return defaultUrl;
  
  // 1. Canonical链接（最权威）
  const canonical = tree.querySelector('link[rel="canonical"]');
  if (canonical) {
    const href = canonical.getAttribute('href');
    if (href && href.startsWith('http')) {
      return href.trim();
    }
  }
  
  // 2. OpenGraph og:url
  const ogUrl = tree.querySelector('meta[property="og:url"]');
  if (ogUrl) {
    const content = ogUrl.getAttribute('content');
    if (content && content.startsWith('http')) {
      return content.trim();
    }
  }
  
  // 3. 返回默认URL
  return defaultUrl;
}

/**
 * 提取主机名/域名
 * 
 * @param {string} url - URL字符串
 * @returns {string|null} 提取的域名
 * 
 * @example
 * const hostname = extractHostname('https://news.sina.com.cn/article.html');
 * console.log(hostname); // "sina.com.cn"
 */
export function extractHostname(url) {
  if (!url) return null;
  
  try {
    return extractDomain(url);
  } catch (e) {
    return null;
  }
}

// 导出所有函数
export default {
  extractTitle,
  extractAuthor,
  extractSitename,
  extractDescription,
  extractUrl,
  extractHostname
};

