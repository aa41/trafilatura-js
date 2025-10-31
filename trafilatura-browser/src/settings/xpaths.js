/**
 * XPath表达式定义
 * 
 * 对应Python模块: trafilatura/xpaths.py
 * 定义用于提取和过滤主内容、元数据的XPath表达式
 * 
 * @module settings/xpaths
 */

/**
 * 执行XPath查询的辅助函数
 * 
 * @param {Document|Element} context - 查询上下文
 * @param {string} xpath - XPath表达式
 * @returns {Array<Element>} 匹配的元素数组
 */
export function evaluateXPath(context, xpath) {
  const doc = context.ownerDocument || context;
  const results = [];
  
  try {
    const xpathResult = doc.evaluate(
      xpath,
      context,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    );
    
    for (let i = 0; i < xpathResult.snapshotLength; i++) {
      results.push(xpathResult.snapshotItem(i));
    }
  } catch (error) {
    console.warn('XPath evaluation failed:', xpath, error);
  }
  
  return results;
}

/**
 * 创建XPath查询函数
 * 
 * @param {string} xpath - XPath表达式
 * @returns {Function} XPath查询函数
 */
export function createXPathFunction(xpath) {
  return (context) => evaluateXPath(context, xpath);
}

// ===== 1. 内容提取XPath =====
// 对应Python: xpaths.py:13-54

/**
 * 主体内容XPath表达式
 * 对应Python: BODY_XPATH
 * 按优先级排序，用于查找文章主体内容
 * 
 * @type {Array<Function>}
 */
export const BODY_XPATH = [
  // 第一优先级：明确的文章内容标识
  `.//*[self::article or self::div or self::main or self::section][
    @class="post" or @class="entry" or
    contains(@class, "post-text") or contains(@class, "post_text") or
    contains(@class, "post-body") or contains(@class, "post-entry") or contains(@class, "postentry") or
    contains(@class, "post-content") or contains(@class, "post_content") or
    contains(@class, "postcontent") or contains(@class, "postContent") or contains(@class, "post_inner_wrapper") or
    contains(@class, "article-text") or contains(@class, "articletext") or contains(@class, "articleText")
    or contains(@id, "entry-content") or
    contains(@class, "entry-content") or contains(@id, "article-content") or
    contains(@class, "article-content") or contains(@id, "article__content") or
    contains(@class, "article__content") or contains(@id, "article-body") or
    contains(@class, "article-body") or contains(@id, "article__body") or
    contains(@class, "article__body") or @itemprop="articleBody" or
    contains(translate(@id, "B", "b"), "articlebody") or contains(translate(@class, "B", "b"), "articlebody")
    or @id="articleContent" or contains(@class, "ArticleContent") or
    contains(@class, "page-content") or contains(@class, "text-content") or
    contains(@id, "body-text") or contains(@class, "body-text") or
    contains(@class, "article__container") or contains(@id, "art-content") or contains(@class, "art-content")][1]`,
  
  // 第二优先级：简单article标签
  `(.//article)[1]`,
  
  // 第三优先级：通用内容类名
  `(.//*[self::article or self::div or self::main or self::section][
    contains(@class, 'post-bodycopy') or
    contains(@class, 'storycontent') or contains(@class, 'story-content') or
    @class='postarea' or @class='art-postcontent' or
    contains(@class, 'theme-content') or contains(@class, 'blog-content') or
    contains(@class, 'section-content') or contains(@class, 'single-content') or
    contains(@class, 'single-post') or
    contains(@class, 'main-column') or contains(@class, 'wpb_text_column') or
    starts-with(@id, 'primary') or starts-with(@class, 'article ') or @class="text" or
    @id="article" or @class="cell" or @id="story" or @class="story" or
    contains(@class, "story-body") or contains(@id, "story-body") or contains(@class, "field-body") or
    contains(translate(@class, "FULTEX","fultex"), "fulltext")
    or @role='article'])[1]`,
  
  // 第四优先级：content相关
  `(.//*[self::article or self::div or self::main or self::section][
    contains(@id, "content-main") or contains(@class, "content-main") or contains(@class, "content_main") or
    contains(@id, "content-body") or contains(@class, "content-body") or contains(@id, "contentBody")
    or contains(@class, "content__body") or contains(translate(@id, "CM","cm"), "main-content") or contains(translate(@class, "CM","cm"), "main-content")
    or contains(translate(@class, "CP","cp"), "page-content") or
    @id="content" or @class="content"])[1]`,
  
  // 第五优先级：main标签
  `(.//*[self::article or self::div or self::section][starts-with(@class, "main") or starts-with(@id, "main") or starts-with(@role, "main")])[1]|(.//main)[1]`
].map(createXPathFunction);

/**
 * 评论区域XPath表达式
 * 对应Python: COMMENTS_XPATH
 * 
 * @type {Array<Function>}
 */
export const COMMENTS_XPATH = [
  `.//*[self::div or self::list or self::section][contains(@id, 'commentlist') or contains(@class, 'commentlist')
    or contains(@class, 'comment-page') or
    contains(@id, 'comment-list') or contains(@class, 'comment-list') or
    contains(@class, 'comments-content') or contains(@class, 'post-comments')]`,
  
  `.//*[self::div or self::section or self::list][starts-with(@id, 'comments') or starts-with(@class, 'comments')
    or starts-with(@class, 'Comments') or
    starts-with(@id, 'comment-') or starts-with(@class, 'comment-') or
    contains(@class, 'article-comments')]`,
  
  `.//*[self::div or self::section or self::list][starts-with(@id, 'comol') or
    starts-with(@id, 'disqus_thread') or starts-with(@id, 'dsq-comments')]`,
  
  `.//*[self::div or self::section][starts-with(@id, 'social') or contains(@class, 'comment')]`
].map(createXPathFunction);

/**
 * 移除评论区域XPath表达式
 * 对应Python: REMOVE_COMMENTS_XPATH
 * 
 * @type {Array<Function>}
 */
export const REMOVE_COMMENTS_XPATH = [
  `.//*[self::div or self::list or self::section][
    starts-with(translate(@id, "C","c"), 'comment') or
    starts-with(translate(@class, "C","c"), 'comment') or
    contains(@class, 'article-comments') or contains(@class, 'post-comments')
    or starts-with(@id, 'comol') or starts-with(@id, 'disqus_thread')
    or starts-with(@id, 'dsq-comments')
    ]`
].map(createXPathFunction);

/**
 * 总体丢弃XPath表达式
 * 对应Python: OVERALL_DISCARD_XPATH
 * 用于移除导航、页脚、分享按钮等
 * 
 * @type {Array<Function>}
 */
export const OVERALL_DISCARD_XPATH = [
  // 导航+页脚、相关文章、分享、付费墙等
  `.//*[self::div or self::item or self::list
          or self::p or self::section or self::span][
    contains(translate(@id, "F","f"), "footer") or contains(translate(@class, "F","f"), "footer")
    or contains(@id, "related") or contains(@class, "elated") or
    contains(@id, "viral") or contains(@class, "viral") or
    starts-with(@id, "shar") or starts-with(@class, "shar") or
    contains(@class, "share-") or
    contains(translate(@id, "S", "s"), "share") or
    contains(@id, "social") or contains(@class, "social") or contains(@class, "sociable") or
    contains(@id, "syndication") or contains(@class, "syndication") or
    starts-with(@id, "jp-") or starts-with(@id, "dpsp-content") or
    contains(@class, "embedded") or contains(@class, "embed") or
    contains(@id, "newsletter") or contains(@class, "newsletter") or
    contains(@class, "subnav") or
    contains(@id, "cookie") or contains(@class, "cookie") or
    contains(@id, "tags") or contains(@class, "tags") or contains(@class, "tag-list") or
    contains(@id, "sidebar") or contains(@class, "sidebar") or
    contains(@id, "banner") or contains(@class, "banner") or contains(@class, "bar") or
    contains(@class, "meta") or contains(@id, "menu") or contains(@class, "menu") or
    contains(translate(@id, "N", "n"), "nav") or contains(translate(@role, "N", "n"), "nav")
    or starts-with(@class, "nav") or contains(@class, "avigation") or
    contains(@class, "navbar") or contains(@class, "navbox") or starts-with(@class, "post-nav")
    or contains(@id, "breadcrumb") or contains(@class, "breadcrumb") or
    contains(@id, "bread-crumb") or contains(@class, "bread-crumb") or
    contains(@id, "author") or contains(@class, "author") or
    contains(@id, "button") or contains(@class, "button")
    or contains(translate(@class, "B", "b"), "byline")
    or contains(@class, "rating") or contains(@class, "widget") or
    contains(@class, "attachment") or contains(@class, "timestamp") or
    contains(@class, "user-info") or contains(@class, "user-profile") or
    contains(@class, "-ad-") or contains(@class, "-icon")
    or contains(@class, "article-infos") or
    contains(@class, "nfoline")
    or contains(@data-component, "MostPopularStories")
    or contains(@class, "outbrain") or contains(@class, "taboola")
    or contains(@class, "criteo") or contains(@class, "options") or contains(@class, "expand")
    or contains(@class, "consent") or contains(@class, "modal-content")
    or contains(@class, " ad ") or contains(@class, "permission")
    or contains(@class, "next-") or contains(@class, "-stories")
    or contains(@class, "most-popular") or contains(@class, "mol-factbox")
    or starts-with(@class, "ZendeskForm") or contains(@id, "message-container") or contains(@class, "message-container")
    or contains(@class, "yin") or contains(@class, "zlylin")
    or contains(@class, "xg1") or contains(@id, "bmdh")
    or contains(@class, "slide") or contains(@class, "viewport")
    or @data-lp-replacement-content
    or contains(@id, "premium") or contains(@class, "overlay")
    or contains(@class, "paid-content") or contains(@class, "paidcontent")
    or contains(@class, "obfuscated") or contains(@class, "blurred")]`,
  
  // 评论残留 + 隐藏部分
  `.//*[@class="comments-title" or contains(@class, "comments-title") or
    contains(@class, "nocomments") or starts-with(@id, "reply-") or starts-with(@class, "reply-") or
    contains(@class, "-reply-") or contains(@class, "message") or contains(@id, "reader-comments")
    or contains(@id, "akismet") or contains(@class, "akismet") or contains(@class, "suggest-links") or
    starts-with(@class, "hide-") or contains(@class, "-hide-") or contains(@class, "hide-print") or
    contains(@id, "hidden") or contains(@style, "hidden") or contains(@class, " hidden") or contains(@class, " hide")
    or contains(@class, "noprint") or contains(@style, "display:none") or contains(@style, "display: none")
    or @aria-hidden="true" or contains(@class, "notloaded")]`
].map(createXPathFunction);

/**
 * 预告片丢弃XPath表达式
 * 对应Python: TEASER_DISCARD_XPATH
 * 
 * @type {Array<Function>}
 */
export const TEASER_DISCARD_XPATH = [
  `.//*[self::div or self::item or self::list
           or self::p or self::section or self::span][
      contains(translate(@id, "T", "t"), "teaser") or contains(translate(@class, "T", "t"), "teaser")
  ]`
].map(createXPathFunction);

/**
 * 精确模式丢弃XPath表达式
 * 对应Python: PRECISION_DISCARD_XPATH
 * 
 * @type {Array<Function>}
 */
export const PRECISION_DISCARD_XPATH = [
  './/header',
  `.//*[self::div or self::item or self::list
           or self::p or self::section or self::span][
      contains(@id, "bottom") or contains(@class, "bottom") or
      contains(@id, "link") or contains(@class, "link") or
      contains(@style, "border")
  ]`
].map(createXPathFunction);

/**
 * 丢弃图片元素XPath表达式
 * 对应Python: DISCARD_IMAGE_ELEMENTS
 * 
 * @type {Array<Function>}
 */
export const DISCARD_IMAGE_ELEMENTS = [
  `.//*[self::div or self::item or self::list
           or self::p or self::section or self::span][
           contains(@id, "caption") or contains(@class, "caption")
          ]`
].map(createXPathFunction);

/**
 * 评论丢弃XPath表达式
 * 对应Python: COMMENTS_DISCARD_XPATH
 * 
 * @type {Array<Function>}
 */
export const COMMENTS_DISCARD_XPATH = [
  './/*[self::div or self::section][starts-with(@id, "respond")]',
  './/cite|.//quote',
  `.//*[@class="comments-title" or contains(@class, "comments-title") or
    contains(@class, "nocomments") or starts-with(@id, "reply-") or starts-with(@class, "reply-") or
    contains(@class, "-reply-") or contains(@class, "message")
    or contains(@class, "signin") or
    contains(@id, "akismet") or contains(@class, "akismet") or contains(@style, "display:none")]`
].map(createXPathFunction);

// ===== 2. 元数据提取XPath =====
// 对应Python: xpaths.py:210-268

/**
 * 作者XPath表达式
 * 对应Python: AUTHOR_XPATHS
 * 
 * @type {Array<Function>}
 */
export const AUTHOR_XPATHS = [
  // 特定和几乎特定
  `//*[self::a or self::address or self::div or self::link or self::p or self::span or self::strong][@rel="author" or @id="author" or @class="author" or @itemprop="author name" or @rel="me" or contains(@class, "author-name") or contains(@class, "AuthorName") or contains(@class, "authorName") or contains(@class, "author name") or @data-testid="AuthorCard" or @data-testid="AuthorURL"]|//author`,
  
  // 几乎通用和通用
  `//*[self::a or self::div or self::h3 or self::h4 or self::p or self::span][contains(@class, "author") or contains(@id, "author") or contains(@itemprop, "author") or @class="byline" or contains(@class, "channel-name") or contains(@id, "zuozhe") or contains(@class, "zuozhe") or contains(@id, "bianji") or contains(@class, "bianji") or contains(@id, "xiaobian") or contains(@class, "xiaobian") or contains(@class, "submitted-by") or contains(@class, "posted-by") or @class="username" or @class="byl" or @class="BBL" or contains(@class, "journalist-name")]`,
  
  // 最后的手段：任何元素
  `//*[contains(translate(@id, "A", "a"), "author") or contains(translate(@class, "A", "a"), "author") or contains(@class, "screenname") or contains(@data-component, "Byline") or contains(@itemprop, "author") or contains(@class, "writer") or contains(translate(@class, "B", "b"), "byline")]`
].map(createXPathFunction);

/**
 * 作者丢弃XPath表达式
 * 对应Python: AUTHOR_DISCARD_XPATHS
 * 
 * @type {Array<Function>}
 */
export const AUTHOR_DISCARD_XPATHS = [
  `.//*[self::a or self::div or self::section or self::span][@id='comments' or @class='comments' or @class='title' or @class='date' or
    contains(@id, 'commentlist') or contains(@class, 'commentlist') or contains(@class, 'sidebar') or contains(@class, 'is-hidden') or contains(@class, 'quote')
    or contains(@id, 'comment-list') or contains(@class, 'comments-list') or contains(@class, 'embedly-instagram') or contains(@id, 'ProductReviews') or
    starts-with(@id, 'comments') or contains(@data-component, "Figure") or contains(@class, "article-share") or contains(@class, "article-support") or contains(@class, "print") or contains(@class, "category") or contains(@class, "meta-date") or contains(@class, "meta-reviewer")
    or starts-with(@class, 'comments') or starts-with(@class, 'Comments')
    ]`,
  '//time|//figure'
].map(createXPathFunction);

/**
 * 分类XPath表达式
 * 对应Python: CATEGORIES_XPATHS
 * 
 * @type {Array<Function>}
 */
export const CATEGORIES_XPATHS = [
  `//div[starts-with(@class, 'post-info') or starts-with(@class, 'postinfo') or
    starts-with(@class, 'post-meta') or starts-with(@class, 'postmeta') or
    starts-with(@class, 'meta') or starts-with(@class, 'entry-meta') or starts-with(@class, 'entry-info') or
    starts-with(@class, 'entry-utility') or starts-with(@id, 'postpath')]//a[@href]`,
  
  `//p[starts-with(@class, 'postmeta') or starts-with(@class, 'entry-categories') or @class='postinfo' or @id='filedunder']//a[@href]`,
  
  `//footer[starts-with(@class, 'entry-meta') or starts-with(@class, 'entry-footer')]//a[@href]`,
  
  `//*[self::li or self::span][@class="post-category" or @class="postcategory" or @class="entry-category" or contains(@class, "cat-links")]//a[@href]`,
  
  '//header[@class="entry-header"]//a[@href]',
  
  '//div[@class="row" or @class="tags"]//a[@href]'
].map(createXPathFunction);

/**
 * 标签XPath表达式
 * 对应Python: TAGS_XPATHS
 * 
 * @type {Array<Function>}
 */
export const TAGS_XPATHS = [
  '//div[@class="tags"]//a[@href]',
  
  `//p[starts-with(@class, 'entry-tags')]//a[@href]`,
  
  `//div[@class="row" or @class="jp-relatedposts" or
    @class="entry-utility" or starts-with(@class, 'tag') or
    starts-with(@class, 'postmeta') or starts-with(@class, 'meta')]//a[@href]`,
  
  `//*[@class="entry-meta" or contains(@class, "topics") or contains(@class, "tags-links")]//a[@href]`
].map(createXPathFunction);

/**
 * 标题XPath表达式
 * 对应Python: TITLE_XPATHS
 * 
 * @type {Array<Function>}
 */
export const TITLE_XPATHS = [
  `//*[self::h1 or self::h2][contains(@class, "post-title") or contains(@class, "entry-title") or contains(@class, "headline") or contains(@id, "headline") or contains(@itemprop, "headline") or contains(@class, "post__title") or contains(@class, "article-title")]`,
  
  `//*[@class="entry-title" or @class="post-title"]`,
  
  `//*[self::h1 or self::h2 or self::h3][contains(@class, "title") or contains(@id, "title")]`
].map(createXPathFunction);

/**
 * 基础清理选择器（用于baseline提取）
 * 对应Python: BASIC_CLEAN_XPATH - settings.py:432-434
 * 
 * XPath: ".//aside|.//div[contains(@class|@id, 'footer')]|.//footer|.//script|.//style"
 * 
 * 选择需要删除的元素：aside, footer相关div, footer, script, style
 * 
 * @param {Element} tree - 要搜索的树
 * @returns {Array<Element>} 匹配的元素列表
 */
export function BASIC_CLEAN_XPATH(tree) {
  if (!tree) return [];
  
  const elements = [];
  
  // .//aside
  elements.push(...tree.querySelectorAll('aside'));
  
  // .//div[contains(@class|@id, 'footer')]
  const divs = tree.querySelectorAll('div');
  for (const div of divs) {
    const className = div.className || '';
    const id = div.id || '';
    if (className.includes('footer') || id.includes('footer')) {
      elements.push(div);
    }
  }
  
  // .//footer
  elements.push(...tree.querySelectorAll('footer'));
  
  // .//script
  elements.push(...tree.querySelectorAll('script'));
  
  // .//style
  elements.push(...tree.querySelectorAll('style'));
  
  return Array.from(elements);
}

// ===== 导出所有XPath =====

export default {
  // 内容提取
  BODY_XPATH,
  COMMENTS_XPATH,
  REMOVE_COMMENTS_XPATH,
  OVERALL_DISCARD_XPATH,
  TEASER_DISCARD_XPATH,
  PRECISION_DISCARD_XPATH,
  DISCARD_IMAGE_ELEMENTS,
  COMMENTS_DISCARD_XPATH,
  
  // 基础清理（baseline）
  BASIC_CLEAN_XPATH,
  
  // 元数据提取
  AUTHOR_XPATHS,
  AUTHOR_DISCARD_XPATHS,
  CATEGORIES_XPATHS,
  TAGS_XPATHS,
  TITLE_XPATHS,
  
  // 辅助函数
  evaluateXPath,
  createXPathFunction
};

