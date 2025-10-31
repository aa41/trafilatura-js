/**
 * 核心提取模块
 * 
 * 实现主要的extract()函数，整合所有提取逻辑
 * 对应Python模块: trafilatura/core.py
 * 
 * @module core/extract
 */

import { loadHtml } from '../utils/dom.js';
import { checkHtmlLang, languageFilter } from '../utils/language.js';
import { duplicateTest, contentFingerprint } from '../utils/deduplication.js';
import { compareExtraction } from '../external/index.js';
import { treeCleaning } from '../processing/index.js';
import { convertTags } from '../processing/convert-tags.js';
import { extractMetadata } from '../metadata/index.js';
import { extractContent } from '../extraction/extractor.js';
import { extractComments } from '../extraction/comments.js';
import { baseline } from '../extraction/baseline.js';
import { Extractor, Document } from '../settings/extractor.js';
import { determineReturnString } from './output-control.js';
import { xmlToTxt } from '../output/text.js';

/**
 * 创建Document对象并合并元数据和内容
 * 
 * @param {Object} metadata - 元数据对象
 * @param {Object} result - 提取结果
 * @returns {Document} Document对象
 */
function createDocument(metadata, result) {
  const doc = new Document(metadata);
  
  if (result && result.body) {
    doc.body = result.body;
  }
  
  if (result && result.commentsbody) {
    doc.commentsbody = result.commentsbody;
  }
  
  return doc;
}

/**
 * 应用预处理规则到HTML树
 * 类似Turndown的规则系统
 * 
 * @param {Document} tree - HTML树
 * @param {Extractor} options - 提取器选项
 * @returns {Document} 处理后的树
 */
function applyPreprocessingRules(tree, options) {
  if (!options.preprocessing_rules || options.preprocessing_rules.size === 0) {
    return tree;
  }
  
  // 遍历所有规则
  for (const [ruleName, rule] of options.preprocessing_rules.entries()) {
    try {
      let matchedNodes = [];
      
      // 根据filter类型获取匹配的节点
      if (typeof rule.filter === 'string') {
        // CSS选择器字符串
        matchedNodes = Array.from(tree.querySelectorAll(rule.filter));
      } else if (Array.isArray(rule.filter)) {
        // CSS选择器数组
        for (const selector of rule.filter) {
          const nodes = Array.from(tree.querySelectorAll(selector));
          matchedNodes.push(...nodes);
        }
      } else if (typeof rule.filter === 'function') {
        // 自定义过滤函数
        const allNodes = Array.from(tree.querySelectorAll('*'));
        matchedNodes = allNodes.filter(node => {
          try {
            return rule.filter(node, options);
          } catch (e) {
            console.warn(`Error in filter function for rule '${ruleName}':`, e);
            return false;
          }
        });
      }
      
      // 对每个匹配的节点应用action
      for (const node of matchedNodes) {
        try {
          const result = rule.action(node, options);
          
          // 根据返回值处理节点
          if (result === null) {
            // 删除节点
            if (node.parentNode) {
              node.parentNode.removeChild(node);
            }
          } else if (result && result.nodeType) {
            // 替换为新节点
            if (node.parentNode) {
              node.parentNode.replaceChild(result, node);
            }
          }
          // undefined或其他值：保持原样（原地修改）
        } catch (e) {
          console.warn(`Error in action function for rule '${ruleName}' on node:`, node, e);
        }
      }
    } catch (e) {
      console.warn(`Error applying preprocessing rule '${ruleName}':`, e);
    }
  }
  
  return tree;
}

/**
 * 内部提取函数
 * 对应Python: bare_extraction() - core.py:131-348
 * 
 * 执行实际的提取工作，返回Document对象
 * 
 * @param {string|Document} htmlContent - HTML内容或DOM对象
 * @param {Object} options - 提取选项（Extractor实例）
 * @returns {Document|null} Document对象或null
 */
function internalExtraction(htmlContent, options) {
  try {
    // 1. 加载HTML树
    let tree = null;
    
    if (typeof htmlContent === 'string') {
      tree = loadHtml(htmlContent);
    } else if (htmlContent && htmlContent.nodeType) {
      // 已经是DOM节点
      tree = htmlContent;
    } else {
      console.warn('Invalid HTML content');
      return null;
    }
    
    if (!tree) {
      console.warn('Empty HTML tree');
      return null;
    }

    // 1.5. 应用预处理规则（类似Turndown的addRule）
    // 在HTML加载后、修剪前应用自定义规则
    if (options.preprocessing_rules && options.preprocessing_rules.size > 0) {
      tree = applyPreprocessingRules(tree, options);
    }

    // 2. 用户自定义修剪（prune_xpath - 通过CSS选择器实现）
    if (options.prune_xpath) {
      try {
        const pruneSelectors = Array.isArray(options.prune_xpath) 
          ? options.prune_xpath 
          : [options.prune_xpath];
        
        for (const selector of pruneSelectors) {
          const elements = tree.querySelectorAll(selector);
          for (const elem of elements) {
            if (elem.parentNode) {
              elem.parentNode.removeChild(elem);
            }
          }
        }
      } catch (e) {
        console.warn('Prune xpath failed:', e);
      }
    }

    // 3. 快速HTML语言检查（如果指定了目标语言）
    if (options.lang && (options.fast || true)) {  // 简化版总是检查
      const langCheck = checkHtmlLang(tree, options.lang);
      if (langCheck === false) {
        console.error(`Wrong HTML meta language for ${options.source || 'unknown'}`);
        return null;
      }
    }

    // 4. 提取元数据（如果需要）
    let document;
    
    if (options.with_metadata) {
      document = extractMetadata(
        tree,
        options.url,
        options.date_params,
        options.fast,
        options.author_blacklist
      );
      
      // 检查URL黑名单
      if (document.url && options.url_blacklist.has(document.url)) {
        console.warn(`Blacklisted URL: ${document.url}`);
        return null;
      }
      
      // 检查必需元数据
      if (options.only_with_metadata) {
        if (!document.date || !document.title || !document.url) {
          console.warn(`Missing required metadata: ${options.source}`);
          return null;
        }
      }
    } else {
      document = new Document();
    }
    
    // 5. HTML清理和转换
    const cleanedTree = treeCleaning(tree, options);
    
    if (!cleanedTree) {
      console.warn('Tree cleaning failed');
      return null;
    }
    
    // 备份清理后的树和原始树（用于后备提取）
    const cleanedTreeBackup = cleanedTree.cloneNode(true);
    const treeBackup = tree.cloneNode(true);
    
    // 6. 标签转换
    let convertedTree = convertTags(cleanedTree, options, options.url || (document && document.url));
    
    // 7. 提取评论（如果需要）
    let commentsbody = null;
    let tempComments = '';
    let lenComments = 0;
    
    if (options.comments) {
      try {
        const commentsResult = extractComments(convertedTree, options);
        if (commentsResult) {
          commentsbody = commentsResult.commentsbody || null;
          tempComments = commentsResult.temp_comments || '';
          lenComments = commentsResult.len_comments || 0;
          // 更新tree（评论区域已被删除）
          convertedTree = commentsResult.tree;
        }
      } catch (e) {
        console.warn('Comment extraction failed:', e);
      }
    }
    
    // 8. 提取主要内容（Trafilatura主提取器）
    let postbody = null;
    let tempText = '';
    let lenText = 0;
    
    try {
      const result = extractContent(convertedTree, options);
      if (result && result.body) {
        postbody = result.body;
        tempText = result.text || '';
        lenText = result.length || 0;
      }
    } catch (e) {
      console.error('Content extraction failed:', e);
    }
    
    // 9. 外部提取器对比（如果不是fast模式）
    // 对应Python: compare_extraction
    if (!options.fast && postbody) {
      try {
        const comparison = compareExtraction(
          tree,
          cleanedTreeBackup,
          postbody,
          tempText,
          lenText,
          options
        );
        
        if (comparison) {
          postbody = comparison.body;
          tempText = comparison.text;
          lenText = comparison.length;
        }
      } catch (e) {
        console.warn('External extraction comparison failed:', e);
      }
    }
    
    // 10. 备份提取机制（对应Python: trafilatura_sequence）
    // 如果主提取结果不足，使用baseline提取原始树
    if (lenText < options.min_extracted_size && options.focus !== 'precision') {
      console.debug('Main extraction too short, trying baseline extraction');
      
      try {
        const backupResult = baseline(treeBackup.cloneNode(true));
        if (backupResult && backupResult.body) {
          const backupText = backupResult.text || '';
          const backupLength = backupResult.length || 0;
          
          // 如果baseline提取的结果更好，使用它
          if (backupLength > lenText) {
            console.debug(`Baseline extraction better: ${backupLength} vs ${lenText}`);
            postbody = backupResult.body;
            tempText = backupText;
            lenText = backupLength;
          }
        }
      } catch (e) {
        console.warn('Baseline extraction failed:', e);
      }
    }
    
    // 最终检查：如果仍然没有内容，返回null
    if (!postbody) {
      console.warn('No content extracted after all attempts');
      return null;
    }
    
    // 11. 去重检测（如果启用）
    if (options.dedup && postbody) {
      const isDuplicate = duplicateTest(postbody, options);
      
      if (isDuplicate) {
        console.debug(`Duplicate document detected, discarding ${options.source || 'unknown'}`);
        return null;
      }
    }

    // 12. 语言过滤（如果指定了目标语言）
    if (options.lang && tempText) {
      const langResult = languageFilter(tempText, tempComments, options.lang, document);
      
      if (langResult.isWrongLanguage) {
        console.debug(`Wrong language detected, discarding ${options.source || 'unknown'}`);
        return null;
      }
      
      // 更新document（可能包含检测到的语言）
      document = langResult.document;
    }

    // 13. 树大小检查（如果指定）
    if (options.max_tree_size && postbody) {
      const treeSize = postbody.children.length;
      
      if (treeSize > options.max_tree_size) {
        console.debug(`Output tree too large: ${treeSize} > ${options.max_tree_size}, discarding ${options.source || 'unknown'}`);
        return null;
      }
    }

    // 14. 大小验证
    // 注意：这里检查的是输出最小值
    const minOutputSize = options.min_output_size || 1;
    const minOutputCommSize = options.min_output_comm_size || 10;
    
    if (options.comments && lenComments < options.min_extracted_comm_size) {
      console.debug(`Not enough comments: ${options.source}`);
    }
    
    if (lenText < minOutputSize && lenComments < minOutputCommSize) {
      console.debug(`Text and comments not long enough: ${lenText} ${lenComments} ${options.source}`);
      return null;
    }
    
    // 15. 构建最终Document
    document.body = postbody;
    document.raw_text = tempText;
    
    if (options.comments && commentsbody) {
      document.commentsbody = commentsbody;
      document.comments = xmlToTxt(commentsbody, options.formatting);
    }
    
    // 生成内容指纹（如果启用去重）
    if (options.dedup) {
      document.fingerprint = contentFingerprint(tempText);
    }
    
    // 为python格式生成text字段
    if (options.format === 'python') {
      document.text = xmlToTxt(postbody, options.formatting);
    }
    
    return document;
    
  } catch (error) {
    console.warn('Extraction error:', error, options.source);
    return null;
  }
}

/**
 * 主要的extract函数
 * 对应Python: extract() - core.py:351-447
 * 
 * 从HTML中提取内容并转换为指定格式
 * 
 * @param {string|Document} htmlContent - HTML内容字符串或DOM对象
 * @param {Object} userOptions - 用户配置选项
 * @returns {string|null} 提取的内容（指定格式）或null
 * 
 * @example
 * // 基础使用
 * const result = extract(htmlString);
 * 
 * @example
 * // 带配置
 * const result = extract(htmlString, {
 *   format: 'markdown',
 *   with_metadata: true,
 *   include_comments: true,
 *   target_language: 'zh'
 * });
 */
export function extract(htmlContent, userOptions = {}) {
  // 1. 创建Extractor配置
  let options;
  
  if (userOptions instanceof Extractor) {
    options = userOptions;
  } else {
    // 从用户选项创建Extractor
    options = new Extractor({
      format: userOptions.output_format || userOptions.format || 'markdown',
      fast: userOptions.fast || false,
      precision: userOptions.favor_precision || false,
      recall: userOptions.favor_recall || false,
      comments: userOptions.include_comments !== undefined 
        ? userOptions.include_comments 
        : true,
      formatting: userOptions.include_formatting !== undefined
        ? userOptions.include_formatting
        : true,
      links: userOptions.include_links !== undefined
        ? userOptions.include_links
        : true,
      images: userOptions.include_images !== undefined
        ? userOptions.include_images
        : true,
      tables: userOptions.include_tables !== undefined 
        ? userOptions.include_tables 
        : true,
      dedup: userOptions.deduplicate || false,
      lang: userOptions.target_language || null,
      url: userOptions.url || null,
      with_metadata: userOptions.with_metadata || false,
      only_with_metadata: userOptions.only_with_metadata || false,
      tei_validation: userOptions.tei_validation || false,
      author_blacklist: userOptions.author_blacklist || new Set(),
      url_blacklist: userOptions.url_blacklist || new Set(),
      date_params: userOptions.date_extraction_params || null
    });
  }
  
  // 2. 执行内部提取
  const document = internalExtraction(htmlContent, options);
  
  if (!document) {
    return null;
  }
  
  // 3. 格式化输出
  return determineReturnString(document, options);
}

/**
 * 简化版提取函数
 * 对应Python中没有直接等价，但类似于extract的简化版本
 * 
 * 只提取纯文本，不包含元数据和格式化
 * 
 * @param {string|Document} htmlContent - HTML内容字符串或DOM对象
 * @param {Object} userOptions - 简化的用户选项
 * @returns {string|null} 提取的文本或null
 * 
 * @example
 * const text = bareExtraction(htmlString);
 * 
 * @example
 * const markdown = bareExtraction(htmlString, { formatting: true });
 */
export function bareExtraction(htmlContent, userOptions = {}) {
  // 创建最小化配置
  const options = new Extractor({
    format: 'txt',
    fast: userOptions.fast || false,
    comments: false,
    formatting: userOptions.formatting || false,
    links: false,
    images: false,
    tables: userOptions.include_tables !== undefined 
      ? userOptions.include_tables 
      : true,
    with_metadata: false,
    only_with_metadata: false
  });
  
  // 执行提取
  try {
    let tree = null;
    
    if (typeof htmlContent === 'string') {
      tree = loadHtml(htmlContent);
    } else if (htmlContent && htmlContent.nodeType) {
      tree = htmlContent;
    } else {
      return null;
    }
    
    if (!tree) {
      return null;
    }
    
    // 清理和转换
    const cleanedTree = treeCleaning(tree, options);
    if (!cleanedTree) {
      return null;
    }
    
    const convertedTree = convertTags(cleanedTree, options);
    if (!convertedTree) {
      return null;
    }
    
    // 提取内容
    const result = extractContent(convertedTree, options);
    
    if (!result || !result.body) {
      return null;
    }
    
    // 直接返回文本
    return xmlToTxt(result.body, options.formatting);
    
  } catch (error) {
    console.warn('Bare extraction error:', error);
    return null;
  }
}

/**
 * 导出所有函数
 */
export default {
  extract,
  bareExtraction,
  createDocument,
  internalExtraction
};

