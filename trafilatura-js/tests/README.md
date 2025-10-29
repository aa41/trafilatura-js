# Trafilatura.js 测试套件

## 📋 测试结构

```
tests/
├── unit/                      # 单元测试
│   ├── text-utils.test.js    # 文本工具测试 (12 套件)
│   ├── dom-utils.test.js     # DOM 工具测试 (14 套件)
│   ├── url-utils.test.js     # URL 工具测试 (10 套件)
│   └── config.test.js        # 配置系统测试 (4 套件)
├── integration/               # 集成测试 (待实现)
├── fixtures/                  # 测试数据
│   └── sample-articles.js    # 样本文章 (15+ 示例)
├── helpers/                   # 测试辅助函数
│   └── test-utils.js         # 工具函数集合
└── setup.js                  # Jest 环境设置
```

## 🚀 运行测试

### 运行所有测试
```bash
npm test
```

### 监听模式（开发时使用）
```bash
npm run test:watch
```

### 查看测试覆盖率
```bash
npm run test:coverage
```

覆盖率报告会生成在 `coverage/` 目录，打开 `coverage/lcov-report/index.html` 查看详细报告。

### 运行特定测试文件
```bash
npm test -- text-utils.test.js
npm test -- dom-utils.test.js
```

### 运行特定测试套件
```bash
npm test -- -t "trim()"
npm test -- -t "createElement"
```

### 调试模式
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

然后在 Chrome 中访问 `chrome://inspect` 进行调试。

## 📊 当前测试覆盖

| 模块 | 测试套件 | 测试用例 | 覆盖率目标 |
|------|---------|---------|-----------|
| text-utils | 12 | 40+ | 80%+ |
| dom-utils | 14 | 50+ | 80%+ |
| url-utils | 10 | 35+ | 80%+ |
| config | 4 | 15+ | 80%+ |
| **总计** | **40** | **140+** | **80%+** |

## 🧪 测试用例说明

### 1. 文本工具测试 (text-utils.test.js)

测试覆盖：
- ✅ `trim()` - 文本修整和空格处理
- ✅ `normalizeUnicode()` - Unicode 规范化
- ✅ `removeControlCharacters()` - 控制字符移除
- ✅ `lineProcessing()` - 行级文本处理
- ✅ `sanitize()` - 文本清理
- ✅ `textCharsTest()` - 文本检测
- ✅ `isImageFile()` - 图片文件判断
- ✅ `normalizeTags()` - 标签规范化
- ✅ `unescapeHtml()` / `escapeHtml()` - HTML 转义
- ✅ `mergeText()` - 文本合并
- ✅ `isAcceptableLength()` - 长度验证

### 2. DOM 工具测试 (dom-utils.test.js)

测试覆盖：
- ✅ `createElement()` / `createSubElement()` - 元素创建
- ✅ `deleteElement()` - 元素删除
- ✅ `stripTags()` - 标签剥离
- ✅ `copyAttributes()` - 属性复制
- ✅ `getIterText()` - 文本获取
- ✅ `findElement()` / `findAllElements()` - 元素查找
- ✅ `getChildren()` - 子元素获取
- ✅ `clearAttrib()` - 属性清除
- ✅ `hasChildren()` / `hasText()` - 检查方法

### 3. URL 工具测试 (url-utils.test.js)

测试覆盖：
- ✅ `isValidUrl()` / `validateUrl()` - URL 验证
- ✅ `normalizeUrl()` - URL 规范化
- ✅ `extractDomain()` - 域名提取
- ✅ `getBaseUrl()` - 基础 URL
- ✅ `fixRelativeUrls()` - 相对路径修复
- ✅ `getUrlPath()` / `getUrlParams()` - URL 解析
- ✅ `isSameOrigin()` - 同源检测
- ✅ `cleanUrl()` - URL 清理

### 4. 配置系统测试 (config.test.js)

测试覆盖：
- ✅ `Document` 类 - 文档对象
  - 创建、属性设置、序列化、清理
- ✅ `Extractor` 类 - 提取器配置
  - 默认配置、自定义选项、焦点模式、黑名单
- ✅ `useConfig()` - 配置合并
- ✅ `setDateParams()` - 日期参数

## 📦 测试数据 (fixtures/sample-articles.js)

提供 15+ 种不同类型的测试文章：

1. **simpleArticle** - 简单文章
2. **articleWithMetadata** - 带元数据的文章
3. **articleWithLists** - 包含列表
4. **articleWithTable** - 包含表格
5. **articleWithQuotes** - 包含引用
6. **articleWithCode** - 包含代码
7. **articleWithComments** - 包含评论
8. **noisyArticle** - 带噪音（广告等）
9. **articleWithImages** - 包含图片
10. **articleWithLinks** - 包含链接
11. **articleWithFormatting** - 格式化文本
12. **emptyArticle** - 空文章
13. **malformedHTML** - 畸形 HTML
14. **realWorldExample** - 真实世界示例（完整博客文章）

每个示例都包含：
- `html` - 原始 HTML
- `expected` - 期望的提取结果

### 使用测试数据

```javascript
import { simpleArticle, realWorldExample } from '../fixtures/sample-articles.js';
import { createDocumentFromHTML } from '../helpers/test-utils.js';

test('should extract simple article', () => {
  const doc = createDocumentFromHTML(simpleArticle.html);
  const result = extract(doc);
  expect(result.title).toBe(simpleArticle.expected.title);
});
```

## 🛠️ 测试工具函数 (helpers/test-utils.js)

提供丰富的测试辅助函数：

### DOM 创建
```javascript
import { createElementFromHTML, createDocumentFromHTML } from './helpers/test-utils.js';

const elem = createElementFromHTML('<div>Test</div>');
const doc = createDocumentFromHTML('<html><body>Test</body></html>');
```

### 文章生成
```javascript
import { createSimpleArticle, createComplexArticle } from './helpers/test-utils.js';

const simple = createSimpleArticle({
  title: 'My Title',
  content: 'My content',
});

const complex = createComplexArticle(); // 包含各种元素
```

### 断言辅助
```javascript
import { 
  expectElementToContainTag, 
  expectElementNotToContainTag,
  textSimilar 
} from './helpers/test-utils.js';

expectElementToContainTag(elem, 'p');
expectElementNotToContainTag(elem, 'script');
expect(textSimilar('hello world', 'hello  world')).toBe(true);
```

### Mock 创建
```javascript
import { createMockConfig, createMockExtractor } from './helpers/test-utils.js';

const config = createMockConfig({ fast: true });
const extractor = createMockExtractor({ format: 'json' });
```

## 🎯 自定义 Jest 匹配器

在 `tests/setup.js` 中定义了自定义匹配器：

### toBeValidHtml
```javascript
expect('<div>Test</div>').toBeValidHtml();
```

### toHaveTextContent
```javascript
const elem = document.createElement('div');
elem.textContent = 'Hello World';
expect(elem).toHaveTextContent('Hello');
```

### toBeElement
```javascript
const elem = document.createElement('div');
expect(elem).toBeElement();
```

## 📝 编写新测试

### 测试文件模板

```javascript
/**
 * 模块描述
 */

import { functionToTest } from '../../src/module/file.js';
import { createDocumentFromHTML } from '../helpers/test-utils.js';

describe('module-name', () => {
  describe('functionToTest()', () => {
    test('should do something', () => {
      // Arrange
      const input = 'test input';
      
      // Act
      const result = functionToTest(input);
      
      // Assert
      expect(result).toBe('expected output');
    });

    test('should handle edge case', () => {
      expect(functionToTest(null)).toBeNull();
      expect(functionToTest('')).toBe('');
    });
  });
});
```

### 测试命名规范

- **describe**: 模块或类名
- **test/it**: "should + 动词 + 期望行为"

示例：
```javascript
describe('Calculator', () => {
  test('should add two numbers correctly', () => {
    expect(add(1, 2)).toBe(3);
  });

  test('should throw error for invalid input', () => {
    expect(() => add('a', 'b')).toThrow();
  });
});
```

## 🔍 测试覆盖率要求

### 全局阈值（已设置）
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

### 查看覆盖率报告

运行 `npm run test:coverage` 后：

1. **终端输出** - 简要摘要
2. **HTML 报告** - `coverage/lcov-report/index.html`
3. **LCOV 文件** - `coverage/lcov.info`（CI/CD 使用）

### 提升覆盖率的技巧

1. **测试所有分支**
   ```javascript
   function divide(a, b) {
     if (b === 0) throw new Error('Division by zero');
     return a / b;
   }
   
   // 需要测试两个分支
   test('normal division', () => expect(divide(6, 2)).toBe(3));
   test('division by zero', () => expect(() => divide(6, 0)).toThrow());
   ```

2. **测试边界情况**
   - 空值（null, undefined, ''）
   - 边界值（0, -1, MAX_VALUE）
   - 异常情况

3. **测试错误处理**
   ```javascript
   test('should handle errors gracefully', () => {
     expect(() => riskyOperation()).not.toThrow();
   });
   ```

## 🚦 持续集成

测试在以下情况下运行：
- 提交代码前（pre-commit hook）
- Pull Request
- 合并到主分支

## 📚 参考资源

- [Jest 文档](https://jestjs.io/)
- [Jest DOM 匹配器](https://github.com/testing-library/jest-dom)
- [测试最佳实践](https://testingjavascript.com/)

## ❓ 常见问题

### Q: 如何只运行失败的测试？
```bash
npm test -- --onlyFailures
```

### Q: 如何并行运行测试？
Jest 默认并行运行，可以调整并发数：
```bash
npm test -- --maxWorkers=4
```

### Q: 如何生成 JSON 格式的测试报告？
```bash
npm test -- --json --outputFile=test-results.json
```

### Q: 测试太慢怎么办？
1. 使用 `test.only()` 只运行特定测试
2. 增加 `--maxWorkers` 参数
3. 避免在测试中使用 `setTimeout`

---

**编写测试是确保代码质量的关键！** 🎉

