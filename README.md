# LLM Json View

A web-based JSON viewer designed for exploring long LLM conversation messages with ease.

With **agentic AI** and **AI coding** booming, message payloads routinely reach tens or hundreds of thousands of tokens. Standard JSON viewers choke on these sizes. LLM Json View is built for exactly this: visualize, navigate, and extract from massive LLM API responses and conversation logs—without lag.

## Features

- **Tree View** - Navigate complex JSON structures with expandable tree visualization
- **Long String Support** - One-click copy for long text blocks (ideal for LLM responses)
- **JSON Formatting** - Beautify compressed JSON for readability
- **JSON Compression** - Compress formatted JSON to compact format
- **Smart Repair** - Auto-fix common JSON issues (trailing commas, single quotes, etc.)
- **Syntax Highlighting** - Color-coded display for different JSON element types
- **File Upload** - Support uploading JSON files for processing
- **Clipboard Integration** - Paste from clipboard or read directly (HTTPS)
- **Alfred Workflow** - One-key workflow to open and paste JSON on macOS
- **Responsive Design** - Works on mobile and desktop

## Tech Stack

- **React 18** - Modern UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool
- **Lucide React** - Icon library
- **jsonrepair** - Smart JSON repair

## Quick Start

### Development

```bash
# Clone the project
git clone <repository-url>
cd LLMJsonView

# Install dependencies
npm install

# Start dev server
npm run dev
```

### Production Build

```bash
npm run build
npm run preview
```

## Usage

1. **Input JSON** - Paste, type, or upload a JSON file (e.g., LLM API responses)
2. **Parse & View** - Click "Parse & View" to switch to tree view
3. **Explore** - Expand/collapse nodes, preview long strings in side panel
4. **Copy** - One-click copy for any node value (especially handy for long message content)

## Alfred Workflow (macOS)

For seamless integration with Alfred, see [alfred-workflow/INSTALLATION_GUIDE.md](alfred-workflow/INSTALLATION_GUIDE.md).

## Project Structure

```
src/
├── App.tsx          # Main app component
├── App.css          # App styles
├── i18n.ts          # i18n (en/zh)
├── main.tsx         # App entry
└── index.css        # Global styles
```

## Future Plans

- **Tree virtualization** - Virtual scroll for huge trees (100K+ nodes) to avoid lag
- **Search & filter** - Full-text search, filter by key/value, jump to path (e.g. `messages[0].content`)
- **LLM format detection** - Auto-detect OpenAI/Anthropic/Claude formats, highlight `role` (user/assistant/system)
- **Token count** - Approximate token count for common models (GPT-4, Claude, etc.)
- **JSON diff** - Side-by-side compare two JSON files (useful for LLM output versions)
- **Conversation flatten** - Extract messages into a readable timeline view
- **Browser extension** - Quick access from any page
- **VS Code extension** - View JSON in editor sidebar
- **Dark mode** - Theme toggle

## License

MIT License

## Contributing

Issues and Pull Requests are welcome!

---

[中文版本 (Chinese)](README.zh-CN.md)
