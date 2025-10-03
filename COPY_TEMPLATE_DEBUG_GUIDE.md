# Copy Template Debug Guide

## Issue Report (October 3, 2025)
User reported: "The JSON export in market analysis side does not work. It results in error 'Copy Failed'."

## Investigation Steps Taken

### 1. Initial Analysis
- Found that "Copy Template" button was missing from Import Data tab
- Added the button back to Import Data tab (line ~478)
- Button now calls `handleTemplateCopy` function

### 2. Function Analysis
**Location:** `src/components/market-analysis/modules/DataManagementModule.tsx` (lines 154-194)

**Function Flow:**
```typescript
handleTemplateCopy()
  ├─> Check selectedModules (default: ['market_sizing'])
  ├─> Generate template via generateModularTemplate() or use MarketAnalysisTemplate
  ├─> Call copyTextToClipboard(template)
  └─> Show success/error toast
```

### 3. Enhanced Error Logging
Added comprehensive console logging to identify the exact failure point:
- Logs selected modules
- Logs template generation success & length
- Logs copy result
- Shows actual error message in toast notification

## Potential Root Causes

### A. Template Generation Failure
**Function:** `generateModularTemplate()` in `MarketAnalysisTemplate.ts` (line 258)
- Parses MarketAnalysisTemplate using `JSON.parse()`
- Could fail if template string is malformed
- **Status:** Template file verified (17,835 chars, valid structure)

### B. Clipboard API Failure
**Function:** `copyTextToClipboard()` in `lib/clipboard-utils.ts`
- Uses modern Clipboard API
- Falls back to execCommand
- Falls back to manual instruction
- **Possible Issues:**
  - Not running in secure context (HTTPS required)
  - Browser permissions denied
  - Template string too large for clipboard

### C. Browser Context Issues
- **Secure Context Required:** Clipboard API only works over HTTPS or localhost
- **Permissions:** Some browsers require user gesture
- **Size Limits:** Large templates might exceed clipboard limits

## Testing Instructions

### To Reproduce the Issue:
1. Open http://localhost:8081/ in browser
2. Navigate to Market Analysis
3. Go to Data Management tab
4. Click "Import Data" tab
5. Click "Copy Template" button
6. **Check browser console** for detailed error logs

### Expected Console Output (Success):
```
Copy template clicked. Selected modules: ['market_sizing']
Template generated successfully, length: 12345
Copy result: { success: true, method: 'clipboard-api' }
```

### Expected Console Output (Failure):
```
Copy template clicked. Selected modules: ['market_sizing']
Failed to copy template - full error: [Error details]
```

## Quick Fixes to Try

### Fix 1: Use Full Template (No Module Selection)
If `generateModularTemplate()` is failing, bypass it:
```typescript
// In handleTemplateCopy, replace:
const template = selectedModules.length > 0 
  ? generateModularTemplate(selectedModules)
  : MarketAnalysisTemplate;

// With:
const template = MarketAnalysisTemplate;
```

### Fix 2: Add Try-Catch Around Template Generation
```typescript
let template;
try {
  template = selectedModules.length > 0 
    ? generateModularTemplate(selectedModules)
    : MarketAnalysisTemplate;
} catch (genError) {
  console.error('Template generation failed:', genError);
  template = MarketAnalysisTemplate; // Fallback to full template
}
```

### Fix 3: Check Clipboard Permissions
Add permission check before copying:
```typescript
if ('permissions' in navigator) {
  const permission = await navigator.permissions.query({ name: 'clipboard-write' as PermissionName });
  console.log('Clipboard permission:', permission.state);
}
```

## Solution Implemented

### Enhanced Error Handling
Added detailed logging to `handleTemplateCopy` function to capture:
- Selected modules state
- Template generation success
- Copy operation result
- Full error details in toast message

### User-Friendly Error Messages
Changed error toast to show actual error message:
```typescript
toast({
  title: "Copy Failed",
  description: `Error: ${errorMessage}. Please try again or manually copy the template.`,
  variant: "destructive",
});
```

## Next Steps

1. **Test in Browser:** Open dev tools console and click "Copy Template"
2. **Check Console Logs:** Look for the detailed error information
3. **Verify Context:** Ensure running on localhost (secure context)
4. **Try Different Browsers:** Test in Chrome, Firefox, Edge
5. **Check Template Size:** Verify template isn't too large for clipboard

## Files Modified

1. `src/components/market-analysis/modules/DataManagementModule.tsx`
   - Added Copy Template button to Import Data tab
   - Enhanced error logging in handleTemplateCopy
   - Improved error messages

2. `COPY_TEMPLATE_FIX_SUMMARY.md`
   - Updated with critical fix information

3. `COPY_TEMPLATE_DEBUG_GUIDE.md` (this file)
   - Created comprehensive debugging guide

## Alternative Workarounds

If clipboard copy continues to fail:

### Workaround 1: Show Template in TextArea
Add a "Show Template" option that displays the template in a textarea for manual copying.

### Workaround 2: Download Template
Add a "Download Template" button that downloads the template as a JSON file:
```typescript
const handleTemplateDownload = () => {
  const template = generateModularTemplate(selectedModules);
  const blob = new Blob([template], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'market-analysis-template.json';
  a.click();
  URL.revokeObjectURL(url);
};
```

### Workaround 3: Use Template & Guide Tab
Users can still access copy functionality from the "Template & Guide" tab which has always worked.
