/**
 * 图片处理模块
 * 
 * 对应Python模块: trafilatura/main_extractor.py
 * 函数: handle_image()
 * 
 * 实现图片元素的处理和属性提取
 * 
 * @module extraction/handlers/images
 */

import { isImageFile } from '../../utils/text.js';
import { 
  getElementTail,
  setElementTail
} from './node-processing.js';

/**
 * 处理图片元素及其相关属性
 * 
 * 对应Python: handle_image() - main_extractor.py:456-495
 * 
 * 处理流程：
 * 1. 检查元素是否存在
 * 2. 创建新的graphic元素
 * 3. 提取src属性（优先级：data-src > src > data-src* 属性）
 * 4. 验证src是否为有效的图片文件
 * 5. 提取alt和title属性
 * 6. URL后处理（相对路径转绝对路径）
 * 7. 复制tail属性
 * 
 * @param {Element|null} element - 图片元素
 * @param {Object|null} options - 提取器配置（可选）
 * @returns {Element|null} 处理后的图片元素，如果无效则返回null
 */
export function handleImage(element, options = null) {
  // 对应Python: if element is None: return None
  if (element === null) {
    return null;
  }

  // 对应Python: processed_element = Element(element.tag)
  const processedElement = document.createElement('graphic');
  
  // 提取src属性，优先级：data-src > src
  // 对应Python: main_extractor.py:463-473
  let foundSrc = false;
  
  // 首先尝试 data-src 和 src 属性
  for (const attr of ['data-src', 'src']) {
    const src = element.getAttribute(attr) || '';
    if (isImageFile(src)) {
      processedElement.setAttribute('src', src);
      foundSrc = true;
      break;
    }
  }
  
  // 如果没有找到，尝试所有 data-src* 属性
  // 对应Python: for attr, value in element.attrib.items()
  if (!foundSrc) {
    for (const attr of element.getAttributeNames()) {
      if (attr.startsWith('data-src')) {
        const value = element.getAttribute(attr) || '';
        if (isImageFile(value)) {
          processedElement.setAttribute('src', value);
          foundSrc = true;
          break;
        }
      }
    }
  }

  // 提取额外数据
  // 对应Python: main_extractor.py:475-479
  const altAttr = element.getAttribute('alt');
  if (altAttr) {
    processedElement.setAttribute('alt', altAttr);
  }
  
  const titleAttr = element.getAttribute('title');
  if (titleAttr) {
    processedElement.setAttribute('title', titleAttr);
  }

  // 如果没有属性或没有src，返回null
  // 对应Python: if not processed_element.attrib or not processed_element.get("src"): return None
  if (processedElement.getAttributeNames().length === 0 || !processedElement.getAttribute('src')) {
    return null;
  }

  // URL后处理
  // 对应Python: main_extractor.py:485-492
  let link = processedElement.getAttribute('src') || '';
  
  if (!link.startsWith('http')) {
    if (options !== null && options.url) {
      // 使用URL API进行相对URL解析
      try {
        const baseUrl = new URL(options.url);
        const absoluteUrl = new URL(link, baseUrl);
        link = absoluteUrl.href;
      } catch (e) {
        // 如果URL解析失败，尝试简单的//替换
        link = link.replace(/^\/\//, 'http://');
      }
    } else {
      // 对应Python: link = re.sub(r"^//", "http://", link)
      link = link.replace(/^\/\//, 'http://');
    }
    processedElement.setAttribute('src', link);
  }

  // 复制tail
  // 对应Python: processed_element.tail = element.tail
  const tail = getElementTail(element);
  if (tail) {
    setElementTail(processedElement, tail);
  }

  return processedElement;
}

