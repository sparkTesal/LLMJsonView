# Alfred 工作流修复说明

## 常见导入错误

**错误信息**：`The workflow you are trying to import is invalid or corrupted.`

**原因**：XML格式问题 - plist 文件中的脚本包含未转义的特殊字符（如 `&`、`>` 等）

## 解决方案

### 方案1：简化版工作流（推荐）

**特点**：
- 避免复杂的XML转义
- 简单可靠，2秒可粘贴
- 支持任意大小的JSON
- 无需额外权限

**脚本**：见 [FIX_NOTES.md](FIX_NOTES.md) 中的 Solution 1

### 方案2：使用外部脚本

**特点**：
- 权限检测
- 错误识别
- 详细日志

**用法**：`./paste_script.sh`

## 验证步骤

1. **校验XML**：`plutil -lint info.plist`
2. **检查工作流**：`unzip -t "JSON Handle.alfredworkflow"`
3. **测试工作流**：`./test_workflow.sh`

## XML转义规则

- `&` → `&amp;`
- `<` → `&lt;`
- `>` → `&gt;`

---

[English Version](FIX_NOTES.md)
