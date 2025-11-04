# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Blur Focus is a Chrome extension (compatible with Chromium-based browsers) that blurs all text on a webpage except for the text currently being hovered over. This helps users maintain focus while reading documentation by preventing text from "sliding away" visually.

**Version 2.0+ Features:**
- ✅ **Real-time updates** - No page reload required after toggling blur state
- ✅ **Customizable blur intensity** - Adjustable from 2px to 15px
- ✅ **Element type selection** - Choose which HTML elements to blur
- ✅ **Per-site configuration** - Enable/disable blur for specific websites
- ✅ **Keyboard shortcuts** - `Ctrl+Shift+F` (Mac: `⌘+Shift+F`) to toggle
- ✅ **Dynamic element support** - Automatically handles dynamically added elements (SPAs)
- ✅ **Performance optimized** - Event delegation and efficient DOM handling

## Important Notes

### No Page Reload Required (v2.0+)
**Key Change**: Changes now take effect **immediately** without requiring a page reload. This is achieved through Chrome Message Passing between the popup and content script.

### Development Reload Workflow
When modifying code:
1. **Content script changes** (`src/content_script.tsx`):
   - Rebuild: `npm run build` or let `npm run watch` auto-rebuild
   - Reload extension: Go to `chrome://extensions/` and click reload icon
   - Changes apply immediately to new page loads

2. **Popup changes** (`src/popup.tsx`, `src/components/SettingsPanel.tsx`):
   - Rebuild
   - Reload extension
   - Close and reopen the popup

3. **No background script** - Removed in v2.0 for resource efficiency

### Target Elements Configuration
Default target elements are defined in `src/types.ts`:
```typescript
targetElements: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'span', 'ul', 'li', 'label', 'code']
```
Users can customize this via the settings panel.

### UI Language
The extension UI is in Japanese. Key UI text:
- "ブラーを有効にする" = Enable blur
- "ブラーを無効にする" = Disable blur
- "設定を開く" = Open settings
- "変更は即座に反映されます" = Changes apply immediately

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

### Code Quality
```bash
# Run ESLint
npm run lint

# Auto-fix ESLint issues
npm run lint:fix

# TypeScript type check
npm run type-check

# Run Jest tests (passes even without tests)
npm test

# Format TypeScript/TSX files with Prettier
npm run style
```

### Loading Extension in Browser
1. Navigate to `chrome://extensions/` (Chrome) or `edge://extensions/` (Edge/Chromium browsers)
2. Enable "Developer mode"
3. Click "Load unpacked extension"
4. Select the `blur-focus/dist` folder

## Debugging

### Popup Debugging
1. Right-click the extension icon in the browser toolbar
2. Select "Inspect popup" (Chrome) or equivalent
3. DevTools will open for the popup page
4. Console logs from `src/popup.tsx` and `src/components/SettingsPanel.tsx` appear here

### Content Script Debugging
1. Open DevTools on the webpage where the extension is running (F12)
2. Content script runs in the page context
3. Check the Console tab for `[Blur Focus]` prefixed logs
4. Use `Elements` tab to inspect:
   - `.blur-focus-element` class on target elements
   - `.blur-focus-hover` class on hovered elements
   - `filter: blur(Xpx)` CSS property
   - Injected `<style id="blur-focus-styles">` in `<head>`

## Architecture

### Extension Entry Points

The extension has **two** main entry points (as of v2.0):

1. **popup.tsx** - React-based popup UI for toggling blur state and settings
2. **content_script.tsx** - Injected into all pages to apply blur effects

**Note**: `background.ts` was removed in v2.0 as it was unnecessary for the extension's functionality.

### Build System

- **Webpack** bundles TypeScript/TSX into `dist/js/`
- **Code splitting**: `vendor.js` contains shared dependencies (React, ReactDOM)
  - Only used by popup (content script is standalone)
- **CopyPlugin** copies files from `public/` to `dist/` (manifest.json, popup.html, images)
- **CSS Loader** handles `src/styles/popup.css` and injects into popup
- TypeScript compiles with strict mode, targeting ES6, `moduleResolution: bundler`
- **Development mode** (`npm run watch`): Enables `inline-source-map` for debugging
- **Production mode** (`npm run build`): No source maps, optimized build

### State Management

State is managed via Chrome's `chrome.storage.local` API with the following structure:

```typescript
interface BlurSettings {
  isBlur: boolean;              // Main toggle
  blurIntensity: number;        // 2-15px
  targetElements: string[];     // Array of element selectors
  siteList: SiteRule[];         // Per-site rules
}

interface SiteRule {
  pattern: string;              // URL pattern (e.g., "example.com")
  enabled: boolean;             // Enable blur for this pattern
}
```

Both `popup.tsx` and `content_script.tsx` read/write to storage. Changes are propagated via Chrome Message Passing.

### Content Script Flow (v2.0+)

**Initialization:**
1. Load settings from `chrome.storage.local`
2. Check if current site is enabled (via `siteList`)
3. If enabled, inject CSS styles dynamically
4. Apply `.blur-focus-element` class to all target elements
5. Set up event delegation on `document`
6. Start MutationObserver to watch for new elements

**Event Handling (Event Delegation):**
- Single `mouseover` listener on `document`
- Single `mouseout` listener on `document`
- On hover: Find closest `.blur-focus-element` and add `.blur-focus-hover` class to it and all ancestor blur elements
- On unhover: Remove `.blur-focus-hover` class from element and ancestors

**Message Passing:**
- Listens for `toggleBlur` and `updateSettings` messages from popup
- Updates internal state and re-applies blur without page reload

**Dynamic Elements (MutationObserver):**
- Watches for `childList` and `subtree` changes
- Automatically applies `.blur-focus-element` to newly added elements matching `targetElements`

### Popup UI Flow (v2.0+)

**Initialization:**
1. React component reads initial blur state from storage using `useEffect` hook
2. Displays current state and settings UI

**Toggle Blur:**
1. User clicks toggle button
2. Update local state with `setIsBlur`
3. Save to `chrome.storage.local`
4. Send message to content script via `chrome.tabs.sendMessage`
5. Content script receives message and updates immediately

**Settings Panel:**
1. User opens settings (accordion style)
2. Three tabs: Intensity, Elements, Sites
3. Changes are saved to storage and sent to content script in real-time
4. No reload required

**Error Handling:**
- All `chrome.storage` and `chrome.tabs` API calls have proper error handling
- Errors are logged with `[Blur Focus]` prefix
- User-friendly error messages displayed in popup

### Performance Optimizations

**v1.0 Issues:**
- ❌ Attached individual event listeners to every element (N×2 listeners)
- ❌ Called `querySelectorAll('*')` on every mouseout
- ❌ No support for dynamic elements

**v2.0 Improvements:**
- ✅ **Event Delegation**: Only 2 listeners total (mouseover/mouseout on document)
- ✅ **CSS Classes**: Use `.blur-focus-element` and `.blur-focus-hover` classes instead of inline styles
- ✅ **CSS Transitions**: Smooth 0.2s transitions instead of instant changes
- ✅ **MutationObserver**: Efficiently handles dynamic elements
- ✅ **Ancestor Handling**: Properly removes blur from parent elements when hovering child links

## Project Structure

```
src/
├── components/
│   └── SettingsPanel.tsx        # Settings UI component (tabs, sliders, inputs)
├── styles/
│   └── popup.css                # Popup and settings styles
├── types.ts                     # TypeScript type definitions
├── popup.tsx                    # Main popup UI component
└── content_script.tsx           # Content script with BlurFocusManager class

public/
├── manifest.json                # Extension manifest (MV3, no background)
├── popup.html                   # Popup HTML template
└── images/                      # Extension icons

.github/workflows/
├── ci.yml                       # Lint + Type-check + Test on all branches
└── release.yml                  # Build + Release on master (version change only)

webpack/
├── webpack.common.js            # Shared webpack config (no background entry)
├── webpack.dev.js               # Development config
└── webpack.prod.js              # Production config

dist/                            # Built extension (generated)
├── js/
│   ├── vendor.js                # React + ReactDOM (popup only)
│   ├── popup.js                 # Popup bundle
│   └── content_script.js        # Content script bundle
├── manifest.json
├── popup.html
└── images/
```

## Extension Permissions

Defined in `public/manifest.json`:
- `storage` - Required for persisting settings
- `activeTab` - Required for sending messages to current tab
- `tabs` - Required for `chrome.tabs.query` and `chrome.tabs.sendMessage`
- `host_permissions: <all_urls>` - Required for content script injection on all pages

**Keyboard Commands:**
- `_execute_action` with `Ctrl+Shift+F` / `Command+Shift+F` - Opens popup (native Chrome behavior)
- Content script also listens for `Ctrl+Shift+F` to toggle blur without opening popup

## Testing

Jest is configured with `ts-jest` transformer and `--passWithNoTests` flag.

**Running tests:**
```bash
npm test  # Runs Jest (exits with code 0 even if no tests found)
```

**Configuration differences:**
- `tsconfig.json`: `moduleResolution: bundler` (for webpack)
- `tsconfig.test.json`: `moduleResolution: node` (extends main config, overrides for Jest compatibility)

## CI/CD (GitHub Actions)

### CI Workflow (`.github/workflows/ci.yml`)
**Triggers:** All branches and pull requests

**Steps:**
1. Checkout code
2. Setup Node.js 22 with npm cache
3. Install dependencies (`npm ci`)
4. Run ESLint (`npm run lint`)
5. Run TypeScript type check (`npm run type-check`)
6. Run tests (`npm test`)

### Release Workflow (`.github/workflows/release.yml`)
**Triggers:** Push to `master` branch

**Permissions:** `contents: write` (for creating releases)

**Steps:**
1. **Check Version Change:**
   - Compare `package.json` version with previous commit
   - If unchanged, skip release

2. **Build and Release** (only if version changed):
   - Run full CI checks (lint, type-check, test)
   - Build extension (`npm run build`)
   - Create ZIP file (`blur-focus-vX.X.X.zip`)
   - Create GitHub Release with:
     - Tag: `vX.X.X`
     - Release notes (commit message, file size)
     - Attached ZIP file

**To create a release:**
1. Update `version` in `package.json` (e.g., `2.0.0` → `2.0.1`)
2. Commit and push to master
3. GitHub Actions automatically creates the release

## Code Style and Patterns

### TypeScript
- Strict mode enabled
- Explicit types for function parameters and return values
- Use `interface` for object shapes
- Prefix unused parameters with `_` (e.g., `_response`)

### React
- Functional components with hooks
- `useState` for local state
- `useEffect` for side effects
- Event handlers use arrow functions for correct `this` binding

### Chrome APIs
- Always handle `chrome.runtime.lastError`
- Use promises where possible (wrap callbacks with `new Promise`)
- Log errors with `[Blur Focus]` prefix

### CSS
- BEM-like naming: `.popup-container`, `.settings-panel`, `.tab-button`
- Use CSS classes instead of inline styles
- Responsive design with flexbox

### Git Commits
- Use conventional commits: `feat:`, `fix:`, `docs:`, `chore:`
- Keep commit messages concise but descriptive
- Japanese or English acceptable

## Known Limitations and Future Improvements

**Current Limitations:**
- None significant (all major v1.0 limitations resolved in v2.0)

**Potential Future Improvements:**
- [ ] Chrome Web Store publishing
- [ ] Internationalization (i18n) for English/other languages
- [ ] More blur modes (e.g., grayscale, opacity)
- [ ] Advanced URL pattern matching (regex support)
- [ ] Sync settings across devices (chrome.storage.sync)
- [ ] Accessibility improvements (ARIA labels, focus management)
- [ ] Unit tests for core functionality
