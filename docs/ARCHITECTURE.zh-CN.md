# JSON Handle 项目分析 - 后端开发者视角

## 项目简介

这是一个**JSON格式化和可视化工具**，类似于一个在线的JSON解析器服务。用户可以：
- 输入JSON字符串进行验证和格式化
- 以树形结构查看JSON数据
- 上传/下载JSON文件
- 复制和预览JSON节点

## 架构设计

### 技术选型对比
| 前端技术 | 后端类比 | 作用 |
|---------|---------|------|
| React | Spring Framework | 应用框架 |
| TypeScript | Java | 类型安全的编程语言 |
| Vite | Maven/Gradle | 构建工具 |
| CSS | 样式配置 | UI外观定制 |

## 核心业务流程

### JSON解析流程
```
用户输入 → 格式验证 → 解析为对象 → 构建树结构 → UI渲染
```

### 关键方法说明

- **validateAndParseJson()** - 验证器 + 解析器
- **buildTreeData()** - 递归构建树形结构

## UI组件结构

```
App (根组件)
├── Header (标题栏)
├── Toolbar (工具栏)
├── InputSection (输入区域)
├── TreeViewer (树形视图)
└── SidePanel (详情面板)
```

## 快速上手步骤

1. 先看`package.json`了解依赖
2. 从`main.tsx`开始，理解应用启动
3. 重点看`App.tsx`中的状态定义
4. 理解主要的业务方法
5. 最后看UI渲染逻辑

---

[English Version](ARCHITECTURE.md)
