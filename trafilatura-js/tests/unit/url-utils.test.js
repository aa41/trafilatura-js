/**
 * URL 工具函数单元测试
 */

import {
  isValidUrl,
  validateUrl,
  normalizeUrl,
  extractDomain,
  getBaseUrl,
  fixRelativeUrls,
  getUrlPath,
  getUrlParams,
  isSameOrigin,
  cleanUrl,
} from '../../src/utils/url-utils.js';

describe('url-utils', () => {
  describe('isValidUrl()', () => {
    test('should validate correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('https://example.com/path')).toBe(true);
      expect(isValidUrl('https://sub.example.com:8080/path?query=1')).toBe(true);
    });

    test('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('ftp://example.com')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl(null)).toBe(false);
      expect(isValidUrl(undefined)).toBe(false);
    });
  });

  describe('validateUrl()', () => {
    test('should return tuple with validation result', () => {
      const [valid1, url1] = validateUrl('https://example.com');
      expect(valid1).toBe(true);
      expect(url1).toBeInstanceOf(URL);
      expect(url1.href).toBe('https://example.com/');

      const [valid2, url2] = validateUrl('invalid');
      expect(valid2).toBe(false);
      expect(url2).toBeNull();
    });
  });

  describe('normalizeUrl()', () => {
    test('should normalize URL', () => {
      expect(normalizeUrl('https://example.com/')).toBe('https://example.com/');
      expect(normalizeUrl('https://example.com/path/')).toBe('https://example.com/path');
    });

    test('should remove hash', () => {
      expect(normalizeUrl('https://example.com#section')).toBe('https://example.com/');
    });

    test('should remove default ports', () => {
      expect(normalizeUrl('http://example.com:80')).toBe('http://example.com/');
      expect(normalizeUrl('https://example.com:443')).toBe('https://example.com/');
    });

    test('should handle URL objects', () => {
      const url = new URL('https://example.com/');
      expect(normalizeUrl(url)).toBe('https://example.com/');
    });
  });

  describe('extractDomain()', () => {
    test('should extract domain', () => {
      expect(extractDomain('https://example.com/path')).toBe('example.com');
      expect(extractDomain('http://www.example.com')).toBe('example.com');
      expect(extractDomain('https://sub.example.com')).toBe('sub.example.com');
    });

    test('should handle fast mode', () => {
      expect(extractDomain('https://www.example.com', true)).toBe('www.example.com');
    });

    test('should handle invalid URLs', () => {
      expect(extractDomain('')).toBeNull();
      expect(extractDomain(null)).toBeNull();
    });
  });

  describe('getBaseUrl()', () => {
    test('should get base URL', () => {
      expect(getBaseUrl('https://example.com/path/to/page')).toBe('https://example.com');
      expect(getBaseUrl('http://example.com:8080/path')).toBe('http://example.com:8080');
    });

    test('should handle invalid URLs', () => {
      expect(getBaseUrl('invalid')).toBeNull();
      expect(getBaseUrl(null)).toBeNull();
    });
  });

  describe('fixRelativeUrls()', () => {
    test('should fix relative URLs', () => {
      expect(fixRelativeUrls('https://example.com', '/path')).toBe('https://example.com/path');
      expect(fixRelativeUrls('https://example.com/page', '../other')).toBe('https://example.com/other');
      expect(fixRelativeUrls('https://example.com/a/', 'b')).toBe('https://example.com/a/b');
    });

    test('should keep absolute URLs unchanged', () => {
      const result = fixRelativeUrls('https://example.com', 'https://other.com');
      expect(result).toContain('https://other.com');
    });

    test('should handle missing base URL', () => {
      expect(fixRelativeUrls(null, '/path')).toBe('/path');
    });
  });

  describe('getUrlPath()', () => {
    test('should extract URL path', () => {
      expect(getUrlPath('https://example.com/path/to/page')).toBe('/path/to/page');
      expect(getUrlPath('https://example.com')).toBe('/');
    });
  });

  describe('getUrlParams()', () => {
    test('should extract query parameters', () => {
      const params = getUrlParams('https://example.com?a=1&b=2');
      expect(params).toEqual({ a: '1', b: '2' });
    });

    test('should handle URLs without params', () => {
      expect(getUrlParams('https://example.com')).toEqual({});
    });
  });

  describe('isSameOrigin()', () => {
    test('should detect same origin', () => {
      expect(isSameOrigin('https://example.com/a', 'https://example.com/b')).toBe(true);
      expect(isSameOrigin('http://example.com', 'http://example.com:80')).toBe(true);
    });

    test('should detect different origins', () => {
      expect(isSameOrigin('https://example.com', 'http://example.com')).toBe(false);
      expect(isSameOrigin('https://example.com', 'https://other.com')).toBe(false);
    });
  });

  describe('cleanUrl()', () => {
    test('should remove tracking parameters', () => {
      const url = 'https://example.com/page?utm_source=test&utm_medium=email&id=123';
      const clean = cleanUrl(url);
      expect(clean).toContain('id=123');
      expect(clean).not.toContain('utm_source');
      expect(clean).not.toContain('utm_medium');
    });

    test('should remove common tracking params', () => {
      const url = 'https://example.com?fbclid=xxx&gclid=yyy&content=real';
      const clean = cleanUrl(url);
      expect(clean).toContain('content=real');
      expect(clean).not.toContain('fbclid');
      expect(clean).not.toContain('gclid');
    });
  });
});

