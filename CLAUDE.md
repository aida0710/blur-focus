# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Blur Focus is a Chrome extension (compatible with Chromium-based browsers) that blurs all text on a webpage except for the text currently being hovered over. This helps users maintain focus while reading documentation by preventing text from "sliding away" visually.

The extension:
- Blurs all specified text elements (h1-h6, p, a, span, ul, li, label, code) by default when enabled
- Removes blur on mouseover, both for the element and its children
- Re-applies blur on mouseout
- Uses Chrome's storage API to persist the blur state
- Requires page reload after toggling the blur state

**Known Limitation**: Does not support dynamically generated elements or elements without specified tags.

## Important Notes

### Page Reload Requirement
**Critical**: After toggling the blur state in the popup, you MUST reload the page for changes to take effect. The popup includes a "Pageをリロード" button that calls `chrome.tabs.reload()` for this purpose.

### Development Reload Workflow
When modifying code:
1. **Content script changes** (`src/content_script.tsx`):
   - Rebuild: `npm run build` or let `npm run watch` auto-rebuild
   - Reload extension: Go to `chrome://extensions/` and click reload icon
   - Reload the target webpage
2. **Popup changes** (`src/popup.tsx`):
   - Rebuild
   - Reload extension
   - Close and reopen the popup
3. **Background script changes** (`src/background.ts`):
   - Rebuild
   - Reload extension

### Target Elements Configuration
Blur effects are applied only to elements matching the selector defined in `src/content_script.tsx:3`:
```typescript
'h1,h2,h3,h4,h5,h6,p,a,span,ul,li,label,code'
```
To support additional element types, modify this selector string.

### UI Language
The extension UI is in Japanese. Key UI text:
- "Blurを掛ける" = Enable blur
- "Blurを無くす" = Disable blur
- "Pageをリロード" = Reload page
- "※ ページをリロードする必要があります。" = Page reload required

## Development Commands

### Build and Development
```bash
# Development mode with file watching
npm run watch

# Production build (cleans dist and rebuilds)
npm run build

# Clean dist directory
npm run clean
```

### Testing and Formatting
```bash
# Run Jest tests
npm test

# Format TypeScript/TSX files with Prettier
npm run style
```

### Loading Extension in Browser
1. Search for `chrome://extensions/` (Chrome) or `edge://extensions/` (Edge/Chromium browsers)
2. Enable "Developer mode"
3. Click "Load unpacked extension"
4. Select the `blur-focus/dist` folder

## Debugging

### Popup Debugging
1. Right-click the extension icon in the browser toolbar
2. Select "Inspect popup" (Chrome) or equivalent
3. DevTools will open for the popup page
4. Console logs from `src/popup.tsx` appear here

### Content Script Debugging
1. Open DevTools on the webpage where the extension is running (F12)
2. Content script runs in the page context
3. Check the Console tab for any errors
4. Use `Elements` tab to inspect applied `filter: blur(5px)` styles

### Background Script Debugging
1. Go to `chrome://extensions/`
2. Find "Blur Focus" extension
3. Click "Service Worker" link to inspect background script
4. Note: Current background.ts only implements polling, minimal functionality

## Architecture

### Extension Entry Points

The extension has three main entry points configured in `webpack/webpack.common.js`:

1. **popup.tsx** - React-based popup UI for toggling blur state
2. **content_script.tsx** - Injected into all pages to apply blur effects
3. **background.ts** - Service worker (minimal implementation, only polling)

### Build System

- **Webpack** bundles TypeScript/TSX into `dist/js/`
- **Code splitting**: `vendor.js` contains shared dependencies for popup and content_script
  - Background script is excluded from vendor bundle (see `webpack.common.js:20`)
  - This prevents unnecessary React/ReactDOM from loading in the service worker
- **CopyPlugin** copies files from `public/` to `dist/` (includes manifest.json, popup.html, images)
- TypeScript compiles with strict mode, targeting ES6, `moduleResolution: bundler`
- **Development mode** (`npm run watch`): Enables `inline-source-map` for debugging
- **Production mode** (`npm run build`): No source maps, optimized build

### State Management

State is managed via Chrome's `chrome.storage.local` API:
- Key: `isBlur` (boolean)
- popup.tsx reads/writes the state
- content_script.tsx reads the state on page load to determine if blur should be applied

### Content Script Flow

1. On load, reads `isBlur` from Chrome storage
2. If enabled, queries all target elements (`h1,h2,h3,h4,h5,h6,p,a,span,ul,li,label,code`)
3. Applies `filter: blur(5px)` to each element
4. Attaches mouseover/mouseout event listeners to toggle blur
5. Event handlers also manage blur for child elements

### Popup UI Flow

1. React component reads initial blur state from storage using `useEffect` hook
2. Toggle button updates both local state (`setIsBlur`) and Chrome storage
3. Reload button calls `chrome.tabs.reload()` to apply changes
4. Settings section exists but is marked as unimplemented ("※ 未実装機能です。")
5. React is mounted using `createRoot(document.getElementById("root")!)` (React 18 API)
6. popup.html loads `js/vendor.js` first, then `js/popup.js`

## Project Structure

```
src/
├── popup.tsx           - React popup UI component
├── content_script.tsx  - Blur logic injected into pages
└── background.ts       - Service worker (minimal)

public/
├── manifest.json       - Extension manifest (MV3)
├── popup.html          - Popup HTML template
└── images/             - Extension icons

webpack/
├── webpack.common.js   - Shared webpack config
├── webpack.dev.js      - Development config
└── webpack.prod.js     - Production config

dist/                   - Built extension (generated)
```

## Extension Permissions

Defined in `public/manifest.json`:
- `storage` - Required for persisting blur state
- `host_permissions: <all_urls>` - Required for content script injection on all pages

## Testing

Jest is configured with `ts-jest` transformer. Test files should be placed in `src/` directory (as specified in `jest.config.js` roots configuration).

**Configuration differences**:
- `tsconfig.json`: `moduleResolution: bundler` (for webpack)
- `tsconfig.test.json`: `moduleResolution: node` (extends main config, overrides for Jest compatibility)
