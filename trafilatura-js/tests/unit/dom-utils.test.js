/**
 * DOM 工具函数单元测试
 */

import {
  createElement,
  createSubElement,
  deleteElement,
  stripTags,
  copyAttributes,
  getIterText,
  findElement,
  findAllElements,
  getChildren,
  clearAttrib,
  hasChildren,
  hasText,
} from '../../src/utils/dom-utils.js';

describe('dom-utils', () => {
  describe('createElement()', () => {
    test('should create an element', () => {
      const elem = createElement('div');
      expect(elem.tagName).toBe('DIV');
    });

    test('should create element with attributes', () => {
      const elem = createElement('div', { class: 'test', id: 'myDiv' });
      expect(elem.className).toBe('test');
      expect(elem.id).toBe('myDiv');
    });
  });

  describe('createSubElement()', () => {
    test('should create and append sub-element', () => {
      const parent = createElement('div');
      const child = createSubElement(parent, 'span', { class: 'child' });
      
      expect(child.tagName).toBe('SPAN');
      expect(child.className).toBe('child');
      expect(parent.children.length).toBe(1);
      expect(parent.children[0]).toBe(child);
    });
  });

  describe('deleteElement()', () => {
    test('should remove element from parent', () => {
      const parent = createElement('div');
      const child = createSubElement(parent, 'span');
      
      expect(parent.children.length).toBe(1);
      deleteElement(child);
      expect(parent.children.length).toBe(0);
    });

    test('should handle element without parent', () => {
      const elem = createElement('div');
      expect(() => deleteElement(elem)).not.toThrow();
    });
  });

  describe('stripTags()', () => {
    test('should strip specified tags', () => {
      const parent = createElement('div');
      parent.innerHTML = '<p>Hello <span>world</span>!</p>';
      
      stripTags(parent, 'span');
      expect(parent.innerHTML).toContain('Hello');
      expect(parent.innerHTML).toContain('world');
      expect(parent.innerHTML).not.toContain('<span');
    });

    test('should strip multiple tag types', () => {
      const parent = createElement('div');
      parent.innerHTML = '<p>Text <b>bold</b> and <i>italic</i></p>';
      
      stripTags(parent, 'b', 'i');
      expect(parent.innerHTML).toContain('bold');
      expect(parent.innerHTML).toContain('italic');
      expect(parent.innerHTML).not.toContain('<b>');
      expect(parent.innerHTML).not.toContain('<i>');
    });
  });

  describe('copyAttributes()', () => {
    test('should copy attributes from source to destination', () => {
      const src = createElement('div', { class: 'source', id: 'src', 'data-value': '123' });
      const dest = createElement('div');
      
      copyAttributes(dest, src);
      
      expect(dest.className).toBe('source');
      expect(dest.id).toBe('src');
      expect(dest.getAttribute('data-value')).toBe('123');
    });

    test('should handle empty attributes', () => {
      const src = createElement('div');
      const dest = createElement('div', { class: 'dest' });
      
      expect(() => copyAttributes(dest, src)).not.toThrow();
      expect(dest.className).toBe('dest');
    });
  });

  describe('getIterText()', () => {
    test('should get all text content', () => {
      const elem = createElement('div');
      elem.innerHTML = '<p>Hello</p><p>World</p>';
      
      const text = getIterText(elem);
      expect(text).toContain('Hello');
      expect(text).toContain('World');
    });

    test('should handle empty element', () => {
      const elem = createElement('div');
      expect(getIterText(elem)).toBe('');
    });
  });

  describe('findElement()', () => {
    test('should find element by CSS selector', () => {
      const parent = createElement('div');
      parent.innerHTML = '<p class="target">Test</p><p>Other</p>';
      
      const found = findElement(parent, '.target');
      expect(found).toBeTruthy();
      expect(found.textContent).toBe('Test');
    });

    test('should return null when not found', () => {
      const parent = createElement('div');
      const found = findElement(parent, '.nonexistent');
      expect(found).toBeNull();
    });
  });

  describe('findAllElements()', () => {
    test('should find all matching elements', () => {
      const parent = createElement('div');
      parent.innerHTML = '<p>One</p><p>Two</p><p>Three</p>';
      
      const found = findAllElements(parent, 'p');
      expect(found.length).toBe(3);
    });

    test('should return empty array when none found', () => {
      const parent = createElement('div');
      const found = findAllElements(parent, 'span');
      expect(found).toEqual([]);
    });
  });

  describe('getChildren()', () => {
    test('should get all child elements', () => {
      const parent = createElement('div');
      createSubElement(parent, 'p');
      createSubElement(parent, 'span');
      
      const children = getChildren(parent);
      expect(children.length).toBe(2);
    });

    test('should handle element without children', () => {
      const elem = createElement('div');
      expect(getChildren(elem)).toEqual([]);
    });
  });

  describe('clearAttrib()', () => {
    test('should clear all attributes', () => {
      const elem = createElement('div', { class: 'test', id: 'myId', 'data-value': '123' });
      
      expect(elem.attributes.length).toBeGreaterThan(0);
      clearAttrib(elem);
      expect(elem.attributes.length).toBe(0);
    });
  });

  describe('hasChildren()', () => {
    test('should detect children', () => {
      const parent = createElement('div');
      expect(hasChildren(parent)).toBe(false);
      
      createSubElement(parent, 'p');
      expect(hasChildren(parent)).toBe(true);
    });
  });

  describe('hasText()', () => {
    test('should detect text content', () => {
      const elem = createElement('div');
      expect(hasText(elem)).toBe(false);
      
      elem.textContent = 'Hello';
      expect(hasText(elem)).toBe(true);
      
      elem.textContent = '   ';
      expect(hasText(elem)).toBe(false);
    });
  });
});

