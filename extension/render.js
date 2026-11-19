// Turns a Markdown file the browser opened as text/plain into rendered, sanitized HTML.
// Loaded after vendor/marked.umd.js and vendor/purify.min.js (content script and test/check.html).

function renderMarkdown(src) {
  // Sanitize: a .md file can carry raw HTML (onerror=, <script>, javascript: links).
  return DOMPurify.sanitize(marked.parse(src, { gfm: true }));
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
