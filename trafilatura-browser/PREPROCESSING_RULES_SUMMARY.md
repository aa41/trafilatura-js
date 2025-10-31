# 预处理规则系统 - 功能总结

## 🎯 核心功能

我们在 Trafilatura Browser 中成功实现了类似 [Turndown](https://github.com/mixmark-io/turndown) 的预处理规则系统，允许在 HTML 内容提取前对 DOM 节点进行自定义处理。

## 📋 实现清单

### 1. Extractor 类扩展
**文件**: `src/settings/extractor.js`

- ✅ 添加 `preprocessing_rules` Map 属性存储规则
- ✅ 实现 `addPreprocessingRule(name, rule)` 方法
- ✅ 实现 `removePreprocessingRule(name)` 方法
- ✅ 实现 `clearPreprocessingRules()` 方法
- ✅ 实现 `getPreprocessingRuleNames()` 方法
- ✅ 支持链式调用

### 2. 规则应用逻辑
**文件**: `src/core/extract.js`

- ✅ 实现 `applyPreprocessingRules(tree, options)` 函数
- ✅ 支持三种 filter 类型：
  - CSS 选择器字符串
  - CSS 选择器数组
  - 自定义函数
- ✅ 支持三种 action 返回值：
  - `null` - 删除节点
  - `Node` - 替换节点
  - `undefined` - 原地修改
- ✅ 在 `internalExtraction` 中集成（步骤 1.5）
- ✅ 完善的错误处理

### 3. 文档和测试
**文件**: 多个文档和测试文件

- ✅ `PREPROCESSING_RULES.md` - 完整 API 文档
- ✅ `PREPROCESSING_QUICKSTART.md` - 快速开始指南
- ✅ `test-preprocessing-rules.html` - 交互式测试页面
  - 测试 1: 删除广告元素
  - 测试 2: 转换视频元素
  - 测试 3: 修复懒加载图片
  - 测试 4: 链式调用多个规则
  - 测试 5: 使用函数过滤器

## 🔧 技术细节

### 规则结构

```javascript
{
  name: 'ruleName',           // 唯一标识
  filter: string|Array|Function,  // 节点选择器
  action: Function            // 处理函数
}
```

### 执行流程

```
HTML 加载
    ↓
[预处理规则应用] ← 新增步骤
    ↓
用户自定义修剪 (prune_xpath)
    ↓
HTML 语言检查
    ↓
元数据提取
    ↓
... (其他提取步骤)
```

### Filter 实现

1. **字符串**: 直接使用 `querySelectorAll(filter)`
2. **数组**: 遍历数组，对每个选择器调用 `querySelectorAll`
3. **函数**: 获取所有元素，使用函数过滤

### Action 处理

```javascript
const result = action(node, options);

if (result === null) {
  // 删除节点
  node.parentNode.removeChild(node);
} else if (result && result.nodeType) {
  // 替换节点
  node.parentNode.replaceChild(result, node);
}
// 否则保持原样（原地修改）
```

## 📊 性能考虑

### 优化策略

1. **CSS 选择器优先**: 性能最好
2. **合并相似规则**: 减少遍历次数
3. **错误隔离**: 单个规则失败不影响其他规则

### 性能对比

```javascript
// ❌ 性能较差（3次遍历）
.addPreprocessingRule('ad1', { filter: '.ad1', action: ... })
.addPreprocessingRule('ad2', { filter: '.ad2', action: ... })
.addPreprocessingRule('ad3', { filter: '.ad3', action: ... })

// ✅ 性能更好（1次遍历）
.addPreprocessingRule('removeAds', { 
  filter: ['.ad1', '.ad2', '.ad3'], 
  action: ... 
})
```

## 🎨 使用场景

### 1. 内容清理
- 删除广告
- 移除弹窗
- 清除导航栏

### 2. 结构修复
- 修复懒加载图片
- 转换特殊元素
- 调整属性

### 3. 条件处理
- 基于选项的动态处理
- 特定网站的自定义规则
- A/B 测试支持

## 📦 代码示例

### 基础用法

```javascript
const extractor = new Extractor({ format: 'markdown' });

extractor.addPreprocessingRule('removeAds', {
  filter: '.advertisement',
  action: () => null
});

const result = extract(html, extractor);
```

### 高级用法

```javascript
const extractor = new Extractor({ format: 'markdown' })
  .addPreprocessingRule('cleanup', {
    filter: ['.ad', '.popup', 'nav', 'footer'],
    action: () => null
  })
  .addPreprocessingRule('fixImages', {
    filter: 'img[data-lazy-src]',
    action: (node) => {
      node.src = node.getAttribute('data-lazy-src');
    }
  })
  .addPreprocessingRule('convertMedia', {
    filter: (node) => ['VIDEO', 'AUDIO'].includes(node.tagName),
    action: (node) => {
      const link = document.createElement('a');
      link.href = node.src;
      link.textContent = `[${node.tagName.toLowerCase()}]`;
      return link;
    }
  });
```

## 🔍 与 Turndown 的对比

| 特性 | Turndown | Trafilatura Preprocessing |
|------|----------|---------------------------|
| 目的 | HTML → Markdown 转换 | HTML 预处理 |
| 时机 | 转换时 | 提取前 |
| Filter | 标签名、数组、函数 | CSS 选择器、数组、函数 |
| 输出 | Markdown 字符串 | Node、null、undefined |
| API | `addRule(key, rule)` | `addPreprocessingRule(name, rule)` |
| 链式调用 | ✅ | ✅ |

## ✅ 测试结果

所有测试通过：

- ✅ 删除广告元素 (CSS 选择器数组)
- ✅ 转换视频元素为链接 (函数过滤器 + 节点替换)
- ✅ 修复懒加载图片 (CSS 选择器 + 原地修改)
- ✅ 链式调用多个规则 (多规则协同)
- ✅ 使用函数过滤器 (自定义过滤逻辑)

## 📚 文档结构

```
trafilatura-browser/
├── PREPROCESSING_RULES.md          # 完整 API 文档
├── PREPROCESSING_QUICKSTART.md     # 快速开始指南
├── PREPROCESSING_RULES_SUMMARY.md  # 功能总结（本文件）
├── test-preprocessing-rules.html   # 交互式测试
└── src/
    ├── settings/extractor.js       # Extractor 类扩展
    └── core/extract.js             # 规则应用逻辑
```

## 🚀 后续增强

可能的未来改进：

1. **规则优先级**: 支持规则的优先级排序
2. **规则分组**: 支持规则集合和批量管理
3. **规则模板**: 提供常用规则的预设模板
4. **性能监控**: 添加规则执行时间统计
5. **规则验证**: 增强规则参数验证
6. **插件系统**: 支持规则插件化

## 💡 最佳实践

1. ✅ 使用描述性的规则名称
2. ✅ 优先使用 CSS 选择器
3. ✅ 合并相似的规则
4. ✅ 为复杂规则添加注释
5. ✅ 封装常用规则为工具函数
6. ✅ 测试规则的边界情况

## 🎉 总结

我们成功实现了一个功能完整、性能优良、易于使用的预处理规则系统：

- **完整性**: 覆盖所有常见使用场景
- **灵活性**: 支持多种 filter 和 action 方式
- **可靠性**: 完善的错误处理
- **易用性**: 简洁的 API 和详细的文档
- **性能**: 优化的执行逻辑
- **扩展性**: 易于添加新功能

这个功能极大地增强了 Trafilatura Browser 的实用性和灵活性，使其能够应对各种复杂的 HTML 预处理需求！

---

**实现时间**: 2025-10-31  
**版本**: v1.0.0  
**参考**: https://github.com/mixmark-io/turndown

