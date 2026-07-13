---
name: verify
description: How to build, launch, and drive this Twine fork to verify changes end-to-end.
---

# Verifying twine-scene-editor changes

## Launch

- Dev server: `npx vite --port 5173 --strictPort` (or `npm start`). The user
  often already has one running on 5173 with HMR — check with
  `curl -s http://localhost:5173/ | head` before starting another; if it's
  already this app, just use it (it serves the current working tree).
- Playwright is a devDependency (`npx playwright install chromium` if
  browsers are missing). Drive with a standalone node script using
  `NODE_PATH=<repo>/node_modules node script.js` from the scratchpad.

## Driving the app (selectors that work)

- First run shows a welcome screen: `getByRole('button', {name: 'Skip'})`,
  then `page.reload()`.
- Create story: Story tab → `New` → textbox named
  `What should your story be named? You can change this later.` → `Create`.
- Passage/data node cards are `.passage-card` (`.passage-card.data-node` for
  data nodes); the card body is a button named after the passage; `dblclick`
  opens the editor. The data node dialog opens in the Visual Builder view —
  click the `JSON Text` button to reach its CodeMirror editor.
- CodeMirror editors: type via `page.getByLabel('<editor label>')` or click
  `.CodeMirror` + `page.keyboard`. Read contents with
  `locator('.CodeMirror').evaluate(el => el.CodeMirror.getValue())`.
- Store writes are debounced ~1000ms — wait ~1200ms before reloading or
  exporting to check persistence.
- Tag popover input is a combobox (datalist), so use `getByLabel('Tag Name')`,
  not `getByRole('textbox')`.
- MenuButton menus can leave more than one popover mounted mid-transition;
  disambiguate menu items with `.last()`. Checkable menu items (e.g. the data
  node Template menu) match `getByRole('checkbox', {name})`, not button.
- File exports use file-saver; capture with `page.waitForEvent('download')`
  and `download.saveAs(...)`.
- HTML5 drag-and-drop (e.g. JSON builder palette) works with
  `page.dragAndDrop(source, target)` in Chromium.

## Gotchas

- The dev server's vite-plugin-checker badge (bottom-left red counter) can
  hold stale errors from mid-edit states; trust fresh `npx tsc --noEmit` and
  `npx eslint src` instead.
- `src/electron/main-process` jest suites fail on Windows regardless of
  changes (path separator mocks) — pre-existing, not a signal.
