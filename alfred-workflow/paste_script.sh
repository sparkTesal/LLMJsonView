#!/bin/bash

# JSON Handle Alfred Workflow - 完整版自动粘贴脚本

# 权限检测
check_permission() {
    osascript -e 'tell application "System Events" to get name of first process' >/dev/null 2>&1
    return $?
}

# 检查权限
if ! check_permission; then
    echo "权限检测失败，打开权限引导页面"
    open "http://antnluservice1.inc.alipay.net/json_handle?setup=permissions"
    
    # 打开系统偏好设置
    osascript -e '
    tell application "System Preferences"
        activate
        delay 0.5
        set current pane to pane "com.apple.preference.security"
    end tell'
    
    exit 0
fi

# 生成唯一会话ID
session_id=$(uuidgen | cut -d'-' -f1 | tr 'A-Z' 'a-z')
echo "生成会话ID: $session_id"

# 打开网页
echo "打开网页..."
open "http://antnluservice1.inc.alipay.net/json_handle?trigger=alfred&session=$session_id"

# 等待页面加载
echo "等待页面加载..."
sleep 1.5

# 智能等待并粘贴
echo "开始窗口检测和粘贴..."
for i in {1..30}; do
    # 获取当前前台窗口标题
    title=$(osascript -e '
    try
        tell application "System Events"
            set frontApp to name of first application process whose frontmost is true
            if frontApp contains "Chrome" or frontApp contains "Safari" or frontApp contains "Firefox" then
                return name of front window of first application process whose frontmost is true
            end if
        end tell
    on error
        return ""
    end try' 2>/dev/null)
    
    echo "检测窗口标题: $title"
    
    # 检查标题是否包含会话ID
    if [[ "$title" == *"$session_id"* ]]; then
        echo "找到目标窗口，执行粘贴操作"
        sleep 0.3
        osascript -e 'tell application "System Events" to keystroke "v" using command down'
        echo "粘贴完成"
        exit 0
    fi
    
    sleep 0.2
done

# 备用方案：直接粘贴
echo "窗口检测超时，执行备用粘贴"
sleep 0.5
osascript -e 'tell application "System Events" to keystroke "v" using command down'
echo "备用粘贴完成" 