# 🚀 快速开始指南

欢迎使用Trafilatura Browser！这份指南将帮助你快速上手开发。

## 📦 项目结构

```
trafilatura-browser/
├── src/                      # 源代码
│   ├── utils/               # 工具函数模块
│   ├── processing/          # HTML处理模块
│   ├── extraction/          # 提取器模块
│   ├── metadata/            # 元数据提取模块
│   ├── output/              # 输出格式化模块
│   ├── settings/            # 配置和常量
│   ├── core.js             # 核心入口
│   └── index.js            # 主导出文件
├── test/                    # 测试文件
│   ├── unit/               # 单元测试
│   ├── integration/        # 集成测试
│   ├── fixtures/           # 测试夹具
│   └── html/               # HTML测试页面
├── dist/                    # 构建输出
├── docs/                    # 文档
└── examples/                # 示例代码
```

## 🛠️ 安装依赖

```bash
cd trafilatura-browser
npm install
```

## 📖 开发流程

### 第一步：了解架构

阅读关键文档：
- `DEVELOPMENT_PLAN.md` - 完整开发计划
- `PYTHON_CODE_ANALYSIS.md` - Python代码分析
- `PYTHON_MODULE_DETAILS.md` - 详细实现指南

### 第二步：开始开发

我们建议按以下顺序开发：

#### 阶段1：基础工具函数 (当前阶段) ⭐

**目标**: 实现所有基础工具函数

**任务**:
1. 创建 `src/utils/text.js`
   ```javascript
   // 实现文本处理函数
   export function trim(string) {
     // TODO: 实现
   }
   
   export function sanitize(text, options = {}) {
     // TODO: 实现
   }
   ```

2. 创建 `src/utils/dom.js`
   ```javascript
   // 实现DOM处理函数
   export function loadHtml(htmlString) {
     // TODO: 实现
   }
   
   export function deleteElement(element, options = {}) {
     // TODO: 实现
   }
   ```

3. 为每个函数编写测试
   ```javascript
   // test/unit/text.test.js
   import { trim } from '../../src/utils/text.js';
   
   describe('trim', () => {
     test('移除多余空格', () => {
       expect(trim('  hello   world  ')).toBe('hello world');
     });
   });
   ```

**运行测试**:
```bash
npm test                    # 运行所有测试
npm test -- text.test.js   # 运行特定测试
npm run test:watch         # 监视模式
```

#### 阶段2：HTML处理

创建HTML处理和标签转换模块

#### 阶段3-7：核心功能

按照开发计划逐步实现

### 第三步：构建和测试

```bash
# 构建项目
npm run build

# 运行Jest测试
npm test

# 浏览器测试
npm run serve
# 访问 http://localhost:8080/test/html/test-runner.html
```

## 📝 开发规范

### 代码风格

```javascript
// ✅ 好的代码
/**
 * 修剪字符串，移除多余空格
 * @param {string} string - 输入字符串
 * @returns {string} 修剪后的字符串
 */
export function trim(string) {
  try {
    return string.split(/\s+/).join(' ').trim();
  } catch (error) {
    return '';
  }
}

// ❌ 不好的代码
export function trim(s) { return s.replace(/\s+/g,' ').trim() }
```

### 测试规范

每个函数都应该有测试：

```javascript
describe('函数名', () => {
  test('正常情况', () => {
    // 测试正常输入
  });
  
  test('边界情况', () => {
    // 测试边界条件
  });
  
  test('错误处理', () => {
    // 测试错误输入
  });
});
```

### 提交规范

```bash
git commit -m "feat: 实现trim函数"
git commit -m "test: 添加trim函数测试"
git commit -m "fix: 修复trim函数Unicode问题"
git commit -m "docs: 更新README"
```

## 🎯 当前任务

### 立即开始的任务

1. **实现 trim() 函数** (优先级: P0)
   - 文件: `src/utils/text.js`
   - 参考: `PYTHON_MODULE_DETAILS.md` 第870-877行
   - 测试: 确保与Python版本输出一致

2. **实现 loadHtml() 函数** (优先级: P0)
   - 文件: `src/utils/dom.js`
   - 参考: `PYTHON_CODE_ANALYSIS.md` 第761-807行
   - 注意: 浏览器使用DOMParser，不需要编码检测

3. **创建常量文件** (优先级: P0)
   - 文件: `src/settings/constants.js`
   - 参考: `PYTHON_MODULE_DETAILS.md` 第12-185行
   - 包含所有标签映射和元素集合

## 🧪 测试策略

### 单元测试
- 每个函数独立测试
- 覆盖率目标: 90%+

### 集成测试
- 测试模块间协作
- 使用真实HTML片段

### 浏览器测试
- 打开 `test/html/test-runner.html`
- 可视化查看提取结果
- 实时调试

## 📊 追踪进度

使用以下文件追踪进度：
- `TASKS.md` - 详细任务清单
- `CHANGELOG.md` - 变更日志（待创建）

## 🆘 遇到问题？

### 常见问题

**Q: 如何调试浏览器中的代码？**
```javascript
// 在代码中添加
console.log('DEBUG:', variable);
debugger; // 浏览器会在这里暂停
```

**Q: 测试失败怎么办？**
```bash
# 查看详细错误信息
npm test -- --verbose

# 运行单个测试
npm test -- --testNamePattern="trim"
```

**Q: 如何对比Python版本的输出？**
```bash
# 在Python环境中
python3 -c "from trafilatura import extract; print(extract('<html>...</html>'))"

# 在JS环境中
node -e "const T = require('./dist/trafilatura.cjs.js'); console.log(T.extract('<html>...</html>'))"
```

### 获取帮助

1. 查看文档：`DEVELOPMENT_PLAN.md`
2. 搜索Python源码：`trafilatura/*.py`
3. 运行Python版本对比输出

## 🎉 完成一个阶段后

1. ✅ 确保所有测试通过
2. ✅ 更新 `TASKS.md`
3. ✅ 提交代码
4. ✅ 开始下一个阶段

## 📚 推荐阅读

- [Python源码分析](./PYTHON_CODE_ANALYSIS.md)
- [详细实现指南](./PYTHON_MODULE_DETAILS.md)
- [开发计划](./DEVELOPMENT_PLAN.md)
- [任务清单](./TASKS.md)

---

**准备好了吗？让我们开始阶段1的开发！** 🚀

建议从 `src/utils/text.js` 的 `trim()` 函数开始。

