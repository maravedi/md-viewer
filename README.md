# md-viewer

Local-only browser extension (Chromium family: Opera, Chrome, Edge) that renders Markdown files opened from disk (`file:///…/*.md`) instead of showing raw text.

- No network: no host permissions, no background script, no remote code. Markdown is parsed by vendored [marked](https://github.com/markedjs/marked) and sanitized by vendored [DOMPurify](https://github.com/cure53/DOMPurify), so raw HTML in a `.md` file (scripts, `onerror=`, `javascript:` links) does not run.
- GitHub-flavored Markdown: tables, task lists, fenced code, heading anchors (`#some-heading`). Light/dark follows the OS.
- Matches `.md`, `.MD`, `.markdown`, `.mdown`, `.mkd`. Only plain-text `file://` pages are touched.

## Install (once)

1. Open `opera://extensions` (or `chrome://extensions`), turn on **Developer mode**.
2. **Load unpacked** → pick `~/md-viewer/extension`.
3. On the extension's details page, turn on **Allow access to file URLs**. Without it nothing renders.
4. Open any `.md` file in the browser (drag it in, or `open -a Opera file.md`).

Raw text: `view-source:` in front of the URL.

## Change it

Edit files in `extension/`, then click reload on the extension card and reload the `.md` tab.

## Test

```sh
npm test
```

Loads `test/check.html` in headless Chrome and checks rendering and sanitizing (script, `onerror`, `javascript:` stripped). It tests `render.js` directly: branded Chrome no longer honors `--load-extension`, so the content-script wiring is checked by hand with `test/sample.md`.

## Update the vendored libraries

```sh
cd /tmp && npm pack marked dompurify
# extract; copy lib/marked.umd.js and dist/purify.min.js (+ LICENSE files) into extension/vendor/;
# delete the sourceMappingURL line from each; npm test
```

Vendored: marked 18.2.1 (MIT), DOMPurify 3.4.18 (Apache-2.0 or MPL-2.0). Their license files are in `extension/vendor/`.

## License

MIT, see [LICENSE](LICENSE). Vendored libraries keep their own licenses.
