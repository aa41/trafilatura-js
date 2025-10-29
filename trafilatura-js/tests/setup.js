/**
 * Jest 测试环境设置
 */

// 扩展 Jest 匹配器
expect.extend({
  toBeValidHtml(received) {
    const pass = received && typeof received === 'string' && received.trim().length > 0;
    if (pass) {
      return {
        message: () => `expected ${received} not to be valid HTML`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be valid HTML`,
        pass: false,
      };
    }
  },

  toHaveTextContent(received, expected) {
    const actual = received?.textContent || '';
    const pass = actual.includes(expected);
    if (pass) {
      return {
        message: () => `expected element not to have text content "${expected}"`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to have text content "${expected}", but got "${actual}"`,
        pass: false,
      };
    }
  },

  toBeElement(received) {
    const pass = received && received.nodeType === 1;
    if (pass) {
      return {
        message: () => `expected ${received} not to be an Element`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be an Element`,
        pass: false,
      };
    }
  },
});

// 全局测试辅助函数
global.createTestElement = (html) => {
  const container = document.createElement('div');
  container.innerHTML = html;
  return container.firstElementChild || container;
};

global.createTestDocument = (html) => {
  const parser = new DOMParser();
  return parser.parseFromString(html, 'text/html');
};

// 抑制控制台警告（测试时）
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});

// 每个测试后清理 DOM
afterEach(() => {
  document.body.innerHTML = '';
});

