# JSON Handle - JSON格式化工具

一个现代化的JSON处理工具，类似于Chrome插件json-handle，但以网页形式提供更灵活的使用体验。

## 功能特性

- **JSON格式化** - 将压缩的JSON数据美化为易读格式
- **JSON压缩** - 将格式化的JSON压缩为紧凑格式
- **JSON验证** - 实时验证JSON语法正确性
- **语法高亮** - 彩色显示不同类型的JSON元素
- **树形视图** - 提供结构化的树形展示方式
- **文件上传** - 支持上传JSON文件进行处理
- **一键复制** - 快速复制处理结果
- **文件下载** - 将结果保存为JSON文件
- **错误提示** - 详细的语法错误信息和位置定位
- **响应式设计** - 支持移动端和桌面端

## 技术栈

- **React 18** - 现代化UI框架
- **TypeScript** - 类型安全的JavaScript
- **Vite** - 快速的构建工具
- **Lucide React** - 美观的图标库
- **CSS3** - 现代化样式设计

## 安装和运行

### 开发环境

```bash
# 克隆项目
git clone <repository-url>
cd json_handle

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 或者在容器/服务器环境中后台启动
conda activate agent_log
nohup npm run dev 2>&1 &

# 查看后台服务状态
ps aux | grep vite

# 查看服务日志
tail -f vite.log

# 停止后台服务
pkill -f vite
```

### 生产构建

```bash
# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 使用指南

1. **输入JSON数据** - 在左侧文本框中粘贴或输入，或点击"上传文件"
2. **实时验证** - 工具会实时验证JSON语法，右上角显示验证状态
3. **格式化操作** - 点击"格式化"或"压缩"按钮
4. **查看结果** - 右侧面板显示处理结果，可切换树形视图
5. **导出结果** - 点击"复制"或"下载"按钮

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！

---

[English Version](README.md)
