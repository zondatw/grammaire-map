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
const assetPrefix = process.env.ASSET_PREFIX ?? '.'

// All JS chunk filenames available in the build
const allChunkFiles = readdirSync(chunksDir).filter(f => f.endsWith('.js'))

const htmlFiles = ['index.html', 'drill.html']

/**
 * Patch chunk content: replace TURBOPACK's document.currentScript reference
 * with the chunk's actual URL string so registerChunk gets a valid path.
 */
function patchChunk(content, filename) {
  const chunkUrl = `${assetPrefix}/_next/static/chunks/${filename}`
  // The pattern pushed as first element of each TURBOPACK.push([...]) call
  return content.replace(
    '"object"==typeof document?document.currentScript:void 0',
    JSON.stringify(chunkUrl)
  )
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

    html = html.replace(/(<script[^>]*id="_R_")/, `${missingTags}\n$1`)
  }

  writeFileSync(path, html)
  console.log(`${file}: done`)
}
