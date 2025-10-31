# 预处理规则快速开始 🚀

## 5分钟上手指南

### 1. 基础用法

```javascript
// 导入
const { Extractor, extract } = Trafilatura;

// 创建 Extractor
const extractor = new Extractor({
  format: 'markdown'
});

// 添加规则：删除广告
extractor.addPreprocessingRule('removeAds', {
  filter: '.advertisement',     // CSS 选择器
  action: (node) => null        // 返回 null = 删除节点
});

// 提取内容
const result = extract(htmlString, extractor);
```

### 2. 三种返回方式

#### ① 删除节点 - 返回 `null`

```javascript
extractor.addPreprocessingRule('deleteIt', {
  filter: '.unwanted',
  action: () => null  // 删除
});
```

#### ② 替换节点 - 返回新节点

```javascript
extractor.addPreprocessingRule('replaceIt', {
  filter: 'video',
  action: (node) => {
    const link = document.createElement('a');
    link.href = node.src;
    link.textContent = '[视频]';
    return link;  // 替换
  }
});
```

#### ③ 修改节点 - 不返回值

```javascript
extractor.addPreprocessingRule('modifyIt', {
  filter: 'img[data-src]',
  action: (node) => {
    node.src = node.getAttribute('data-src');
    // 不返回 = 原地修改
  }
});
```

### 3. 三种过滤方式

#### ① CSS 选择器字符串

```javascript
filter: 'nav.menu'
```

#### ② CSS 选择器数组

```javascript
filter: ['.ad', '.popup', '#sidebar']
```

#### ③ 自定义函数

```javascript
filter: (node) => node.tagName === 'VIDEO'
```

### 4. 常见场景

#### 场景 A: 清理页面

```javascript
const extractor = new Extractor({ format: 'markdown' })
  .addPreprocessingRule('cleanup', {
    filter: [
      'nav', 'header', 'footer',
      '.ad', '.popup', '.cookie-notice'
    ],
    action: () => null
  });
```

#### 场景 B: 修复图片

```javascript
extractor.addPreprocessingRule('fixImages', {
  filter: 'img[data-lazy-src]',
  action: (node) => {
    node.src = node.getAttribute('data-lazy-src');
    node.removeAttribute('data-lazy-src');
  }
});
```

#### 场景 C: 转换特殊元素

```javascript
extractor.addPreprocessingRule('convertMedia', {
  filter: (node) => {
    return node.tagName === 'VIDEO' || 
           node.tagName === 'AUDIO' ||
           node.tagName === 'IFRAME';
  },
  action: (node) => {
    const link = document.createElement('a');
    link.href = node.src || node.getAttribute('src') || '#';
    
    const type = {
      'VIDEO': '视频',
      'AUDIO': '音频',
      'IFRAME': '嵌入内容'
    }[node.tagName];
    
    link.textContent = `[${type}]`;
    return link;
  }
});
```

### 5. 完整示例

```javascript
// HTML 输入
const html = `
  <article>
    <h1>文章标题</h1>
    <div class="ad">广告内容</div>
    <p>这是正文。</p>
    <img data-lazy-src="real.jpg" src="placeholder.gif" alt="图片">
    <video src="video.mp4" title="演示视频"></video>
    <div class="popup">弹窗</div>
    <p>更多内容。</p>
  </article>
`;

// 配置 Extractor
const extractor = new Extractor({
  format: 'markdown',
  include_images: true
});

// 添加规则（链式调用）
extractor
  .addPreprocessingRule('removeUnwanted', {
    filter: ['.ad', '.popup'],
    action: () => null
  })
  .addPreprocessingRule('fixImages', {
    filter: 'img[data-lazy-src]',
    action: (node) => {
      node.src = node.getAttribute('data-lazy-src');
    }
  })
  .addPreprocessingRule('convertVideo', {
    filter: 'video',
    action: (node) => {
      const a = document.createElement('a');
      a.href = node.src;
      a.textContent = `[视频: ${node.title}]`;
      return a;
    }
  });

// 提取
const result = extract(html, extractor);

console.log(result);
// # 文章标题
// 
// 这是正文。
// 
// ![图片](real.jpg)
// 
// [视频: 演示视频](video.mp4)
// 
// 更多内容。
```

### 6. 实用工具函数

```javascript
// 创建常用规则的工厂函数
const PreprocessingRules = {
  // 删除广告
  removeAds() {
    return {
      filter: [
        '.ad', '.ads', '.advertisement', 
        '.sponsored', '[class*="ad-"]',
        '#ad', '#ads'
      ],
      action: () => null
    };
  },
  
  // 修复懒加载图片
  fixLazyImages() {
    return {
      filter: 'img[data-src], img[data-lazy-src], img[data-original]',
      action: (node) => {
        const lazySrc = node.getAttribute('data-src') ||
                        node.getAttribute('data-lazy-src') ||
                        node.getAttribute('data-original');
        if (lazySrc) {
          node.src = lazySrc;
        }
      }
    };
  },
  
  // 删除导航和页脚
  removeNavFooter() {
    return {
      filter: ['nav', 'header', 'footer', 'aside'],
      action: () => null
    };
  },
  
  // 转换媒体元素
  convertMedia() {
    return {
      filter: (node) => ['VIDEO', 'AUDIO', 'IFRAME'].includes(node.tagName),
      action: (node) => {
        const link = document.createElement('a');
        link.href = node.src || node.getAttribute('src') || '#';
        link.textContent = `[${node.tagName.toLowerCase()}]`;
        return link;
      }
    };
  }
};

// 使用
const extractor = new Extractor({ format: 'markdown' })
  .addPreprocessingRule('removeAds', PreprocessingRules.removeAds())
  .addPreprocessingRule('fixImages', PreprocessingRules.fixLazyImages())
  .addPreprocessingRule('convertMedia', PreprocessingRules.convertMedia());
```

### 7. 调试技巧

```javascript
// 记录被处理的节点
extractor.addPreprocessingRule('debug', {
  filter: '.target',
  action: (node, options) => {
    console.log('Processing node:', node);
    console.log('With options:', options);
    // 不返回值，只记录
  }
});

// 条件处理
extractor.addPreprocessingRule('conditional', {
  filter: '.optional',
  action: (node, options) => {
    if (options.fast) {
      console.log('Fast mode: removing', node);
      return null;
    }
    console.log('Normal mode: keeping', node);
  }
});
```

### 8. 管理规则

```javascript
// 添加
extractor.addPreprocessingRule('rule1', { /* ... */ });

// 查看所有规则
console.log(extractor.getPreprocessingRuleNames());
// ['rule1']

// 删除
extractor.removePreprocessingRule('rule1');

// 清空
extractor.clearPreprocessingRules();
```

## 测试

在浏览器中打开测试文件：

```bash
open test-preprocessing-rules.html
```

## 下一步

查看完整文档：[PREPROCESSING_RULES.md](./PREPROCESSING_RULES.md)

## 常见问题

**Q: 规则的执行顺序？**  
A: 按照添加的顺序执行。

**Q: 规则执行时机？**  
A: 在 HTML 加载后、内容提取前。

**Q: 性能影响？**  
A: CSS 选择器性能最好，函数过滤器稍慢。建议合并相似规则。

**Q: 错误处理？**  
A: 规则错误会被捕获并记录，不会中断提取流程。

**Q: 能否访问 Extractor 选项？**  
A: 可以，`action(node, options)` 的第二个参数就是 Extractor 实例。

---

**开始使用**: 复制上面的代码，修改 filter 和 action，立即开始！ 🎉

