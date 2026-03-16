# JSON Handle Alfred Workflow

An Alfred workflow to quickly open the JSON Handle web app and auto-read clipboard content.

## Features

- Quick trigger: type `json` to launch
- Smart read: uses Clipboard API to read clipboard directly
- Direct open: opens JSON Handle in default browser
- Seamless flow: copy → open → read in one step
- No size limit: supports large JSON (MB level)
- Secure: sensitive data never appears in URL

## Technical Approach

### v2.0 - Clipboard API
- **Trigger**: URL param `?from=alfred`
- **Data**: Browser Clipboard API
- **Benefits**:
  - No URL length limit
  - Supports any JSON size (MB level)
  - More secure (data not in URL)
  - Faster (no encode/decode)
  - More reliable (avoids special chars)

### v1.0 - URL Params (Deprecated)
- **Issue**: URL length limit (IE/Chrome: 2,083 chars)
- **Limit**: Small JSON only
- **Status**: Not recommended

## Installation

### Method 1: Direct Import (Recommended)

1. Download `JSON Handle.alfredworkflow`
2. Double-click to import into Alfred
3. Confirm import

### Method 2: Manual Setup

1. Open Alfred Preferences
2. Go to "Workflows"
3. Click "+" → "Blank Workflow"
4. Fill in:
   - Name: `JSON Handle`
   - Description: `Open JSON Handle and auto-read clipboard`
   - Bundle Id: `com.jsonhandle.workflow`

5. Add trigger:
   - Right-click canvas → "Inputs" → "Keyword"
   - Keyword: `json`
   - Title: `JSON Handle`
   - Subtitle: `Open JSON Handle and auto-read clipboard`
   - Uncheck "with space"

6. Add script:
   - Right-click canvas → "Actions" → "Run Script"
   - Language: `/bin/bash`
   - Paste script (see FIX_NOTES.md for full script)

7. Connect trigger output to script input

## Usage

1. Copy JSON to clipboard
2. Press `Cmd + Space` (or your Alfred shortcut)
3. Type `json` and Enter
4. Browser opens JSON Handle and auto-reads clipboard

## System Requirements

- **macOS**: Any version with Alfred
- **Browser**: Chrome, Firefox, Safari, Edge
- **HTTPS**: Required for Clipboard API
- **Permissions**: Browser clipboard read permission

## Troubleshooting

### Workflow not responding
- Check Alfred clipboard permission
- Ensure `json` keyword has no conflict

### Page won't open
- Check network
- Verify URL

### Clipboard not read
- Ensure clipboard has content
- Grant browser clipboard permission
- Use HTTPS
- Check browser console for errors

### HTTP fallback
On HTTP, you can:
1. Click "Read Clipboard" on the page
2. Or paste JSON manually

---

[中文版本 (Chinese)](README.zh-CN.md) | [Installation Guide](INSTALLATION_GUIDE.md) | [Fix Notes](FIX_NOTES.md)
