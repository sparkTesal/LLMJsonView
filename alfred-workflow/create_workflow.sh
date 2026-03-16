#!/bin/bash

# JSON Handle Alfred Workflow 打包脚本

echo "🚀 开始创建 JSON Handle Alfred Workflow..."

# 创建临时目录
TEMP_DIR="JSON_Handle_Workflow_temp"
WORKFLOW_NAME="JSON Handle.alfredworkflow"

# 清理之前的文件
rm -rf "$TEMP_DIR"
rm -f "$WORKFLOW_NAME"

# 创建临时目录
mkdir "$TEMP_DIR"

# 复制info.plist到临时目录
cp info.plist "$TEMP_DIR/"

echo "📦 正在打包工作流文件..."

# 进入临时目录并创建zip文件
cd "$TEMP_DIR"
zip -r "../$WORKFLOW_NAME" .
cd ..

# 清理临时目录
rm -rf "$TEMP_DIR"

echo "✅ Alfred工作流创建完成！"
echo "📁 文件位置: $(pwd)/$WORKFLOW_NAME"
echo ""
echo "📋 安装步骤："
echo "1. 双击 '$WORKFLOW_NAME' 文件"
echo "2. Alfred会自动打开并询问是否导入"
echo "3. 点击 'Import' 确认导入"
echo "4. 完成！现在你可以输入 'json' 来使用工作流了"
echo ""
echo "🎯 使用方法："
echo "1. 复制JSON内容到剪贴板"
echo "2. 按 Cmd+Space 打开Alfred"
echo "3. 输入 'json' 并按回车"
echo "4. 浏览器会自动打开并填入剪贴板内容" 