import fs from 'fs'
import path from 'path'

const content = path.join(process.cwd(), 'content')
let errors = 0

function err(msg: string) {
  console.error(`  ✗ ${msg}`)
  errors++
}

// Load curriculum
const curriculumPath = path.join(content, 'curriculum.json')
if (!fs.existsSync(curriculumPath)) {
  err('content/curriculum.json not found')
  process.exit(1)
}
const curriculum: string[] = JSON.parse(fs.readFileSync(curriculumPath, 'utf-8'))
console.log(`Checking ${curriculum.length} rules...`)

// Load graph
const graphPath = path.join(content, 'graph.json')
if (!fs.existsSync(graphPath)) {
  err('content/graph.json not found')
} else {
  const graph = JSON.parse(fs.readFileSync(graphPath, 'utf-8'))
  const graphIds = new Set((graph.nodes as { id: string }[]).map((n) => n.id))

  for (const id of curriculum) {
    if (!graphIds.has(id)) {
      err(`graph.json missing node: ${id}`)
    }
  }
  for (const nodeId of graphIds) {
    if (!curriculum.includes(nodeId)) {
      err(`graph.json has extra node not in curriculum: ${nodeId}`)
    }
  }
}

// Check each rule has a .md file and a .json drill file
for (const id of curriculum) {
  const rulePath = path.join(content, 'rules', `${id}.md`)
  const drillPath = path.join(content, 'drills', `${id}.json`)

  if (!fs.existsSync(rulePath)) {
    err(`Missing rule file: content/rules/${id}.md`)
  }
  if (!fs.existsSync(drillPath)) {
    err(`Missing drill file: content/drills/${id}.json`)
  } else {
    try {
      const drills = JSON.parse(fs.readFileSync(drillPath, 'utf-8'))
      if (!Array.isArray(drills)) {
        err(`content/drills/${id}.json is not an array`)
      } else if (drills.length === 0) {
        console.warn(`  ⚠ content/drills/${id}.json has 0 drills`)
      }
    } catch {
      err(`content/drills/${id}.json is invalid JSON`)
    }
  }
}

if (errors === 0) {
  console.log(`✓ All content valid (${curriculum.length} rules checked)`)
} else {
  console.error(`\n${errors} error(s) found — fix before deploying`)
  process.exit(1)
}
