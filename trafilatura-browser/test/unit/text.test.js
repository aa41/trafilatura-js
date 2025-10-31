/**
 * 文本处理工具函数单元测试
 * 对应Python测试文件中的相关测试
 */

import {
  trim,
  removeControlCharacters,
  lineProcessing,
  sanitize,
  textCharsTest,
  isFullText,
  textFilter,
  normalizeUnicode,
  stripTags,
  clearCaches
} from '../../src/utils/text.js';

describe('文本处理函数', () => {
  // 每个测试后清除缓存
  afterEach(() => {
    clearCaches();
  });

  describe('trim()', () => {
    test('移除多余空格', () => {
      expect(trim('  hello   world  ')).toBe('hello world');
      expect(trim('hello world')).toBe('hello world');
    });

    test('处理换行符', () => {
      expect(trim('line1\n  \nline2')).toBe('line1 line2');
      expect(trim('line1\nline2\nline3')).toBe('line1 line2 line3');
    });

    test('处理制表符和其他空白字符', () => {
      expect(trim('hello\t\tworld')).toBe('hello world');
      expect(trim('hello\r\nworld')).toBe('hello world');
    });

    test('边界情况', () => {
      expect(trim('')).toBe('');
      expect(trim('   ')).toBe('');
      expect(trim('single')).toBe('single');
    });

    test('错误处理', () => {
      expect(trim(null)).toBe('');
      expect(trim(undefined)).toBe('');
      expect(trim(123)).toBe(''); // 非字符串类型
    });

    test('缓存功能', () => {
      const input = '  test  ';
      const result1 = trim(input);
      const result2 = trim(input);
      expect(result1).toBe(result2);
      expect(result1).toBe('test');
    });
  });

  describe('removeControlCharacters()', () => {
    test('移除控制字符', () => {
      expect(removeControlCharacters('hello\u0000world')).toBe('helloworld');
      expect(removeControlCharacters('test\u0001\u0002\u0003')).toBe('test');
    });

    test('保留可打印字符', () => {
      expect(removeControlCharacters('hello world')).toBe('hello world');
      expect(removeControlCharacters('Hello, 世界!')).toBe('Hello, 世界!');
    });

    test('保留空白字符', () => {
      expect(removeControlCharacters('hello\nworld')).toBe('hello\nworld');
      expect(removeControlCharacters('hello\tworld')).toBe('hello\tworld');
      expect(removeControlCharacters('hello world')).toBe('hello world');
    });

    test('移除DEL和其他控制字符', () => {
      expect(removeControlCharacters('hello\u007Fworld')).toBe('helloworld');
      expect(removeControlCharacters('test\u009Fdata')).toBe('testdata');
    });

    test('边界情况', () => {
      expect(removeControlCharacters('')).toBe('');
      expect(removeControlCharacters(null)).toBe('');
      expect(removeControlCharacters(undefined)).toBe('');
    });
  });

  describe('lineProcessing()', () => {
    test('处理HTML实体', () => {
      expect(lineProcessing('hello&#13;world')).toBe('hello world');
      expect(lineProcessing('test&#10;data')).toBe('test data');
      // 注意: &nbsp;被替换为\u00A0，然后trim()会将其转换为普通空格
      // Python行为: " ".join(string.split()).strip() 会将\u00A0转换为普通空格
      expect(lineProcessing('hello&nbsp;world')).toBe('hello world');
    });

    test('不保留空格时修剪', () => {
      expect(lineProcessing('  hello  world  ', false, false)).toBe('hello world');
      expect(lineProcessing('line\nwith\nnewlines', false, false)).toBe('line with newlines');
    });

    test('保留空格模式', () => {
      const result = lineProcessing('  hello  world  ', true, false);
      expect(result).toContain('hello');
      expect(result).toContain('world');
    });

    test('首尾空格模式', () => {
      const result = lineProcessing(' hello world ', false, true);
      expect(result).toBe(' hello world ');
    });

    test('全空格行返回null', () => {
      // Python行为: if all(map(str.isspace, new_line)): new_line = None
      // trim()会先将空白规范化，然后检查是否全是空白字符
      expect(lineProcessing('   ', false, false)).toBeNull();
      expect(lineProcessing('\t\t', false, false)).toBeNull();
      expect(lineProcessing('\n\n', false, false)).toBeNull();
      expect(lineProcessing('     \n   ', false, false)).toBeNull();
    });

    test('空输入', () => {
      expect(lineProcessing('', false, false)).toBeNull();
      expect(lineProcessing(null, false, false)).toBeNull();
    });
  });

  describe('sanitize()', () => {
    test('清理多行文本', () => {
      const input = 'line1\n\nline2\n  \nline3';
      const expected = 'line1\nline2\nline3';
      // Python: filter(None, ...) 会过滤掉None值（空行）
      expect(sanitize(input)).toBe(expected);
    });

    test('移除空行', () => {
      const input = 'line1\n   \nline2\n\t\nline3';
      const expected = 'line1\nline2\nline3';
      // Python: 空白行经lineProcessing()后返回None，被filter()过滤掉
      expect(sanitize(input)).toBe(expected);
    });

    test('处理HTML实体', () => {
      const input = 'hello&nbsp;world&#10;test';
      const result = sanitize(input);
      // &nbsp;被替换为\u00A0，然后trim()将其转换为普通空格
      // Python行为: " ".join(string.split()).strip()
      expect(result).toContain('hello world');  // 不是'hello\u00A0world'
      expect(result).toContain('test');
    });

    test('移除控制字符', () => {
      const input = 'hello\u0000world\ntest\u0001data';
      const expected = 'helloworld\ntestdata';
      expect(sanitize(input)).toBe(expected);
    });

    test('移除\u2424符号', () => {
      const input = 'line1\u2424line2';
      const result = sanitize(input);
      expect(result).not.toContain('\u2424');
    });

    test('preserveSpace模式', () => {
      const input = '  line1  \n  line2  ';
      const result = sanitize(input, true);
      expect(result).toBeTruthy();
    });

    test('trailingSpace模式', () => {
      const input = ' hello world ';
      const result = sanitize(input, false, true);
      expect(result).toBe(' hello world ');
    });

    test('空输入', () => {
      expect(sanitize('')).toBeNull();
      expect(sanitize(null)).toBeNull();
      expect(sanitize(undefined)).toBeNull();
    });

    test('只有空白的文本', () => {
      const result = sanitize('   \n\t\n   ');
      // Python: 所有行都是空白，lineProcessing()返回None，filter()过滤后为空列表
      // '\n'.join([]) 返回 ''
      expect(result).toBe('');
    });
  });

  describe('textCharsTest()', () => {
    test('检测有效文本', () => {
      expect(textCharsTest('hello')).toBe(true);
      expect(textCharsTest('hello world')).toBe(true);
      expect(textCharsTest('123')).toBe(true);
      expect(textCharsTest('a')).toBe(true);
    });

    test('检测空白文本', () => {
      expect(textCharsTest('   ')).toBe(false);
      expect(textCharsTest('\t\t')).toBe(false);
      expect(textCharsTest('\n\n')).toBe(false);
      expect(textCharsTest('')).toBe(false);
    });

    test('边界情况', () => {
      expect(textCharsTest(null)).toBe(false);
      expect(textCharsTest(undefined)).toBe(false);
    });
  });

  describe('isFullText()', () => {
    test('相同文本返回true', () => {
      expect(isFullText('hello', 'hello')).toBe(true);
      expect(isFullText('  hello  ', 'hello')).toBe(true);
      expect(isFullText('hello\n', 'hello')).toBe(true);
    });

    test('不同文本返回false', () => {
      expect(isFullText('hello', 'world')).toBe(false);
      expect(isFullText('hello world', 'hello')).toBe(false);
    });

    test('空值处理', () => {
      expect(isFullText('', '')).toBe(false);
      expect(isFullText('hello', '')).toBe(false);
      expect(isFullText('', 'hello')).toBe(false);
      expect(isFullText(null, null)).toBe(false);
    });
  });

  describe('textFilter()', () => {
    test('过滤社交媒体文本', () => {
      expect(textFilter('Facebook')).toBe(true);
      expect(textFilter('Share on Twitter')).toBe(true);
      expect(textFilter('Print')).toBe(true);
      expect(textFilter('E-Mail')).toBe(true);
    });

    test('不过滤正常文本', () => {
      expect(textFilter('This is a normal paragraph')).toBe(false);
      expect(textFilter('Hello world')).toBe(false);
    });

    test('空文本', () => {
      expect(textFilter('')).toBe(true);
      expect(textFilter('   ')).toBe(true);
      expect(textFilter(null)).toBe(true);
    });

    test('多行文本检测', () => {
      expect(textFilter('Normal text\nFacebook')).toBe(true);
      expect(textFilter('Normal text\nMore normal text')).toBe(false);
    });
  });

  describe('normalizeUnicode()', () => {
    test('NFC标准化（默认）', () => {
      // é 可以表示为 e + ́ (U+0065 + U+0301) 或 é (U+00E9)
      const composed = '\u00E9'; // é (单个字符)
      const decomposed = '\u0065\u0301'; // e + ́ (两个字符)
      expect(normalizeUnicode(decomposed)).toBe(composed);
    });

    test('NFD标准化', () => {
      const composed = '\u00E9';
      const decomposed = '\u0065\u0301';
      expect(normalizeUnicode(composed, 'NFD')).toBe(decomposed);
    });

    test('NFKC标准化', () => {
      // ﬁ (ligature fi) -> fi
      const ligature = '\uFB01';
      const result = normalizeUnicode(ligature, 'NFKC');
      expect(result.length).toBeGreaterThan(ligature.length);
    });

    test('空输入', () => {
      expect(normalizeUnicode('')).toBe('');
      expect(normalizeUnicode(null)).toBe('');
    });
  });

  describe('stripTags()', () => {
    test('移除HTML标签', () => {
      expect(stripTags('<p>hello</p>')).toBe('hello');
      expect(stripTags('<div>test</div>')).toBe('test');
      expect(stripTags('<a href="#">link</a>')).toBe('link');
    });

    test('移除多个标签', () => {
      expect(stripTags('<p>para</p><div>div</div>')).toBe('paradiv');
      expect(stripTags('<strong>bold</strong> <em>italic</em>')).toBe('bold italic');
    });

    test('移除HTML注释', () => {
      expect(stripTags('<!-- comment -->text')).toBe('text');
      expect(stripTags('before<!-- comment -->after')).toBe('beforeafter');
    });

    test('保留纯文本', () => {
      expect(stripTags('hello world')).toBe('hello world');
      expect(stripTags('no tags here')).toBe('no tags here');
    });

    test('空输入', () => {
      expect(stripTags('')).toBe('');
      expect(stripTags(null)).toBe('');
    });
  });

  describe('性能和缓存测试', () => {
    test('trim缓存工作正常', () => {
      const input = '  cached test  ';
      const start1 = performance.now();
      const result1 = trim(input);
      const time1 = performance.now() - start1;

      const start2 = performance.now();
      const result2 = trim(input);
      const time2 = performance.now() - start2;

      expect(result1).toBe(result2);
      // 第二次调用应该更快（从缓存读取）
      // 注意：在测试环境中这个断言可能不稳定，所以只检查结果相同
      expect(time2).toBeLessThanOrEqual(time1 + 1); // +1容差
    });

    test('大文本处理', () => {
      const largeText = 'line\n'.repeat(1000);
      const result = sanitize(largeText);
      expect(result).toBeTruthy();
      expect(result.split('\n').length).toBe(1000);
    });
  });

  describe('边界情况和错误处理', () => {
    test('Unicode字符处理', () => {
      expect(trim('你好 世界')).toBe('你好 世界');
      expect(sanitize('こんにちは\n世界')).toBe('こんにちは\n世界');
      expect(removeControlCharacters('Здравствуй мир')).toBe('Здравствуй мир');
    });

    test('Emoji处理', () => {
      expect(trim('hello 👋 world 🌍')).toBe('hello 👋 world 🌍');
      expect(sanitize('test 😀\ndata 🎉')).toBe('test 😀\ndata 🎉');
    });

    test('特殊空白字符', () => {
      // Python: " ".join(string.split()).strip()
      // split()会按所有空白字符分割，包括\u00A0 (non-breaking space)
      // 所以\u00A0会被转换为普通空格
      expect(trim('hello\u00A0world')).toBe('hello world'); // non-breaking space
      expect(trim('hello\u2009world')).toBe('hello world'); // thin space
    });

    test('极端长度', () => {
      const veryLong = 'a'.repeat(10000);
      expect(trim(veryLong)).toBe(veryLong);
      expect(removeControlCharacters(veryLong)).toBe(veryLong);
    });
  });
});

