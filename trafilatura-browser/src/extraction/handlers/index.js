/**
 * Handler模块统一导出
 * 
 * 导出所有元素处理handler
 * 
 * @module extraction/handlers
 */

// 节点处理基础函数
export { 
  processNode, 
  handleTextNode,
  getElementText,
  setElementText,
  getElementTail,
  setElementTail,
  flushTail
} from './node-processing.js';

// 段落处理
export { handleParagraphs } from './paragraphs.js';

// 标题处理
export { handleTitles } from './titles.js';

// 格式化处理
export { handleFormatting } from './formatting.js';

// 其他元素处理
export { handleOtherElements } from './other-elements.js';

// 列表处理 (步骤3)
export { handleLists } from './lists.js';

// 引用和代码块处理 (步骤3)
export { 
  handleQuotes, 
  handleCodeBlocks,
  isCodeBlockElement 
} from './quotes.js';

// 辅助函数
export {
  addSubElement,
  processNestedElements,
  updateElemRendition,
  isTextElement,
  defineNewElem
} from './utils.js';

// 表格处理 (步骤4)
export { 
  handleTable,
  defineCellType 
} from './tables.js';

// 图片处理 (步骤4)
export { handleImage } from './images.js';

