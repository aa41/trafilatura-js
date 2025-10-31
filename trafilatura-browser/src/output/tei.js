/**
 * TEI-XML输出模块
 * 
 * 实现TEI (Text Encoding Initiative) XML格式的输出功能
 * 对应Python模块: trafilatura/xml.py (TEI输出部分)
 * 
 * TEI是一个广泛使用的文本编码标准，用于数字人文研究
 * 
 * @module output/tei
 */

import { cleanAttributes } from './xml-processing.js';

/**
 * TEI命名空间
 */
const TEI_NAMESPACE = 'http://www.tei-c.org/ns/1.0';

/**
 * 包版本（用于元数据）
 */
const PKG_VERSION = '1.0.0'; // 可以从package.json读取

/**
 * 定义发布者字符串
 * 对应Python: _define_publisher_string() - xml.py:437-445
 * 
 * @param {Object} docMeta - 文档元数据
 * @returns {string} 发布者字符串
 * 
 * @example
 * definePublisherString({sitename: 'Example', hostname: 'example.com'})
 * → "Example (example.com)"
 */
function definePublisherString(docMeta) {
  if (docMeta.hostname && docMeta.sitename) {
    return `${docMeta.sitename.trim()} (${docMeta.hostname})`;
  }
  
  const publisher = docMeta.hostname || docMeta.sitename || 'N/A';
  
  if (publisher === 'N/A') {
    console.warn('no publisher for URL', docMeta.url);
  }
  
  return publisher;
}

/**
 * 创建TEI元素（使用XML命名空间）
 * 
 * @param {string} tagName - 标签名
 * @param {Object} attributes - 属性对象
 * @param {string} text - 文本内容
 * @returns {Element} TEI元素
 */
function createTeiElement(tagName, attributes = {}, text = null) {
  // 使用createElementNS创建XML元素，保持大小写
  const element = typeof document.createElementNS !== 'undefined'
    ? document.createElementNS(TEI_NAMESPACE, tagName)
    : document.createElement(tagName);
  
  // 设置属性
  for (const [key, value] of Object.entries(attributes)) {
    if (value !== null && value !== undefined) {
      element.setAttribute(key, String(value));
    }
  }
  
  // 设置文本
  if (text !== null && text !== undefined) {
    element.textContent = String(text);
  }
  
  return element;
}

/**
 * 写入完整的TEI头部
 * 对应Python: write_fullheader() - xml.py:448-516
 * 
 * 基于收集的元数据写入TEI头部
 * 
 * @param {Element} teiDoc - TEI文档根元素
 * @param {Object} docMeta - 文档元数据
 * @returns {Element} TEI头部元素
 */
export function writeFullHeader(teiDoc, docMeta) {
  // <teiHeader>
  const header = createTeiElement('teiHeader');
  teiDoc.appendChild(header);
  
  // <fileDesc>
  const fileDesc = createTeiElement('fileDesc');
  header.appendChild(fileDesc);
  
  // <titleStmt>
  const titleStmt = createTeiElement('titleStmt');
  fileDesc.appendChild(titleStmt);
  
  const mainTitle = createTeiElement('title', { type: 'main' }, docMeta.title || '');
  titleStmt.appendChild(mainTitle);
  
  if (docMeta.author) {
    const author = createTeiElement('author', {}, docMeta.author);
    titleStmt.appendChild(author);
  }
  
  // <publicationStmt>
  const publicationStmt = createTeiElement('publicationStmt');
  fileDesc.appendChild(publicationStmt);
  
  const publisherString = definePublisherString(docMeta);
  
  // license, if applicable
  if (docMeta.license) {
    const publisher = createTeiElement('publisher', {}, publisherString);
    publicationStmt.appendChild(publisher);
    
    const availability = createTeiElement('availability');
    publicationStmt.appendChild(availability);
    
    const licensePara = createTeiElement('p', {}, docMeta.license);
    availability.appendChild(licensePara);
  } else {
    // insert an empty paragraph for conformity
    const emptyPara = createTeiElement('p');
    publicationStmt.appendChild(emptyPara);
  }
  
  // <notesStmt>
  const notesStmt = createTeiElement('notesStmt');
  fileDesc.appendChild(notesStmt);
  
  if (docMeta.id) {
    const idNote = createTeiElement('note', { type: 'id' }, docMeta.id);
    notesStmt.appendChild(idNote);
  }
  
  const fingerprintNote = createTeiElement('note', { type: 'fingerprint' }, docMeta.fingerprint || '');
  notesStmt.appendChild(fingerprintNote);
  
  // <sourceDesc>
  const sourceDesc = createTeiElement('sourceDesc');
  fileDesc.appendChild(sourceDesc);
  
  const sourceBibl = createTeiElement('bibl');
  sourceDesc.appendChild(sourceBibl);
  
  // sigle = ', '.join(filter(None, [docmeta.sitename, docmeta.date]))
  const sigleParts = [docMeta.sitename, docMeta.date].filter(x => x);
  const sigle = sigleParts.join(', ');
  
  if (!sigle) {
    console.warn('no sigle for URL', docMeta.url);
  }
  
  const biblParts = [docMeta.title, sigle].filter(x => x);
  sourceBibl.textContent = biblParts.join(', ');
  
  const sigleBibl = createTeiElement('bibl', { type: 'sigle' }, sigle);
  sourceDesc.appendChild(sigleBibl);
  
  // <biblFull>
  const biblFull = createTeiElement('biblFull');
  sourceDesc.appendChild(biblFull);
  
  const bibTitleStmt = createTeiElement('titleStmt');
  biblFull.appendChild(bibTitleStmt);
  
  const bibMainTitle = createTeiElement('title', { type: 'main' }, docMeta.title || '');
  bibTitleStmt.appendChild(bibMainTitle);
  
  if (docMeta.author) {
    const bibAuthor = createTeiElement('author', {}, docMeta.author);
    bibTitleStmt.appendChild(bibAuthor);
  }
  
  const bibPublicationStmt = createTeiElement('publicationStmt');
  biblFull.appendChild(bibPublicationStmt);
  
  const bibPublisher = createTeiElement('publisher', {}, publisherString);
  bibPublicationStmt.appendChild(bibPublisher);
  
  if (docMeta.url) {
    const ptr = createTeiElement('ptr', { type: 'URL', target: docMeta.url });
    bibPublicationStmt.appendChild(ptr);
  }
  
  const pubDate = createTeiElement('date', {}, docMeta.date || '');
  bibPublicationStmt.appendChild(pubDate);
  
  // <profileDesc>
  const profileDesc = createTeiElement('profileDesc');
  header.appendChild(profileDesc);
  
  const abstract = createTeiElement('abstract');
  profileDesc.appendChild(abstract);
  
  const abstractPara = createTeiElement('p', {}, docMeta.description || '');
  abstract.appendChild(abstractPara);
  
  // categories and tags
  if (docMeta.categories || docMeta.tags) {
    const textClass = createTeiElement('textClass');
    profileDesc.appendChild(textClass);
    
    const keywords = createTeiElement('keywords');
    textClass.appendChild(keywords);
    
    if (docMeta.categories && docMeta.categories.length > 0) {
      const categoriesTerm = createTeiElement('term', 
        { type: 'categories' }, 
        docMeta.categories.join(',')
      );
      keywords.appendChild(categoriesTerm);
    }
    
    if (docMeta.tags && docMeta.tags.length > 0) {
      const tagsTerm = createTeiElement('term', 
        { type: 'tags' }, 
        docMeta.tags.join(',')
      );
      keywords.appendChild(tagsTerm);
    }
  }
  
  // creation date
  const creation = createTeiElement('creation');
  profileDesc.appendChild(creation);
  
  const downloadDate = createTeiElement('date', 
    { type: 'download' }, 
    docMeta.filedate || new Date().toISOString().split('T')[0]
  );
  creation.appendChild(downloadDate);
  
  // <encodingDesc>
  const encodingDesc = createTeiElement('encodingDesc');
  header.appendChild(encodingDesc);
  
  const appInfo = createTeiElement('appInfo');
  encodingDesc.appendChild(appInfo);
  
  const application = createTeiElement('application', {
    version: PKG_VERSION,
    ident: 'Trafilatura'
  });
  appInfo.appendChild(application);
  
  const label = createTeiElement('label', {}, 'Trafilatura');
  application.appendChild(label);
  
  const appPtr = createTeiElement('ptr', { 
    target: 'https://github.com/adbar/trafilatura' 
  });
  application.appendChild(appPtr);
  
  return header;
}

/**
 * 将提取的内容和评论打包成TEI树
 * 对应Python: write_teitree() - xml.py:418-434
 * 
 * @param {Object} docMeta - 文档元数据
 * @returns {Element} TEI文档
 */
export function writeTeiTree(docMeta) {
  // <TEI xmlns="http://www.tei-c.org/ns/1.0">
  // 直接使用createElementNS以保持TEI大写
  const teiDoc = typeof document.createElementNS !== 'undefined'
    ? document.createElementNS(TEI_NAMESPACE, 'TEI')
    : document.createElement('TEI');
  
  teiDoc.setAttribute('xmlns', TEI_NAMESPACE);
  
  // 写入头部
  writeFullHeader(teiDoc, docMeta);
  
  // <text>
  const textElem = createTeiElement('text');
  teiDoc.appendChild(textElem);
  
  // <body>
  const textBody = createTeiElement('body');
  textElem.appendChild(textBody);
  
  // post body
  if (docMeta.body) {
    // 克隆body以避免修改原始元素
    const postBody = docMeta.body.cloneNode(true);
    cleanAttributes(postBody);
    
    // 修改标签为div
    const postDiv = createTeiElement('div');
    postDiv.setAttribute('type', 'entry');
    
    // 复制内容
    while (postBody.firstChild) {
      postDiv.appendChild(postBody.firstChild);
    }
    
    textBody.appendChild(postDiv);
  }
  
  // comments body
  if (docMeta.commentsbody) {
    // 克隆commentsbody以避免修改原始元素
    const commentsBody = docMeta.commentsbody.cloneNode(true);
    cleanAttributes(commentsBody);
    
    // 修改标签为div
    const commentsDiv = createTeiElement('div');
    commentsDiv.setAttribute('type', 'comments');
    
    // 复制内容
    while (commentsBody.firstChild) {
      commentsDiv.appendChild(commentsBody.firstChild);
    }
    
    textBody.appendChild(commentsDiv);
  }
  
  return teiDoc;
}

/**
 * 构建TEI输出
 * 对应Python: build_tei_output() - xml.py:598-632
 * 
 * @param {Object} docMeta - 文档元数据
 * @returns {Element} TEI文档
 */
export function buildTeiOutput(docMeta) {
  return writeTeiTree(docMeta);
}

/**
 * 将TEI文档转换为XML字符串
 * 
 * @param {Element} teiDoc - TEI文档
 * @param {boolean} pretty - 是否格式化输出
 * @returns {string} XML字符串
 */
export function teiToString(teiDoc, pretty = true) {
  if (!teiDoc) {
    return '';
  }
  
  const serializer = new XMLSerializer();
  let xmlString = serializer.serializeToString(teiDoc);
  
  // 添加XML声明
  if (!xmlString.startsWith('<?xml')) {
    xmlString = '<?xml version="1.0" encoding="UTF-8"?>\n' + xmlString;
  }
  
  // 简单的格式化（如果需要）
  if (pretty) {
    // 基础的格式化：在主要标签后添加换行
    xmlString = xmlString
      .replace(/></g, '>\n<')
      .replace(/\n\s*\n/g, '\n');
  }
  
  return xmlString;
}

/**
 * 导出所有函数
 */
export default {
  writeFullHeader,
  writeTeiTree,
  buildTeiOutput,
  teiToString
};

