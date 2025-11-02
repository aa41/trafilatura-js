/**
 * Handler辅助函数
 * 
 * 实现main_extractor.py中的辅助函数
 * 
 * @module extraction/handlers/utils
 */

import { textCharsTest } from '../../utils/text.js';
import { copyAttributes } from '../../utils/dom.js';
import { getElementText, setElementText, handleTextNode, flushTail } from './node-processing.js';
import { handleLists } from './lists.js';

/**
 * 添加子元素到现有子元素
 * 对应Python: add_sub_element() - main_extractor.py:120-125
 * 
 * @param {Element} newChildElem - 新的子元素
 * @param {Element} subelem - 原始子元素（用于复制属性）
 * @param {Element} processedSubchild - 处理后的子元素
 */
export function addSubElement(newChildElem, subelem, processedSubchild) {
  if (!newChildElem || !processedSubchild) {
    return;
  }
  
  // Python: sub_child_elem = SubElement(new_child_elem, processed_subchild.tag)
  const subChildElem = document.createElement(processedSubchild.tagName.toLowerCase());
  
  // Python: sub_child_elem.text, sub_child_elem.tail = processed_subchild.text, processed_subchild.tail
  setElementText(subChildElem, getElementText(processedSubchild));
  // tail会在appendChild时自动处理
  
  // Python: for attr in subelem.attrib: sub_child_elem.set(attr, subelem.attrib[attr])
  if (subelem && subelem.attributes) {
    for (const attr of subelem.attributes) {
      subChildElem.setAttribute(attr.name, attr.value);
    }
  }
  
  newChildElem.appendChild(subChildElem);
  // 刷新tail: 将临时存储的_tail转换为真正的文本节点
  flushTail(subChildElem);
}

/**
 * 遍历元素子元素并重新连接其后代
 * 对应Python: process_nested_elements() - main_extractor.py:128-141
 * 
 * @param {Element} child - 子元素
 * @param {Element} newChildElem - 新的子元素
 * @param {Extractor} options - 提取器选项
 */
export function processNestedElements(child, newChildElem, options) {
  if (!child || !newChildElem) {
    return;
  }
  
  // Python: new_child_elem.text = child.text
  setElementText(newChildElem, getElementText(child));
  
  // Python: for subelem in child.iterdescendants("*"):
  const subelems = Array.from(child.querySelectorAll('*'));
  
  for (const subelem of subelems) {
    const subelemTag = subelem.tagName.toLowerCase();
    
    // Python: if subelem.tag == "list":
    if (subelemTag === 'list') {
      // 导入会在运行时解决循环依赖
      // Python: processed_subchild = handle_lists(subelem, options)
      const processedSubchild = handleLists(subelem, options);
      
      if (processedSubchild) {
        // Python: new_child_elem.append(processed_subchild)
        newChildElem.appendChild(processedSubchild);
        // 刷新tail: 将临时存储的_tail转换为真正的文本节点
        flushTail(processedSubchild);
      }
    } else {
      // Python: processed_subchild = handle_textnode(subelem, options, comments_fix=False)
      const processedSubchild = handleTextNode(subelem, options, false, false);
      
      if (processedSubchild) {
        // Python: add_sub_element(new_child_elem, subelem, processed_subchild)
        addSubElement(newChildElem, subelem, processedSubchild);
      }
    }
    
    // Python: subelem.tag = "done"
    subelem.setAttribute('data-done', 'true');
  }
}

/**
 * 复制rend属性从现有元素到新元素
 * 对应Python: update_elem_rendition() - main_extractor.py:144-147
 * 
 * @param {Element} elem - 源元素
 * @param {Element} newElem - 目标元素
 */
export function updateElemRendition(elem, newElem) {
  if (!elem || !newElem) {
    return;
  }
  
  // Python: if rend_attr := elem.get("rend"): new_elem.set("rend", rend_attr)
  const rendAttr = elem.getAttribute('rend');
  if (rendAttr) {
    newElem.setAttribute('rend', rendAttr);
  }
}

/**
 * 查找元素是否包含文本
 * 对应Python: is_text_element() - main_extractor.py:150-152
 * 
 * @param {Element} elem - 要检查的元素
 * @returns {boolean} 如果包含文本返回true
 */
export function isTextElement(elem) {
  if (!elem) {
    return false;
  }
  
  // Python: return elem is not None and text_chars_test(''.join(elem.itertext())) is True
  const allText = elem.textContent || '';
  return textCharsTest(allText);
}

/**
 * 如果需要，创建一个新的子元素
 * 对应Python: define_newelem() - main_extractor.py:155-161
 * 
 * @param {Element} processedElem - 处理后的元素
 * @param {Element} origElem - 原始元素
 */
export function defineNewElem(processedElem, origElem) {
  if (!processedElem || !origElem) {
    return;
  }
  
  // Python: childelem = SubElement(orig_elem, processed_elem.tag)
  const childelem = document.createElement(processedElem.tagName.toLowerCase());
  
  // Python: childelem.text, childelem.tail = processed_elem.text, processed_elem.tail
  setElementText(childelem, getElementText(processedElem));
  // tail处理由appendChild自动完成
  
  // Python: if processed_elem.tag == 'graphic': copy_attributes(childelem, processed_elem)
  if (processedElem.tagName.toLowerCase() === 'graphic') {
    copyAttributes(childelem, processedElem);
  }
  
  origElem.appendChild(childelem);
}

export default {
  addSubElement,
  processNestedElements,
  updateElemRendition,
  isTextElement,
  defineNewElem
};

