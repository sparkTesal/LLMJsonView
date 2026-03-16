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
  Unlink,
  Globe
} from 'lucide-react';
import { jsonrepair } from 'jsonrepair';
import unescapeJs from 'unescape-js';
import { translations, getFixDescription, type Locale } from './i18n';
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
  fixKey?: string; // for i18n: 'smart' | 'combined'
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
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = localStorage.getItem('llm-json-view-locale');
    return (saved === 'zh' || saved === 'en') ? saved : 'en';
  });
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);

  const t = translations[locale];
  const toggleLocale = () => {
    const next: Locale = locale === 'en' ? 'zh' : 'en';
    setLocale(next);
    localStorage.setItem('llm-json-view-locale', next);
  };

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
        document.title = `LLM Json View - ${sessionId}`;
        
        // 延迟一点确保标题设置完成
        setTimeout(() => {
          // 聚焦到输入框准备接收粘贴
          const textarea = document.querySelector('.json-input') as HTMLTextAreaElement;
          if (textarea) {
            textarea.focus();
            
            // 检查会话ID长度来判断是简化版还是完整版
            if (sessionId.length <= 6) {
              // 简化版：只聚焦，不监听粘贴事件，等待Alfred自动粘贴
              setCopyFeedback({show: true, message: t.readyForPaste});
              
              // 监听粘贴事件仅用于显示反馈
              const handleSimplePaste = (e: ClipboardEvent) => {
                const pastedText = e.clipboardData?.getData('text');
                if (pastedText) {
                  // 不阻止默认行为，让粘贴正常进行
                  setTimeout(() => {
                    handleInputChange(pastedText, true);
                    setCopyFeedback({show: true, message: t.clipboardPasted});
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
              setCopyFeedback({show: true, message: t.readyForPaste});
              
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
  }, [locale]);

  // 读取剪贴板内容
  const handleReadClipboard = async (isAutomatic = false) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        const clipboardText = await navigator.clipboard.readText();
        
        if (clipboardText.trim()) {
          setInputJson(clipboardText);
          handleInputChange(clipboardText, true);
          
          const message = isAutomatic ? t.clipboardReadAuto : t.clipboardRead;
          setCopyFeedback({show: true, message});
          setTimeout(() => {
            setCopyFeedback({show: false, message: ''});
          }, 3000);
        } else {
          setCopyFeedback({show: true, message: t.clipboardEmpty});
          setTimeout(() => {
            setCopyFeedback({show: false, message: ''});
          }, 2000);
        }
      } else {
        setCopyFeedback({show: true, message: t.clipboardNotSupported});
        setTimeout(() => {
          setCopyFeedback({show: false, message: ''});
        }, 3000);
      }
    } catch (error) {
      console.error('读取剪贴板失败:', error);
      setCopyFeedback({show: true, message: t.clipboardReadFailed});
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
            description: 'fixCombined',
            fixedJson: combinedFix,
            confidence: 'medium',
            fixKey: 'combined'
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
          description: 'fixSmart',
          fixedJson: repaired,
          confidence: 'high',
          fixKey: 'smart'
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
      const errorMessage = err instanceof Error ? err.message : t.unknownError;
      
      // 尝试提取行号和列号
      const match = errorMessage.match(/position (\d+)|line (\d+)|column (\d+)/i);
      const position = match ? parseInt(match[1] || match[2] || match[3]) : undefined;
      
      // 尝试自动修复
      const suggestions = attemptJsonFix(jsonString);
      
      setError({
        message: errorMessage,
        line: position,
        fixSuggestion: suggestions.length > 0 ? t.fixSuggestionsFound(suggestions.length) : undefined
      });
      setIsValid(false);
      setParsedData(null);
      setTreeData([]);
      setFixSuggestions(suggestions);
      setShowFixSuggestions(suggestions.length > 0);
    }
  }, [buildTreeData, attemptJsonFix, t]);

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
    setCopyFeedback({show: true, message: `${t.fixApplied}: ${getFixDescription(locale, suggestion.type, suggestion.fixKey)}`});
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
      setCopyFeedback({show: true, message: t.copiedToClipboard});
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
      setCopyFeedback({show: true, message: t.copyFailed});
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
      setCopyFeedback({show: true, message: t.jsonFormatted});
      setTimeout(() => {
        setCopyFeedback({show: false, message: ''});
      }, 2000);
    } catch (err) {
      setCopyFeedback({show: true, message: t.formatFailed});
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
      setCopyFeedback({show: true, message: t.jsonCompressed});
      setTimeout(() => {
        setCopyFeedback({show: false, message: ''});
      }, 2000);
    } catch (err) {
      setCopyFeedback({show: true, message: t.compressFailed});
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
    setCopyFeedback({show: true, message: t.stringEscaped});
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
      setCopyFeedback({show: true, message: t.stringUnescaped});
      setTimeout(() => {
        setCopyFeedback({show: false, message: ''});
      }, 2000);
    } catch (err) {
      setCopyFeedback({show: true, message: t.unescapeFailed});
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
                title={allChildrenExpanded ? t.collapseAll : t.expandAll}
              >
                {allChildrenExpanded ? <ChevronsRight size={12} /> : <ChevronsDown size={12} />}
              </button>
            )}
            
            {/* 预览按钮 - 悬停时显示 */}
            <button 
              className="preview-btn"
              onClick={handlePreview}
              title={t.preview}
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
                    title={isStringCopied ? t.copied : t.copyString}
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
              <h2>🔐 {t.permissionTitle}</h2>
              <button 
                className="close-btn"
                onClick={() => setShowPermissionGuide(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="permission-guide-content">
              <div className="guide-section">
                <h3>📋 {t.permissionWhy}</h3>
                <p>{t.permissionWhyDesc}</p>
              </div>
              
              <div className="guide-section">
                <h3>⚙️ {t.permissionSteps}</h3>
                <ol className="setup-steps">
                  <li>
                    <strong>{t.permissionStep1}</strong>
                    <p>{t.permissionStep1Desc}</p>
                  </li>
                  <li>
                    <strong>{t.permissionStep2}</strong>
                    <p>{t.permissionStep2Desc}</p>
                  </li>
                  <li>
                    <strong>{t.permissionStep3}</strong>
                    <p>{t.permissionStep3Desc}</p>
                  </li>
                  <li>
                    <strong>{t.permissionStep4}</strong>
                    <p>{t.permissionStep4Desc}</p>
                  </li>
                  <li>
                    <strong>{t.permissionStep5}</strong>
                    <p>{t.permissionStep5Desc}</p>
                  </li>
                  <li>
                    <strong>{t.permissionStep6}</strong>
                    <p>{t.permissionStep6Desc}</p>
                  </li>
                </ol>
              </div>
              
              <div className="guide-section">
                <h3>🚀 {t.permissionDone}</h3>
                <p>{t.permissionDoneDesc}</p>
                <ul className="feature-list">
                  <li>✅ {t.permissionItem1}</li>
                  <li>✅ {t.permissionItem2}</li>
                  <li>✅ {t.permissionItem3}</li>
                  <li>✅ {t.permissionItem4}</li>
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
                  🔧 {t.openSystemPrefs}
                </button>
                
                <button 
                  className="secondary-btn"
                  onClick={() => {
                    setShowPermissionGuide(false);
                    setCopyFeedback({show: true, message: t.pasteLater});
                    setTimeout(() => {
                      setCopyFeedback({show: false, message: ''});
                    }, 3000);
                  }}
                >
                  {t.setLater}
                </button>
              </div>
              
              <div className="guide-note">
                <p><strong>💡 </strong>{t.permissionTip}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 正常模式的标题和工具栏 */}
      {!isViewerMode && (
        <>
          <header className="header">
            <h1>{t.appName}</h1>
            <p>{t.appSubtitle}</p>
          </header>

          <div className="toolbar">
            <div className="toolbar-left">
              <label className="file-upload">
                <Upload size={16} />
                {t.uploadFile}
                <input type="file" accept=".json,.txt" onChange={handleFileUpload} />
              </label>
              
              {showClipboardButton && (
                <button 
                  className="toolbar-btn clipboard-btn"
                  onClick={() => handleReadClipboard(false)}
                  title={t.readClipboard}
                >
                  <Copy size={16} />
                  {t.readClipboard}
                </button>
              )}
              
              {!showInput && (
                <button className="toolbar-btn" onClick={() => setShowInput(true)}>
                  {t.editJson}
                </button>
              )}
            </div>

            <div className="toolbar-center">
              <div className="toolbar-title">{t.appName}</div>
              <div className="toolbar-subtitle">{t.appSubtitle}</div>
            </div>

            <div className="toolbar-right">
              <button 
                className="toolbar-btn lang-toggle"
                onClick={toggleLocale}
                title={locale === 'en' ? '中文' : 'English'}
              >
                <Globe size={16} />
                <span>{locale === 'en' ? '中文' : 'EN'}</span>
              </button>
              
              <button 
                className="toolbar-btn"
                onClick={formatJson}
                disabled={!inputJson.trim()}
                title={t.format}
              >
                <Expand size={14} />
                {t.format}
              </button>
              
              <button 
                className="toolbar-btn"
                onClick={compressJson}
                disabled={!inputJson.trim()}
                title={t.compress}
              >
                <Minimize size={14} />
                {t.compress}
              </button>
              
              <button 
                className="toolbar-btn"
                onClick={escapeJson}
                disabled={!inputJson.trim()}
                title={t.escape}
              >
                <Quote size={14} />
                {t.escape}
              </button>
              
              <button 
                className="toolbar-btn"
                onClick={unescapeJson}
                disabled={!inputJson.trim()}
                title={t.unescape}
              >
                <Unlink size={14} />
                {t.unescape}
              </button>
            </div>
          </div>
        </>
      )}

      <div className={`main-content ${isViewerMode ? 'viewer-mode' : ''}`}>
        {showInput && (
          <div className="input-section">
            <div className="input-header">
              <h3>{t.inputJson}</h3>
              <div className="input-actions">
                {isValid === true && <span className="status-valid">✓ {t.validJson}</span>}
                {isValid === false && <span className="status-invalid">✗ {t.invalidJson}</span>}
                <button 
                  className="parse-btn"
                  onClick={handleSubmit}
                  disabled={!isValid}
                >
                  {t.parseAndView}
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
              placeholder={t.placeholder}
              spellCheck={false}
            />
            
            {error && (
              <div className="error-message">
                <div className="error-info">
                  <AlertTriangle size={16} />
                  <span>{error.message}</span>
                  {error.line && <span>{t.position}: {error.line}</span>}
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
                        {showFixSuggestions ? t.hideFixSuggestions : t.showFixSuggestions}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {showFixSuggestions && fixSuggestions.length > 0 && (
              <div className="fix-suggestions">
                <h4>{t.fixSuggestions}</h4>
                {fixSuggestions.map((suggestion, index) => (
                  <div key={index} className={`fix-suggestion ${suggestion.confidence}`}>
                    <div className="fix-header">
                      <span className="fix-description">{getFixDescription(locale, suggestion.type, suggestion.fixKey)}</span>
                      <span className={`fix-confidence ${suggestion.confidence}`}>
                        {suggestion.confidence === 'high' ? t.high : suggestion.confidence === 'medium' ? t.medium : t.low} {t.confidence}
                      </span>
                    </div>
                    <div className="fix-actions">
                      <button 
                        className="apply-fix-btn"
                        onClick={() => applyFixSuggestion(suggestion)}
                      >
                        <Wrench size={14} />
                        {t.applyFix}
                      </button>
                      <button 
                        className="preview-fix-btn"
                        onClick={() => copyToClipboard(suggestion.fixedJson)}
                        title={t.copyRepairedJson}
                      >
                        <Copy size={14} />
                        {t.copy}
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
                title={t.backToEdit}
              >
                <ArrowLeft size={18} />
              </button>
            </div>

            {/* 全屏模式下的固定操作栏 */}
            {isViewerMode && (
              <div className="control-panel">
                <button 
                  className="control-icon-btn lang-toggle"
                  onClick={toggleLocale}
                  title={locale === 'en' ? '中文' : 'English'}
                >
                  <Globe size={18} />
                  <span>{locale === 'en' ? '中文' : 'EN'}</span>
                </button>
                <div className="control-menu">
                  <button 
                    className="control-icon-btn menu-trigger"
                    onClick={() => setShowActionMenu(!showActionMenu)}
                    title={t.moreActions}
                  >
                    <MoreVertical size={18} />
                  </button>
                  
                  {showActionMenu && (
                    <div className="action-menu">
                      <label className="menu-item file-upload-menu">
                        <Upload size={16} />
                        <span>{t.uploadFileMenu}</span>
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
                        <span>{t.editJsonMenu}</span>
                      </button>
                      
                      <button 
                        className="menu-item"
                        onClick={() => {
                          copyToClipboard(JSON.stringify(parsedData, null, 2));
                          setShowActionMenu(false);
                        }}
                      >
                        <Copy size={16} />
                        <span>{t.copyJson}</span>
                      </button>
                      
                      <button 
                        className="menu-item"
                        onClick={() => {
                          downloadJson();
                          setShowActionMenu(false);
                        }}
                      >
                        <Download size={16} />
                        <span>{t.downloadFile}</span>
                      </button>
                      
                      <button 
                        className="menu-item danger"
                        onClick={() => {
                          handleClear();
                          setShowActionMenu(false);
                        }}
                      >
                        <Trash2 size={16} />
                        <span>{t.clearReset}</span>
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
                title={t.copyValue}
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