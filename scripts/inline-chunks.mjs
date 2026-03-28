/**
 * Post-build: inline all JS chunks directly into HTML files.
 * This creates self-contained HTML files that work with htmlpreview.github.io:
 * - No dynamic chunk loading at runtime
 * - No MIME type issues from raw.githubusercontent.com
 * - No document.currentScript URL construction needed
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join } from 'path'

const outDir = 'out'
const chunksDir = join(outDir, '_next/static/chunks')

// All JS chunk filenames available in the build
const allChunkFiles = readdirSync(chunksDir).filter(f => f.endsWith('.js'))

const htmlFiles = ['index.html', 'drill.html']

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
      const content = readFileSync(filePath, 'utf8')
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
        const content = readFileSync(filePath, 'utf8')
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
