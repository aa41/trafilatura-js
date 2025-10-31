/**
 * JSON-LD元数据提取模块
 * 
 * 实现从JSON-LD格式提取元数据的功能
 * 对应Python模块: trafilatura/json_metadata.py
 * 
 * @module metadata/json-ld
 * 
 * JSON-LD类型参考: https://schema.org/docs/full.html
 */

import { trim } from '../utils/text.js';
import { normalizeAuthors } from './meta.js';

/**
 * 解码常见的HTML实体
 * @param {string} str - 要解码的字符串
 * @returns {string} 解码后的字符串
 */
function decodeHtmlEntities(str) {
  const entities = {
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
    '&#39;': "'",
    '&apos;': "'",
    '&amp;': '&'
  };
  
  return str.replace(/&[a-z0-9#]+;/gi, match => entities[match] || match);
}

/**
 * JSON-LD Schema类型集合
 */

// Article类型集合
const JSON_ARTICLE_SCHEMA = new Set([
  'article',
  'backgroundnewsarticle',
  'blogposting',
  'medicalscholarlyarticle',
  'newsarticle',
  'opinionnewsarticle',
  'reportagenewsarticle',
  'scholarlyarticle',
  'socialmediaposting',
  'liveblogposting'
]);

// OG Type类型集合（用于pagetype）
const JSON_OGTYPE_SCHEMA = new Set([
  'aboutpage', 'checkoutpage', 'collectionpage', 'contactpage',
  'faqpage', 'itempage', 'medicalwebpage', 'profilepage',
  'qapage', 'realestatelisting', 'searchresultspage',
  'webpage', 'website',
  'article', 'advertisercontentarticle', 'newsarticle',
  'analysisnewsarticle', 'askpublicnewsarticle', 'backgroundnewsarticle',
  'opinionnewsarticle', 'reportagenewsarticle', 'reviewnewsarticle',
  'report', 'satiricalarticle', 'scholarlyarticle',
  'medicalscholarlyarticle', 'socialmediaposting',
  'blogposting', 'liveblogposting', 'discussionforumposting',
  'techarticle', 'blog', 'jobposting'
]);

// 出版商类型集合
const JSON_PUBLISHER_SCHEMA = new Set([
  'newsmediaorganization',
  'organization',
  'webpage',
  'website'
]);

// 作者属性（用于组合作者名）
const AUTHOR_ATTRS = ['givenName', 'additionalName', 'familyName'];

/**
 * 标准化JSON字符串
 * 对应Python: normalize_json() - json_metadata.py:216-223
 * 
 * 功能：
 * 1. 移除转义字符 (\n, \r, \t)
 * 2. 解码Unicode转义 (\uXXXX)
 * 3. 移除HTML标签
 * 4. 清理空格
 * 
 * @param {string} str - 要标准化的字符串
 * @returns {string} 标准化后的字符串
 */
export function normalizeJson(str) {
  if (!str || typeof str !== 'string') {
    return '';
  }
  
  // 移除常见转义字符
  str = str.replace(/\\n/g, '').replace(/\\r/g, '').replace(/\\t/g, '');
  
  // 解码Unicode转义序列 (\uXXXX)
  str = str.replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => {
    return String.fromCharCode(parseInt(code, 16));
  });
  
  // 移除代理对范围的字符 (U+D800 to U+DFFF)
  str = str.split('').filter(c => {
    const code = c.charCodeAt(0);
    return code < 0xD800 || code > 0xDFFF;
  }).join('');
  
  // 解码HTML实体
  // 使用textarea的方法（更可靠）
  if (typeof document !== 'undefined') {
    try {
      const textarea = document.createElement('textarea');
      textarea.innerHTML = str;
      str = textarea.value;
    } catch (e) {
      // Fallback
      str = decodeHtmlEntities(str);
    }
  } else {
    // Node.js环境
    str = decodeHtmlEntities(str);
  }
  
  // 移除HTML标签
  str = str.replace(/<[^>]+>/g, '');
  
  // 清理空格
  return trim(str);
}

/**
 * 判断候选网站名是否应该使用
 * 对应Python: is_plausible_sitename() - json_metadata.py:57-64
 * 
 * @param {Object} metadata - 元数据对象
 * @param {any} candidate - 候选网站名
 * @param {string} contentType - 内容类型
 * @returns {boolean} 是否应该使用
 */
function isPlausibleSitename(metadata, candidate, contentType = null) {
  if (candidate && typeof candidate === 'string') {
    // 如果没有现有sitename，或候选更长且不是webpage类型
    if (!metadata.sitename || (
      metadata.sitename.length < candidate.length && 
      contentType !== 'webpage'
    )) {
      return true;
    }
    // 如果现有sitename是URL，候选不是URL
    if (metadata.sitename && 
        metadata.sitename.startsWith('http') && 
        !candidate.startsWith('http')) {
      return true;
    }
  }
  return false;
}

/**
 * 处理JSON-LD父级数组
 * 对应Python: process_parent() - json_metadata.py:67-138
 * 
 * @param {Array} parent - JSON-LD数据数组
 * @param {Object} metadata - 元数据对象
 * @returns {Object} 更新后的元数据
 */
function processParent(parent, metadata) {
  if (!Array.isArray(parent)) {
    return metadata;
  }
  
  for (const content of parent.filter(Boolean)) {
    if (!content || typeof content !== 'object') {
      continue;
    }
    
    // 尝试提取publisher
    if (content.publisher && content.publisher.name) {
      metadata.sitename = content.publisher.name;
    }
    
    if (!content['@type']) {
      continue;
    }
    
    // 处理@type（可能是数组或字符串）
    let contentType = content['@type'];
    if (Array.isArray(contentType)) {
      contentType = contentType[0];
    }
    if (typeof contentType !== 'string') {
      continue;
    }
    contentType = contentType.toLowerCase();
    
    // 设置pagetype（如果是文章或网页类型）
    if (JSON_OGTYPE_SCHEMA.has(contentType) && !metadata.pagetype) {
      metadata.pagetype = normalizeJson(contentType);
    }
    
    // 处理Publisher类型
    if (JSON_PUBLISHER_SCHEMA.has(contentType)) {
      const candidate = content.name || content.legalName || content.alternateName;
      if (isPlausibleSitename(metadata, candidate, contentType)) {
        metadata.sitename = candidate;
      }
    }
    // 处理Person类型
    else if (contentType === 'person') {
      if (content.name && !content.name.startsWith('http')) {
        metadata.author = normalizeAuthors(metadata.author, content.name);
      }
    }
    // 处理Article类型
    else if (JSON_ARTICLE_SCHEMA.has(contentType)) {
      // 提取作者
      if (content.author) {
        let listAuthors = content.author;
        
        // 如果是字符串，尝试解析为JSON
        if (typeof listAuthors === 'string') {
          try {
            listAuthors = JSON.parse(listAuthors);
          } catch (e) {
            // 是普通字符串
            metadata.author = normalizeAuthors(metadata.author, listAuthors);
            listAuthors = null;
          }
        }
        
        // 转换为数组
        if (listAuthors && !Array.isArray(listAuthors)) {
          listAuthors = [listAuthors];
        }
        
        // 处理每个作者
        if (Array.isArray(listAuthors)) {
          for (const author of listAuthors) {
            if (!author || typeof author !== 'object') {
              continue;
            }
            
            // 只处理Person类型或没有@type的对象
            if (!author['@type'] || author['@type'] === 'Person') {
              let authorName = null;
              
              // 尝试从name提取
              if (author.name) {
                if (Array.isArray(author.name)) {
                  authorName = author.name.join('; ').trim().replace(/^;+|;+$/g, '');
                } else if (typeof author.name === 'object' && author.name.name) {
                  authorName = author.name.name;
                } else if (typeof author.name === 'string') {
                  authorName = author.name;
                }
              }
              // 尝试从givenName和familyName组合
              else if (author.givenName && author.familyName) {
                const nameParts = AUTHOR_ATTRS
                  .filter(attr => author[attr])
                  .map(attr => author[attr]);
                authorName = nameParts.join(' ');
              }
              
              // 验证并添加作者
              if (typeof authorName === 'string' && authorName.length > 0) {
                metadata.author = normalizeAuthors(metadata.author, authorName);
              }
            }
          }
        }
      }
      
      // 提取分类
      if (!metadata.categories || metadata.categories.length === 0) {
        if (content.articleSection) {
          if (typeof content.articleSection === 'string') {
            metadata.categories = [content.articleSection];
          } else if (Array.isArray(content.articleSection)) {
            metadata.categories = content.articleSection.filter(Boolean);
          }
        }
      }
      
      // 提取标题（headline优先于name）
      if (!metadata.title) {
        if (content.headline) {
          metadata.title = content.headline;
        } else if (content.name && contentType === 'article') {
          metadata.title = content.name;
        }
      }
    }
  }
  
  return metadata;
}

/**
 * 提取并解析JSON-LD数据
 * 对应Python: extract_json() - json_metadata.py:141-160
 * 
 * @param {Object|Array} schema - JSON-LD schema
 * @param {Object} metadata - 元数据对象
 * @returns {Object} 更新后的元数据
 */
export function extractJson(schema, metadata) {
  if (!schema) {
    return metadata;
  }
  
  // 转换为数组
  if (!Array.isArray(schema)) {
    schema = [schema];
  }
  
  for (let parent of schema) {
    if (!parent || typeof parent !== 'object') {
      continue;
    }
    
    const context = parent['@context'];
    
    // 检查是否是schema.org格式
    if (context && typeof context === 'string' && 
        /^https?:\/\/schema\.org/i.test(context)) {
      
      // 处理@graph
      if (parent['@graph']) {
        parent = Array.isArray(parent['@graph']) 
          ? parent['@graph'] 
          : [parent['@graph']];
      }
      // 处理LiveBlogPosting的liveBlogUpdate
      else if (parent['@type'] && 
               typeof parent['@type'] === 'string' && 
               parent['@type'].toLowerCase().includes('liveblogposting') && 
               parent.liveBlogUpdate) {
        parent = Array.isArray(parent.liveBlogUpdate) 
          ? parent.liveBlogUpdate 
          : [parent.liveBlogUpdate];
      }
      // 否则使用原始schema
      else {
        parent = schema;
      }
      
      metadata = processParent(parent, metadata);
    }
  }
  
  return metadata;
}

/**
 * 从HTML树中提取JSON-LD元数据
 * 对应Python: extract_meta_json() - metadata.py:182-195
 * 
 * 这是主入口函数，查找所有JSON-LD script标签并解析
 * 
 * @param {Document|Element} tree - HTML文档树
 * @param {Object} metadata - 元数据对象
 * @returns {Object} 更新后的元数据
 * 
 * @example
 * const metadata = { title: null, author: null, ... };
 * const updated = extractMetaJson(document, metadata);
 * console.log(updated.title, updated.author);
 */
export function extractMetaJson(tree, metadata = {}) {
  if (!tree) {
    return metadata;
  }
  
  // 查找所有JSON-LD script标签
  const scripts = tree.querySelectorAll(
    'script[type="application/ld+json"], script[type="application/settings+json"]'
  );
  
  for (const elem of scripts) {
    const text = elem.textContent || elem.innerText;
    if (!text || !text.trim()) {
      continue;
    }
    
    try {
      // 尝试解析JSON
      const schema = JSON.parse(text);
      metadata = extractJson(schema, metadata);
    } catch (e) {
      // JSON解析失败，尝试提取部分信息
      console.warn('Failed to parse JSON-LD:', e.message);
      metadata = extractJsonParseError(text, metadata);
    }
  }
  
  return metadata;
}

/**
 * 当JSON解析失败时，尝试用正则表达式提取信息
 * 对应Python: extract_json_parse_error() - json_metadata.py:174-213
 * 
 * @param {string} text - JSON-LD文本
 * @param {Object} metadata - 元数据对象
 * @returns {Object} 更新后的元数据
 */
function extractJsonParseError(text, metadata) {
  if (!text) {
    return metadata;
  }
  
  // 尝试提取作者（简化版，只处理最常见的格式）
  const authorMatch = text.match(/"author"[^}]*?"name"\s*:\s*"([^"]+)"/);
  if (authorMatch && !metadata.author) {
    metadata.author = normalizeJson(authorMatch[1]);
  }
  
  // 尝试提取类型
  if (!metadata.pagetype) {
    const typeMatch = text.match(/"@type"\s*:\s*"([^"]+)"/);
    if (typeMatch) {
      const candidate = normalizeJson(typeMatch[1].toLowerCase());
      if (JSON_OGTYPE_SCHEMA.has(candidate)) {
        metadata.pagetype = candidate;
      }
    }
  }
  
  // 尝试提取出版商
  if (!metadata.sitename) {
    const publisherMatch = text.match(/"publisher"[^}]*?"name"\s*:\s*"([^"]+)"/);
    if (publisherMatch && !publisherMatch[1].includes(',')) {
      const candidate = normalizeJson(publisherMatch[1]);
      if (isPlausibleSitename(metadata, candidate)) {
        metadata.sitename = candidate;
      }
    }
  }
  
  // 尝试提取分类
  if (!metadata.categories || metadata.categories.length === 0) {
    const categoryMatch = text.match(/"articleSection"\s*:\s*"([^"]+)"/);
    if (categoryMatch) {
      metadata.categories = [normalizeJson(categoryMatch[1])];
    }
  }
  
  // 尝试提取标题
  if (!metadata.title) {
    // 尝试headline
    let titleMatch = text.match(/"headline"\s*:\s*"([^"]+)"/);
    if (titleMatch) {
      metadata.title = normalizeJson(titleMatch[1]);
    } else {
      // 尝试name
      titleMatch = text.match(/"@type"\s*:\s*"Article"\s*,\s*"name"\s*:\s*"([^"]+)"/);
      if (titleMatch) {
        metadata.title = normalizeJson(titleMatch[1]);
      }
    }
  }
  
  return metadata;
}

// 导出所有函数
export default {
  extractMetaJson,
  extractJson,
  normalizeJson
};

