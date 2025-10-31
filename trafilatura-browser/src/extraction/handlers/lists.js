/**
 * 列表处理
 * 
 * 实现列表提取和处理逻辑
 * 对应Python: main_extractor.py - handle_lists()
 * 
 * @module extraction/handlers/lists
 */

import { processNode } from './node-processing.js';
import { processNestedElements, updateElemRendition, isTextElement } from './utils.js';
import { getElementText, setElementText, getElementTail } from './node-processing.js';

/**
 * 处理列表元素及其后代
 * 对应Python: handle_lists() - main_extractor.py:164-202
 * 
 * @param {Element} element - 要处理的列表元素
 * @param {Extractor} options - 提取器选项
 * @returns {Element|null} 处理后的列表元素，如果不应保留则返回null
 */
export function handleLists(element, options) {
  if (!element) {
    return null;
  }
  
  // Python: processed_element = Element(element.tag)
  const processedElement = document.createElement(element.tagName.toLowerCase());
  
  // Python: if element.text is not None and element.text.strip():
  const elementText = getElementText(element);
  if (elementText && elementText.trim()) {
    // Python: new_child_elem = SubElement(processed_element, "item")
    const newChildElem = document.createElement('item');
    
    // Python: new_child_elem.text = element.text
    setElementText(newChildElem, elementText);
    
    processedElement.appendChild(newChildElem);
  }
  
  // Python: for child in element.iterdescendants("item"):
  const items = Array.from(element.querySelectorAll('item'));
  
  for (const child of items) {
    // Python: new_child_elem = Element("item")
    let newChildElem = document.createElement('item');
    
    // Python: if len(child) == 0:
    if (child.children.length === 0) {
      // Python: processed_child = process_node(child, options)
      const processedChild = processNode(child, options);
      
      if (processedChild) {
        // Python: new_child_elem.text = processed_child.text or ""
        const childText = getElementText(processedChild) || '';
        let combinedText = childText;
        
        // Python: if processed_child.tail and processed_child.tail.strip():
        const childTail = getElementTail(processedChild);
        if (childTail && childTail.trim()) {
          // Python: new_child_elem.text += " " + processed_child.tail
          combinedText += ' ' + childTail;
        }
        
        setElementText(newChildElem, combinedText);
        processedElement.appendChild(newChildElem);
      }
    } else {
      // Python: process_nested_elements(child, new_child_elem, options)
      processNestedElements(child, newChildElem, options);
      
      // Python: if child.tail is not None and child.tail.strip():
      const childTail = getElementTail(child);
      if (childTail && childTail.trim()) {
        // Python: new_child_elem_children = [el for el in new_child_elem if el.tag != "done"]
        const newChildElemChildren = Array.from(newChildElem.children).filter(
          el => el.getAttribute('data-done') !== 'true' && el.tagName.toLowerCase() !== 'done'
        );
        
        if (newChildElemChildren.length > 0) {
          // Python: last_subchild = new_child_elem_children[-1]
          const lastSubchild = newChildElemChildren[newChildElemChildren.length - 1];
          
          // Python: if last_subchild.tail is None or not last_subchild.tail.strip():
          const lastTail = getElementTail(lastSubchild);
          if (!lastTail || !lastTail.trim()) {
            // Python: last_subchild.tail = child.tail
            // 在浏览器中，tail是nextSibling文本节点
            // 这里我们需要将tail添加到lastSubchild后面
            if (lastSubchild.nextSibling && lastSubchild.nextSibling.nodeType === Node.TEXT_NODE) {
              lastSubchild.nextSibling.textContent = childTail;
            } else {
              const textNode = document.createTextNode(childTail);
              lastSubchild.parentNode.insertBefore(textNode, lastSubchild.nextSibling);
            }
          } else {
            // Python: last_subchild.tail += " " + child.tail
            if (lastSubchild.nextSibling && lastSubchild.nextSibling.nodeType === Node.TEXT_NODE) {
              lastSubchild.nextSibling.textContent += ' ' + childTail;
            } else {
              const textNode = document.createTextNode(' ' + childTail);
              lastSubchild.parentNode.insertBefore(textNode, lastSubchild.nextSibling);
            }
          }
        }
      }
    }
    
    // Python: if new_child_elem.text or len(new_child_elem) > 0:
    const newChildText = getElementText(newChildElem);
    if (newChildText || newChildElem.children.length > 0) {
      // Python: update_elem_rendition(child, new_child_elem)
      updateElemRendition(child, newChildElem);
      
      // Python: processed_element.append(new_child_elem)
      processedElement.appendChild(newChildElem);
    }
    
    // Python: child.tag = "done"
    child.setAttribute('data-done', 'true');
  }
  
  // Python: element.tag = "done"
  element.setAttribute('data-done', 'true');
  
  // Python: if is_text_element(processed_element):
  if (isTextElement(processedElement)) {
    // Python: update_elem_rendition(element, processed_element)
    updateElemRendition(element, processedElement);
    return processedElement;
  }
  
  return null;
}

export default {
  handleLists
};

