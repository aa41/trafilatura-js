# 阶段4：核心内容提取器 - 实现计划

## 📋 模块概览

根据 Python 源码分析，核心提取器包含以下主要组件：

### 1. main_extractor.py (700+ 行)
核心提取逻辑，包括：
- 内容提取主函数
- 评论提取
- 段落处理
- 列表处理
- 表格处理
- 代码/引用处理
- 文本节点处理

### 2. core.py (600+ 行)
提取流程编排，包括：
- 提取序列控制
- 回退策略
- 格式转换
- 输出生成

### 3. baseline.py
基线提取器（回退方案）

## 🎯 实现计划

### Phase 4.1: 基础提取框架 (预计 300行)
**文件**: `src/extraction/extractor.js`

功能：
- [ ] `extractContent()` - 主内容提取
- [ ] `extractComments()` - 评论提取
- [ ] `handleTitles()` - 标题处理
- [ ] `handleFormatting()` - 格式化处理
- [ ] `handleParagraphs()` - 段落处理

### Phase 4.2: 高级元素处理 (预计 400行)
**文件**: `src/extraction/elements.js`

功能：
- [ ] `handleLists()` - 列表处理
- [ ] `handleTables()` - 表格处理
- [ ] `handleQuotes()` - 引用处理
- [ ] `handleCode()` - 代码块处理
- [ ] `processNestedElements()` - 嵌套元素处理

### Phase 4.3: 文本评分和过滤 (预计 200行)
**文件**: `src/extraction/scoring.js`

功能：
- [ ] `textCharsTest()` - 文本字符测试
- [ ] `calculateTextDensity()` - 文本密度计算
- [ ] `scoreElement()` - 元素评分
- [ ] `filterLowScore()` - 过滤低分元素

### Phase 4.4: 核心流程编排 (预计 300行)
**文件**: `src/core.js`

功能：
- [ ] `bareExtraction()` - 底层提取
- [ ] `extract()` - 主提取函数
- [ ] `trafilaturaSequence()` - 提取序列
- [ ] `determineReturnString()` - 确定返回格式

### Phase 4.5: 基线提取器 (预计 200行)
**文件**: `src/extraction/baseline.js`

功能：
- [ ] `baseline()` - 基线提取
- [ ] `baselineExtract()` - 基础文本提取

## 📊 预计工作量

| 模块 | 文件 | 预计行数 | 优先级 |
|------|------|----------|--------|
| 基础框架 | extractor.js | 300 | P0 |
| 元素处理 | elements.js | 400 | P0 |
| 评分过滤 | scoring.js | 200 | P1 |
| 流程编排 | core.js | 300 | P0 |
| 基线提取 | baseline.js | 200 | P2 |
| **总计** | **5个文件** | **1400** | - |

## 🔍 关键技术点

### 1. 元素遍历策略
```python
# Python
for child in element.iter('*'):
    process_child(child)
```

```javascript
// JavaScript
for (const child of element.querySelectorAll('*')) {
  processChild(child);
}
```

### 2. 文本评分算法
- 计算文本密度（文本长度 / 元素大小）
- 链接密度检测
- 最小长度阈值

### 3. 嵌套元素处理
- 递归处理子元素
- 保持父子关系
- 属性继承

### 4. 回退机制
```
主提取器 → 外部对比 → 基线提取 → 失败
```

## 📝 开发顺序

1. **第一步**: 创建 `extractor.js` - 基础提取框架
2. **第二步**: 创建 `elements.js` - 元素处理
3. **第三步**: 创建 `scoring.js` - 评分系统
4. **第四步**: 创建 `core.js` - 流程编排
5. **第五步**: 创建 `baseline.js` - 基线提取
6. **第六步**: 集成测试和调试

## 🎯 成功标准

- [ ] 能够提取主要内容
- [ ] 正确处理段落、列表、表格
- [ ] 移除样板内容
- [ ] 保持文本结构
- [ ] 通过基本测试用例

## 📅 预计时间
**3-4 天**（约24-32工作小时）

---

让我们开始实现！

