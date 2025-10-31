/**
 * Meta标签提取模块
 * 
 * 实现Meta标签和OpenGraph的提取功能
 * 对应Python模块: trafilatura/metadata.py
 * 
 * @module metadata/meta
 */

import { trim } from '../utils/text.js';

/**
 * Meta标签名称分类（对应Python常量）
 * 用于识别不同类型的meta标签
 */

// 作者相关的meta名称
const METANAME_AUTHOR = new Set([
  'author',
  'article:author',
  'article:published',
  'citation_author',
  'creator',
  'dc.creator',
  'dcterms.creator',
  'parsely-author',
  'sailthru.author',
  'twitter:creator'
]);

// 描述相关的meta名称
const METANAME_DESCRIPTION = new Set([
  'description',
  'dc.description',
  'dcterms.description',
  'og:description',
  'twitter:description',
  'sailthru.description'
]);

// 网站名称相关
const METANAME_PUBLISHER = new Set([
  'application-name',
  'article:publisher',
  'citation_journal_title',
  'publisher',
  'dc.publisher',
  'dcterms.publisher',
  'sailthru.publisher',
  'rbpubname',
  'twitter:site'
]);

// 标签/关键词相关
const METANAME_TAG = new Set([
  'citation_keywords',
  'dcterms.subject',
  'keywords',
  'parsely-tags',
  'shareaholic:keywords',
  'tags'
]);

// 标题相关
const METANAME_TITLE = new Set([
  'citation_title',
  'dc.title',
  'dcterms.title',
  'fb_title',
  'headline',
  'parsely-title',
  'sailthru.title',
  'shareaholic:title',
  'rbtitle',
  'title',
  'twitter:title'
]);

// URL相关
const METANAME_URL = new Set([
  'rbmainurl',
  'twitter:url'
]);

// 图片相关
const METANAME_IMAGE = new Set([
  'image',
  'og:image',
  'og:image:url',
  'og:image:secure_url',
  'twitter:image',
  'twitter:image:src'
]);

// OpenGraph属性映射
const OG_PROPERTIES = {
  'og:title': 'title',
  'og:description': 'description',
  'og:site_name': 'sitename',
  'og:image': 'image',
  'og:image:url': 'image',
  'og:image:secure_url': 'image',
  'og:type': 'pagetype'
};

// OpenGraph作者属性
const OG_AUTHOR = new Set(['og:author', 'og:article:author']);

/**
 * 标准化标签字符串
 * 对应Python: normalize_tags() - metadata.py:160-166
 * 
 * @param {string} tags - 标签字符串
 * @returns {string} 标准化后的标签
 * 
 * @example
 * normalizeTags('tag1, tag2,, tag3') // 'tag1, tag2, tag3'
 */
export function normalizeTags(tags) {
  if (!tags || typeof tags !== 'string') {
    return '';
  }
  
  // 清理文本
  const trimmed = trim(tags);
  if (!trimmed) {
    return '';
  }
  
  // 移除特殊字符（除了逗号和连字符）
  const cleaned = trimmed.replace(/[^\w\s,\-\u4e00-\u9fff]/g, '');
  
  // 分割、清理、过滤空值、重新组合
  const tagList = cleaned
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
  
  // 去重
  const uniqueTags = [...new Set(tagList)];
  
  return uniqueTags.join(', ');
}

/**
 * 标准化作者名称
 * 对应Python: normalize_authors() - metadata.py (multiple functions)
 * 
 * 功能：
 * 1. 合并多个作者
 * 2. 移除黑名单作者
 * 3. 标准化格式
 * 
 * @param {string|null} currentAuthor - 当前作者
 * @param {string} newAuthor - 新作者
 * @param {Set<string>} blacklist - 黑名单作者
 * @returns {string|null} 标准化后的作者
 * 
 * @example
 * normalizeAuthors(null, 'John Doe') // 'John Doe'
 * normalizeAuthors('Jane', 'John Doe') // 'Jane; John Doe'
 */
export function normalizeAuthors(currentAuthor, newAuthor, blacklist = new Set()) {
  if (!newAuthor || typeof newAuthor !== 'string') {
    return currentAuthor;
  }
  
  // 清理新作者
  newAuthor = trim(newAuthor);
  if (!newAuthor) {
    return currentAuthor;
  }
  
  // 移除常见前缀（必须后面有空格或冒号）
  // 对应Python: AUTHOR_PREFIX
  newAuthor = newAuthor.replace(/^(written by|words by|words|by|von|from|作者[:：])\s*/i, '');
  
  // 如果没有现有作者，直接返回新作者
  if (!currentAuthor) {
    return checkAuthor(newAuthor, blacklist);
  }
  
  // 检查是否重复
  const currentLower = currentAuthor.toLowerCase();
  const newLower = newAuthor.toLowerCase();
  
  // 完全相同，直接返回
  if (currentLower === newLower) {
    return currentAuthor;
  }
  
  // 一个包含另一个（部分匹配）
  if (currentLower.includes(newLower)) {
    return currentAuthor; // 保留更完整的
  }
  if (newLower.includes(currentLower)) {
    return checkAuthor(newAuthor, blacklist); // 使用更完整的
  }
  
  // 不重复且不包含，合并（用分号分隔）
  const combined = `${currentAuthor}; ${newAuthor}`;
  return checkAuthor(combined, blacklist);
}

/**
 * 检查作者是否在黑名单中
 * 对应Python: check_authors() - metadata.py:169-179
 * 
 * @param {string} authors - 作者字符串
 * @param {Set<string>} blacklist - 黑名单
 * @returns {string|null} 过滤后的作者
 */
function checkAuthor(authors, blacklist = new Set()) {
  if (!authors) return null;
  
  // 创建小写黑名单
  const lowerBlacklist = new Set(
    Array.from(blacklist).map(a => a.toLowerCase())
  );
  
  // 分割作者（用分号分隔）
  const authorList = authors
    .split(';')
    .map(a => a.trim())
    .filter(a => {
      // 过滤空值和黑名单
      if (!a) return false;
      if (lowerBlacklist.has(a.toLowerCase())) return false;
      // 过滤过短的名字（可能是无效的）
      if (a.length < 2) return false;
      // 过滤纯数字
      if (/^\d+$/.test(a)) return false;
      return true;
    });
  
  if (authorList.length === 0) return null;
  
  return authorList.join('; ').trim();
}

/**
 * 提取OpenGraph元数据
 * 对应Python: extract_opengraph() - metadata.py:198-218
 * 
 * @param {Document|Element} tree - HTML文档树
 * @returns {Object} OpenGraph元数据对象
 * 
 * @example
 * const og = extractOpenGraph(document);
 * console.log(og.title, og.description, og.image);
 */
export function extractOpenGraph(tree) {
  if (!tree) return {};
  
  const result = {
    title: null,
    author: null,
    url: null,
    description: null,
    sitename: null,
    image: null,
    pagetype: null
  };
  
  // 查找所有og:开头的meta标签
  const ogTags = tree.querySelectorAll('meta[property^="og:"]');
  
  for (const elem of ogTags) {
    const property = elem.getAttribute('property');
    const content = elem.getAttribute('content');
    
    // 安全检查
    if (!content || !content.trim()) {
      continue;
    }
    
    const contentTrimmed = content.trim();
    
    // 标准OG属性
    if (property in OG_PROPERTIES) {
      const key = OG_PROPERTIES[property];
      // 图片可能有多个，保留第一个
      if (!result[key] || key !== 'image') {
        result[key] = contentTrimmed;
      }
    }
    // OG URL（需要验证）
    else if (property === 'og:url' && contentTrimmed.startsWith('http')) {
      result.url = contentTrimmed;
    }
    // OG作者
    else if (OG_AUTHOR.has(property)) {
      result.author = normalizeAuthors(result.author, contentTrimmed);
    }
  }
  
  return result;
}

/**
 * 检查所有meta标签并提取元数据
 * 对应Python: examine_meta() - metadata.py:221-300+
 * 
 * 这是核心函数，扫描所有meta标签并分类提取信息
 * 注意：Python版本会先调用extract_opengraph，我们这里也要这样做
 * 
 * @param {Document|Element} tree - HTML文档树
 * @returns {Object} 提取的元数据对象
 * 
 * @example
 * const metadata = examineMeta(document);
 * console.log(metadata.title, metadata.author, metadata.description);
 */
export function examineMeta(tree) {
  if (!tree) return {};
  
  // 首先从OpenGraph提取（Python: bootstrap from potential OpenGraph tags）
  const ogData = extractOpenGraph(tree);
  
  const metadata = {
    title: ogData.title || null,
    author: ogData.author || null,
    url: ogData.url || null,
    description: ogData.description || null,
    sitename: ogData.sitename || null,
    date: null,
    categories: [],
    tags: [],
    image: ogData.image || null
  };
  
  // 遍历所有meta标签
  const metaTags = tree.querySelectorAll('meta');
  
  for (const meta of metaTags) {
    // 获取meta标签的名称或属性
    const name = meta.getAttribute('name') || 
                 meta.getAttribute('property') || 
                 meta.getAttribute('itemprop');
    const content = meta.getAttribute('content');
    
    if (!name || !content || !content.trim()) {
      continue;
    }
    
    const nameLower = name.toLowerCase();
    const contentTrimmed = content.trim();
    
    // 作者
    if (METANAME_AUTHOR.has(nameLower)) {
      metadata.author = normalizeAuthors(metadata.author, contentTrimmed);
    }
    // 标题
    else if (METANAME_TITLE.has(nameLower)) {
      if (!metadata.title || contentTrimmed.length > (metadata.title.length || 0)) {
        metadata.title = contentTrimmed;
      }
    }
    // 描述
    else if (METANAME_DESCRIPTION.has(nameLower)) {
      if (!metadata.description || contentTrimmed.length > (metadata.description.length || 0)) {
        metadata.description = contentTrimmed;
      }
    }
    // 网站名称
    else if (METANAME_PUBLISHER.has(nameLower)) {
      if (!metadata.sitename) {
        metadata.sitename = contentTrimmed;
      }
    }
    // URL
    else if (METANAME_URL.has(nameLower)) {
      if (!metadata.url && contentTrimmed.startsWith('http')) {
        metadata.url = contentTrimmed;
      }
    }
    // 图片
    else if (METANAME_IMAGE.has(nameLower)) {
      if (!metadata.image) {
        metadata.image = contentTrimmed;
      }
    }
    // 标签/关键词
    else if (METANAME_TAG.has(nameLower)) {
      const tags = normalizeTags(contentTrimmed);
      if (tags) {
        metadata.tags.push(tags);
      }
    }
    // 日期相关（多种可能的名称）
    else if (nameLower.includes('date') || 
             nameLower.includes('time') || 
             nameLower === 'article:published_time' ||
             nameLower === 'article:modified_time') {
      if (!metadata.date) {
        metadata.date = contentTrimmed;
      }
    }
    // 分类
    else if (nameLower.includes('category') || 
             nameLower.includes('section') ||
             nameLower === 'article:section') {
      metadata.categories.push(contentTrimmed);
    }
  }
  
  // 合并和去重标签
  if (metadata.tags.length > 0) {
    const allTags = metadata.tags.join(', ');
    metadata.tags = normalizeTags(allTags).split(', ').filter(t => t.length > 0);
  }
  
  // 去重分类
  if (metadata.categories.length > 0) {
    metadata.categories = [...new Set(metadata.categories)];
  }
  
  return metadata;
}

/**
 * 合并多个元数据源
 * 
 * @param {Array<Object>} sources - 元数据源数组
 * @returns {Object} 合并后的元数据
 */
export function mergeMetadata(...sources) {
  const result = {
    title: null,
    author: null,
    url: null,
    description: null,
    sitename: null,
    date: null,
    categories: [],
    tags: [],
    image: null
  };
  
  for (const source of sources) {
    if (!source || typeof source !== 'object') continue;
    
    // 简单字段：使用第一个非空值
    for (const key of ['title', 'url', 'sitename', 'date', 'image']) {
      if (!result[key] && source[key]) {
        result[key] = source[key];
      }
    }
    
    // 描述：选择最长的
    if (source.description) {
      if (!result.description || source.description.length > result.description.length) {
        result.description = source.description;
      }
    }
    
    // 作者：累积合并（而不是替换）
    if (source.author) {
      if (!result.author) {
        result.author = source.author;
      } else if (result.author !== source.author) {
        // 避免重复
        const currentLower = result.author.toLowerCase();
        const sourceLower = source.author.toLowerCase();
        if (!currentLower.includes(sourceLower) && !sourceLower.includes(currentLower)) {
          result.author = `${result.author}; ${source.author}`;
        }
      }
    }
    
    // 数组字段：合并
    if (source.categories && Array.isArray(source.categories)) {
      result.categories.push(...source.categories);
    }
    if (source.tags && Array.isArray(source.tags)) {
      result.tags.push(...source.tags);
    }
  }
  
  // 去重
  result.categories = [...new Set(result.categories)];
  result.tags = [...new Set(result.tags)];
  
  return result;
}

// 导出所有函数
export default {
  examineMeta,
  extractOpenGraph,
  normalizeAuthors,
  normalizeTags,
  mergeMetadata
};

