import React, { useState, useCallback } from 'react';
import { 
  Copy, 
  Download, 
  Upload, 
  Trash2, 
  ChevronRight,
  ChevronDown,
  X,
  FileText,
  Hash,
  ToggleLeft,
  ToggleRight,
  Braces,
  Brackets,
  Expand,
  Minimize,
  Settings,
  MoreVertical,
  Eye,
  ChevronsDown,
  ChevronsRight,
  Wrench,
  AlertTriangle,
  ArrowLeft,
  Quote,
  Unlink
} from 'lucide-react';
import { jsonrepair } from 'jsonrepair';
import unescapeJs from 'unescape-js';
import './App.css';

interface JsonError {
  message: string;
  line?: number;
  column?: number;
  fixSuggestion?: string;
}

interface JsonFixSuggestion {
  type: 'trailing_comma' | 'missing_quotes' | 'single_quotes' | 'missing_comma' | 'bracket_mismatch' | 'undefined_values' | 'comments' | 'other';
  description: string;
  fixedJson: string;
  confidence: 'high' | 'medium' | 'low';
}

interface TreeNode {
  key: string;
  value: any;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  path: string[];
  isExpanded?: boolean;
  children?: TreeNode[];
}

interface SelectedNode {
  path: string[];
  key: string;
  value: any;
  type: string;
  displayValue: string;
}

function App() {
  const [inputJson, setInputJson] = useState('');
  const [parsedData, setParsedData] = useState<any>(null);
  const [error, setError] = useState<JsonError | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [showInput, setShowInput] = useState(true);
  const [isViewerMode, setIsViewerMode] = useState(false);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [panelSize, setPanelSize] = useState({ width: 700, height: 800 });
  const [copyFeedback, setCopyFeedback] = useState<{show: boolean, message: string}>({show: false, message: ''});
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
  const [fixSuggestions, setFixSuggestions] = useState<JsonFixSuggestion[]>([]);
  const [showFixSuggestions, setShowFixSuggestions] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<number | null>(null);
  const [showClipboardButton, setShowClipboardButton] = useState(false);

  // 权限引导状态
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);

  // 检测是否支持剪贴板API
  React.useEffect(() => {
    // 检查是否支持现代剪贴板API
    const supportsClipboard = navigator.clipboard && window.isSecureContext;
    setShowClipboardButton(supportsClipboard);
  }, []);

  // 检查URL参数中的触发标识（用于Alfred工作流）
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const trigger = urlParams.get('trigger');
    const sessionId = urlParams.get('session');
    const setup = urlParams.get('setup');
    
    if (setup === 'permissions') {
      // 显示权限设置引导
      setShowPermissionGuide(true);
      return;
    }
    
    if (trigger === 'alfred') {
      if (sessionId) {
        // 设置页面标题包含会话ID（用于Alfred脚本识别）
        document.title = `JSON Handle - ${sessionId}`;
        
        // 延迟一点确保标题设置完成
        setTimeout(() => {
          // 聚焦到输入框准备接收粘贴
          const textarea = document.querySelector('.json-input') as HTMLTextAreaElement;
          if (textarea) {
            textarea.focus();
            
            // 检查会话ID长度来判断是简化版还是完整版
            if (sessionId.length <= 6) {
              // 简化版：只聚焦，不监听粘贴事件，等待Alfred自动粘贴
              setCopyFeedback({show: true, message: '已准备就绪，等待Alfred自动粘贴...'});
              
              // 监听粘贴事件仅用于显示反馈
              const handleSimplePaste = (e: ClipboardEvent) => {
                const pastedText = e.clipboardData?.getData('text');
                if (pastedText) {
                  // 不阻止默认行为，让粘贴正常进行
                  setTimeout(() => {
                    handleInputChange(pastedText, true);
                    setCopyFeedback({show: true, message: '已自动粘贴剪贴板内容'});
                    setTimeout(() => {
                      setCopyFeedback({show: false, message: ''});
                    }, 3000);
                  }, 100);
                  
                  // 移除监听器
                  textarea.removeEventListener('paste', handleSimplePaste);
                }
              };
              
              textarea.addEventListener('paste', handleSimplePaste);
              
              // 5秒后清理提示和监听器
              setTimeout(() => {
                textarea.removeEventListener('paste', handleSimplePaste);
                setCopyFeedback({show: false, message: ''});
              }, 5000);
            } else {
              // 完整版：监听粘贴事件
              setCopyFeedback({show: true, message: '已准备就绪，等待自动粘贴...'});
              
              // 监听粘贴事件
              const handlePaste = (e: ClipboardEvent) => {
                const pastedText = e.clipboardData?.getData('text');
                if (pastedText) {
                  handleInputChange(pastedText, true);
                  setCopyFeedback({show: true, message: '已自动粘贴剪贴板内容'});
                  setTimeout(() => {
                    setCopyFeedback({show: false, message: ''});
                  }, 3000);
                  
                  // 移除监听器
                  textarea.removeEventListener('paste', handlePaste);
                }
              };
              
              textarea.addEventListener('paste', handlePaste);
              
              // 10秒后清理
              setTimeout(() => {
                textarea.removeEventListener('paste', handlePaste);
                setCopyFeedback({show: false, message: ''});
              }, 10000);
            }
          }
        }, 200);
      } else {
        // 兼容旧版本（无会话ID）
        handleReadClipboard(true);
      }
      
      // 清除URL参数
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  // 读取剪贴板内容
  const handleReadClipboard = async (isAutomatic = false) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        const clipboardText = await navigator.clipboard.readText();
        
        if (clipboardText.trim()) {
          setInputJson(clipboardText);
          handleInputChange(clipboardText, true);
          
          const message = isAutomatic ? '已自动读取剪贴板内容' : '已读取剪贴板内容';
          setCopyFeedback({show: true, message});
          setTimeout(() => {
            setCopyFeedback({show: false, message: ''});
          }, 3000);
        } else {
          setCopyFeedback({show: true, message: '剪贴板为空'});
          setTimeout(() => {
            setCopyFeedback({show: false, message: ''});
          }, 2000);
        }
      } else {
        setCopyFeedback({show: true, message: '当前环境不支持剪贴板读取（需要HTTPS）'});
        setTimeout(() => {
          setCopyFeedback({show: false, message: ''});
        }, 3000);
      }
    } catch (error) {
      console.error('读取剪贴板失败:', error);
      setCopyFeedback({show: true, message: '读取剪贴板失败，请手动粘贴'});
      setTimeout(() => {
        setCopyFeedback({show: false, message: ''});
      }, 3000);
    }
  };

  const formatValue = (value: any, type: string): string => {
    if (type === 'string') {
      // 对于字符串，显示原始内容，不添加额外的转义
      return value;
    }
    return JSON.stringify(value, null, 2);
  };

  // 分析JSON变化，识别具体修复了什么
  const analyzeJsonChanges = useCallback((original: string, repaired: string): JsonFixSuggestion[] => {
    const changes: JsonFixSuggestion[] = [];
    
    // 检查是否移除了尾随逗号
    if (/,\s*[}\]]/.test(original) && !/,\s*[}\]]/.test(repaired)) {
      changes.push({
        type: 'trailing_comma',
        description: '移除了尾随逗号',
        fixedJson: repaired,
        confidence: 'high'
      });
    }
    
    // 检查是否修复了单引号
    if (/'/.test(original) && !/'/.test(repaired)) {
      changes.push({
        type: 'single_quotes',
        description: '将单引号替换为双引号',
        fixedJson: repaired,
        confidence: 'high'
      });
    }
    
    // 检查是否添加了属性名引号
    if (/[{,]\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*:/.test(original)) {
      changes.push({
        type: 'missing_quotes',
        description: '为属性名添加了双引号',
        fixedJson: repaired,
        confidence: 'high'
      });
    }
    
    // 检查是否修复了注释
    if (/\/\*|\s\/\//.test(original) && !/\/\*|\s\/\//.test(repaired)) {
      changes.push({
        type: 'comments',
        description: '移除了JSON注释',
        fixedJson: repaired,
        confidence: 'medium'
      });
    }

    return changes;
  }, []);

  // 递归修复函数 - 当专业库失败时的备用方案
  const attemptRecursiveRepair = useCallback((jsonString: string): JsonFixSuggestion[] => {
    const fixes: JsonFixSuggestion[] = [];
    
    // 逐步应用修复规则，每次修复后重新验证
    const repairStrategies = [
      {
        name: '移除尾随逗号',
        type: 'trailing_comma' as const,
        fix: (str: string) => str.replace(/,(\s*[}\]])/g, '$1'),
        confidence: 'high' as const
      },
      {
        name: '将单引号替换为双引号',
        type: 'single_quotes' as const,
        fix: (str: string) => str.replace(/'/g, '"'),
        confidence: 'high' as const
      },
      {
        name: '为属性名添加双引号',
        type: 'missing_quotes' as const,
        fix: (str: string) => str.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":'),
        confidence: 'high' as const
      },
      {
        name: '将undefined/null替换为null',
        type: 'undefined_values' as const,
        fix: (str: string) => str.replace(/:\s*(undefined|NaN|Infinity)\b/g, ': null'),
        confidence: 'high' as const
      },
      {
        name: '移除注释',
        type: 'comments' as const,
        fix: (str: string) => str.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''),
        confidence: 'medium' as const
      },
      {
        name: '修复Python风格的布尔值',
        type: 'other' as const,
        fix: (str: string) => str.replace(/\b(True|False|None)\b/g, (match) => {
          switch (match) {
            case 'True': return 'true';
            case 'False': return 'false';
            case 'None': return 'null';
            default: return match;
          }
        }),
        confidence: 'high' as const
      },
      {
        name: '添加缺失的逗号',
        type: 'missing_comma' as const,
        fix: (str: string) => str.replace(/(["}])\s*(["{])/g, '$1,$2'),
        confidence: 'medium' as const
      }
    ];

    let currentJson = jsonString;
    
    for (const strategy of repairStrategies) {
      try {
        const fixedJson = strategy.fix(currentJson);
        if (fixedJson !== currentJson) {
          // 验证修复结果
          JSON.parse(fixedJson);
          
          fixes.push({
            type: strategy.type,
            description: strategy.name,
            fixedJson: fixedJson,
            confidence: strategy.confidence
          });
          
          // 如果这个修复成功了，继续在此基础上尝试其他修复
          currentJson = fixedJson;
        }
      } catch (error) {
        // 如果这个策略失败了，继续尝试下一个
        continue;
      }
    }

    // 如果没有单独的修复策略成功，尝试组合修复
    if (fixes.length === 0) {
      try {
        let combinedFix = jsonString;
        
        // 按顺序应用所有修复策略
        for (const strategy of repairStrategies) {
          combinedFix = strategy.fix(combinedFix);
        }
        
        if (combinedFix !== jsonString) {
          JSON.parse(combinedFix);
          
          fixes.push({
            type: 'other',
            description: '应用了多种修复规则组合',
            fixedJson: combinedFix,
            confidence: 'medium'
          });
        }
      } catch (error) {
        // 组合修复也失败了
        console.warn('所有修复策略都失败了:', error);
      }
    }

    return fixes;
  }, []);

  const attemptJsonFix = useCallback((jsonString: string): JsonFixSuggestion[] => {
    const fixes: JsonFixSuggestion[] = [];
    
    try {
      // 首先尝试使用专业的jsonrepair库进行修复
      const repaired = jsonrepair(jsonString);
      
      // 验证修复结果
      JSON.parse(repaired);
      
      // 如果修复成功且内容有变化，添加到修复建议
      if (repaired !== jsonString) {
        fixes.push({
          type: 'other',
          description: '使用智能修复引擎自动修复JSON',
          fixedJson: repaired,
          confidence: 'high'
        });
        
        // 分析具体修复了什么问题
        const analysisResults = analyzeJsonChanges(jsonString, repaired);
        fixes.push(...analysisResults);
      }
    } catch (repairError) {
      console.warn('jsonrepair库修复失败:', repairError);
      
      // 如果专业库修复失败，使用递归修复策略
      const recursiveFixes = attemptRecursiveRepair(jsonString);
      fixes.push(...recursiveFixes);
    }

    return fixes;
  }, [analyzeJsonChanges, attemptRecursiveRepair]);

  const buildTreeData = useCallback((obj: any, path: string[] = []): TreeNode[] => {
    if (obj === null) {
      return [{
        key: path.length === 0 ? 'root' : path[path.length - 1],
        value: null,
        type: 'null',
        path,
      }];
    }

    if (typeof obj !== 'object') {
      return [{
        key: path.length === 0 ? 'root' : path[path.length - 1],
        value: obj,
        type: typeof obj as any,
        path,
      }];
    }

    if (Array.isArray(obj)) {
      const children = obj.map((item, index) => 
        buildTreeData(item, [...path, index.toString()])[0]
      );
      
      return [{
        key: path.length === 0 ? 'root' : path[path.length - 1],
        value: obj,
        type: 'array',
        path,
        isExpanded: expandedPaths.has(path.join('.')),
        children,
      }];
    }

    const children = Object.entries(obj).map(([key, value]) => 
      buildTreeData(value, [...path, key])[0]
    );

    return [{
      key: path.length === 0 ? 'root' : path[path.length - 1],
      value: obj,
      type: 'object',
      path,
      isExpanded: expandedPaths.has(path.join('.')),
      children,
    }];
  }, [expandedPaths]);

  const validateAndParseJson = useCallback((jsonString: string) => {
    if (!jsonString.trim()) {
      setParsedData(null);
      setTreeData([]);
      setError(null);
      setIsValid(null);
      setFixSuggestions([]);
      setShowFixSuggestions(false);
      return;
    }

    try {
      const parsed = JSON.parse(jsonString);
      setParsedData(parsed);
      setError(null);
      setIsValid(true);
      setFixSuggestions([]);
      setShowFixSuggestions(false);
      
      // 默认展开根节点
      const rootPath = '';
      setExpandedPaths(new Set([rootPath]));
      
      // 构建树形数据
      const tree = buildTreeData(parsed);
      setTreeData(tree);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      
      // 尝试提取行号和列号
      const match = errorMessage.match(/position (\d+)|line (\d+)|column (\d+)/i);
      const position = match ? parseInt(match[1] || match[2] || match[3]) : undefined;
      
      // 尝试自动修复
      const suggestions = attemptJsonFix(jsonString);
      
      setError({
        message: errorMessage,
        line: position,
        fixSuggestion: suggestions.length > 0 ? `找到${suggestions.length}个修复建议` : undefined
      });
      setIsValid(false);
      setParsedData(null);
      setTreeData([]);
      setFixSuggestions(suggestions);
      setShowFixSuggestions(suggestions.length > 0);
    }
  }, [buildTreeData, attemptJsonFix]);

  const handleInputChange = (value: string, isPaste = false) => {
    setInputJson(value);
    
    // 清除之前的定时器
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    if (isPaste || Math.abs(value.length - inputJson.length) > 100) {
      // 粘贴操作或大量文本变化，立即处理
      validateAndParseJson(value);
    } else {
      // 正常输入，使用防抖
      const timer = setTimeout(() => {
        validateAndParseJson(value);
      }, 300);
      setDebounceTimer(timer);
    }
  };

  const applyFixSuggestion = (suggestion: JsonFixSuggestion) => {
    setInputJson(suggestion.fixedJson);
    validateAndParseJson(suggestion.fixedJson);
    setCopyFeedback({show: true, message: `已应用修复: ${suggestion.description}`});
    setTimeout(() => {
      setCopyFeedback({show: false, message: ''});
    }, 2000);
  };

  const handleSubmit = () => {
    validateAndParseJson(inputJson);
    setShowInput(false);
    setIsViewerMode(true);
  };

  const handleClear = () => {
    setInputJson('');
    setParsedData(null);
    setTreeData([]);
    setError(null);
    setIsValid(null);
    setSelectedNode(null);
    setExpandedPaths(new Set());
    setShowInput(true);
    setIsViewerMode(false);
    setShowActionMenu(false);
    setFixSuggestions([]);
    setShowFixSuggestions(false);
    
    // 重置文件输入框
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach((input) => {
      (input as HTMLInputElement).value = '';
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        handleInputChange(content, true); // 标记为粘贴操作
      };
      reader.readAsText(file);
      // 重置input值，确保同一文件可以重复上传
      event.target.value = '';
    }
  };

  const toggleExpand = (path: string[]) => {
    const pathKey = path.join('.');
    const newExpanded = new Set(expandedPaths);
    
    if (newExpanded.has(pathKey)) {
      newExpanded.delete(pathKey);
    } else {
      newExpanded.add(pathKey);
    }
    
    setExpandedPaths(newExpanded);
  };

  const toggleExpandAll = (node: TreeNode) => {
    const getAllChildPaths = (node: TreeNode): string[] => {
      const paths: string[] = [];
      if (node.children) {
        node.children.forEach(child => {
          paths.push(child.path.join('.'));
          paths.push(...getAllChildPaths(child));
        });
      }
      return paths;
    };

    const allChildPaths = getAllChildPaths(node);
    const newExpanded = new Set(expandedPaths);
    const nodePathKey = node.path.join('.');
    
    // 检查是否所有子节点都已展开
    const allExpanded = allChildPaths.every(path => newExpanded.has(path));
    
    if (allExpanded) {
      // 如果都展开了，就全部折叠（只保留当前节点展开）
      allChildPaths.forEach(path => {
        if (path !== nodePathKey) {
          newExpanded.delete(path);
        }
      });
    } else {
      // 如果有未展开的，就全部展开
      allChildPaths.forEach(path => newExpanded.add(path));
    }
    
    setExpandedPaths(newExpanded);
  };

  const selectNode = (node: TreeNode) => {
    const displayValue = formatValue(node.value, node.type);
    
    setSelectedNode({
      path: node.path,
      key: node.key,
      value: node.value,
      type: node.type,
      displayValue,
    });
  };

  const copyToClipboard = async (text: string, source?: string) => {
    try {
      // 检查是否支持现代剪贴板API（需要HTTPS）
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // HTTP环境下使用传统方法
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        // @ts-ignore - execCommand已废弃但仍需用于HTTP环境兼容
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      // 显示全局提示
      setCopyFeedback({show: true, message: '已复制到剪贴板'});
      setTimeout(() => {
        setCopyFeedback({show: false, message: ''});
      }, 2000);

      // 如果有指定来源，添加到已复制列表
      if (source) {
        setCopiedItems(prev => new Set([...prev, source]));
        setTimeout(() => {
          setCopiedItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(source);
            return newSet;
          });
        }, 1500);
      }
    } catch (err) {
      console.error('复制失败:', err);
      setCopyFeedback({show: true, message: '复制失败'});
      setTimeout(() => {
        setCopyFeedback({show: false, message: ''});
      }, 2000);
    }
  };

  const downloadJson = () => {
    if (!parsedData) return;
    
    const jsonString = JSON.stringify(parsedData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 格式化JSON
  const formatJson = () => {
    if (!inputJson.trim()) return;
    
    try {
      const parsed = JSON.parse(inputJson);
      const formatted = JSON.stringify(parsed, null, 2);
      setInputJson(formatted);
      setCopyFeedback({show: true, message: 'JSON已格式化'});
      setTimeout(() => {
        setCopyFeedback({show: false, message: ''});
      }, 2000);
    } catch (err) {
      setCopyFeedback({show: true, message: '无法格式化：JSON格式不正确'});
      setTimeout(() => {
        setCopyFeedback({show: false, message: ''});
      }, 2000);
    }
  };

  // 压缩JSON
  const compressJson = () => {
    if (!inputJson.trim()) return;
    
    try {
      const parsed = JSON.parse(inputJson);
      const compressed = JSON.stringify(parsed);
      setInputJson(compressed);
      setCopyFeedback({show: true, message: 'JSON已压缩'});
      setTimeout(() => {
        setCopyFeedback({show: false, message: ''});
      }, 2000);
    } catch (err) {
      setCopyFeedback({show: true, message: '无法压缩：JSON格式不正确'});
      setTimeout(() => {
        setCopyFeedback({show: false, message: ''});
      }, 2000);
    }
  };

  // 转义字符串
  const escapeJson = () => {
    if (!inputJson.trim()) return;
    
    // 纯粹的字符串转义：转义双引号、反斜杠、换行符等
    const escaped = inputJson
      .replace(/\\/g, '\\\\')  // 先转义反斜杠
      .replace(/"/g, '\\"')    // 转义双引号
      .replace(/\n/g, '\\n')   // 转义换行符
      .replace(/\r/g, '\\r')   // 转义回车符
      .replace(/\t/g, '\\t');  // 转义制表符
    
    setInputJson(escaped);
    setCopyFeedback({show: true, message: '字符串已转义'});
    setTimeout(() => {
      setCopyFeedback({show: false, message: ''});
    }, 2000);
  };

  // 反转义字符串
  const unescapeJson = () => {
    if (!inputJson.trim()) return;
    
    try {
      let textToUnescape = inputJson.trim();
      
      // 更智能的双引号检测
      if (textToUnescape.length >= 2) {
        const firstChar = textToUnescape[0];
        const lastChar = textToUnescape[textToUnescape.length - 1];
        
        // 检查是否被双引号包裹（确保不是转义的引号）
        if (firstChar === '"' && lastChar === '"') {
          // 检查最后的引号是否被转义
          let isLastQuoteEscaped = false;
          let backslashCount = 0;
          
          // 从倒数第二个字符开始向前数反斜杠
          for (let i = textToUnescape.length - 2; i >= 0 && textToUnescape[i] === '\\'; i--) {
            backslashCount++;
          }
          
          // 如果反斜杠数量是奇数，说明最后的引号被转义了
          isLastQuoteEscaped = backslashCount % 2 === 1;
          
          if (!isLastQuoteEscaped) {
            // 去掉外层双引号
            textToUnescape = textToUnescape.slice(1, -1);
          }
        }
      }
      
      // 使用专业的unescape-js库处理所有转义序列
      const unescaped = unescapeJs(textToUnescape);
      
      setInputJson(unescaped);
      setCopyFeedback({show: true, message: '字符串已反转义'});
      setTimeout(() => {
        setCopyFeedback({show: false, message: ''});
      }, 2000);
    } catch (err) {
      setCopyFeedback({show: true, message: '反转义失败'});
      setTimeout(() => {
        setCopyFeedback({show: false, message: ''});
      }, 2000);
    }
  };

  const renderTreeNode = (node: TreeNode, level = 0): React.ReactNode => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = node.isExpanded;
    const pathKey = node.path.join('.');

    // 判断是否为长字符串（超过60个字符）
    const isLongString = node.type === 'string' && String(node.value).length > 60;
    const stringCopyId = `string-${pathKey}`;
    const isStringCopied = copiedItems.has(stringCopyId);

    // 判断是否所有子节点都已展开
    const getAllChildPaths = (node: TreeNode): string[] => {
      const paths: string[] = [];
      if (node.children) {
        node.children.forEach(child => {
          paths.push(child.path.join('.'));
          paths.push(...getAllChildPaths(child));
        });
      }
      return paths;
    };

    const allChildPaths = hasChildren ? getAllChildPaths(node) : [];
    const allChildrenExpanded = allChildPaths.length > 0 && allChildPaths.every(path => expandedPaths.has(path));

    const handlePreview = (e: React.MouseEvent) => {
      e.stopPropagation();
      selectNode(node);
    };

    const handleLongStringCopy = async (e: React.MouseEvent) => {
      e.stopPropagation();
      await copyToClipboard(String(node.value), stringCopyId);
    };

    const handleExpandAll = (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleExpandAll(node);
    };

    return (
      <div key={pathKey} className="tree-node">
        <div 
          className={`node-content ${selectedNode?.path.join('.') === pathKey ? 'selected' : ''} ${isLongString ? 'long-string-node' : ''}`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
        >
          {hasChildren && (
            <button
              className="expand-btn"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.path);
              }}
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          )}
          
          {!hasChildren && <div className="expand-placeholder" />}
          
          <div className="node-header">
            <span className="node-key">{node.key}</span>
            <span className="node-colon">:</span>
            
            {/* 节点级别的展开/折叠所有子节点按钮 */}
            {hasChildren && isExpanded && (
              <button 
                className="expand-all-btn"
                onClick={handleExpandAll}
                title={allChildrenExpanded ? "折叠所有子节点" : "展开所有子节点"}
              >
                {allChildrenExpanded ? <ChevronsRight size={12} /> : <ChevronsDown size={12} />}
              </button>
            )}
            
            {/* 预览按钮 - 悬停时显示 */}
            <button 
              className="preview-btn"
              onClick={handlePreview}
              title="预览详情"
            >
              <Eye size={12} />
            </button>
          </div>
          
          <span className={`node-value node-${node.type}`}>
            {node.type === 'object' && (hasChildren ? `{${node.children!.length}}` : '{}')}
            {node.type === 'array' && (hasChildren ? `[${node.children!.length}]` : '[]')}
            {node.type === 'string' && !isLongString && '"'}
            {node.type === 'string' && isLongString && '"""'}
            {node.type === 'string' && (
              <span className={isLongString ? "string-long" : "string-full"}>
                {String(node.value)}
                {/* 长字符串的复制按钮 */}
                {isLongString && (
                  <button 
                    className={`string-copy-btn ${isStringCopied ? 'copied' : ''}`}
                    onClick={handleLongStringCopy}
                    title={isStringCopied ? "已复制!" : "复制字符串"}
                  >
                    {isStringCopied ? (
                      <span className="copy-success">✓</span>
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                )}
              </span>
            )}
            {node.type === 'string' && !isLongString && '"'}
            {node.type === 'string' && isLongString && '"""'}
            {!['object', 'array', 'string'].includes(node.type) && String(node.value)}
          </span>
          
          <div className="node-icons">
            {node.type === 'object' && <Braces size={12} />}
            {node.type === 'array' && <Brackets size={12} />}
            {node.type === 'string' && <FileText size={12} />}
            {node.type === 'number' && <Hash size={12} />}
            {node.type === 'boolean' && (node.value ? <ToggleRight size={12} /> : <ToggleLeft size={12} />)}
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="node-children">
            {node.children!.map((child) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // 重新构建树形数据当展开状态改变时
  React.useEffect(() => {
    if (parsedData) {
      const tree = buildTreeData(parsedData);
      setTreeData(tree);
    }
  }, [parsedData, buildTreeData]);

  // 清理定时器
  React.useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = panelSize.width;
    const startHeight = panelSize.height;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      // 左下角调整：X轴向左减小宽度，Y轴向下增加高度
      const deltaX = startX - moveEvent.clientX; // 向左为正
      const deltaY = moveEvent.clientY - startY; // 向下为正
      
      const newWidth = Math.max(400, Math.min(1000, startWidth + deltaX));
      const newHeight = Math.max(400, Math.min(window.innerHeight - 80, startHeight + deltaY));
      
      setPanelSize({ width: newWidth, height: newHeight });
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="app">
      {/* 复制成功提示 */}
      {copyFeedback.show && (
        <div className="copy-toast">
          {copyFeedback.message}
        </div>
      )}

      {/* 权限引导页面 */}
      {showPermissionGuide && (
        <div className="permission-guide-overlay">
          <div className="permission-guide-modal">
            <div className="permission-guide-header">
              <h2>🔐 设置辅助功能权限</h2>
              <button 
                className="close-btn"
                onClick={() => setShowPermissionGuide(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="permission-guide-content">
              <div className="guide-section">
                <h3>📋 为什么需要这个权限？</h3>
                <p>为了实现完全自动化的JSON粘贴功能，Alfred需要辅助功能权限来模拟键盘操作。</p>
              </div>
              
              <div className="guide-section">
                <h3>⚙️ 设置步骤</h3>
                <ol className="setup-steps">
                  <li>
                    <strong>打开系统偏好设置</strong>
                    <p>点击苹果菜单 → 系统偏好设置</p>
                  </li>
                  <li>
                    <strong>进入安全性与隐私</strong>
                    <p>点击"安全性与隐私"图标</p>
                  </li>
                  <li>
                    <strong>选择隐私标签</strong>
                    <p>点击窗口顶部的"隐私"标签</p>
                  </li>
                  <li>
                    <strong>找到辅助功能</strong>
                    <p>在左侧列表中选择"辅助功能"</p>
                  </li>
                  <li>
                    <strong>添加Alfred</strong>
                    <p>点击锁图标解锁，然后点击"+"按钮添加Alfred应用</p>
                  </li>
                  <li>
                    <strong>确认权限</strong>
                    <p>确保Alfred旁边的复选框已勾选</p>
                  </li>
                </ol>
              </div>
              
              <div className="guide-section">
                <h3>🚀 完成设置后</h3>
                <p>设置完成后，您就可以享受完全自动化的JSON处理体验了：</p>
                <ul className="feature-list">
                  <li>✅ 复制JSON内容到剪贴板</li>
                  <li>✅ 在Alfred中输入 "json"</li>
                  <li>✅ 自动打开网页并粘贴内容</li>
                  <li>✅ 支持任意大小的JSON数据</li>
                </ul>
              </div>
              
              <div className="guide-actions">
                <button 
                  className="primary-btn"
                  onClick={() => {
                    // 重新打开系统偏好设置
                    window.open('x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility');
                  }}
                >
                  🔧 打开系统偏好设置
                </button>
                
                <button 
                  className="secondary-btn"
                  onClick={() => {
                    setShowPermissionGuide(false);
                    setCopyFeedback({show: true, message: '您可以稍后手动粘贴JSON内容'});
                    setTimeout(() => {
                      setCopyFeedback({show: false, message: ''});
                    }, 3000);
                  }}
                >
                  稍后设置
                </button>
              </div>
              
              <div className="guide-note">
                <p><strong>💡 提示：</strong>如果您不想设置权限，也可以手动粘贴JSON内容到输入框中。</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 正常模式的标题和工具栏 */}
      {!isViewerMode && (
        <>
          <header className="header">
            <h1>JSON Handle</h1>
            <p>强大的JSON格式化和验证工具</p>
          </header>

          <div className="toolbar">
            <div className="toolbar-left">
              <label className="file-upload">
                <Upload size={16} />
                上传文件
                <input type="file" accept=".json,.txt" onChange={handleFileUpload} />
              </label>
              
              {showClipboardButton && (
                <button 
                  className="toolbar-btn clipboard-btn"
                  onClick={() => handleReadClipboard(false)}
                  title="读取剪贴板内容"
                >
                  <Copy size={16} />
                  读取剪贴板
                </button>
              )}
              
              {!showInput && (
                <button className="toolbar-btn" onClick={() => setShowInput(true)}>
                  编辑JSON
                </button>
              )}
            </div>

            <div className="toolbar-center">
              <div className="toolbar-title">JSON Handle</div>
              <div className="toolbar-subtitle">强大的JSON格式化和验证工具</div>
            </div>

            <div className="toolbar-right">
              <button 
                className="toolbar-btn"
                onClick={formatJson}
                disabled={!inputJson.trim()}
                title="格式化JSON"
              >
                <Expand size={14} />
                格式化
              </button>
              
              <button 
                className="toolbar-btn"
                onClick={compressJson}
                disabled={!inputJson.trim()}
                title="压缩JSON"
              >
                <Minimize size={14} />
                压缩
              </button>
              
              <button 
                className="toolbar-btn"
                onClick={escapeJson}
                disabled={!inputJson.trim()}
                title="转义JSON"
              >
                <Quote size={14} />
                转义
              </button>
              
              <button 
                className="toolbar-btn"
                onClick={unescapeJson}
                disabled={!inputJson.trim()}
                title="反转义JSON"
              >
                <Unlink size={14} />
                反转义
              </button>
            </div>
          </div>
        </>
      )}

      <div className={`main-content ${isViewerMode ? 'viewer-mode' : ''}`}>
        {showInput && (
          <div className="input-section">
            <div className="input-header">
              <h3>输入 JSON</h3>
              <div className="input-actions">
                {isValid === true && <span className="status-valid">✓ 有效的JSON</span>}
                {isValid === false && <span className="status-invalid">✗ 无效的JSON</span>}
                <button 
                  className="parse-btn"
                  onClick={handleSubmit}
                  disabled={!isValid}
                >
                  解析并查看
                </button>
              </div>
            </div>
            
            <textarea
              className="json-input"
              value={inputJson}
              onChange={(e) => handleInputChange(e.target.value)}
              onPaste={(e) => {
                // 保存当前滚动位置
                const target = e.target as HTMLTextAreaElement;
                const scrollTop = target.scrollTop;
                const scrollLeft = target.scrollLeft;
                
                // 延迟一点点让粘贴内容先更新到value中
                setTimeout(() => {
                  handleInputChange(target.value, true);
                  
                  // 恢复滚动位置
                  requestAnimationFrame(() => {
                    target.scrollTop = scrollTop;
                    target.scrollLeft = scrollLeft;
                  });
                }, 10);
              }}
              placeholder="在这里粘贴您的JSON数据..."
              spellCheck={false}
            />
            
            {error && (
              <div className="error-message">
                <div className="error-info">
                  <AlertTriangle size={16} />
                  <span>{error.message}</span>
                  {error.line && <span>位置: {error.line}</span>}
                </div>
                {error.fixSuggestion && (
                  <div className="fix-hint">
                    <Wrench size={14} />
                    <span>{error.fixSuggestion}</span>
                    {fixSuggestions.length > 0 && (
                      <button 
                        className="show-fixes-btn"
                        onClick={() => setShowFixSuggestions(!showFixSuggestions)}
                      >
                        {showFixSuggestions ? '隐藏修复建议' : '查看修复建议'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {showFixSuggestions && fixSuggestions.length > 0 && (
              <div className="fix-suggestions">
                <h4>修复建议</h4>
                {fixSuggestions.map((suggestion, index) => (
                  <div key={index} className={`fix-suggestion ${suggestion.confidence}`}>
                    <div className="fix-header">
                      <span className="fix-description">{suggestion.description}</span>
                      <span className={`fix-confidence ${suggestion.confidence}`}>
                        {suggestion.confidence === 'high' ? '高' : suggestion.confidence === 'medium' ? '中' : '低'}置信度
                      </span>
                    </div>
                    <div className="fix-actions">
                      <button 
                        className="apply-fix-btn"
                        onClick={() => applyFixSuggestion(suggestion)}
                      >
                        <Wrench size={14} />
                        应用此修复
                      </button>
                      <button 
                        className="preview-fix-btn"
                        onClick={() => copyToClipboard(suggestion.fixedJson)}
                        title="复制修复后的JSON"
                      >
                        <Copy size={14} />
                        复制
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!showInput && treeData.length > 0 && (
          <div className="tree-viewer">
            {/* 左上角返回按钮 */}
            <div className="back-button-panel">
              <button 
                className="back-btn"
                onClick={() => {
                  setShowInput(true);
                  setIsViewerMode(false);
                }}
                title="返回编辑"
              >
                <ArrowLeft size={18} />
              </button>
            </div>

            {/* 全屏模式下的固定操作栏 */}
            {isViewerMode && (
              <div className="control-panel">
                {/* 更多操作菜单 */}
                <div className="control-menu">
                  <button 
                    className="control-icon-btn menu-trigger"
                    onClick={() => setShowActionMenu(!showActionMenu)}
                    title="更多操作"
                  >
                    <MoreVertical size={18} />
                  </button>
                  
                  {showActionMenu && (
                    <div className="action-menu">
                      <label className="menu-item file-upload-menu">
                        <Upload size={16} />
                        <span>上传文件</span>
                        <input type="file" accept=".json,.txt" onChange={handleFileUpload} />
                      </label>
                      
                      <button 
                        className="menu-item"
                        onClick={() => {
                          setShowInput(true);
                          setIsViewerMode(false);
                          setShowActionMenu(false);
                        }}
                      >
                        <Settings size={16} />
                        <span>编辑JSON</span>
                      </button>
                      
                      <button 
                        className="menu-item"
                        onClick={() => {
                          copyToClipboard(JSON.stringify(parsedData, null, 2));
                          setShowActionMenu(false);
                        }}
                      >
                        <Copy size={16} />
                        <span>复制JSON</span>
                      </button>
                      
                      <button 
                        className="menu-item"
                        onClick={() => {
                          downloadJson();
                          setShowActionMenu(false);
                        }}
                      >
                        <Download size={16} />
                        <span>下载文件</span>
                      </button>
                      
                      <button 
                        className="menu-item danger"
                        onClick={() => {
                          handleClear();
                          setShowActionMenu(false);
                        }}
                      >
                        <Trash2 size={16} />
                        <span>清空重置</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="tree-container">
              {treeData.map((node) => renderTreeNode(node))}
            </div>
          </div>
        )}
      </div>

      {/* 右上角固定弹窗 */}
      {selectedNode && (
        <div 
          className="side-panel"
          style={{
            width: `${panelSize.width}px`,
            height: `${panelSize.height}px`,
          }}
        >
          {/* 左下角调整大小手柄 */}
          <div 
            className="resize-handle"
            onMouseDown={handleResizeStart}
            style={{ cursor: isResizing ? 'sw-resize' : 'sw-resize' }}
          />
          
          <div className="side-panel-header">
            <div className="side-panel-title">
              <span className={`type-badge type-${selectedNode.type}`}>
                {selectedNode.type}
              </span>
              <span className="node-path">
                {selectedNode.path.join('.') || 'root'} → {selectedNode.key}
              </span>
            </div>
            <button 
              className="close-btn"
              onClick={() => setSelectedNode(null)}
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="side-panel-body">
            <div className="value-container">
              <pre className="value-display">{selectedNode.displayValue}</pre>
              <button 
                className="copy-btn"
                onClick={() => copyToClipboard(selectedNode.displayValue)}
                title="复制值"
              >
                <Copy size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App; 