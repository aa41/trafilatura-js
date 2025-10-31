/**
 * CSV输出模块
 * 
 * 实现CSV格式的输出功能
 * 对应Python模块: trafilatura/xml.py (CSV输出部分)
 * 
 * @module output/csv
 */

import { xmlToTxt } from './text.js';

/**
 * 转义CSV字段值
 * 
 * @param {string} value - 要转义的值
 * @returns {string} 转义后的值
 * 
 * @example
 * escapeCsvField('包含"引号"的文本') → '"包含""引号""的文本"'
 */
function escapeCsvField(value) {
  if (value === null || value === undefined) {
    return '';
  }
  
  const str = String(value);
  
  // 如果包含分隔符、引号或换行，需要用引号包裹
  if (str.includes('\t') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    // 转义引号（双引号变成两个引号）
    return '"' + str.replace(/"/g, '""') + '"';
  }
  
  return str;
}

/**
 * 将XML文档转换为CSV字符串
 * 对应Python: xmltocsv() - xml.py:391-415
 * 
 * @param {Object} document - 文档对象
 * @param {boolean} includeFormatting - 是否包含格式化
 * @param {Object} options - 选项
 * @param {string} options.delim - 分隔符（默认\t）
 * @param {string} options.null - null值的表示（默认"null"）
 * @returns {string} CSV字符串
 * 
 * @example
 * const csv = xmlToCsv(document, false);
 * // url\tid\tfingerprint\thostname\ttitle\timage\tdate\ttext\tcomments\tlicense\tpagetype
 * // https://example.com\t...\t...\texample.com\t标题\t...\t2023-01-01\t正文\t评论\t...\t...
 */
export function xmlToCsv(doc, includeFormatting = false, options = {}) {
  const delim = options.delim || '\t';
  const nullValue = options.null || 'null';
  
  if (!doc) {
    return '';
  }
  
  // Python: posttext = xmltotxt(doc.body, include_formatting) or null
  const posttext = doc.body 
    ? xmlToTxt(doc.body, includeFormatting) 
    : nullValue;
  
  // Python: commentstext = xmltotxt(doc.commentsbody, include_formatting) or null
  const commentstext = doc.commentsbody 
    ? xmlToTxt(doc.commentsbody, includeFormatting) 
    : nullValue;
  
  // Python: organize fields
  // outputwriter.writerow([d if d else null for d in (...)])
  const fields = [
    doc.url || nullValue,
    doc.id || nullValue,
    doc.fingerprint || nullValue,
    doc.hostname || nullValue,
    doc.title || nullValue,
    doc.image || nullValue,
    doc.date || nullValue,
    posttext,
    commentstext,
    doc.license || nullValue,
    doc.pagetype || nullValue
  ];
  
  // 转义字段并连接
  const escapedFields = fields.map(f => escapeCsvField(f));
  return escapedFields.join(delim);
}

/**
 * 生成CSV表头
 * 
 * @param {string} delim - 分隔符（默认\t）
 * @returns {string} CSV表头行
 */
export function getCsvHeader(delim = '\t') {
  const headers = [
    'url',
    'id',
    'fingerprint',
    'hostname',
    'title',
    'image',
    'date',
    'text',
    'comments',
    'license',
    'pagetype'
  ];
  
  return headers.join(delim);
}

/**
 * 导出所有函数
 */
export default {
  xmlToCsv,
  getCsvHeader
};

