# JSON Handle - JSON Formatting Tool

A modern JSON processing tool, similar to the Chrome extension json-handle, but provided as a web app for a more flexible experience.

## Features

- **JSON Formatting** - Beautify compressed JSON for readability
- **JSON Compression** - Compress formatted JSON to compact format
- **JSON Validation** - Real-time JSON syntax validation
- **Syntax Highlighting** - Color-coded display for different JSON element types
- **Tree View** - Structured tree visualization
- **File Upload** - Support uploading JSON files for processing
- **One-Click Copy** - Quick copy of processed results
- **File Download** - Save results as JSON files
- **Error Hints** - Detailed syntax error messages with position
- **Responsive Design** - Support for mobile and desktop

## Tech Stack

- **React 18** - Modern UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool
- **Lucide React** - Beautiful icon library
- **CSS3** - Modern styling

## Installation & Run

### Development

```bash
# Clone the project
git clone <repository-url>
cd json_handle

# Install dependencies
npm install

# Start dev server
npm run dev

# Or run in background (container/server)
conda activate agent_log
nohup npm run dev 2>&1 &

# Check background service
ps aux | grep vite

# View logs
tail -f vite.log

# Stop service
pkill -f vite
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage Guide

1. **Input JSON**
   - Paste or type JSON in the left text area
   - Or click "Upload File" to select a JSON file

2. **Real-time Validation**
   - Tool validates JSON syntax in real time
   - Validation status (valid/invalid) shown in the top right
   - Detailed error messages at the bottom if invalid

3. **Format Operations**
   - Click "Format" to beautify JSON
   - Click "Compress" to compress JSON

4. **View Results**
   - Right panel shows processed output
   - Switch to "Tree View" for better readability

5. **Export**
   - Click "Copy" to copy to clipboard
   - Click "Download" to save as file

## Project Structure

```
src/
├── App.tsx          # Main app component
├── App.css          # App styles
├── main.tsx         # App entry
└── index.css        # Global styles
```

## License

MIT License

## Contributing

Issues and Pull Requests are welcome!

---

[中文版本 (Chinese)](README.zh-CN.md)
