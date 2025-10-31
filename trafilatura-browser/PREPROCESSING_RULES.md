# 预处理规则系统 (Preprocessing Rules)

## 概述

预处理规则系统允许你在 HTML 内容提取前对 DOM 节点进行自定义处理，提供了类似 [Turndown](https://github.com/mixmark-io/turndown) 的 `addRule` 功能。

这个功能在以下场景特别有用：
- 🚫 删除广告、弹窗、导航栏等不需要的元素
- 🔄 转换特殊元素（如将 `<video>` 转为文本链接）
- 🔧 修复特定网站的 HTML 结构问题
- 🎨 调整元素属性（如修复懒加载图片的 src）
- ✨ 任何你需要在提取前对 HTML 进行的自定义处理

## 快速开始

```javascript
const { Extractor, extract } = Trafilatura;

// 创建 Extractor 实例
const extractor = new Extractor({
  format: 'markdown',
  include_images: true
});

// 添加规则：删除所有广告
extractor.addPreprocessingRule('removeAds', {
  filter: '.advertisement',
  action: (node) => null  // 返回 null 删除节点
});

// 提取内容
const result = extract(htmlString, extractor);
```

## API 参考

### `addPreprocessingRule(name, rule)`

添加一个预处理规则。

#### 参数

- **`name`** (string) - 规则的唯一名称
- **`rule`** (Object) - 规则对象
  - **`filter`** (string | Array | Function) - 元素过滤器
  - **`action`** (Function) - 处理函数

#### 返回值

返回 `Extractor` 实例，支持链式调用。

#### Filter 类型

##### 1. CSS 选择器字符串

```javascript
extractor.addPreprocessingRule('removeNav', {
  filter: 'nav.menu',  // CSS 选择器
  action: (node) => null
});
```

##### 2. CSS 选择器数组

```javascript
extractor.addPreprocessingRule('removeMultiple', {
  filter: ['.ad', '.popup', '#sidebar'],  // 多个选择器
  action: (node) => null
});
```

##### 3. 自定义过滤函数

```javascript
extractor.addPreprocessingRule('customFilter', {
  filter: (node, options) => {
    // 返回 true 表示匹配
    return node.tagName === 'DIV' && 
           node.classList.contains('unwanted');
  },
  action: (node) => null
});
```

#### Action 函数

Action 函数接收节点和选项，可以：

##### 1. 删除节点 - 返回 `null`

```javascript
action: (node) => null
```

##### 2. 替换节点 - 返回新节点

```javascript
action: (node) => {
  const newNode = document.createElement('p');
  newNode.textContent = node.textContent;
  return newNode;
}
```

##### 3. 修改节点 - 不返回值或返回 `undefined`

```javascript
action: (node) => {
  node.setAttribute('class', 'processed');
  node.removeAttribute('data-old');
  // 不返回值，原地修改
}
```

### `removePreprocessingRule(name)`

移除指定的预处理规则。

```javascript
const removed = extractor.removePreprocessingRule('removeAds');
console.log(removed);  // true or false
```

### `clearPreprocessingRules()`

清空所有预处理规则。

```javascript
extractor.clearPreprocessingRules();
```

### `getPreprocessingRuleNames()`

获取所有规则的名称。

```javascript
const names = extractor.getPreprocessingRuleNames();
console.log(names);  // ['removeAds', 'fixImages', ...]
```

## 使用示例

### 示例 1: 删除广告和弹窗

```javascript
const extractor = new Extractor({ format: 'markdown' });

extractor.addPreprocessingRule('removeUnwanted', {
  filter: [
    '.advertisement',
    '.ad-banner',
    '.popup',
    '#cookie-notice',
    'aside.sidebar'
  ],
  action: () => null
});

const cleanContent = extract(html, extractor);
```

### 示例 2: 转换视频为链接

```javascript
extractor.addPreprocessingRule('convertVideo', {
  filter: (node) => node.tagName === 'VIDEO' || node.tagName === 'IFRAME',
  action: (node) => {
    const link = document.createElement('a');
    
    if (node.tagName === 'VIDEO') {
      link.href = node.src || node.getAttribute('src') || '#';
      link.textContent = `[视频: ${node.title || '播放'}]`;
    } else if (node.tagName === 'IFRAME') {
      link.href = node.src || node.getAttribute('src') || '#';
      link.textContent = `[嵌入内容: ${node.title || '查看'}]`;
    }
    
    return link;
  }
});
```

### 示例 3: 修复懒加载图片

```javascript
extractor.addPreprocessingRule('fixLazyImages', {
  filter: 'img[data-src], img[data-lazy-src], img[data-original]',
  action: (node) => {
    // 按优先级尝试不同的懒加载属性
    const lazySrc = node.getAttribute('data-src') ||
                    node.getAttribute('data-lazy-src') ||
                    node.getAttribute('data-original');
    
    if (lazySrc) {
      node.setAttribute('src', lazySrc);
      // 清理懒加载属性
      node.removeAttribute('data-src');
      node.removeAttribute('data-lazy-src');
      node.removeAttribute('data-original');
    }
  }
});
```

### 示例 4: 链式调用多个规则

```javascript
const extractor = new Extractor({ format: 'markdown' })
  .addPreprocessingRule('removeAds', {
    filter: ['.ad', '.advertisement'],
    action: () => null
  })
  .addPreprocessingRule('fixImages', {
    filter: 'img[data-src]',
    action: (node) => {
      node.src = node.getAttribute('data-src');
    }
  })
  .addPreprocessingRule('convertVideos', {
    filter: 'video',
    action: (node) => {
      const link = document.createElement('a');
      link.href = node.src;
      link.textContent = '[视频]';
      return link;
    }
  });

const result = extract(html, extractor);
```

### 示例 5: 基于内容的条件处理

```javascript
extractor.addPreprocessingRule('removeEmptyDivs', {
  filter: (node) => {
    // 只处理空的 div 元素
    return node.tagName === 'DIV' && 
           node.textContent.trim().length === 0 &&
           node.children.length === 0;
  },
  action: () => null
});
```

### 示例 6: 特定网站的规则

```javascript
// 针对特定网站的自定义处理
if (url.includes('example.com')) {
  extractor
    .addPreprocessingRule('fixExampleComImages', {
      filter: 'img.lazy',
      action: (node) => {
        node.src = node.getAttribute('data-full-src');
      }
    })
    .addPreprocessingRule('removeExampleComAds', {
      filter: '.sponsored-content',
      action: () => null
    });
}
```

### 示例 7: 添加元数据标记

```javascript
extractor.addPreprocessingRule('markImportant', {
  filter: '.important, .highlight',
  action: (node) => {
    // 添加自定义属性，后续处理可能会用到
    node.setAttribute('data-importance', 'high');
    // 原地修改，不返回值
  }
});
```

### 示例 8: 处理表格

```javascript
extractor.addPreprocessingRule('simplifyTables', {
  filter: 'table.complex',
  action: (node) => {
    // 将复杂表格转换为简单列表
    const list = document.createElement('ul');
    const rows = node.querySelectorAll('tr');
    
    rows.forEach(row => {
      const cells = row.querySelectorAll('td, th');
      const text = Array.from(cells)
        .map(cell => cell.textContent.trim())
        .join(' - ');
      
      if (text) {
        const li = document.createElement('li');
        li.textContent = text;
        list.appendChild(li);
      }
    });
    
    return list;
  }
});
```

## 高级用法

### 访问 Extractor 选项

Action 函数的第二个参数是 `options` (Extractor 实例)：

```javascript
extractor.addPreprocessingRule('conditionalRemoval', {
  filter: '.optional-content',
  action: (node, options) => {
    // 根据提取选项决定是否删除
    if (options.fast) {
      return null;  // fast 模式删除
    }
    // 否则保留
  }
});
```

### 规则执行顺序

规则按照添加的顺序执行：

```javascript
extractor
  .addPreprocessingRule('first', { /* ... */ })   // 第一个执行
  .addPreprocessingRule('second', { /* ... */ })  // 第二个执行
  .addPreprocessingRule('third', { /* ... */ });  // 第三个执行
```

### 动态管理规则

```javascript
// 添加规则
extractor.addPreprocessingRule('temporary', {
  filter: '.temp',
  action: () => null
});

// 检查规则
console.log(extractor.getPreprocessingRuleNames());
// ['temporary']

// 移除规则
extractor.removePreprocessingRule('temporary');

// 清空所有规则
extractor.clearPreprocessingRules();
```

## 性能考虑

1. **CSS 选择器优先**: 尽量使用 CSS 选择器而不是函数过滤器，性能更好
2. **规则数量**: 过多的规则会影响性能，建议合并相似的规则
3. **复杂操作**: 避免在 action 中进行复杂的 DOM 操作

```javascript
// ❌ 性能较差
extractor
  .addPreprocessingRule('rule1', { filter: '.ad1', action: () => null })
  .addPreprocessingRule('rule2', { filter: '.ad2', action: () => null })
  .addPreprocessingRule('rule3', { filter: '.ad3', action: () => null });

// ✅ 性能更好
extractor.addPreprocessingRule('removeAds', {
  filter: ['.ad1', '.ad2', '.ad3'],
  action: () => null
});
```

## 错误处理

预处理规则的错误会被捕获并记录到控制台，不会中断提取流程：

```javascript
extractor.addPreprocessingRule('risky', {
  filter: '.element',
  action: (node) => {
    // 即使这里抛出错误，也不会中断整个提取
    throw new Error('Something went wrong');
  }
});

// 提取仍会继续，只是这个规则会失败
const result = extract(html, extractor);
```

## 与 Turndown 的对比

如果你熟悉 [Turndown](https://github.com/mixmark-io/turndown)，以下是主要差异：

| 特性 | Turndown | Trafilatura Preprocessing |
|------|----------|---------------------------|
| 时机 | Markdown 转换时 | HTML 提取前 |
| 目的 | 控制 Markdown 输出 | 预处理 HTML DOM |
| Filter | 标签名、数组、函数 | CSS 选择器、数组、函数 |
| Replacement | 返回 Markdown 字符串 | 返回 Node、null 或 undefined |
| 用途 | HTML → Markdown 转换 | HTML 预处理 |

## 测试

运行测试文件：

```bash
# 在浏览器中打开
open test-preprocessing-rules.html
```

测试包括：
- ✅ 删除广告元素
- ✅ 转换视频元素为链接
- ✅ 修复懒加载图片
- ✅ 链式调用多个规则
- ✅ 使用函数过滤器

## 最佳实践

1. **命名规范**: 使用描述性的规则名称
2. **规则复用**: 将常用规则封装为函数
3. **测试驱动**: 为特定网站编写规则前先测试
4. **文档记录**: 为复杂规则添加注释

```javascript
// 封装常用规则
function createAdRemovalRule() {
  return {
    filter: ['.ad', '.advertisement', '.sponsored', '[class*="ad-"]'],
    action: () => null
  };
}

function createLazyImageFixRule() {
  return {
    filter: 'img[data-src], img[data-lazy-src]',
    action: (node) => {
      const lazySrc = node.getAttribute('data-src') || 
                      node.getAttribute('data-lazy-src');
      if (lazySrc) {
        node.src = lazySrc;
      }
    }
  };
}

// 使用
extractor
  .addPreprocessingRule('removeAds', createAdRemovalRule())
  .addPreprocessingRule('fixImages', createLazyImageFixRule());
```

## 参考

- [Turndown GitHub](https://github.com/mixmark-io/turndown)
- [MDN - DOM API](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model)
- [CSS Selectors Reference](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors)

## 贡献

欢迎提交 Issue 和 Pull Request！

---

**版本**: v1.0.0  
**最后更新**: 2025-10-31

