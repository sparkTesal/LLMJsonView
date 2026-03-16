# LLM Json View

一款基于 Web 的 JSON 查看器，专为轻松浏览长篇 LLM 对话消息而设计。

**Agentic AI**、**AI 编程** 如火如荼，消息体动辄几十上百 K token，传统 JSON 工具难以胜任。LLM Json View 为此而生：流畅可视化、浏览和提取海量 LLM API 响应与对话日志，不卡顿。

## 功能特性

- **树形视图** - 通过可展开的树形结构浏览复杂 JSON
- **长文本支持** - 长字符串一键复制（适合 LLM 回复内容）
- **JSON 格式化** - 将压缩的 JSON 美化为易读格式
- **JSON 压缩** - 将格式化的 JSON 压缩为紧凑格式
- **智能修复** - 自动修复常见 JSON 问题（尾随逗号、单引号等）
- **语法高亮** - 彩色显示不同类型的 JSON 元素
- **文件上传** - 支持上传 JSON 文件进行处理
- **剪贴板集成** - 粘贴或直接读取剪贴板（需 HTTPS）
- **Alfred 工作流** - macOS 上一键打开并粘贴 JSON
- **响应式设计** - 支持移动端和桌面端

## 技术栈

- **React 18** - 现代化 UI 框架
- **TypeScript** - 类型安全的 JavaScript
- **Vite** - 快速的构建工具
- **Lucide React** - 图标库
- **jsonrepair** - 智能 JSON 修复

## 快速开始

### 开发环境

```bash
# 克隆项目
git clone <repository-url>
cd LLMJsonView

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 生产构建

```bash
npm run build
npm run preview
```

## 使用说明

1. **输入 JSON** - 粘贴、输入或上传 JSON 文件（如 LLM API 响应）
2. **解析并查看** - 点击「解析并查看」切换到树形视图
3. **浏览** - 展开/折叠节点，在侧边栏预览长文本
4. **复制** - 任意节点值一键复制（特别适合长消息内容）

## Alfred 工作流（macOS）

如需与 Alfred 无缝集成，请参阅 [alfred-workflow/INSTALLATION_GUIDE.zh-CN.md](alfred-workflow/INSTALLATION_GUIDE.zh-CN.md)。

## 项目结构

```
src/
├── App.tsx          # 主应用组件
├── App.css          # 应用样式
├── i18n.ts          # 国际化（中/英）
├── main.tsx         # 应用入口
└── index.css        # 全局样式
```

## 未来计划

- **树形虚拟滚动** - 超大树形结构（10 万+ 节点）虚拟滚动，避免卡顿
- **搜索与过滤** - 全文搜索、按 key/value 过滤、路径跳转（如 `messages[0].content`）
- **LLM 格式识别** - 自动识别 OpenAI/Anthropic/Claude 格式，高亮 `role`（user/assistant/system）
- **Token 统计** - 常见模型（GPT-4、Claude 等）的 token 估算
- **JSON 对比** - 并排对比两份 JSON（便于对比 LLM 输出版本）
- **对话扁平化** - 将 messages 提取为可读的时间线视图
- **浏览器扩展** - 任意页面快速唤起
- **VS Code 扩展** - 在编辑器侧边栏查看 JSON
- **深色模式** - 主题切换

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

---

[English Version](README.md)
