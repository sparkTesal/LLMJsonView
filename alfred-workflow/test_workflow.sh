#!/bin/bash

# JSON Handle Alfred Workflow 测试脚本 - 简化版

echo "🧪 测试 JSON Handle Alfred Workflow（简化版 - 自动粘贴）..."

# 测试JSON数据
test_json='{"name": "测试用户", "age": 25, "skills": ["JavaScript", "React", "Node.js"], "active": true, "description": "这是一个测试JSON，用于验证自动粘贴功能。支持中文字符和各种数据类型。"}'

echo ""
echo "📋 测试JSON数据（$(echo "$test_json" | wc -c)字符）:"
echo "$test_json"
echo ""

# 将测试数据复制到剪贴板
echo "$test_json" | pbcopy
echo "✅ 测试数据已复制到剪贴板"

# 生成会话ID（模拟Alfred脚本）
session_id=$(date +%s | tail -c 6)

# 构建测试URL
base_url="http://antnluservice1.inc.alipay.net/json_handle"
test_url="${base_url}?trigger=alfred&session=$session_id"

echo ""
echo "🔗 生成的测试URL:"
echo "$test_url"
echo "📱 会话ID: $session_id"
echo ""

echo "🚀 即将测试自动粘贴流程..."
echo ""
echo "📝 测试流程："
echo "1. 打开浏览器并加载页面"
echo "2. 页面检测会话ID并设置标题"
echo "3. 等待2秒后自动粘贴"
echo "4. 验证JSON自动解析"
echo ""

# 等待用户确认
read -p "按回车键开始自动粘贴测试..."

# 记录开始时间
start_time=$(date +%s)

# 打开浏览器
open "$test_url"

# 等待页面加载
echo "⏳ 等待页面加载..."
sleep 2

# 执行粘贴操作
echo "📋 执行自动粘贴..."
osascript -e 'tell application "System Events" to keystroke "v" using command down'

# 计算总耗时
end_time=$(date +%s)
total_time=$((end_time - start_time))

echo ""
echo "✅ 自动粘贴测试完成！"
echo "⏱️  总耗时: ${total_time}秒"
echo ""

echo "📝 验证清单："
echo "□ 浏览器是否成功打开了JSON Handle网页？"
echo "□ 页面标题是否包含会话ID: $session_id？"
echo "□ 输入框中是否自动填入了测试JSON数据？"
echo "□ JSON数据是否被正确解析和格式化？"
echo ""

echo "💡 简化版特点："
echo "✓ 无复杂权限检测（避免XML转义问题）"
echo "✓ 固定2秒延迟（适合大多数情况）"
echo "✓ 简单可靠的粘贴机制"
echo "✓ 支持任意大小的JSON数据"
echo ""

echo "🎉 如果以上都正常，说明简化版Alfred工作流配置成功！"
echo ""
echo "🔄 使用方法："
echo "1. 复制JSON内容到剪贴板"
echo "2. Cmd+Space → json → 回车"
echo "3. 等待2秒自动粘贴"
echo ""
echo "💡 提示：如果需要权限设置，请手动运行完整版脚本："
echo "./paste_script.sh" 