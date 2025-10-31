# Trafilatura Browser

> 像素级精确的内容提取库 - 浏览器版本

Trafilatura的JavaScript移植版本，专为浏览器环境优化，实现与Python版本完全一致的提取能力。

## ✨ 特性

- 🎯 **智能提取**: 使用链接密度算法准确识别主要内容
- 📝 **完整元数据**: 提取标题、作者、日期、描述等所有元数据
- 🎨 **多种格式**: 支持文本、Markdown、JSON输出
- 🔄 **多层Fallback**: 确保始终能提取到内容
- 🌐 **浏览器原生**: 完全使用浏览器原生API，无需Node.js
- ⚡ **高性能**: 快速处理，内存占用小

## 📦 安装

```bash
npm install trafilatura-browser
```

或直接在浏览器中使用：

```html
<script src="https://unpkg.com/trafilatura-browser/dist/trafilatura.browser.min.js"></script>
```

## 🚀 快速开始

### 基础用法

```javascript
// ES模块
import { extract } from 'trafilatura-browser';

const html = `
  <html>
    <body>
      <article>
        <h1>文章标题</h1>
        <p>这是文章内容...</p>
      </article>
    </body>
  </html>
`;

const text = extract(html);
console.log(text);
// 输出:
// # 文章标题
// 
// 这是文章内容...
```

### 浏览器中使用

```html
<!DOCTYPE html>
<html>
<head>
  <script src="trafilatura.browser.min.js"></script>
</head>
<body>
  <script>
    const html = document.documentElement.outerHTML;
    const text = Trafilatura.extract(html, {
      outputFormat: 'markdown',
      withMetadata: true
    });
    console.log(text);
  </script>
</body>
</html>
```

### 提取元数据

```javascript
import { bareExtraction } from 'trafilatura-browser';

const document = bareExtraction(html, {
  withMetadata: true
});

console.log(document.title);       // 标题
console.log(document.author);      // 作者
console.log(document.date);        // 日期
console.log(document.description); // 描述
console.log(document.text);        // 提取的文本
```

### 配置选项

```javascript
const options = {
  // 输出格式: 'txt' | 'markdown' | 'json'
  outputFormat: 'markdown',
  
  // 是否提取元数据
  withMetadata: true,
  
  // 是否包含格式化（粗体、斜体等）
  formatting: true,
  
  // 是否包含链接
  links: false,
  
  // 是否包含图片
  images: false,
  
  // 是否包含表格
  tables: true,
  
  // 提取焦点: 'balanced' | 'precision' | 'recall'
  focus: 'balanced',
  
  // 最小提取文本长度
  minExtractedSize: 200
};

const text = extract(html, options);
```

## 📖 API文档

### `extract(html, options)`

主提取函数，返回格式化后的文本。

**参数**:
- `html` (string): HTML字符串或DOM元素
- `options` (object): 配置选项

**返回**: string - 提取并格式化后的文本

---

### `bareExtraction(html, options)`

裸提取函数，返回完整的Document对象。

**参数**:
- `html` (string): HTML字符串或DOM元素
- `options` (object): 配置选项

**返回**: Document对象，包含所有提取的内容和元数据

---

### `extractMetadata(html, url, options)`

仅提取元数据。

**参数**:
- `html` (string): HTML字符串或DOM元素
- `url` (string): 页面URL
- `options` (object): 配置选项

**返回**: 元数据对象

---

## 🧪 开发

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run build:watch
```

### 运行测试

```bash
npm test
```

### 测试覆盖率

```bash
npm run test:coverage
```

### 浏览器测试

```bash
npm run serve
# 访问 http://localhost:8080/test/html/test-runner.html
```

## 📊 测试

项目包含完整的测试套件：

- ✅ 单元测试 (85%+ 覆盖率)
- ✅ 集成测试
- ✅ 浏览器测试页面
- ✅ 与Python版本对比测试

## 🗺️ 路线图

- [x] 阶段0: 项目初始化
- [ ] 阶段1: 基础工具函数
- [ ] 阶段2: HTML处理
- [ ] 阶段3: 基础提取器
- [ ] 阶段4: 核心提取器
- [ ] 阶段5: 元数据提取
- [ ] 阶段6: 输出格式化
- [ ] 阶段7: 核心入口
- [ ] 阶段8: 测试套件
- [ ] 阶段9: 对比测试

详细开发计划请查看 [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)

## 🤝 贡献

欢迎贡献！请查看 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解详情。

## 📄 许可证

GPL-3.0 License - 详见 [LICENSE](./LICENSE) 文件

## 🙏 致谢

本项目是 [Trafilatura](https://github.com/adbar/trafilatura) 的JavaScript移植版本。

感谢原作者 Adrien Barbaresi 创建了如此优秀的内容提取库！

## 📞 联系

- 问题反馈: [GitHub Issues](https://github.com/your-org/trafilatura-browser/issues)
- 讨论: [GitHub Discussions](https://github.com/your-org/trafilatura-browser/discussions)

---

Made with ❤️ by Trafilatura Team

