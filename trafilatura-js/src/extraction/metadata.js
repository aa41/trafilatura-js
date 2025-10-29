/**
 * 元数据提取模块
 * 对应 Python: trafilatura/metadata.py
 * 
 * 功能：
 * - JSON-LD 提取
 * - OpenGraph 提取
 * - Meta 标签提取
 * - 标题提取
 * - 作者提取
 * - URL 提取
 * - 站点名称提取
 * - 分类和标签提取
 * - 许可证提取
 */

import { Document } from '../settings/config.js';
import {
  METANAME_AUTHOR,
  METANAME_DESCRIPTION,
  METANAME_PUBLISHER,
  METANAME_TAG,
  METANAME_TITLE,
  METANAME_URL,
  METANAME_IMAGE,
  PROPERTY_AUTHOR,
  TWITTER_ATTRS,
  OG_PROPERTIES,
  OG_AUTHOR,
  HTMLTITLE_REGEX,
  CLEAN_META_TAGS,
  LICENSE_REGEX,
  TEXT_LICENSE_REGEX,
  TITLE_XPATHS,
  AUTHOR_XPATHS,
  AUTHOR_DISCARD_XPATHS,
  CATEGORIES_XPATHS,
  TAGS_XPATHS,
} from '../settings/constants.js';

import { trim, lineProcessing, unescapeHtml } from '../utils/text-utils.js';
import {
  isValidUrl,
  validateUrl,
  normalizeUrl,
  getBaseUrl,
} from '../utils/url-utils.js';

/**
 * JSON 最小化正则表达式
 */
const JSON_MINIFY = /("(?:\\"|[^"])*")|\s/g;

/**
 * 规范化标签 - 移除特殊字符
 * 对应 Python: normalize_tags()
 * 
 * @param {string} tags - 标签字符串
 * @returns {string} 规范化后的标签
 */
export function normalizeTags(tags) {
  const trimmed = trim(unescapeHtml(tags));
  if (!trimmed) {
    return '';
  }
  
  const cleaned = trimmed.replace(CLEAN_META_TAGS, '');
  return cleaned
    .split(', ')
    .filter(tag => tag)
    .join(', ');
}

/**
 * 检查作者字符串是否符合预期值
 * 对应 Python: check_authors()
 * 
 * @param {string} authors - 作者字符串
 * @param {Set<string>} authorBlacklist - 作者黑名单
 * @returns {string|null} 检查后的作者字符串
 */
export function checkAuthors(authors, authorBlacklist) {
  if (!authors) return null;
  
  const blacklist = new Set(
    Array.from(authorBlacklist).map(a => a.toLowerCase())
  );
  
  const newAuthors = authors
    .split(';')
    .map(author => author.trim())
    .filter(author => !blacklist.has(author.toLowerCase()));
  
  if (newAuthors.length > 0) {
    return newAuthors.join('; ').trim();
  }
  
  return null;
}

/**
 * 规范化作者信息
 * 对应 Python json_metadata.py: normalize_authors()
 * 
 * @param {string|null} currentAuthor - 当前作者
 * @param {string} newAuthor - 新作者
 * @returns {string|null} 合并后的作者
 */
export function normalizeAuthors(currentAuthor, newAuthor) {
  if (!newAuthor || !newAuthor.trim()) {
    return currentAuthor;
  }
  
  const cleaned = trim(newAuthor);
  
  if (!currentAuthor) {
    return cleaned;
  }
  
  // 避免重复
  const authors = currentAuthor.split(';').map(a => a.trim());
  if (!authors.includes(cleaned)) {
    authors.push(cleaned);
    return authors.join('; ');
  }
  
  return currentAuthor;
}

/**
 * 规范化 JSON 字符串
 * 
 * @param {string} jsonStr - JSON 字符串
 * @returns {string} 规范化后的 JSON
 */
function normalizeJson(jsonStr) {
  if (!jsonStr) return '';
  
  // 移除 BOM
  let cleaned = jsonStr.replace(/^\uFEFF/, '');
  
  // 移除注释
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
  cleaned = cleaned.replace(/\/\/.*/g, '');
  
  return cleaned.trim();
}

/**
 * 从 JSON-LD 数据中提取元数据
 * 对应 Python: extract_meta_json()
 * 
 * @param {Element} tree - HTML 树
 * @param {Document} metadata - 元数据对象
 * @returns {Document} 更新后的元数据
 */
export function extractMetaJson(tree, metadata) {
  const scripts = tree.querySelectorAll('script[type="application/ld+json"], script[type="application/settings+json"]');
  
  scripts.forEach(elem => {
    const text = elem.textContent;
    if (!text) return;
    
    try {
      const elementText = normalizeJson(text.replace(JSON_MINIFY, '$1'));
      const schema = JSON.parse(elementText);
      metadata = extractJsonData(schema, metadata);
    } catch (e) {
      // JSON 解析错误，尝试修复
      try {
        metadata = extractJsonParseError(text, metadata);
      } catch (err) {
        console.warn('Failed to parse JSON-LD:', err);
      }
    }
  });
  
  return metadata;
}

/**
 * 从 JSON 结构中提取数据
 * 对应 Python json_metadata.py: extract_json()
 * 
 * @param {Object|Array} schema - JSON 结构
 * @param {Document} metadata - 元数据对象
 * @returns {Document} 更新后的元数据
 */
function extractJsonData(schema, metadata) {
  if (Array.isArray(schema)) {
    // 处理数组
    schema.forEach(item => {
      metadata = extractJsonData(item, metadata);
    });
    return metadata;
  }
  
  if (typeof schema !== 'object' || schema === null) {
    return metadata;
  }
  
  // 提取作者
  if (schema.author) {
    const author = extractJsonAuthor(schema.author);
    if (author) {
      metadata.author = normalizeAuthors(metadata.author, author);
    }
  }
  
  // 提取标题
  if (schema.headline && !metadata.title) {
    metadata.title = trim(schema.headline);
  } else if (schema.name && !metadata.title) {
    metadata.title = trim(schema.name);
  }
  
  // 提取描述
  if (schema.description && !metadata.description) {
    metadata.description = trim(schema.description);
  }
  
  // 提取日期
  if (schema.datePublished && !metadata.date) {
    metadata.date = trim(schema.datePublished);
  } else if (schema.dateCreated && !metadata.date) {
    metadata.date = trim(schema.dateCreated);
  }
  
  // 提取 URL
  if (schema.url && !metadata.url && isValidUrl(schema.url)) {
    metadata.url = schema.url;
  }
  
  // 提取图片
  if (schema.image && !metadata.image) {
    if (typeof schema.image === 'string') {
      metadata.image = schema.image;
    } else if (schema.image.url) {
      metadata.image = schema.image.url;
    }
  }
  
  // 提取站点名称
  if (schema.publisher && !metadata.sitename) {
    if (typeof schema.publisher === 'string') {
      metadata.sitename = schema.publisher;
    } else if (schema.publisher.name) {
      metadata.sitename = schema.publisher.name;
    }
  }
  
  // 递归处理嵌套对象
  if (schema['@graph']) {
    metadata = extractJsonData(schema['@graph'], metadata);
  }
  
  return metadata;
}

/**
 * 从 JSON 中提取作者
 * 
 * @param {Object|Array|string} authorData - 作者数据
 * @returns {string|null} 作者字符串
 */
function extractJsonAuthor(authorData) {
  if (!authorData) return null;
  
  if (typeof authorData === 'string') {
    return trim(authorData);
  }
  
  if (Array.isArray(authorData)) {
    const authors = authorData
      .map(a => extractJsonAuthor(a))
      .filter(a => a);
    return authors.join('; ');
  }
  
  if (typeof authorData === 'object') {
    if (authorData.name) {
      return trim(authorData.name);
    }
  }
  
  return null;
}

/**
 * 尝试从损坏的 JSON 中提取数据
 * 对应 Python json_metadata.py: extract_json_parse_error()
 * 
 * @param {string} text - JSON 文本
 * @param {Document} metadata - 元数据对象
 * @returns {Document} 更新后的元数据
 */
function extractJsonParseError(text, metadata) {
  // 尝试提取关键字段
  const patterns = {
    headline: /"headline"\s*:\s*"([^"]+)"/,
    author: /"author"\s*:\s*"([^"]+)"/,
    datePublished: /"datePublished"\s*:\s*"([^"]+)"/,
    description: /"description"\s*:\s*"([^"]+)"/,
  };
  
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern);
    if (match) {
      const value = trim(match[1]);
      if (key === 'headline' && !metadata.title) {
        metadata.title = value;
      } else if (key === 'author') {
        metadata.author = normalizeAuthors(metadata.author, value);
      } else if (key === 'datePublished' && !metadata.date) {
        metadata.date = value;
      } else if (key === 'description' && !metadata.description) {
        metadata.description = value;
      }
    }
  }
  
  return metadata;
}

/**
 * 搜索 OpenGraph 元标签
 * 对应 Python: extract_opengraph()
 * 
 * @param {Element} tree - HTML 树
 * @returns {Object} OpenGraph 数据
 */
export function extractOpengraph(tree) {
  const result = {
    title: null,
    author: null,
    url: null,
    description: null,
    sitename: null,
    image: null,
    pagetype: null,
  };
  
  // 检测 OpenGraph schema
  const ogMetas = tree.querySelectorAll('head meta[property^="og:"]');
  
  ogMetas.forEach(elem => {
    const property = elem.getAttribute('property');
    const content = elem.getAttribute('content');
    
    // 安全检查
    if (!content || /^\s*$/.test(content)) {
      return;
    }
    
    // 映射到结果对象
    if (property in OG_PROPERTIES) {
      const key = OG_PROPERTIES[property];
      result[key] = content;
    } else if (property === 'og:url' && isValidUrl(content)) {
      result.url = content;
    } else if (OG_AUTHOR.has(property)) {
      result.author = normalizeAuthors(result.author, content);
    }
  });
  
  return result;
}

/**
 * 搜索 meta 标签获取相关信息
 * 对应 Python: examine_meta()
 * 
 * @param {Element} tree - HTML 树
 * @returns {Document} 元数据对象
 */
export function examineMeta(tree) {
  // 从 OpenGraph 标签开始
  const metadata = new Document();
  metadata.fromDict(extractOpengraph(tree));
  
  // 如果所有值都已赋值，直接返回
  if (metadata.title && metadata.author && metadata.url && 
      metadata.description && metadata.sitename && metadata.image) {
    return metadata;
  }
  
  const tags = [];
  let backupSitename = null;
  
  // 遍历 meta 标签
  const metaTags = tree.querySelectorAll('head meta[content]');
  
  metaTags.forEach(elem => {
    // 获取 content 属性
    let contentAttr = elem.getAttribute('content') || '';
    contentAttr = contentAttr.replace(/<[^>]+>/g, '').trim();
    
    if (!contentAttr) return;
    
    // property 属性
    if (elem.hasAttribute('property')) {
      const propertyAttr = elem.getAttribute('property').toLowerCase();
      
      // 跳过 opengraph（已处理）
      if (propertyAttr.startsWith('og:')) {
        return;
      }
      
      if (propertyAttr === 'article:tag') {
        tags.push(normalizeTags(contentAttr));
      } else if (PROPERTY_AUTHOR.has(propertyAttr)) {
        metadata.author = normalizeAuthors(metadata.author, contentAttr);
      } else if (propertyAttr === 'article:publisher') {
        metadata.sitename = metadata.sitename || contentAttr;
      } else if (METANAME_IMAGE.has(propertyAttr)) {
        metadata.image = metadata.image || contentAttr;
      }
    }
    // name 属性
    else if (elem.hasAttribute('name')) {
      const nameAttr = elem.getAttribute('name').toLowerCase();
      
      // 作者
      if (METANAME_AUTHOR.has(nameAttr)) {
        metadata.author = normalizeAuthors(metadata.author, contentAttr);
      }
      // 标题
      else if (METANAME_TITLE.has(nameAttr)) {
        metadata.title = metadata.title || contentAttr;
      }
      // 描述
      else if (METANAME_DESCRIPTION.has(nameAttr)) {
        metadata.description = metadata.description || contentAttr;
      }
      // 站点名称
      else if (METANAME_PUBLISHER.has(nameAttr)) {
        metadata.sitename = metadata.sitename || contentAttr;
      }
      // 图片
      else if (METANAME_IMAGE.has(nameAttr)) {
        metadata.image = metadata.image || contentAttr;
      }
      // Twitter
      else if (TWITTER_ATTRS.has(nameAttr) || nameAttr.includes('twitter:app:name')) {
        backupSitename = contentAttr;
      }
      // URL
      else if (nameAttr === 'twitter:url' && !metadata.url && isValidUrl(contentAttr)) {
        metadata.url = contentAttr;
      }
      // 关键词
      else if (METANAME_TAG.has(nameAttr)) {
        tags.push(normalizeTags(contentAttr));
      }
    }
    // itemprop 属性
    else if (elem.hasAttribute('itemprop')) {
      const itempropAttr = elem.getAttribute('itemprop').toLowerCase();
      
      if (itempropAttr === 'author') {
        metadata.author = normalizeAuthors(metadata.author, contentAttr);
      } else if (itempropAttr === 'description') {
        metadata.description = metadata.description || contentAttr;
      } else if (itempropAttr === 'headline') {
        metadata.title = metadata.title || contentAttr;
      }
    }
  });
  
  // 备份
  metadata.sitename = metadata.sitename || backupSitename;
  metadata.tags = tags.filter(t => t);
  
  return metadata;
}

/**
 * 使用 XPath 表达式提取元信息
 * 对应 Python: extract_metainfo()
 * 
 * @param {Element} tree - HTML 树
 * @param {Array<string>} expressions - XPath 表达式列表
 * @param {number} lenLimit - 长度限制
 * @returns {string|null} 提取的信息
 */
export function extractMetainfo(tree, expressions, lenLimit = 200) {
  // 尝试所有 XPath 表达式
  for (const expression of expressions) {
    try {
      // 评估 XPath
      const result = document.evaluate(
        expression,
        tree,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null
      );
      
      // 检查所有结果
      for (let i = 0; i < result.snapshotLength; i++) {
        const elem = result.snapshotItem(i);
        const content = trim(elem.textContent);
        
        if (content && content.length > 2 && content.length < lenLimit) {
          return content;
        }
      }
    } catch (e) {
      console.warn(`XPath evaluation failed: ${expression}`, e);
    }
  }
  
  return null;
}

/**
 * 从主 <title> 元素中提取文本段
 * 对应 Python: examine_title_element()
 * 
 * @param {Element} tree - HTML 树
 * @returns {Array} [title, firstPart, secondPart]
 */
export function examineTitleElement(tree) {
  let title = '';
  const titleElement = tree.querySelector('head title');
  
  if (titleElement) {
    title = trim(titleElement.textContent);
    const match = title.match(HTMLTITLE_REGEX);
    
    if (match) {
      return [title, match[1], match[2]];
    }
  }
  
  console.debug('No main title found');
  return [title, null, null];
}

/**
 * 提取文档标题
 * 对应 Python: extract_title()
 * 
 * @param {Element} tree - HTML 树
 * @returns {string|null} 标题
 */
export function extractTitle(tree) {
  // 只有一个 h1 元素：使用它
  const h1Results = tree.querySelectorAll('h1');
  
  if (h1Results.length === 1) {
    const title = trim(h1Results[0].textContent);
    if (title) {
      return title;
    }
  }
  
  // 使用 XPath 提取
  let title = extractMetainfo(tree, TITLE_XPATHS) || '';
  if (title) {
    return title;
  }
  
  // 使用 title 标签提取
  const [fullTitle, first, second] = examineTitleElement(tree);
  
  for (const t of [first, second]) {
    if (t && !t.includes('.')) {
      return t;
    }
  }
  
  // 使用第一个 h1 标题
  if (h1Results.length > 0) {
    return h1Results[0].textContent;
  }
  
  // 使用第一个 h2 标题
  const h2Results = tree.querySelectorAll('h2');
  if (h2Results.length > 0) {
    title = h2Results[0].textContent;
  } else {
    console.debug('No h2 title found');
  }
  
  return title || null;
}

/**
 * 提取文档作者
 * 对应 Python: extract_author()
 * 
 * @param {Element} tree - HTML 树
 * @returns {string|null} 作者
 */
export function extractAuthor(tree) {
  // 克隆树并修剪不需要的节点
  const subtree = tree.cloneNode(true);
  
  // TODO: 实现 pruneUnwantedNodes with AUTHOR_DISCARD_XPATHS
  
  let author = extractMetainfo(subtree, AUTHOR_XPATHS, 120);
  
  if (author) {
    author = normalizeAuthors(null, author);
  }
  
  return author;
}

/**
 * 从 canonical link 提取 URL
 * 对应 Python: extract_url()
 * 
 * @param {Element} tree - HTML 树
 * @param {string|null} defaultUrl - 默认 URL
 * @returns {string|null} URL
 */
export function extractUrl(tree, defaultUrl = null) {
  let url = null;
  
  // XPath 选择器
  const xpathSelectors = [
    './/head//link[@rel="canonical"]',
    './/head//base',
    './/head//link[@rel="alternate"][@hreflang="x-default"]',
  ];
  
  // 尝试所有选择器
  for (const selector of xpathSelectors) {
    try {
      const result = document.evaluate(
        selector,
        tree,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      );
      
      if (result.singleNodeValue) {
        url = result.singleNodeValue.getAttribute('href');
        if (url) break;
      }
    } catch (e) {
      // 尝试下一个选择器
    }
  }
  
  // 修复相对 URL
  if (url && url.startsWith('/')) {
    const metaTags = tree.querySelectorAll('head meta[content]');
    
    for (const element of metaTags) {
      const attrtype = element.getAttribute('name') || element.getAttribute('property') || '';
      
      if (attrtype.startsWith('og:') || attrtype.startsWith('twitter:')) {
        const baseUrl = getBaseUrl(element.getAttribute('content'));
        if (baseUrl) {
          url = baseUrl + url;
          break;
        }
      }
    }
  }
  
  // 不返回无效 URL
  if (url) {
    const [isValid, parsedUrl] = validateUrl(url);
    url = isValid ? normalizeUrl(parsedUrl) : null;
  }
  
  return url || defaultUrl;
}

/**
 * 从主标题提取站点名称
 * 对应 Python: extract_sitename()
 * 
 * @param {Element} tree - HTML 树
 * @returns {string|null} 站点名称
 */
export function extractSitename(tree) {
  const [, ...parts] = examineTitleElement(tree);
  
  for (const part of parts) {
    if (part && part.includes('.')) {
      return part;
    }
  }
  
  return null;
}

/**
 * 查找分类和标签信息
 * 对应 Python: extract_catstags()
 * 
 * @param {string} metatype - 'category' 或 'tag'
 * @param {Element} tree - HTML 树
 * @returns {Array<string>} 分类或标签列表
 */
export function extractCatstags(metatype, tree) {
  const results = [];
  const regexpr = new RegExp(`/${metatype}[s|ies]?/`);
  const xpathExpression = metatype === 'category' ? CATEGORIES_XPATHS : TAGS_XPATHS;
  
  // 使用自定义表达式搜索
  for (const expr of xpathExpression) {
    try {
      const xpathResult = document.evaluate(
        expr,
        tree,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null
      );
      
      for (let i = 0; i < xpathResult.snapshotLength; i++) {
        const elem = xpathResult.snapshotItem(i);
        const href = elem.getAttribute('href');
        
        if (href && regexpr.test(href)) {
          results.push(elem.textContent);
        }
      }
      
      if (results.length > 0) break;
    } catch (e) {
      console.warn(`XPath evaluation failed: ${expr}`, e);
    }
  }
  
  // 分类回退
  if (metatype === 'category' && results.length === 0) {
    const metaTags = tree.querySelectorAll(
      'head meta[property="article:section"][content], head meta[name*="subject"][content]'
    );
    
    metaTags.forEach(element => {
      results.push(element.getAttribute('content'));
    });
  }
  
  // 处理并去重
  const processed = results
    .map(x => lineProcessing(x))
    .filter(x => x);
  
  return Array.from(new Set(processed));
}

/**
 * 解析链接元素以查找可识别的自由许可证线索
 * 对应 Python: parse_license_element()
 * 
 * @param {Element} element - 链接元素
 * @param {boolean} strict - 是否严格模式
 * @returns {string|null} 许可证信息
 */
export function parseLicenseElement(element, strict = false) {
  // 查找 Creative Commons 元素
  const href = element.getAttribute('href') || '';
  const match = href.match(LICENSE_REGEX);
  
  if (match) {
    return `CC ${match[1].toUpperCase()} ${match[2]}`;
  }
  
  const text = element.textContent;
  if (text) {
    // 检查是否可能是 CC 许可证
    if (strict) {
      const textMatch = text.match(TEXT_LICENSE_REGEX);
      return textMatch ? textMatch[0] : null;
    }
    return trim(text);
  }
  
  return null;
}

/**
 * 搜索 HTML 代码中的许可证信息并解析
 * 对应 Python: extract_license()
 * 
 * @param {Element} tree - HTML 树
 * @returns {string|null} 许可证信息
 */
export function extractLicense(tree) {
  // 查找标记为 license 的链接
  const licenseLinks = tree.querySelectorAll('a[rel="license"][href]');
  
  for (const element of licenseLinks) {
    const result = parseLicenseElement(element, false);
    if (result) {
      return result;
    }
  }
  
  // 在 footer 元素中探测 CC 链接
  const footerLinks = tree.querySelectorAll(
    'footer a[href], div[class*="footer"] a[href], div[id*="footer"] a[href]'
  );
  
  for (const element of footerLinks) {
    const result = parseLicenseElement(element, true);
    if (result) {
      return result;
    }
  }
  
  return null;
}

/**
 * 元数据提取的主流程
 * 对应 Python: extract_metadata()
 * 
 * @param {Element|string} filecontent - HTML 代码字符串或解析后的树
 * @param {string|null} defaultUrl - 已知的文档 URL
 * @param {Object|null} dateConfig - htmldate 提取参数
 * @param {boolean} extensive - 是否进行广泛搜索
 * @param {Set<string>|null} authorBlacklist - 作者黑名单
 * @returns {Document} 包含提取的元数据信息的 Document 对象
 */
export async function extractMetadata(
  filecontent,
  defaultUrl = null,
  dateConfig = null,
  extensive = true,
  authorBlacklist = null
) {
  // 初始化
  authorBlacklist = authorBlacklist || new Set();
  // dateConfig = dateConfig || setDateParams(extensive); // TODO: 实现日期参数
  
  // 加载内容
  const { parseHTML } = await import('../utils/dom-utils.js');
  const tree = parseHTML(filecontent);
  
  if (!tree) {
    return new Document();
  }
  
  // 初始化并尝试提取 meta 标签
  let metadata = examineMeta(tree);
  
  // 检查：移除单字作者
  if (metadata.author && !metadata.author.includes(' ')) {
    metadata.author = null;
  }
  
  // 修复：尝试 JSON-LD 元数据并覆盖
  try {
    metadata = extractMetaJson(tree, metadata);
  } catch (err) {
    console.warn('Error in JSON metadata extraction:', err);
  }
  
  // 标题
  if (!metadata.title) {
    metadata.title = extractTitle(tree);
  }
  
  // 检查作者黑名单
  if (metadata.author && authorBlacklist.size > 0) {
    metadata.author = checkAuthors(metadata.author, authorBlacklist);
  }
  
  // 作者
  if (!metadata.author) {
    metadata.author = extractAuthor(tree);
  }
  
  // 再次检查作者黑名单
  if (metadata.author && authorBlacklist.size > 0) {
    metadata.author = checkAuthors(metadata.author, authorBlacklist);
  }
  
  // URL
  if (!metadata.url) {
    metadata.url = extractUrl(tree, defaultUrl);
  }
  
  // 主机名
  if (metadata.url) {
    const { extractDomain } = await import('../utils/url-utils.js');
    metadata.hostname = extractDomain(metadata.url, true);
  }
  
  // 使用外部模块 htmldate 提取日期
  // TODO: 实现 find_date
  // if (dateConfig) {
  //   dateConfig.url = metadata.url;
  //   metadata.date = findDate(tree, dateConfig);
  // }
  
  // 站点名称
  if (!metadata.sitename) {
    metadata.sitename = extractSitename(tree);
  }
  
  if (metadata.sitename) {
    // 修复：取第一个元素
    if (Array.isArray(metadata.sitename)) {
      metadata.sitename = metadata.sitename[0];
    }
    // 修复：可能来自 json_metadata 的错误
    else if (typeof metadata.sitename === 'object') {
      metadata.sitename = String(metadata.sitename);
    }
    
    // 移除 Twitter ID
    metadata.sitename = metadata.sitename.replace(/^@/, '');
    
    // 首字母大写
    if (metadata.sitename && 
        !metadata.sitename.includes('.') && 
        metadata.sitename[0] !== metadata.sitename[0].toUpperCase()) {
      metadata.sitename = metadata.sitename.charAt(0).toUpperCase() + 
                          metadata.sitename.slice(1);
    }
  }
  // 使用 URL
  else if (metadata.url) {
    const match = metadata.url.match(/https?:\/\/(?:www\.|w[0-9]+\.)?([^\/]+)/);
    if (match) {
      metadata.sitename = match[1];
    }
  }
  
  // 分类
  if (!metadata.categories || metadata.categories.length === 0) {
    metadata.categories = extractCatstags('category', tree);
  }
  
  // 标签
  if (!metadata.tags || metadata.tags.length === 0) {
    metadata.tags = extractCatstags('tag', tree);
  }
  
  // 许可证
  metadata.license = extractLicense(tree);
  
  // 安全检查
  // metadata.filedate = dateConfig?.max_date || null;
  metadata.cleanAndTrim();
  
  return metadata;
}

// 默认导出
export default {
  normalizeTags,
  checkAuthors,
  normalizeAuthors,
  extractMetaJson,
  extractOpengraph,
  examineMeta,
  extractMetainfo,
  examineTitleElement,
  extractTitle,
  extractAuthor,
  extractUrl,
  extractSitename,
  extractCatstags,
  parseLicenseElement,
  extractLicense,
  extractMetadata,
};

