/**
 * Post-build: inline all JS chunks directly into HTML files.
 * This creates self-contained HTML files that work with htmlpreview.github.io:
 * - No dynamic chunk loading at runtime
 * - No MIME type issues from raw.githubusercontent.com
 *
 * TURBOPACK fix: each chunk calls
 *   TURBOPACK.push([document.currentScript, ...])
 * so it can compute its own URL via document.currentScript.src.
 * When inlined (no src attribute), currentScript.src is null → TypeError in registerChunk.
 * Fix: replace the document.currentScript expression with the chunk's actual URL string
 * so TURBOPACK uses the string path directly (bypasses the src lookup).
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join } from 'path'

const outDir = 'out'
const chunksDir = join(outDir, '_next/static/chunks')

// Compute the path prefix that getAssetPrefix() should return.
// It's the URL pathname up to (but not including) /_next/.
// We derive it from the first absolute asset URL in the built HTML
// (e.g. https://raw.githubusercontent.com/zondatw/grammaire-map/gh-pages/_next/...)
// → assetPathPrefix = "/zondatw/grammaire-map/gh-pages"
//
// Falls back to ASSET_PREFIX env var, then '' (for local/relative builds).
function computeAssetPathPrefix() {
  // Try to extract from the first HTML file that has an absolute /_next/ URL
  for (const file of ['index.html', 'drill.html']) {
    const filePath = join(outDir, file)
    try {
      const html = readFileSync(filePath, 'utf8')
      const m = html.match(/href="(https?:\/\/[^"]*\/_next\/)/);
      if (m) {
        const url = new URL(m[1])
        const pathBeforeNext = url.pathname.slice(0, url.pathname.indexOf('/_next/'))
        return pathBeforeNext // e.g. "/zondatw/grammaire-map/gh-pages"
      }
    } catch { /* ignore */ }
  }
  // Fallback: ASSET_PREFIX env var
  const assetPrefix = process.env.ASSET_PREFIX
  if (assetPrefix) {
    try {
      // Absolute URL — extract pathname prefix before /_next/
      return new URL(assetPrefix).pathname.replace(/\/$/, '')
    } catch { /* relative prefix like './' */ }
    // Relative prefix: strip trailing slash so getAssetPrefix returns e.g. '.'
    // TURBOPACK constructs chunk URLs as: getAssetPrefix() + '/_next/...'
    // With '.' this becomes './_next/...' (relative) which resolves correctly
    // on GitHub Pages and via <base href> in html-preview.
    return assetPrefix.replace(/\/$/, '') || '.'
  }
  return ''
}
const assetPathPrefix = computeAssetPathPrefix()
console.log(`Asset path prefix: "${assetPathPrefix}"`)

// All JS chunk filenames available in the build
const allChunkFiles = readdirSync(chunksDir).filter(f => f.endsWith('.js'))

const htmlFiles = ['index.html', 'drill.html']

/**
 * Patch chunk content:
 * 1. Replace TURBOPACK's document.currentScript reference with the chunk's
 *    actual relative path so registerChunk gets a valid path key.
 * 2. Replace getAssetPrefix() body with a hardcoded return of the path prefix,
 *    because the function reads document.currentScript.src which is null/empty
 *    for inline scripts and throws when called asynchronously from appBootstrap.
 */
function patchChunk(content, filename) {
  // Fix 1: TURBOPACK.push([SCRIPT_REF, modules...])
  // registerChunk(e) resolves D(typeof e==="string" ? N(e) : e.src) as the chunk key.
  // loadChunkCached uses D(N("static/chunks/xxx.js")) = D(fullUrl) as the same key.
  // Pass the relative path so N() maps it to the correct full URL.
  let patched = content.replace(
    '"object"==typeof document?document.currentScript:void 0',
    JSON.stringify(`static/chunks/${filename}`)
  )

  // Fix 3a: Escape </script> inside JS string/regex literals.
  // The HTML parser terminates a <script> element at </script>, truncating the chunk.
  // Replace with <\/script> — the HTML parser does not treat <\/ as a closing tag,
  // but JS evaluates "\/" as "/" so string values are unchanged.
  patched = patched.replace(/<\/script>/gi, '<\\/script>')

  // Fix 2: getAssetPrefix() reads document.currentScript.src to extract the path
  // prefix before /_next/. When appBootstrap() calls this asynchronously (after
  // TURBOPACK's promise chain resolves), document.currentScript is null → E783 throws.
  // Replace the function body with a hardcoded return of the path prefix.
  const getAssetPrefixPattern = /function l\(\)\{let e=document\.currentScript;if\(!\(e instanceof HTMLScriptElement\)\)throw Object\.defineProperty\(new r\.InvariantError\(`Expected document\.currentScript to be a <script> element\. Received \$\{e\} instead\.`\),"__NEXT_ERROR_CODE",\{value:"E783",enumerable:!1,configurable:!0\}\);let\{pathname:t\}=new URL\(e\.src\),n=t\.indexOf\("\/_next\/"\);if\(-1===n\)throw Object\.defineProperty\(new r\.InvariantError\(`Expected document\.currentScript src to contain '\/_next\/'\. Received \$\{e\.src\} instead\.`\),"__NEXT_ERROR_CODE",\{value:"E784",enumerable:!1,configurable:!0\}\);return t\.slice\(0,n\)\}/
  if (getAssetPrefixPattern.test(patched)) {
    patched = patched.replace(getAssetPrefixPattern, `function l(){return ${JSON.stringify(assetPathPrefix)}}`)
  }

  // Fix 3b: Escape <script opening-tag sequences that htmlpreview.github.io mangles.
  // htmlpreview.js runs a global regex /<script.../gi on the entire HTML string
  // (including inline script content) and replaces every <script with
  // '<script type="text/htmlpreview"'. This turns JS string literals containing
  // "<script>" into broken JS like `"<script type="text/htmlpreview">..."` — which
  // causes a syntax error when the chunk executes. Replace <script (case-insensitive)
  // with \u003cscript: JS evaluates \u003c as "<" so string values are unchanged,
  // but the literal text no longer matches htmlpreview's pattern.
  // This runs AFTER the getAssetPrefix fix because that regex also contains <script>.
  patched = patched.replace(/<script/gi, '\\u003cscript')

  return patched
}

for (const file of htmlFiles) {
  const path = join(outDir, file)
  let html = readFileSync(path, 'utf8')

  // Track which chunks are already referenced in the HTML
  const referenced = new Set(
    [...html.matchAll(/src="[^"]*\/_next\/static\/chunks\/([^"]+\.js)"/g)].map(m => m[1])
  )

  // Inline all existing <script src="...chunks/xxx.js"> tags
  html = html.replace(/<script([^>]*)\ssrc="([^"]*\/_next\/static\/chunks\/[^"]+\.js)"([^>]*)><\/script>/g, (match, before, src, after) => {
    const filename = src.split('/').pop()
    const filePath = join(chunksDir, filename)
    try {
      const raw = readFileSync(filePath, 'utf8')
      const content = patchChunk(raw, filename)
      console.log(`  inlined: ${filename} (${Math.round(content.length / 1024)}KB)`)
      const id = (before + after).match(/id="([^"]+)"/)?.[1]
      return `<script${id ? ` id="${id}"` : ''}>${content}</script>`
    } catch (e) {
      console.warn(`  warning: could not inline ${filename}: ${e.message}`)
      return match
    }
  })

  // Also inline any missing chunks (dynamically loaded ones) before </body>
  const missing = allChunkFiles.filter(f => !referenced.has(f))
  if (missing.length > 0) {
    const missingTags = missing.map(filename => {
      const filePath = join(chunksDir, filename)
      try {
        const raw = readFileSync(filePath, 'utf8')
        const content = patchChunk(raw, filename)
        console.log(`  injected+inlined: ${filename} (${Math.round(content.length / 1024)}KB)`)
        return `<script>${content}</script>`
      } catch (e) {
        console.warn(`  warning: could not inline missing ${filename}: ${e.message}`)
        return ''
      }
    }).filter(Boolean).join('\n')

    // Use a function replacement to prevent $1/$2/etc. in chunk content from
    // being interpreted as backreferences by String.prototype.replace.
    html = html.replace(/(<script[^>]*id="_R_")/, (_, openTag) => `${missingTags}\n${openTag}`)
  }

  writeFileSync(path, html)
  console.log(`${file}: done`)
}
