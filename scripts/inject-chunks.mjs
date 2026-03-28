/**
 * Post-build: inject any chunk JS files not already in the HTML as <script> tags.
 * This ensures htmlpreview.github.io inlines ALL chunks upfront so Next.js's
 * dynamic imports find them in the TURBOPACK cache (no blocked raw.githubusercontent.com fetches).
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join } from 'path'

const outDir = 'out'
const chunksDir = join(outDir, '_next/static/chunks')
const assetPrefix = process.env.ASSET_PREFIX ?? './'

// All JS chunk files
const allChunks = readdirSync(chunksDir)
  .filter(f => f.endsWith('.js'))
  .map(f => `${assetPrefix}/_next/static/chunks/${f}`)

const htmlFiles = ['index.html', 'drill.html']

for (const file of htmlFiles) {
  const path = join(outDir, file)
  let html = readFileSync(path, 'utf8')

  // Find which chunks are already referenced
  const referenced = new Set(
    [...html.matchAll(/src="([^"]*\/_next\/static\/chunks\/[^"]+\.js)"/g)].map(m => {
      // Normalize: strip leading ./ to compare against assetPrefix variant
      return m[1].split('/').pop()
    })
  )

  // Build script tags for missing chunks (insert before first <script)
  const missing = allChunks.filter(c => !referenced.has(c.split('/').pop()))
  if (missing.length === 0) {
    console.log(`${file}: no missing chunks`)
    continue
  }

  const tags = missing.map(src => `<script src="${src}"></script>`).join('\n')
  // Inject BEFORE the app bootstrap script (id="_R_") so page modules are
  // registered in TURBOPACK before React hydration begins
  if (html.includes('id="_R_"')) {
    html = html.replace(/(<script[^>]*id="_R_")/, `${tags}\n$1`)
  } else {
    html = html.replace(/(<\/body>)/, `${tags}\n$1`)
  }
  writeFileSync(path, html)
  console.log(`${file}: injected ${missing.length} chunk(s): ${missing.map(c => c.split('/').pop()).join(', ')}`)
}
