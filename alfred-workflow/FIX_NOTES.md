# Alfred Workflow Fix Notes

## Common Import Error

**Error**: `The workflow you are trying to import is invalid or corrupted.`

**Cause**: XML format issue - script in plist contains unescaped special chars like `&`, `>`, etc.

## Solutions

### Solution 1: Simplified Workflow (Recommended)

**Pros**:
- Avoids complex XML escaping
- Simple and reliable, paste in 2 seconds
- Supports any JSON size
- No extra permissions

**Script**:
```bash
#!/bin/bash

# Generate session ID
session_id=$(date +%s | tail -c 6)

# Open page
open "http://antnluservice1.inc.alipay.net/json_handle?trigger=alfred&session=$session_id"

# Wait for paste
sleep 2
osascript -e 'tell application "System Events" to keystroke "v" using command down'
```

### Solution 2: Use External Script

**Pros**:
- Permission checks
- Better error handling
- Detailed logging

**Usage**:
```bash
./paste_script.sh
```

## Verification

1. **Validate XML**:
   ```bash
   plutil -lint info.plist
   # Should output: info.plist: OK
   ```

2. **Check workflow file**:
   ```bash
   unzip -t "JSON Handle.alfredworkflow"
   # Should output: No errors detected
   ```

3. **Test workflow**:
   ```bash
   ./test_workflow.sh
   ```

## XML Escaping Rules

**Special chars**:
- `&` → `&amp;`
- `<` → `&lt;`
- `>` → `&gt;`

**Workarounds**:
1. Simplify script to avoid special chars
2. Move complex logic to external script
3. Use shell or AppleScript alternatives

## Session ID

**Simplified**:
```bash
session_id=$(date +%s | tail -c 6)  # 6 digits from timestamp
```

**Full version**:
```bash
session_id=$(uuidgen | cut -d'-' -f1 | tr 'A-Z' 'a-z')  # UUID
```

---

[中文版本 (Chinese)](FIX_NOTES.zh-CN.md)
