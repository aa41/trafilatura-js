/**
 * 段落处理
 * 
 * 实现段落提取和处理逻辑
 * 对应Python: main_extractor.py - handle_paragraphs()
 * 
 * @module extraction/handlers/paragraphs
 */

import { processNode, handleTextNode, getElementText, setElementText, getElementTail, setElementTail } from './node-processing.js';
import { textCharsTest } from '../../utils/text.js';
import { deleteElement, stripTags, copyAttributes } from '../../utils/dom.js';
import { P_FORMATTING } from '../../settings/constants.js';
import { isDevelopment } from '../../utils/env.js';

/**
 * 处理段落及其子元素，修剪和清理内容
 * 对应Python: handle_paragraphs() - main_extractor.py:275-354
 * 
 * @param {Element} element - 要处理的段落元素
 * @param {Set<string>} potentialTags - 潜在的有效标签集合
 * @param {Extractor} options - 提取器选项
 * @returns {Element|null} 处理后的段落元素，如果不应保留则返回null
 */
export function handleParagraphs(element, potentialTags, options) {
  if (!element) {
    return null;
  }
  
  // Python: element.attrib.clear()
  for (const attr of Array.from(element.attributes)) {
    element.removeAttribute(attr.name);
  }
  
  // 无子元素
  // Python: if len(element) == 0: return process_node(element, options)
  if (element.children.length === 0) {
    return processNode(element, options);
  }
  
  // 有子元素
  // Python: processed_element = Element(element.tag)
  const processedElement = document.createElement(element.tagName.toLowerCase());
  
  // Python: for child in element.iter("*"):
  const children = Array.from(element.querySelectorAll('*'));
  // 直接子元素
  for (const child of element.children) {
    children.unshift(child);
  }
  
  for (const child of children) {
    const childTag = child.tagName.toLowerCase();
    
    // Python: if child.tag not in potential_tags and child.tag != "done":
    // 检查data-done属性来判断是否已处理
    const isDone = child.getAttribute('data-done') === 'true' || childTag === 'done';
    if (!potentialTags.has(childTag) && !isDone) {
      logEvent('unexpected in p', childTag, child.textContent);
      continue;
    }
    
    // Python: processed_child = handle_textnode(child, options, comments_fix=False, preserve_spaces=True)
    const processedChild = handleTextNode(child, options, false, true);
    
    if (processedChild) {
      const processedTag = processedChild.tagName.toLowerCase();
      
      // Python: if processed_child.tag == "p":
      if (processedTag === 'p') {
        logEvent('extra in p', 'p', getElementText(processedChild));
        
        // Python: if processed_element.text: processed_element.text += " " + (processed_child.text or "")
        const currentText = getElementText(processedElement);
        const childText = getElementText(processedChild) || '';
        
        if (currentText) {
          setElementText(processedElement, currentText + ' ' + childText);
        } else {
          // Python: else: processed_element.text = processed_child.text
          setElementText(processedElement, childText);
        }
        
        // Python: child.tag = "done"
        // 注意: 浏览器DOM中tagName是只读的，使用data属性标记
        child.setAttribute('data-done', 'true');
        continue;
      }
      
      // 处理格式化
      // Python: newsub = Element(child.tag)
      let newsub = document.createElement(childTag);
      
      // Python: if processed_child.tag in P_FORMATTING:
      if (P_FORMATTING.has(processedTag)) {
        // 检查深度并清理
        // Python: if len(processed_child) > 0:
        if (processedChild.children.length > 0) {
          // Python: for item in processed_child:
          for (const item of Array.from(processedChild.children)) {
            // Python: if text_chars_test(item.text) is True: item.text = " " + item.text
            const itemText = getElementText(item);
            if (textCharsTest(itemText)) {
              setElementText(item, ' ' + itemText);
            }
            // Python: strip_tags(processed_child, item.tag)
            stripTags(processedChild, [item.tagName.toLowerCase()]);
          }
        }
        
        // 修正属性
        // Python: if child.tag == "hi":
        if (childTag === 'hi') {
          // Python: newsub.set("rend", child.get("rend", ""))
          const rend = child.getAttribute('rend') || '';
          newsub.setAttribute('rend', rend);
        }
        // Python: elif child.tag == "ref":
        else if (childTag === 'ref') {
          // Python: if child.get("target") is not None: newsub.set("target", child.get("target", ""))
          const target = child.getAttribute('target');
          if (target !== null) {
            newsub.setAttribute('target', target || '');
          }
        }
      }
      
      // 准备文本
      // Python: newsub.text, newsub.tail = processed_child.text, processed_child.tail
      setElementText(newsub, getElementText(processedChild));
      setElementTail(newsub, getElementTail(processedChild));
      
      // Python: if processed_child.tag == 'graphic':
      if (processedTag === 'graphic') {
        // TODO: 实现handle_image
        // Python: image_elem = handle_image(processed_child, options)
        // if (image_elem) { newsub = image_elem; }
      }
      
      // Python: processed_element.append(newsub)
      processedElement.appendChild(newsub);
    }
    
    // Python: child.tag = "done"
    // 注意: 浏览器DOM中tagName是只读的，使用data属性标记
    child.setAttribute('data-done', 'true');
  }
  
  // 完成
  // Python: if len(processed_element) > 0:
  if (processedElement.children.length > 0) {
    // Python: last_elem = processed_element[-1]
    const lastElem = processedElement.lastElementChild;
    
    // 清理尾部lb元素
    // Python: if last_elem.tag == "lb" and last_elem.tail is None:
    if (lastElem && lastElem.tagName.toLowerCase() === 'lb' && !getElementTail(lastElem)) {
      // Python: delete_element(last_elem)
      deleteElement(lastElem, false);
    }
    
    return processedElement;
  }
  
  // Python: if processed_element.text: return processed_element
  if (getElementText(processedElement)) {
    return processedElement;
  }
  
  // Python: _log_event("discarding element:", "p", tostring(processed_element))
  logEvent('discarding element', 'p', processedElement.outerHTML);
  
  return null;
}

/**
 * 日志事件（调试用）
 */
function logEvent(msg, tag, text) {
  if (isDevelopment()) {
    console.debug(`${msg}: ${tag} ${text || 'None'}`);
  }
}

export default {
  handleParagraphs
};

