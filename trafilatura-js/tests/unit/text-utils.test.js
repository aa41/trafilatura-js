/**
 * 文本工具函数单元测试
 */

import {
  trim,
  normalizeUnicode,
  removeControlCharacters,
  lineProcessing,
  sanitize,
  textCharsTest,
  isImageFile,
  normalizeTags,
  unescapeHtml,
  escapeHtml,
  mergeText,
  isAcceptableLength,
} from '../../src/utils/text-utils.js';

describe('text-utils', () => {
  describe('trim()', () => {
    test('should trim whitespace and normalize spaces', () => {
      expect(trim('  hello   world  ')).toBe('hello world');
      expect(trim('hello\n\nworld')).toBe('hello world');
      expect(trim('  \t  hello  \t  ')).toBe('hello');
    });

    test('should handle empty strings', () => {
      expect(trim('')).toBe('');
      expect(trim('   ')).toBe('');
      expect(trim(null)).toBe('');
      expect(trim(undefined)).toBe('');
    });

    test('should handle non-string inputs', () => {
      expect(trim(123)).toBe('');
      expect(trim({})).toBe('');
    });
  });

  describe('normalizeUnicode()', () => {
    test('should normalize Unicode strings', () => {
      const str = 'café';
      expect(normalizeUnicode(str, 'NFC')).toBe(str);
      expect(normalizeUnicode(str, 'NFD')).toBeTruthy();
    });

    test('should handle empty strings', () => {
      expect(normalizeUnicode('')).toBe('');
      expect(normalizeUnicode(null)).toBe('');
    });
  });

  describe('removeControlCharacters()', () => {
    test('should remove control characters', () => {
      expect(removeControlCharacters('hello\x00world')).toBe('helloworld');
      expect(removeControlCharacters('test\x1Fstring')).toBe('teststring');
    });

    test('should keep newlines and tabs', () => {
      expect(removeControlCharacters('hello\nworld')).toBe('hello\nworld');
      expect(removeControlCharacters('hello\tworld')).toBe('hello\tworld');
    });
  });

  describe('lineProcessing()', () => {
    test('should process lines correctly', () => {
      expect(lineProcessing('  hello   world  ')).toBe('hello world');
      expect(lineProcessing('   ')).toBeNull();
    });

    test('should handle HTML entities', () => {
      const result = lineProcessing('hello&nbsp;world');
      expect(result).toContain('hello');
      expect(result).toContain('world');
    });

    test('should preserve spaces when requested', () => {
      const result = lineProcessing('  hello  ', false, true);
      expect(result).toContain('hello');
    });
  });

  describe('sanitize()', () => {
    test('should sanitize multi-line text', () => {
      const text = 'line1\n  line2  \nline3';
      const result = sanitize(text);
      expect(result).toBeTruthy();
      expect(result.split('\n').length).toBeGreaterThan(1);
    });

    test('should handle empty text', () => {
      expect(sanitize('')).toBeNull();
      expect(sanitize(null)).toBeNull();
    });
  });

  describe('textCharsTest()', () => {
    test('should detect actual text', () => {
      expect(textCharsTest('hello')).toBe(true);
      expect(textCharsTest('123')).toBe(true);
      expect(textCharsTest('a')).toBe(true);
    });

    test('should reject whitespace-only strings', () => {
      expect(textCharsTest('')).toBe(false);
      expect(textCharsTest('   ')).toBe(false);
      expect(textCharsTest('\n\t')).toBe(false);
      expect(textCharsTest(null)).toBe(false);
    });
  });

  describe('isImageFile()', () => {
    test('should detect image URLs', () => {
      expect(isImageFile('image.jpg')).toBe(true);
      expect(isImageFile('photo.png')).toBe(true);
      expect(isImageFile('pic.gif')).toBe(true);
      expect(isImageFile('test.webp')).toBe(true);
      expect(isImageFile('https://example.com/image.jpeg')).toBe(true);
    });

    test('should reject non-image URLs', () => {
      expect(isImageFile('document.pdf')).toBe(false);
      expect(isImageFile('page.html')).toBe(false);
      expect(isImageFile('')).toBe(false);
      expect(isImageFile(null)).toBe(false);
    });

    test('should handle long URLs', () => {
      const longUrl = 'http://example.com/' + 'a'.repeat(10000) + '.jpg';
      expect(isImageFile(longUrl)).toBe(false);
    });
  });

  describe('normalizeTags()', () => {
    test('should normalize tag strings', () => {
      expect(normalizeTags('tag1, tag2, tag3')).toBe('tag1, tag2, tag3');
      expect(normalizeTags(' tag1 ,  tag2 ')).toBe('tag1, tag2');
    });

    test('should remove quotes', () => {
      expect(normalizeTags('"tag1", "tag2"')).toBe('tag1, tag2');
      expect(normalizeTags("'tag1', 'tag2'")).toBe('tag1, tag2');
    });

    test('should handle empty input', () => {
      expect(normalizeTags('')).toBe('');
      expect(normalizeTags(null)).toBe('');
    });
  });

  describe('unescapeHtml()', () => {
    test('should unescape HTML entities', () => {
      expect(unescapeHtml('&lt;div&gt;')).toBe('<div>');
      expect(unescapeHtml('&amp;')).toBe('&');
      expect(unescapeHtml('&quot;test&quot;')).toBe('"test"');
    });

    test('should handle empty input', () => {
      expect(unescapeHtml('')).toBe('');
      expect(unescapeHtml(null)).toBe('');
    });
  });

  describe('escapeHtml()', () => {
    test('should escape HTML characters', () => {
      expect(escapeHtml('<div>')).toBe('&lt;div&gt;');
      expect(escapeHtml('&')).toBe('&amp;');
      expect(escapeHtml('"test"')).toContain('test');
    });

    test('should handle empty input', () => {
      expect(escapeHtml('')).toBe('');
      expect(escapeHtml(null)).toBe('');
    });
  });

  describe('mergeText()', () => {
    test('should merge multiple text strings', () => {
      expect(mergeText('hello', 'world')).toBe('hello world');
      expect(mergeText('a', 'b', 'c')).toBe('a b c');
    });

    test('should filter out empty strings', () => {
      expect(mergeText('hello', '', 'world')).toBe('hello world');
      expect(mergeText('', '   ', 'test')).toBe('test');
    });
  });

  describe('isAcceptableLength()', () => {
    test('should check text length', () => {
      expect(isAcceptableLength('hello', 2, 10)).toBe(true);
      expect(isAcceptableLength('a', 2, 10)).toBe(false);
      expect(isAcceptableLength('a very long string', 2, 10)).toBe(false);
    });

    test('should use default limits', () => {
      expect(isAcceptableLength('hello')).toBe(true);
      expect(isAcceptableLength('a')).toBe(false);
    });
  });
});

