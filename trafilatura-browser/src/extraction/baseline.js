/**
 * Baseline提取模块
 * 
 * 实现基础的、低精度的内容提取策略
 * 作为主提取器的fallback方案
 * 
 * @module extraction/baseline
 */

import { loadHtml, deleteElement } from '../utils/dom.js';
import { trim } from '../utils/text.js';
import { BASIC_CLEAN_XPATH } from '../settings/xpaths.js';

/**
 * 基础清理
 * 对应Python: basic_cleaning() - baseline.py:18-22
 * 
 * 从文档中删除一些类型的部分
 * 
 * @param {Element} tree - HTML树
 * @returns {Element} 清理后的树
 */
export function basicCleaning(tree) {
  if (!tree) {
    return null;
  }
  
  // 获取需要删除的元素
  const elementsToDelete = BASIC_CLEAN_XPATH(tree);
  
  // 删除这些元素
  for (const elem of elementsToDelete) {
    deleteElement(elem);
  }
  
  return tree;
}

/**
 * 基础提取函数
 * 对应Python: baseline() - baseline.py:25-101
 * 
 * 使用基础提取功能，目标是文本段落和/或JSON元数据
 * 
 * 提取策略（按优先级）：
 * 1. 从JSON-LD提取articleBody
 * 2. 从<article>标签提取
 * 3. 从段落标签(<p>, <blockquote>, <code>, <pre>, <q>, <quote>)提取
 * 4. 从整个<body>提取所有文本
 * 5. 使用html2txt作为最后的fallback
 * 
 * @param {string|Document|Element} filecontent - HTML代码（字符串、Document或Element）
 * @returns {{body: Element, text: string, length: number}} 包含提取的段落的<body>元素、主文本和长度
 */
export function baseline(filecontent) {
  // 加载HTML
  const tree = loadHtml(filecontent);
  
  // 创建结果body元素
  let postbody = document.createElement('body');
  
  if (!tree) {
    return { body: postbody, text: '', length: 0 };
  }
  
  // ========== 策略1: 从JSON-LD提取articleBody ==========
  // Python: for elem in tree.iterfind('.//script[@type="application/ld+json"]')
  let tempText = '';
  // 使用tree.ownerDocument或tree本身来查找script标签
  const doc = tree.ownerDocument || tree;
  const jsonScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  
  for (const elem of jsonScripts) {
    if (elem.textContent && elem.textContent.includes('articleBody')) {
      try {
        const jsonData = JSON.parse(elem.textContent);
        const jsonBody = jsonData.articleBody || '';
        
        if (jsonBody) {
          let text;
          // 如果包含HTML标签，先解析
          if (jsonBody.includes('<p>')) {
            const parsed = loadHtml(jsonBody);
            text = parsed ? trim(parsed.textContent || '') : '';
          } else {
            text = trim(jsonBody);
          }
          
          if (text) {
            const p = document.createElement('p');
            p.textContent = text;
            postbody.appendChild(p);
            tempText = tempText ? tempText + ' ' + text : text;
          }
        }
      } catch (error) {
        // JSON解析错误，继续下一个
        continue;
      }
    }
  }
  
  // 如果从JSON-LD提取到足够的文本（>100字符），返回结果
  if (tempText.length > 100) {
    return { body: postbody, text: tempText, length: tempText.length };
  }
  
  // JSON内容不足，清空postbody准备下一个策略
  postbody = document.createElement('body');
  
  // ========== 清理树（用于后续策略） ==========
  const cleanedTree = basicCleaning(tree);
  
  // ========== 策略2: 从<article>标签提取 ==========
  // Python: for article_elem in tree.iterfind('.//article')
  tempText = '';
  postbody = document.createElement('body'); // 重置postbody
  const articles = cleanedTree.querySelectorAll('article');
  
  for (const articleElem of articles) {
    const text = trim(articleElem.textContent || '');
    if (text.length > 100) {
      const p = document.createElement('p');
      p.textContent = text;
      postbody.appendChild(p);
      tempText = tempText ? tempText + ' ' + text : text;
    }
  }
  
  // 如果从article提取到内容，返回结果
  if (postbody.children.length > 0) {
    return { body: postbody, text: tempText, length: tempText.length };
  }
  
  // ========== 策略3: 从段落标签提取 ==========
  // Python: for element in tree.iter('blockquote', 'code', 'p', 'pre', 'q', 'quote')
  const results = new Set();
  tempText = '';
  postbody = document.createElement('body'); // 重置postbody
  const paragraphTags = ['blockquote', 'code', 'p', 'pre', 'q', 'quote'];
  
  for (const tag of paragraphTags) {
    const elements = cleanedTree.getElementsByTagName(tag);
    for (const element of elements) {
      const entry = trim(element.textContent || '');
      if (entry && !results.has(entry)) {
        const p = document.createElement('p');
        p.textContent = entry;
        postbody.appendChild(p);
        tempText = tempText ? tempText + ' ' + entry : entry;
        results.add(entry);
      }
    }
  }
  
  // 如果提取到足够的文本（>100字符），返回结果
  if (tempText.length > 100) {
    return { body: postbody, text: tempText, length: tempText.length };
  }
  
  // ========== 策略4: 从整个<body>提取所有文本 ==========
  // Python: default strategy: clean the tree and take everything
  postbody = document.createElement('body');
  const bodyElem = cleanedTree.querySelector('body');
  
  if (bodyElem) {
    // 收集所有文本节点
    // Python: text_elems = [trim(e) for e in body_elem.itertext()]
    const textElems = [];
    const walker = document.createTreeWalker(
      bodyElem,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    let node;
    while (node = walker.nextNode()) {
      const trimmedText = trim(node.textContent || '');
      if (trimmedText) {
        textElems.push(trimmedText);
      }
    }
    
    // Python: p_elem.text = '\n'.join([e for e in text_elems if e])
    const text = textElems.join('\n');
    
    if (text) {
      const p = document.createElement('p');
      p.textContent = text;
      postbody.appendChild(p);
    }
    
    return { body: postbody, text: text, length: text.length };
  }
  
  // ========== 策略5: html2txt fallback ==========
  // Python: new fallback
  const text = html2txt(cleanedTree, false);
  
  if (text) {
    const p = document.createElement('p');
    p.textContent = text;
    postbody.appendChild(p);
  }
  
  return { body: postbody, text: text, length: text.length };
}

/**
 * 基础HTML转文本函数
 * 对应Python: html2txt() - baseline.py:104-123
 * 
 * 在文档上运行基本的html2txt
 * 
 * @param {string|Document|Element} content - HTML文档（字符串、Document或LXML元素）
 * @param {boolean} [clean=true] - 是否删除潜在不需要的元素
 * @returns {string} 提取的文本字符串，如果失败则返回空字符串
 */
export function html2txt(content, clean = true) {
  // 加载HTML
  const tree = loadHtml(content);
  if (!tree) {
    return '';
  }
  
  // 查找body元素
  let body = tree.querySelector('body');
  if (!body) {
    return '';
  }
  
  // 如果需要，进行清理
  if (clean) {
    body = basicCleaning(body);
  }
  
  // 提取并规范化文本
  // Python: " ".join(body.text_content().split()).strip()
  const textContent = body.textContent || '';
  return trim(textContent);
}

// 默认导出
export default {
  basicCleaning,
  baseline,
  html2txt
};

