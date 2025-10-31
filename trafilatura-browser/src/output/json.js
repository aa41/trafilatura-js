/**
 * JSON输出模块
 * 
 * 实现JSON格式的输出功能
 * 对应Python模块: trafilatura/xml.py (JSON输出部分)
 * 
 * @module output/json
 */

import { xmlToTxt } from './text.js';

/**
 * 构建JSON输出
 * 对应Python: build_json_output() - xml.py:116-135
 * 
 * 基于提取的信息构建JSON输出
 * 
 * @param {Object} docMeta - 文档元数据对象
 * @param {boolean} withMetadata - 是否包含元数据（默认true）
 * @returns {string} JSON字符串
 * 
 * @example
 * const json = buildJsonOutput(docMeta, true);
 * // {
 * //   "title": "标题",
 * //   "author": "作者",
 * //   "text": "正文内容",
 * //   "source": "https://example.com",
 * //   ...
 * // }
 */
export function buildJsonOutput(docMeta, withMetadata = true) {
  if (!docMeta) {
    return JSON.stringify({});
  }
  
  let outputDict = {};
  
  if (withMetadata) {
    // 获取所有元数据字段
    // Python: {slot: getattr(docmeta, slot, None) for slot in docmeta.__slots__}
    const metaFields = [
      'title', 'author', 'url', 'hostname', 'description', 
      'sitename', 'date', 'categories', 'tags', 'fingerprint',
      'id', 'license', 'body', 'commentsbody', 'raw_text',
      'text', 'language', 'image', 'pagetype'
    ];
    
    for (const field of metaFields) {
      outputDict[field] = docMeta[field] !== undefined ? docMeta[field] : null;
    }
    
    // 重命名和转换字段
    // Python: 'source': outputdict.pop('url')
    outputDict['source'] = outputDict['url'];
    delete outputDict['url'];
    
    // Python: 'source-hostname': outputdict.pop('sitename')
    outputDict['source-hostname'] = outputDict['sitename'];
    delete outputDict['sitename'];
    
    // Python: 'excerpt': outputdict.pop('description')
    outputDict['excerpt'] = outputDict['description'];
    delete outputDict['description'];
    
  // Python: 'categories': ';'.join(outputdict.pop('categories') or [])
  const categories = outputDict['categories'] || [];
  outputDict['categories'] = Array.isArray(categories) ? categories.join('; ') : categories;
  
  // Python: 'tags': ';'.join(outputdict.pop('tags') or [])
  const tags = outputDict['tags'] || [];
  outputDict['tags'] = Array.isArray(tags) ? tags.join('; ') : tags;
    
    // Python: 'text': xmltotxt(outputdict.pop('body'), include_formatting=False)
    const body = outputDict['body'];
    outputDict['text'] = body ? xmlToTxt(body, false) : '';
    delete outputDict['body'];
    
    // Python: commentsbody = outputdict.pop('commentsbody')
    const commentsbody = outputDict['commentsbody'];
    delete outputDict['commentsbody'];
    
    // Python: outputdict['comments'] = xmltotxt(commentsbody, include_formatting=False)
    outputDict['comments'] = commentsbody ? xmlToTxt(commentsbody, false) : '';
  } else {
    // 只包含文本内容
    // Python: outputdict = {'text': xmltotxt(docmeta.body, include_formatting=False)}
    outputDict = {
      'text': docMeta.body ? xmlToTxt(docMeta.body, false) : ''
    };
    
    // Python: outputdict['comments'] = xmltotxt(commentsbody, include_formatting=False)
    outputDict['comments'] = docMeta.commentsbody ? xmlToTxt(docMeta.commentsbody, false) : '';
  }
  
  // Python: return json_dumps(outputdict, ensure_ascii=False)
  // JavaScript默认不转义非ASCII字符，与Python的ensure_ascii=False一致
  return JSON.stringify(outputDict, null, 2);
}

/**
 * 导出所有函数
 */
export default {
  buildJsonOutput
};

