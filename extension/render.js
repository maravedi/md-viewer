// Turns a Markdown file the browser opened as text/plain into rendered, sanitized HTML.
// Loaded after vendor/marked.umd.js and vendor/purify.min.js (content script and test/check.html).

const MD_EXT = /\.(md|markdown|mdown|mkd)$/i;

function resolve(v) {
  try { return new URL(v, location.href); } catch { return null; }
}

// Links: web, mail, in-page anchors and other local Markdown only. A relative link to a local
// .html/.svg would open a file:// page that runs its own scripts.
function linkAllowed(v) {
  if (v.startsWith('#')) return true;
  const u = resolve(v);
  if (!u) return false;
  if (['http:', 'https:', 'mailto:'].includes(u.protocol)) return true;
  return u.protocol === 'file:' && u.host === '' && MD_EXT.test(u.pathname);
}

// Images/media: local files on this machine and data: only. "//host/x" or "\\host\x" on a
// file:// page becomes file://host/x, a network share on Windows (no-click NTLM hash leak).
function resourceAllowed(v) {
  const u = resolve(v);
  return !!u && ((u.protocol === 'file:' && u.host === '') || u.protocol === 'data:');
}

DOMPurify.addHook('afterSanitizeAttributes', node => {
  for (const name of ['href', 'xlink:href', 'src', 'poster']) {
    const v = node.getAttribute(name);
    if (v === null) continue;
    const isLink = name.endsWith('href') && node.nodeName.toLowerCase() === 'a';
    if (!(isLink ? linkAllowed(v) : resourceAllowed(v))) node.removeAttribute(name);
  }
  // Only GFM task-list checkboxes are wanted; anything else (type=password, image) becomes one.
  if (node.nodeName === 'INPUT') { node.setAttribute('type', 'checkbox'); node.setAttribute('disabled', ''); }
});

function renderMarkdown(src) {
  // Sanitize: a .md file can carry raw HTML (onerror=, <script>, javascript: links).
  // Forms, style, dialogs and popovers go too: they allow fake login prompts and overlays.
  // srcset/background/source carry URLs the hook above does not check.
  return DOMPurify.sanitize(marked.parse(src, { gfm: true }), {
    FORBID_TAGS: ['form', 'button', 'textarea', 'select', 'style', 'dialog', 'source'],
    FORBID_ATTR: ['style', 'srcset', 'background', 'popover', 'popovertarget', 'popovertargetaction', 'open'],
  });
}

// No network from a rendered file: only local and data: images/media (stops tracking pixels).
// Must run before any rendered HTML is parsed: <img> in a detached element still loads.
function lockDown(doc) {
  const meta = doc.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = "default-src 'none'; img-src file: data:; media-src file: data:; base-uri 'none'; form-action 'none'";
  doc.head.prepend(meta);
}

function slug(text, seen) {
  const base = text.toLowerCase().trim().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-') || 'section';
  const n = seen.get(base) || 0;
  seen.set(base, n + 1);
  return n ? `${base}-${n}` : base;
}

// GitHub-style heading ids so in-document links (#some-heading) work.
function addHeadingIds(root) {
  const seen = new Map();
  for (const h of root.querySelectorAll('h1,h2,h3,h4,h5,h6')) if (!h.id) h.id = slug(h.textContent, seen);
}

(function main() {
  // Only the browser's text viewer on file:// (Chrome reports .md as text/markdown, others text/plain);
  // leaves HTML pages (and test/check.html) alone.
  const type = document.contentType;
  if (location.protocol !== 'file:' || !type.startsWith('text/') || type === 'text/html') return;
  const pre = document.querySelector('body > pre');
  if (!pre) return;
  const src = pre.textContent;
  lockDown(document);

  const article = document.createElement('article');
  article.className = 'mdv-body';
  article.innerHTML = renderMarkdown(src);
  addHeadingIds(article);

  document.documentElement.classList.add('mdv');
  document.body.replaceChildren(article);
  const h1 = article.querySelector('h1');
  document.title = h1 ? h1.textContent : decodeURIComponent(location.pathname.split('/').pop());
  if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
})();
