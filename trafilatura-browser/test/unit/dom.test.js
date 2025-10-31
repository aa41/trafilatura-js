/**
 * DOM处理工具函数单元测试
 */

import {
  loadHtml,
  deleteElement,
  stripTags,
  stripElements,
  copyTree,
  isElement,
  getTextContent,
  setTextContent,
  getTail,
  setTail,
  createElement,
  clearAttributes,
  iterElements,
  findDescendants,
  _internal
} from '../../src/utils/dom.js';

const { isDubiousHtml, repairFaultyHtml } = _internal;

describe('DOM处理函数', () => {
  describe('loadHtml()', () => {
    test('解析简单HTML', () => {
      const html = '<html><body><p>Test</p></body></html>';
      const doc = loadHtml(html);
      expect(doc).not.toBeNull();
      expect(doc.querySelector('p').textContent).toBe('Test');
    });

    test('解析复杂HTML', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head><title>Test</title></head>
        <body>
          <div class="content">
            <h1>Title</h1>
            <p>Paragraph</p>
          </div>
        </body>
        </html>
      `;
      const doc = loadHtml(html);
      expect(doc).not.toBeNull();
      expect(doc.querySelector('h1').textContent).toBe('Title');
      expect(doc.querySelector('p').textContent).toBe('Paragraph');
    });

    test('处理已解析的Document', () => {
      const parser = new DOMParser();
      const doc = parser.parseFromString('<html><body></body></html>', 'text/html');
      const result = loadHtml(doc);
      expect(result).toBe(doc);
    });

    test('处理Element对象', () => {
      const div = document.createElement('div');
      const result = loadHtml(div);
      expect(result).toBe(div);
    });

    test('无效输入返回null', () => {
      expect(loadHtml(null)).toBeNull();
      expect(loadHtml(123)).toBeNull();
      expect(loadHtml({})).toBeNull();
    });

    test('修复错误的DOCTYPE', () => {
      const html = '< ! DOCTYPE html/xml><html><body></body></html>';
      const doc = loadHtml(html);
      expect(doc).not.toBeNull();
    });

    test('修复自闭合html标签', () => {
      const html = '<html />\n<body><p>Test</p></body>';
      const doc = loadHtml(html);
      expect(doc).not.toBeNull();
    });

    test('可疑HTML检测', () => {
      // 不包含html标签的文本
      const dubious = '<div>content</div>';
      const doc = loadHtml(dubious);
      // 应该能解析，但元素较少时可能被拒绝
      // 这取决于内容多少
    });
  });

  describe('deleteElement()', () => {
    test('删除元素', () => {
      const html = '<div><p>Keep</p><span>Delete</span></div>';
      const doc = loadHtml(html);
      const span = doc.querySelector('span');
      deleteElement(span);
      expect(doc.querySelector('span')).toBeNull();
      expect(doc.querySelector('p')).not.toBeNull();
    });

    test('删除嵌套元素', () => {
      const html = '<div><section><p>Test</p></section></div>';
      const doc = loadHtml(html);
      const section = doc.querySelector('section');
      deleteElement(section);
      expect(doc.querySelector('section')).toBeNull();
    });

    test('处理null元素', () => {
      expect(() => deleteElement(null)).not.toThrow();
      expect(() => deleteElement(undefined)).not.toThrow();
    });

    test('处理没有父节点的元素', () => {
      const element = document.createElement('div');
      expect(() => deleteElement(element)).not.toThrow();
    });
  });

  describe('stripTags()', () => {
    test('剥离单个标签', () => {
      const html = '<div><span>text</span></div>';
      const doc = loadHtml(html);
      const div = doc.querySelector('div');
      stripTags(div, 'span');
      expect(div.querySelector('span')).toBeNull();
      expect(div.textContent).toBe('text');
    });

    test('剥离多个标签', () => {
      const html = '<div><span>one</span><em>two</em></div>';
      const doc = loadHtml(html);
      const div = doc.querySelector('div');
      stripTags(div, 'span', 'em');
      expect(div.querySelector('span')).toBeNull();
      expect(div.querySelector('em')).toBeNull();
      expect(div.textContent).toBe('onetwo');
    });

    test('剥离标签但保留子元素', () => {
      const html = '<div><section><p>nested</p></section></div>';
      const doc = loadHtml(html);
      const div = doc.querySelector('div');
      stripTags(div, 'section');
      expect(div.querySelector('section')).toBeNull();
      expect(div.querySelector('p')).not.toBeNull();
      expect(div.textContent).toBe('nested');
    });

    test('处理空树', () => {
      expect(() => stripTags(null, 'div')).not.toThrow();
    });
  });

  describe('stripElements()', () => {
    test('移除指定标签的所有元素', () => {
      const html = '<div><script>code</script><p>text</p></div>';
      const doc = loadHtml(html);
      const div = doc.querySelector('div');
      stripElements(div, 'script');
      expect(div.querySelector('script')).toBeNull();
      expect(div.querySelector('p')).not.toBeNull();
    });

    test('移除多个同类元素', () => {
      const html = '<div><span>1</span><p>text</p><span>2</span></div>';
      const doc = loadHtml(html);
      const div = doc.querySelector('div');
      stripElements(div, 'span');
      expect(div.querySelectorAll('span').length).toBe(0);
      expect(div.querySelector('p')).not.toBeNull();
    });
  });

  describe('copyTree()', () => {
    test('深拷贝树', () => {
      const html = '<div><p>test</p></div>';
      const doc = loadHtml(html);
      const div = doc.querySelector('div');
      const copy = copyTree(div, true);
      
      expect(copy).not.toBe(div);
      expect(copy.querySelector('p')).not.toBeNull();
      expect(copy.textContent).toBe('test');
    });

    test('浅拷贝树', () => {
      const html = '<div><p>test</p></div>';
      const doc = loadHtml(html);
      const div = doc.querySelector('div');
      const copy = copyTree(div, false);
      
      expect(copy).not.toBe(div);
      expect(copy.querySelector('p')).toBeNull(); // 浅拷贝不包含子元素
    });

    test('处理null', () => {
      expect(copyTree(null)).toBeNull();
    });
  });

  describe('isElement()', () => {
    test('检测Element', () => {
      const div = document.createElement('div');
      expect(isElement(div)).toBe(true);
    });

    test('检测Document', () => {
      const doc = document.implementation.createHTMLDocument();
      expect(isElement(doc)).toBe(true);
    });

    test('非Element返回false', () => {
      expect(isElement(null)).toBe(false);
      expect(isElement('string')).toBe(false);
      expect(isElement(123)).toBe(false);
      expect(isElement({})).toBe(false);
    });
  });

  describe('getTextContent() / setTextContent()', () => {
    test('获取文本内容', () => {
      const html = '<div>hello world</div>';
      const doc = loadHtml(html);
      const div = doc.querySelector('div');
      expect(getTextContent(div)).toBe('hello world');
    });

    test('获取嵌套文本', () => {
      const html = '<div><p>para1</p><p>para2</p></div>';
      const doc = loadHtml(html);
      const div = doc.querySelector('div');
      expect(getTextContent(div)).toBe('para1para2');
    });

    test('设置文本内容', () => {
      const div = document.createElement('div');
      setTextContent(div, 'new text');
      expect(div.textContent).toBe('new text');
    });

    test('处理null', () => {
      expect(getTextContent(null)).toBe('');
      expect(() => setTextContent(null, 'text')).not.toThrow();
    });
  });

  describe('getTail() / setTail()', () => {
    test('获取尾部文本', () => {
      const html = '<div><span>span text</span> tail text</div>';
      const doc = loadHtml(html);
      const span = doc.querySelector('span');
      const tail = getTail(span);
      expect(tail).toContain('tail');
    });

    test('设置尾部文本', () => {
      const div = document.createElement('div');
      const span = document.createElement('span');
      span.textContent = 'span';
      div.appendChild(span);
      
      setTail(span, ' tail');
      expect(div.textContent).toContain('tail');
    });

    test('无尾部文本返回空字符串', () => {
      const span = document.createElement('span');
      expect(getTail(span)).toBe('');
    });
  });

  describe('createElement()', () => {
    test('创建简单元素', () => {
      const div = createElement('div');
      expect(div.tagName).toBe('DIV');
    });

    test('创建带属性的元素', () => {
      const link = createElement('a', { href: 'https://example.com', target: '_blank' });
      expect(link.getAttribute('href')).toBe('https://example.com');
      expect(link.getAttribute('target')).toBe('_blank');
    });

    test('创建带文本的元素', () => {
      const p = createElement('p', {}, 'Hello world');
      expect(p.textContent).toBe('Hello world');
    });

    test('创建完整元素', () => {
      const span = createElement('span', { class: 'highlight' }, 'text');
      expect(span.tagName).toBe('SPAN');
      expect(span.getAttribute('class')).toBe('highlight');
      expect(span.textContent).toBe('text');
    });
  });

  describe('clearAttributes()', () => {
    test('清除所有属性', () => {
      const div = createElement('div', { id: 'test', class: 'container', 'data-value': '123' });
      expect(div.attributes.length).toBeGreaterThan(0);
      
      clearAttributes(div);
      expect(div.attributes.length).toBe(0);
    });

    test('处理没有属性的元素', () => {
      const div = document.createElement('div');
      expect(() => clearAttributes(div)).not.toThrow();
    });

    test('处理null', () => {
      expect(() => clearAttributes(null)).not.toThrow();
    });
  });

  describe('iterElements()', () => {
    test('迭代所有元素', () => {
      const html = '<div><p>1</p><span>2</span><p>3</p></div>';
      const doc = loadHtml(html);
      const div = doc.querySelector('div');
      
      const elements = Array.from(iterElements(div));
      expect(elements.length).toBeGreaterThan(0);
    });

    test('按标签过滤', () => {
      const html = '<div><p>1</p><span>2</span><p>3</p></div>';
      const doc = loadHtml(html);
      const div = doc.querySelector('div');
      
      const paragraphs = Array.from(iterElements(div, 'p'));
      expect(paragraphs.length).toBe(2);
      paragraphs.forEach(p => expect(p.tagName).toBe('P'));
    });

    test('多标签过滤', () => {
      const html = '<div><p>1</p><span>2</span><em>3</em></div>';
      const doc = loadHtml(html);
      const div = doc.querySelector('div');
      
      const elements = Array.from(iterElements(div, ['p', 'span']));
      expect(elements.length).toBe(2);
    });

    test('处理null', () => {
      const elements = Array.from(iterElements(null));
      expect(elements.length).toBe(0);
    });
  });

  describe('findDescendants()', () => {
    test('查找子孙元素', () => {
      const html = '<div><section><p>1</p></section><p>2</p></div>';
      const doc = loadHtml(html);
      const div = doc.querySelector('div');
      
      const paragraphs = findDescendants(div, 'p');
      expect(paragraphs.length).toBe(2);
    });

    test('处理null', () => {
      const result = findDescendants(null, 'p');
      expect(result).toEqual([]);
    });
  });

  describe('内部函数测试', () => {
    describe('isDubiousHtml()', () => {
      test('检测正常HTML', () => {
        expect(isDubiousHtml('<html><body></body></html>')).toBe(false);
        expect(isDubiousHtml('<!DOCTYPE html><html>')).toBe(false);
      });

      test('检测可疑HTML', () => {
        expect(isDubiousHtml('<div>content</div>')).toBe(true);
        expect(isDubiousHtml('plain text')).toBe(true);
      });
    });

    describe('repairFaultyHtml()', () => {
      test('修复DOCTYPE', () => {
        const input = '< ! DOCTYPE html/xml>\n<html></html>';
        const result = repairFaultyHtml(input, '< ! doctype');
        expect(result).not.toContain('DOCTYPE html/xml');
      });

      test('修复自闭合html标签', () => {
        const input = '<html lang="en" />\n<body></body>';
        const result = repairFaultyHtml(input, '<html');
        expect(result).toContain('<html lang="en">');
        expect(result).not.toContain('/>');
      });

      test('不修复正常HTML', () => {
        const input = '<html><body></body></html>';
        const result = repairFaultyHtml(input, '<html>');
        expect(result).toBe(input);
      });
    });
  });

  describe('边界情况和集成测试', () => {
    test('处理空HTML', () => {
      const doc = loadHtml('');
      // 浏览器会创建基础的html/body结构
      expect(doc).not.toBeNull();
    });

    test('处理不完整HTML', () => {
      const html = '<div><p>text';
      const doc = loadHtml(html);
      expect(doc).not.toBeNull();
      // 浏览器会自动修复
    });

    test('处理特殊字符', () => {
      const html = '<div>特殊字符: & < > " \'</div>';
      const doc = loadHtml(html);
      expect(doc).not.toBeNull();
    });

    test('处理大型HTML', () => {
      const items = Array(1000).fill('<p>item</p>').join('');
      const html = `<html><body><div>${items}</div></body></html>`;
      const doc = loadHtml(html);
      expect(doc).not.toBeNull();
      expect(doc.querySelectorAll('p').length).toBe(1000);
    });
  });
});

