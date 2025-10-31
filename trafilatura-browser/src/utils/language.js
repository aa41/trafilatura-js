/**
 * 语言检测和过滤模块
 * 
 * 对应Python模块: trafilatura/utils.py 中的语言相关功能
 * 
 * @module utils/language
 */

/**
 * HTML语言属性列表
 * 对应Python: TARGET_LANG_ATTRS
 */
const TARGET_LANG_ATTRS = ['http-equiv', 'property'];

/**
 * HTML语言分隔符正则
 * 对应Python: RE_HTML_LANG
 */
const RE_HTML_LANG = /[,;]/;

/**
 * 检查HTML meta元素中的语言信息
 * 对应Python: check_html_lang() - utils.py:390-410
 * 
 * 从HTML meta标签中检查语言，并在有多个语言时分割结果
 * 
 * @param {Element} tree - HTML DOM树
 * @param {string} targetLanguage - 目标语言代码 (ISO 639-1格式，如 'en', 'zh')
 * @param {boolean} strict - 是否严格模式（同时检查<html lang>属性）
 * @returns {boolean} 是否匹配目标语言
 * 
 * @example
 * checkHtmlLang(tree, 'en') // true 如果HTML声明为英语
 * checkHtmlLang(tree, 'zh', true) // 严格检查，包括<html lang>
 */
export function checkHtmlLang(tree, targetLanguage, strict = false) {
  if (!tree || !targetLanguage) {
    return null;
  }
  
  const targetLang = targetLanguage.toLowerCase();
  
  // 1. 检查meta标签中的语言属性
  for (const attr of TARGET_LANG_ATTRS) {
    const elems = tree.querySelectorAll(`meta[${attr}][content]`);
    
    if (elems.length > 0) {
      // 检查是否有任何元素包含目标语言
      for (const elem of elems) {
        const content = elem.getAttribute('content') || '';
        const languages = content.toLowerCase().split(RE_HTML_LANG);
        
        if (languages.some(lang => lang.trim() === targetLang)) {
          return true;
        }
      }
      
      // 找到了meta标签但不匹配
      console.debug(`${attr} lang attr failed`);
      return false;
    }
  }
  
  // 2. 严格模式：检查<html lang>属性
  if (strict) {
    const htmlElems = tree.querySelectorAll('html[lang]');
    
    if (htmlElems.length > 0) {
      for (const elem of htmlElems) {
        const lang = elem.getAttribute('lang') || '';
        const languages = lang.toLowerCase().split(RE_HTML_LANG);
        
        if (languages.some(l => l.trim() === targetLang)) {
          return true;
        }
      }
      
      // 找到了lang属性但不匹配
      console.debug('HTML lang failed');
      return false;
    }
  }
  
  // 3. 没有找到相关的语言元素
  console.debug('No relevant lang elements found');
  return null;
}

/**
 * 简单的语言检测（基于常见字符）
 * 注意：这是一个简化版本，Python使用py3langid库
 * 
 * @param {string} text - 要检测的文本
 * @returns {string|null} 检测到的语言代码或null
 */
function simpleLanguageDetect(text) {
  if (!text || text.length < 20) {
    return null;
  }
  
  // 简单的启发式规则
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const japaneseChars = (text.match(/[\u3040-\u309f\u30a0-\u30ff]/g) || []).length;
  const koreanChars = (text.match(/[\uac00-\ud7af]/g) || []).length;
  const arabicChars = (text.match(/[\u0600-\u06ff]/g) || []).length;
  const cyrillicChars = (text.match(/[\u0400-\u04ff]/g) || []).length;
  
  const totalChars = text.length;
  const threshold = 0.3; // 30%的字符
  
  // 根据字符比例判断
  if (chineseChars / totalChars > threshold) return 'zh';
  if (japaneseChars / totalChars > threshold) return 'ja';
  if (koreanChars / totalChars > threshold) return 'ko';
  if (arabicChars / totalChars > threshold) return 'ar';
  if (cyrillicChars / totalChars > threshold) return 'ru';
  
  // 默认假设为英语（或其他拉丁语系）
  // 注意：这是非常简化的检测，真实应用应使用专业的语言检测库
  return 'en';
}

/**
 * 基于语言检测过滤文本
 * 对应Python: language_filter() - utils.py:428-442
 * 
 * 使用语言检测过滤文本并存储相关信息
 * 
 * @param {string} tempText - 主要文本内容
 * @param {string} tempComments - 评论文本内容
 * @param {string} targetLanguage - 目标语言代码
 * @param {Document} document - Document对象
 * @returns {Object} {isWrongLanguage: boolean, document: Document}
 * 
 * @example
 * const result = languageFilter(text, comments, 'en', doc);
 * if (result.isWrongLanguage) {
 *   console.log('Wrong language detected');
 * }
 */
export function languageFilter(tempText, tempComments, targetLanguage, document) {
  if (!targetLanguage) {
    return { isWrongLanguage: false, document };
  }
  
  // 检测文本语言（优先使用主文本，如果太短则结合评论）
  let textToDetect = tempText;
  if (!tempText || tempText.length < 50) {
    textToDetect = (tempText + ' ' + (tempComments || '')).trim();
  }
  
  // 执行语言检测
  const detectedLanguage = simpleLanguageDetect(textToDetect);
  
  // 存储检测到的语言
  if (detectedLanguage) {
    document.language = detectedLanguage;
  }
  
  // 检查是否匹配目标语言
  if (detectedLanguage && detectedLanguage !== targetLanguage.toLowerCase()) {
    console.warn(`Wrong language: detected ${detectedLanguage}, expected ${targetLanguage} for ${document.url || 'unknown'}`);
    return { isWrongLanguage: true, document };
  }
  
  return { isWrongLanguage: false, document };
}

/**
 * 导出所有函数
 */
export default {
  checkHtmlLang,
  languageFilter
};

