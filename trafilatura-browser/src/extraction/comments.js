/**
 * 评论提取模块
 * 
 * 从HTML中提取用户评论
 * 对应Python模块: trafilatura/main_extractor.py:extract_comments()
 * 
 * @module extraction/comments
 */

import { handleTextNode } from './handlers/node-processing.js';
import { deleteElement } from '../output/xml-processing.js';

/**
 * 评论区域识别的CSS选择器
 * 对应Python: COMMENTS_XPATH - xpaths.py:66-78
 * 
 * 按优先级排序，从最精确到最宽泛
 */
const COMMENTS_SELECTORS = [
  // 最精确：包含特定class/id组合
  `div[id*="commentlist"], div[class*="commentlist"],
   list[id*="commentlist"], list[class*="commentlist"],
   section[id*="commentlist"], section[class*="commentlist"],
   div[class*="comment-page"],
   div[id*="comment-list"], div[class*="comment-list"],
   list[id*="comment-list"], list[class*="comment-list"],
   section[id*="comment-list"], section[class*="comment-list"],
   div[class*="comments-content"], section[class*="comments-content"],
   div[class*="post-comments"], section[class*="post-comments"]`,
  
  // 次精确：以comments开头
  `div[id^="comments"], div[class^="comments"],
   section[id^="comments"], section[class^="comments"],
   list[id^="comments"], list[class^="comments"],
   div[class^="Comments"], section[class^="Comments"],
   div[id^="comment-"], div[class^="comment-"],
   section[id^="comment-"], section[class^="comment-"],
   list[id^="comment-"], list[class^="comment-"],
   div[class*="article-comments"], section[class*="article-comments"]`,
  
  // 第三优先级：特定平台
  `div[id^="comol"], section[id^="comol"],
   div[id^="disqus_thread"], section[id^="disqus_thread"],
   div[id^="dsq-comments"], section[id^="dsq-comments"]`,
  
  // 最宽泛：social或包含comment
  `div[id^="social"], section[id^="social"],
   div[class*="comment"], section[class*="comment"]`
];

/**
 * 评论区域内需要删除的元素选择器
 * 对应Python: COMMENTS_DISCARD_XPATH - xpaths.py:198-206
 */
const COMMENTS_DISCARD_SELECTORS = [
  'div[id^="respond"]',
  'section[id^="respond"]',
  'cite',
  'quote',
  '.comments-title',
  '[class*="comments-title"]',
  '[class*="nocomments"]',
  '[id^="reply-"]',
  '[class^="reply-"]',
  '[class*="-reply-"]',
  '[class*="message"]',
  '[class*="signin"]',
  '[id*="akismet"]',
  '[class*="akismet"]',
  '[style*="display:none"]',
  '[style*="display: none"]'
];

/**
 * 标签目录：允许的评论内容标签
 * 对应Python: TAG_CATALOG - settings.py:436-438
 */
const TAG_CATALOG = new Set([
  'blockquote', 'code', 'del', 'head', 'hi', 'lb', 'list', 'p', 'pre', 'quote'
]);

/**
 * 处理评论节点
 * 对应Python: process_comments_node() - main_extractor.py:662-673
 * 
 * @param {Element} elem - 元素节点
 * @param {Set<string>} potentialTags - 允许的标签集合
 * @param {Extractor} options - 提取选项
 * @returns {Element|null} 处理后的元素或null
 */
function processCommentsNode(elem, potentialTags, options) {
  if (!elem || !elem.tagName) {
    return null;
  }
  
  const tag = elem.tagName.toLowerCase();
  
  // 只处理允许的标签
  if (potentialTags.has(tag)) {
    // 使用handleTextnode处理文本节点，comments_fix=true
    const processedElement = handleTextNode(elem, options, true, false);
    
    if (processedElement) {
      // 清除所有属性
      while (processedElement.attributes.length > 0) {
        processedElement.removeAttribute(processedElement.attributes[0].name);
      }
      
      return processedElement;
    }
  }
  
  return null;
}

/**
 * 删除标签但保留内容（类似Python的strip_tags）
 * 
 * @param {Element} subtree - 要处理的子树
 * @param {Array<string>} tagNames - 要删除的标签名数组
 */
function stripTags(subtree, tagNames) {
  if (!subtree) return;
  
  for (const tagName of tagNames) {
    const elements = Array.from(subtree.querySelectorAll(tagName));
    
    for (const elem of elements) {
      // 将所有子节点移动到父节点
      while (elem.firstChild) {
        elem.parentNode.insertBefore(elem.firstChild, elem);
      }
      
      // 删除空元素
      if (elem.parentNode) {
        elem.parentNode.removeChild(elem);
      }
    }
  }
}

/**
 * 提取评论内容
 * 对应Python: extract_comments() - main_extractor.py:676-707
 * 
 * 主要步骤：
 * 1. 使用多个选择器查找评论区域
 * 2. 修剪不需要的子元素
 * 3. 删除链接和span标签（保留内容）
 * 4. 处理所有允许的标签
 * 5. 返回评论body、文本、长度和修改后的tree
 * 
 * @param {Element} tree - HTML DOM树
 * @param {Extractor} options - 提取选项
 * @returns {Object} 包含commentsbody, temp_comments, len_comments, tree
 * 
 * @example
 * const result = extractComments(tree, options);
 * // result = {
 * //   commentsbody: Element,
 * //   temp_comments: "评论文本",
 * //   len_comments: 100,
 * //   tree: Element
 * // }
 */
export function extractComments(tree, options) {
  if (!tree || !options) {
    return {
      commentsbody: null,
      temp_comments: '',
      len_comments: 0,
      tree: tree
    };
  }
  
  // 创建评论body容器
  const doc = tree.ownerDocument || document;
  const commentsBody = doc.createElement('body');
  
  // 定义允许的标签
  const potentialTags = new Set(TAG_CATALOG);
  
  // 遍历所有评论选择器
  for (const selector of COMMENTS_SELECTORS) {
    try {
      // 查找评论区域（找到第一个匹配的）
      const subtree = tree.querySelector(selector);
      
      if (!subtree) {
        continue;
      }
      
      // 1. 修剪不需要的节点
      for (const discardSelector of COMMENTS_DISCARD_SELECTORS) {
        try {
          const unwanted = Array.from(subtree.querySelectorAll(discardSelector));
          for (const elem of unwanted) {
            if (elem.parentNode) {
              elem.parentNode.removeChild(elem);
            }
          }
        } catch (e) {
          // 某些选择器可能无效，跳过
          console.debug('Invalid discard selector:', discardSelector, e);
        }
      }
      
      // 2. 删除链接和span标签（但保留内容）
      // 对应Python: strip_tags(subtree, "a", "ref", "span")
      stripTags(subtree, ['a', 'ref', 'span']);
      
      // 3. 提取内容 - 处理所有子元素
      const allElements = Array.from(subtree.querySelectorAll('*'));
      
      for (const elem of allElements) {
        const processedElem = processCommentsNode(elem, potentialTags, options);
        
        if (processedElem) {
          commentsBody.appendChild(processedElem);
        }
      }
      
      // 4. 控制 - 如果找到了评论内容
      if (commentsBody.children.length > 0) {
        console.debug('Found comments with selector:', selector);
        
        // 从原树中删除评论区域（避免重复）
        deleteElement(subtree, false);
        
        // 找到评论后立即退出
        break;
      }
    } catch (e) {
      console.debug('Error processing comments selector:', selector, e);
      continue;
    }
  }
  
  // 5. 计算长度
  const tempComments = (commentsBody.textContent || '').trim();
  const lenComments = tempComments.length;
  
  return {
    commentsbody: commentsBody.children.length > 0 ? commentsBody : null,
    temp_comments: tempComments,
    len_comments: lenComments,
    tree: tree
  };
}

/**
 * 导出所有函数
 */
export default {
  extractComments,
  TAG_CATALOG,
  COMMENTS_SELECTORS,
  COMMENTS_DISCARD_SELECTORS
};

