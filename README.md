# md-viewer

Local-only browser extension (Chromium family: Opera, Chrome, Edge) that renders Markdown files opened from disk (`file:///…/*.md`) instead of showing raw text.

- No permissions, no background script, no remote code. Markdown is parsed by vendored [marked](https://github.com/markedjs/marked) and sanitized by vendored [DOMPurify](https://github.com/cure53/DOMPurify): scripts, `onerror=`, `javascript:` links, forms, `style`, dialogs and popovers in a `.md` file are removed, and any `<input>` becomes a disabled checkbox (task lists).
- No network from a rendered file: images and media must be local files on this machine or `data:`. Remote URLs and `//host/…` / `\\host\…` paths (Windows network shares) are removed, and a Content-Security-Policy blocks anything that slips through.
- Links: only `http(s):`, `mailto:`, `#anchors` and other local Markdown files. Links to local `.html`, `.svg` and other files are removed (their text stays), because those pages run their own scripts.
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

Loads `test/check.html` in headless Chrome and checks rendering, sanitizing, the link and image rules, and that the CSP alone refuses remote loads. It first checks the vendored files against the hashes below. It tests `render.js` directly: branded Chrome no longer honors `--load-extension`, so the content-script wiring is checked by hand with `test/sample.md`.

## Update the vendored libraries

```sh
cd /tmp && npm pack marked dompurify
# extract; copy lib/marked.umd.js and dist/purify.min.js (+ LICENSE files) into extension/vendor/;
# delete the sourceMappingURL line from each; update the hashes below; npm test
```

SHA-256 of the vendored files (after removing the `sourceMappingURL` line):

```
3953235b41bdcaa96ff14483bf18ce36b52bcf5356bba5e8886b18594a2c4558  extension/vendor/marked.umd.js
5c64f2cdc55474de0409a8e419d741285ab833f6f0818b76a8380dcc2d408078  extension/vendor/purify.min.js
```

Check with `shasum -a 256 -c` on that block.

Vendored: marked 18.2.1 (MIT), DOMPurify 3.4.18 (Apache-2.0 or MPL-2.0). Their license files are in `extension/vendor/`.

## License

MIT, see [LICENSE](LICENSE). Vendored libraries keep their own licenses.
