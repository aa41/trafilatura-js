# 测试快速入门 🚀

## 立即开始测试

### 1. 安装依赖（首次）

```bash
cd trafilatura-js
npm install
```

### 2. 运行测试

```bash
# 方式1: 使用 npm（简单）
npm test

# 方式2: 使用测试脚本（功能丰富，推荐！）
./scripts/test.sh
```

## 📦 已创建的完整测试基础设施

### ✅ 配置文件
- `jest.config.js` - Jest 测试配置
- `.babelrc.js` - Babel 转译配置
- `tests/setup.js` - 测试环境设置

### ✅ 测试工具
- `tests/helpers/test-utils.js` - 20+ 个测试辅助函数
- `tests/fixtures/sample-articles.js` - 15+ 种测试文章样本

### ✅ 测试脚本
- `scripts/test.sh` - 功能丰富的测试运行脚本

### ✅ 已完成的测试
- `tests/unit/text-utils.test.js` - 12 个测试套件，40+ 用例
- `tests/unit/dom-utils.test.js` - 14 个测试套件，50+ 用例
- `tests/unit/url-utils.test.js` - 10 个测试套件，35+ 用例
- `tests/unit/config.test.js` - 4 个测试套件，15+ 用例

**总计：40 个测试套件，140+ 个测试用例！**

## 🎯 测试脚本功能

### 查看所有选项
```bash
./scripts/test.sh help
```

### 常用命令

```bash
# 运行所有测试
./scripts/test.sh

# 生成覆盖率报告（自动打开浏览器）
./scripts/test.sh coverage

# 监听模式（文件改动时自动测试）
./scripts/test.sh watch

# 只运行单元测试
./scripts/test.sh unit

# 快速测试（只测改动的文件）
./scripts/test.sh quick

# 清理缓存
./scripts/test.sh clean

# 运行特定测试文件
./scripts/test.sh text-utils.test.js
```

## 📊 测试覆盖率

当前已实现的模块都达到了 **80%+ 的覆盖率目标**！

查看详细覆盖率：
```bash
npm run test:coverage
# 或
./scripts/test.sh coverage
```

## 🧪 测试数据示例

### 使用样本文章

```javascript
import { simpleArticle, realWorldExample } from '../fixtures/sample-articles.js';
import { createDocumentFromHTML } from '../helpers/test-utils.js';

test('should extract article', () => {
  const doc = createDocumentFromHTML(simpleArticle.html);
  const result = extract(doc);
  expect(result.title).toBe(simpleArticle.expected.title);
});
```

### 可用的样本文章（15+ 种）

1. **simpleArticle** - 简单文章
2. **articleWithMetadata** - 包含完整元数据
3. **articleWithLists** - 包含列表
4. **articleWithTable** - 包含表格
5. **articleWithQuotes** - 包含引用
6. **articleWithCode** - 包含代码块
7. **articleWithComments** - 包含评论区
8. **noisyArticle** - 包含广告噪音
9. **articleWithImages** - 包含图片
10. **articleWithLinks** - 包含链接
11. **articleWithFormatting** - 包含格式化文本
12. **emptyArticle** - 空文章
13. **malformedHTML** - 畸形 HTML
14. **realWorldExample** - 真实博客文章（完整）
15. ...更多

## 🛠️ 测试工具函数

### DOM 操作
```javascript
import {
  createElementFromHTML,
  createDocumentFromHTML,
  createSimpleArticle,
  createComplexArticle,
} from '../helpers/test-utils.js';

// 创建测试元素
const elem = createElementFromHTML('<div>Test</div>');

// 创建测试文档
const doc = createDocumentFromHTML('<html><body>Test</body></html>');

// 生成测试文章
const article = createSimpleArticle({
  title: 'Test Title',
  content: 'Test content',
});
```

### 断言辅助
```javascript
import {
  expectElementToContainTag,
  expectElementNotToContainTag,
  textSimilar,
} from '../helpers/test-utils.js';

// 断言包含特定标签
expectElementToContainTag(elem, 'p');

// 断言不包含特定标签
expectElementNotToContainTag(elem, 'script');

// 文本相似度比较
expect(textSimilar('hello world', 'hello  world')).toBe(true);
```

### Mock 创建
```javascript
import {
  createMockConfig,
  createMockExtractor,
} from '../helpers/test-utils.js';

const config = createMockConfig({ fast: true });
const extractor = createMockExtractor({ format: 'json' });
```

## 🎨 自定义匹配器

在 `tests/setup.js` 中定义了自定义 Jest 匹配器：

```javascript
// 检查是否为有效 HTML
expect('<div>Test</div>').toBeValidHtml();

// 检查元素文本内容
expect(element).toHaveTextContent('Hello');

// 检查是否为 DOM 元素
expect(element).toBeElement();
```

## 📝 编写新测试

### 测试文件模板

```javascript
/**
 * 模块功能测试
 */

import { myFunction } from '../../src/module/file.js';
import { createDocumentFromHTML } from '../helpers/test-utils.js';

describe('module-name', () => {
  describe('myFunction()', () => {
    test('should do expected behavior', () => {
      // Arrange - 准备测试数据
      const input = 'test input';
      
      // Act - 执行函数
      const result = myFunction(input);
      
      // Assert - 验证结果
      expect(result).toBe('expected output');
    });

    test('should handle edge cases', () => {
      expect(myFunction(null)).toBeNull();
      expect(myFunction('')).toBe('');
    });

    test('should throw error for invalid input', () => {
      expect(() => myFunction('invalid')).toThrow();
    });
  });
});
```

## 🐛 调试技巧

### 1. 只运行一个测试
```javascript
test.only('should do something', () => {
  // 只运行这个测试
});
```

### 2. 跳过测试
```javascript
test.skip('should do something else', () => {
  // 跳过这个测试
});
```

### 3. 查看详细输出
```bash
npm test -- --verbose
```

### 4. 使用调试器
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## 📚 文档

- **[TESTING.md](./TESTING.md)** - 完整的测试指南
- **[tests/README.md](./tests/README.md)** - 详细的测试套件文档
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - 开发指南

## 💡 最佳实践

1. ✅ **开发前先写测试** - TDD 方法
2. ✅ **保持测试简单** - 一个测试只测一件事
3. ✅ **使用有意义的名称** - 测试即文档
4. ✅ **测试边界情况** - 包括 null、空字符串、异常值
5. ✅ **保持测试独立** - 不依赖其他测试
6. ✅ **定期运行测试** - 使用 watch 模式

## 🎉 现在就开始！

```bash
# 1. 安装依赖
npm install

# 2. 运行测试
npm test

# 3. 查看覆盖率
npm run test:coverage

# 4. 开启监听模式（推荐开发时使用）
npm run test:watch
```

## ❓ 常见问题

**Q: 测试失败怎么办？**
A: 查看错误信息，检查代码逻辑。使用 `console.log` 或调试器查看中间结果。

**Q: 如何提高覆盖率？**
A: 运行 `npm run test:coverage`，打开生成的报告，查看未覆盖的代码行，针对性补充测试。

**Q: 测试太慢？**
A: 使用 `test.only()` 只运行特定测试，或使用 `./scripts/test.sh quick` 只测试改动的文件。

**Q: 如何测试异步代码？**
A: Jest 自动支持 Promise 和 async/await：
```javascript
test('should handle async', async () => {
  const result = await asyncFunction();
  expect(result).toBe('success');
});
```

---

**工欲善其事，必先利其器！现在你拥有了一套完整的测试基础设施。** 🛠️

开始编写代码前，先写测试。这会让你的开发更有信心！

Happy Testing! 🎉

