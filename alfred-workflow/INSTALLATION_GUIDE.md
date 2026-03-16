# JSON Handle Alfred Workflow - Installation Guide

## Overview

This Alfred workflow enables fully automated JSON processing under HTTP. It uses permission checks, session IDs, and auto-paste to provide a seamless experience.

## Features

- **Fully automated**: One-step flow under HTTP
- **Permission management**: Auto-detect and guide user setup
- **Session ID**: Unique ID for each operation
- **Accurate paste**: Waits for page load before pasting
- **No size limit**: Supports large JSON (MB level)
- **Secure**: Data not transmitted, local processing

## Installation Steps

### Step 1: Install Alfred Workflow

1. **Get workflow file**
   - Locate `JSON Handle.alfredworkflow`

2. **Import**
   - Double-click `.alfredworkflow`
   - Alfred opens import dialog
   - Click **"Import"** to confirm

3. **Verify**
   - `Cmd + Space` in Alfred
   - Type `json` - "JSON Handle" should appear

### Step 2: Set Accessibility Permission (Required)

**Why**: Auto-paste needs to simulate keyboard input, so Alfred needs Accessibility permission.

**Setup**:
1. Open **System Preferences**
2. Go to **Security & Privacy**
3. Select **Privacy** tab
4. Find **Accessibility** in the list
5. Add Alfred: click lock, click "+", select Alfred, ensure checkbox is checked

**Auto prompt**: If not set, workflow will:
- Open permission page
- Redirect to System Preferences
- Show setup instructions

### Step 3: Test Workflow

```bash
cd alfred-workflow
./test_workflow.sh
```

Test script will:
- Check permission status
- Generate sample JSON
- Simulate auto-paste
- Verify functionality

## Usage

### Fully Automated Flow

1. **Copy JSON**
   ```bash
   curl -s "https://api.example.com/data" | pbcopy
   ```

2. **Trigger**
   - `Cmd + Space` → type `json` → Enter

3. **Auto complete**
   - Browser opens
   - Page loads with session ID
   - Input auto-focuses
   - Content auto-pastes
   - JSON auto-parses

**Total time: 1-2 seconds**

## Troubleshooting

### Issue 1: Permission Error

**Symptom**: Redirects to permission page

**Fix**:
1. Follow accessibility setup above
2. Restart Alfred
3. Re-run test workflow

### Issue 2: Auto-paste Fails

**Symptom**: Page opens but no paste

**Causes**:
- Page load too slow
- Focus not correct
- Wrong browser active

**Fix**:
1. Increase delay in script
2. Manually focus input
3. Ensure default browser is correct

### Issue 3: Session ID Timeout

**Symptom**: Operation times out

**Fix**:
1. Ensure page loads completely
2. Check if JavaScript is blocked
3. Try manual refresh

### Issue 4: Large JSON Fails

**Symptom**: Paste incomplete for large JSON

**Optimization**:
1. Increase paste delay
2. Try compressed JSON
3. Consider splitting large JSON

## System Requirements

- **macOS**: 10.14+ (Accessibility API)
- **Alfred**: 4.0+
- **Browser**: Chrome, Safari, Firefox, Edge
- **Memory**: 8GB+ for large JSON

---

[中文版本 (Chinese)](INSTALLATION_GUIDE.zh-CN.md)
