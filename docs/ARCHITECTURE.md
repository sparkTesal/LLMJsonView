# JSON Handle Project Analysis - Backend Developer Perspective

## Project Overview

A **JSON formatting and visualization tool**, similar to an online JSON parser service. Users can:
- Input JSON strings for validation and formatting
- View JSON data in tree structure
- Upload/download JSON files
- Copy and preview JSON nodes

## Architecture

### Tech Stack Comparison

| Frontend | Backend Analogy | Purpose |
|----------|-----------------|---------|
| React | Spring Framework | Application framework |
| TypeScript | Java | Type-safe language |
| Vite | Maven/Gradle | Build tool |
| CSS | Style config | UI customization |

## Data Model

### Core Interfaces

```typescript
// Similar to backend DTOs
interface TreeNode {
  key: string;           // Node key
  value: any;           // Node value
  type: string;         // Data type
  path: string[];       // Node path (like file path)
  isExpanded?: boolean; // Expand state (UI)
  children?: TreeNode[]; // Child nodes (recursive)
}

interface JsonError {
  message: string;      // Error message
  line?: number;       // Line number
  column?: number;     // Column number
}
```

## Core Flow

### 1. JSON Parse Flow

```
User Input → Validation → Parse to Object → Build Tree → UI Render
```

### 2. Key Methods

#### `validateAndParseJson()`
```typescript
// Acts as validator + parser service
const validateAndParseJson = (jsonString: string) => {
  try {
    const parsed = JSON.parse(jsonString);
    setParsedData(parsed);
    const tree = buildTreeData(parsed);
    setTreeData(tree);
  } catch (err) {
    setError(err);
  }
}
```

#### `buildTreeData()`
```typescript
// Recursively builds tree, similar to file system tree
const buildTreeData = (obj: any, path: string[] = []): TreeNode[] => {
  // Handle: object, array, string, number, boolean, null
  // Recursive nested structure
}
```

## UI Component Structure

```
App (root)
├── Header
├── Toolbar
├── InputSection
│   ├── textarea (JSON input)
│   └── ErrorMessage
├── TreeViewer
│   └── TreeNode (recursive)
└── SidePanel (detail panel)
```

## State Management

React Hooks for state, similar to backend in-memory cache:

```typescript
const [inputJson, setInputJson] = useState('');
const [parsedData, setParsedData] = useState(null);
const [treeData, setTreeData] = useState([]);
const [error, setError] = useState(null);
```

## File Structure

```
json_handle/
├── src/
│   ├── App.tsx          # Main component (Controller)
│   ├── App.css          # Styles
│   ├── main.tsx         # Entry (main method)
│   └── index.css        # Global styles
├── package.json         # Dependencies (pom.xml)
└── vite.config.ts       # Build config
```

## Quick Start for Developers

1. Check `package.json` for dependencies
2. Start from `main.tsx` for app bootstrap
3. Focus on state in `App.tsx`
4. Understand main business methods
5. Then review UI rendering logic

---

[中文版本 (Chinese)](ARCHITECTURE.zh-CN.md)
