/**
 * 常量定义 - 移植自 Python 版本的各种常量
 * 包括标签列表、正则表达式、XPath 表达式等
 */

// ============= 标签和元素定义 =============

/**
 * 需要手动清理的标签列表
 * 对应 Python: MANUALLY_CLEANED
 */
export const MANUALLY_CLEANED = [
  'aside',
  'embed',
  'figure',
  'footer',
  'form',
  'header',
  'iframe',
  'label',
  'map',
  'nav',
  'object',
  'picture',
  'select',
  'source',
  'svg',
  'textarea',
  'video',
];

/**
 * 需要剥离但保留内容的标签
 * 对应 Python: MANUALLY_STRIPPED
 */
export const MANUALLY_STRIPPED = [
  'a',
  'abbr',
  'acronym',
  'address',
  'bdi',
  'bdo',
  'big',
  'cite',
  'data',
  'dfn',
  'font',
  'hgroup',
  'img',
  'ins',
  'mark',
  'meta',
  'ruby',
  'rp',
  'rt',
  'small',
  'tbody',
  'template',
  'tfoot',
  'time',
];

/**
 * 需要删除的空元素
 * 对应 Python: CUT_EMPTY_ELEMS
 */
export const CUT_EMPTY_ELEMS = new Set([
  'article',
  'b',
  'blockquote',
  'dd',
  'div',
  'dt',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'i',
  'li',
  'main',
  'p',
  'pre',
  'q',
  'section',
  'span',
  'strong',
]);

/**
 * 标签目录 - 核心处理的标签
 * 对应 Python: TAG_CATALOG
 */
export const TAG_CATALOG = new Set([
  'blockquote',
  'code',
  'del',
  'fw',
  'head',
  'hi',
  'item',
  'lb',
  'list',
  'p',
  'pre',
  'q',
  'quote',
]);

// ============= 渲染标签映射 =============

/**
 * HTML 格式化标签到内部表示的映射
 * 对应 Python: REND_TAG_MAPPING
 */
export const REND_TAG_MAPPING = {
  em: '#i',
  i: '#i',
  b: '#b',
  strong: '#b',
  u: '#u',
  kbd: '#t',
  samp: '#t',
  tt: '#t',
  var: '#t',
  sub: '#sub',
  sup: '#sup',
};

/**
 * 内部表示到 HTML 标签的映射
 */
export const HTML_TAG_MAPPING = {};
Object.keys(REND_TAG_MAPPING).forEach(key => {
  const value = REND_TAG_MAPPING[key];
  if (!HTML_TAG_MAPPING[value]) {
    HTML_TAG_MAPPING[value] = key;
  }
});

// ============= 正则表达式 =============

/**
 * HTML 标签剥离正则
 * 对应 Python: HTML_STRIP_TAGS
 */
export const HTML_STRIP_TAGS = /(<!--.*?-->|<[^>]*>)/g;

/**
 * 行修整正则
 * 对应 Python: LINES_TRIMMING
 */
export const LINES_TRIMMING = /(?<![p{P}>])\n/gu;

/**
 * 图片扩展名正则
 * 对应 Python: IMAGE_EXTENSION
 */
export const IMAGE_EXTENSION = /[^\s]+\.(avif|bmp|gif|hei[cf]|jpe?g|png|webp)(\b|$)/i;

/**
 * 社交媒体过滤正则
 * 对应 Python: RE_FILTER
 */
export const RE_FILTER =
  /\W*(Drucken|E-?Mail|Facebook|Flipboard|Google|Instagram|Linkedin|Mail|PDF|Pinterest|Pocket|Print|QQ|Reddit|Twitter|WeChat|WeiBo|Whatsapp|Xing|Mehr zum Thema:?|More on this.{,8}$)$/i;

/**
 * HTML 标题分隔符正则
 * 对应 Python: HTMLTITLE_REGEX
 */
export const HTMLTITLE_REGEX = /^(.+)?\s+[–•·—|⁄*⋆~‹«<›»>:-]\s+(.+)$/;

/**
 * URL 格式正则
 */
export const META_URL = /https?:\/\/(?:www\.|w[0-9]+\.)?([^/]+)/;

/**
 * HTML 语言属性正则
 */
export const RE_HTML_LANG = /([a-z]{2})/;

// ============= 元数据名称集合 =============

/**
 * 作者相关的 meta name 属性
 * 对应 Python: METANAME_AUTHOR
 */
export const METANAME_AUTHOR = new Set([
  'article:author',
  'atc-metaauthor',
  'author',
  'authors',
  'byl',
  'citation_author',
  'creator',
  'dc.creator',
  'dc.creator.aut',
  'dc:creator',
  'dcterms.creator',
  'dcterms.creator.aut',
  'dcsext.author',
  'parsely-author',
  'rbauthors',
  'sailthru.author',
  'shareaholic:article_author_name',
]);

/**
 * 描述相关的 meta name 属性
 */
export const METANAME_DESCRIPTION = new Set([
  'dc.description',
  'dc:description',
  'dcterms.abstract',
  'dcterms.description',
  'description',
  'sailthru.description',
  'twitter:description',
]);

/**
 * 发布者相关的 meta name 属性
 */
export const METANAME_PUBLISHER = new Set([
  'article:publisher',
  'citation_journal_title',
  'copyright',
  'dc.publisher',
  'dc:publisher',
  'dcterms.publisher',
  'publisher',
  'sailthru.publisher',
  'rbpubname',
  'twitter:site',
]);

/**
 * 标签相关的 meta name 属性
 */
export const METANAME_TAG = new Set([
  'citation_keywords',
  'dcterms.subject',
  'keywords',
  'parsely-tags',
  'shareaholic:keywords',
  'tags',
]);

/**
 * 标题相关的 meta name 属性
 */
export const METANAME_TITLE = new Set([
  'citation_title',
  'dc.title',
  'dcterms.title',
  'fb_title',
  'headline',
  'parsely-title',
  'sailthru.title',
  'shareaholic:title',
  'rbtitle',
  'title',
  'twitter:title',
]);

/**
 * URL 相关的 meta name 属性
 */
export const METANAME_URL = new Set(['rbmainurl', 'twitter:url']);

/**
 * 图片相关的 meta name 属性
 */
export const METANAME_IMAGE = new Set([
  'image',
  'og:image',
  'og:image:url',
  'og:image:secure_url',
  'twitter:image',
  'twitter:image:src',
]);

/**
 * OpenGraph 作者属性
 */
export const OG_AUTHOR = new Set(['og:author', 'og:article:author']);

/**
 * OpenGraph 属性映射
 */
export const OG_PROPERTIES = {
  'og:title': 'title',
  'og:description': 'description',
  'og:site_name': 'sitename',
  'og:image': 'image',
  'og:image:url': 'image',
  'og:image:secure_url': 'image',
  'og:type': 'pagetype',
};

// ============= 保护的标签集合 =============

/**
 * 格式化受保护的标签
 */
export const FORMATTING_PROTECTED = new Set(['cell', 'head', 'hi', 'item', 'p', 'quote', 'ref', 'td']);

/**
 * 空格受保护的标签
 */
export const SPACING_PROTECTED = new Set(['code', 'pre']);

/**
 * 段落格式化标签
 */
export const P_FORMATTING = new Set(['hi', 'ref']);

/**
 * 表格元素标签
 */
export const TABLE_ELEMS = new Set(['td', 'th']);

/**
 * 代码和引用标签
 */
export const CODES_QUOTES = new Set(['code', 'quote']);

/**
 * 不应出现在结尾的标签
 */
export const NOT_AT_THE_END = new Set(['head', 'ref']);

// ============= 代码块指示符 =============

/**
 * 代码块内容的指示字符串
 */
export const CODE_INDICATORS = ['{', '("', "('", '\n    '];

// ============= 图片相关 =============

/**
 * 清理时保留的图片相关标签
 */
export const PRESERVE_IMG_CLEANING = new Set(['figure', 'picture', 'source']);

// ============= 许可证正则 =============

/**
 * 清理 Meta 标签正则
 */
export const CLEAN_META_TAGS = /['"]/g;

/**
 * Creative Commons 许可证正则
 */
export const LICENSE_REGEX = /\/(by-nc-nd|by-nc-sa|by-nc|by-nd|by-sa|by|zero)\/([1-9]\.[0-9])/;

/**
 * 文本中的许可证正则
 */
export const TEXT_LICENSE_REGEX = /(cc|creative commons) (by-nc-nd|by-nc-sa|by-nc|by-nd|by-sa|by|zero) ?([1-9]\.[0-9])?/i;

// ============= URL 选择器 =============

/**
 * 用于提取规范 URL 的选择器
 */
export const URL_SELECTORS = [
  'head link[rel="canonical"]',
  'head base',
  'head link[rel="alternate"][hreflang="x-default"]',
];

// ============= 默认配置 =============

/**
 * 默认提取配置
 */
export const DEFAULT_CONFIG = {
  // 提取选项
  fast: false,
  precision: false,
  recall: false,
  
  // 内容选项
  comments: true,
  formatting: false,
  links: false,
  images: false,
  tables: true,
  
  // 输出选项
  format: 'txt',
  with_metadata: false,
  only_with_metadata: false,
  
  // 去重和过滤
  dedup: false,
  lang: null,
  
  // 黑名单
  url_blacklist: new Set(),
  author_blacklist: new Set(),
  
  // 尺寸限制
  min_file_size: 10,
  max_file_size: 20000000,
  min_extracted_size: 200,
  min_output_size: 10,
  min_output_comm_size: 10,
  min_extracted_comm_size: 10,
  max_tree_size: null,
  
  // 焦点模式
  focus: 'balanced', // 'balanced', 'precision', 'recall'
};

/**
 * 输出格式集合
 */
export const TXT_FORMATS = new Set(['markdown', 'txt']);

// ============= Meta 属性 =============

/**
 * 额外的 meta 属性
 */
export const EXTRA_META = new Set(['charset', 'http-equiv', 'property']);

/**
 * Twitter 相关属性
 */
export const TWITTER_ATTRS = new Set(['twitter:site', 'application-name']);

/**
 * Property 作者属性
 */
export const PROPERTY_AUTHOR = new Set(['author', 'article:author']);

/**
 * Meta 属性列表（用于输出）
 */
export const META_ATTRIBUTES = [
  'title',
  'author',
  'url',
  'hostname',
  'description',
  'sitename',
  'date',
  'categories',
  'tags',
  'fingerprint',
  'id',
  'license',
  'language',
];

// ============= XPath 表达式 =============

/**
 * 标题提取 XPath
 */
export const TITLE_XPATHS = [
  '//head/title',
  '//h1[@class="title"]',
  '//h1[@class="post-title"]',
  '//h1[@class="entry-title"]',
  '//h1[@class="article-title"]',
];

/**
 * 作者提取 XPath
 */
export const AUTHOR_XPATHS = [
  './/*[(@class="author" or @class="byline" or @rel="author")]',
  './/*[contains(@class, "author-name")]',
  './/*[@itemprop="author"]',
];

/**
 * 作者丢弃 XPath
 */
export const AUTHOR_DISCARD_XPATHS = [
  './/*[@class="comments" or @class="comment"]',
];

/**
 * 分类提取 XPath
 */
export const CATEGORIES_XPATHS = [
  './/a[contains(@href, "/category/") or contains(@href, "/categories/")]',
  './/*[@class="category" or contains(@class, "categories")]//a[@href]',
];

/**
 * 标签提取 XPath
 */
export const TAGS_XPATHS = [
  './/a[contains(@href, "/tag/") or contains(@href, "/tags/")]',
  './/*[@class="tag" or contains(@class, "tags")]//a[@href]',
];

