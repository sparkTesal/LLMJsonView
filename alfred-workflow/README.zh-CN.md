# JSON Handle Alfred 工作流

这是一个Alfred工作流，可以快速打开JSON Handle网页并自动读取剪贴板内容。

## 功能特性

- 快速触发：输入 `json` 即可启动
- 智能读取：使用现代剪贴板API直接读取剪贴板内容
- 直接打开：自动在默认浏览器中打开JSON Handle网页
- 无缝体验：一键完成复制→打开→读取的完整流程
- 无长度限制：支持任意大小的JSON数据（MB级别）
- 更安全：敏感数据不会出现在URL中

## 安装方法

### 方法一：直接导入（推荐）

1. 下载 `JSON Handle.alfredworkflow` 文件
2. 双击文件，Alfred会自动导入工作流
3. 确认导入即可使用

### 方法二：手动创建

1. 打开Alfred Preferences（偏好设置）
2. 点击 "Workflows" 标签
3. 点击左下角的 "+" 按钮，选择 "Blank Workflow"
4. 填写工作流信息后连接触发器和脚本

## 使用方法

1. 复制JSON内容到剪贴板
2. 按 `Cmd + Space` 启动Alfred
3. 输入 `json` 并按回车
4. 浏览器自动打开并读取剪贴板内容

## 系统要求

- **macOS**：支持Alfred的任意版本
- **浏览器**：现代浏览器（Chrome、Firefox、Safari、Edge）
- **HTTPS**：需要HTTPS环境才能使用剪贴板API

## 故障排除

- 工作流不响应：检查Alfred权限和触发词冲突
- 剪贴板未读取：确认HTTPS、浏览器权限、剪贴板有内容
- HTTP环境：可手动点击"读取剪贴板"或粘贴

---

[English Version](README.md) | [安装指南](INSTALLATION_GUIDE.zh-CN.md) | [修复说明](FIX_NOTES.zh-CN.md)
