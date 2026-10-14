import { cpSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const defaults = resolve(root, 'defaults')

if (existsSync(defaults)) {
  rmSync(defaults, { recursive: true, force: true })
}
mkdirSync(defaults, { recursive: true })

const copies = [
  ['docs/nav.json', 'docs/nav.json'],
  ['docs/legal', 'docs/legal'],
  ['docs/guide', 'docs/guide'],
  ['docs/tools', 'docs/tools'],
  ['docs/errors', 'docs/errors'],
  ['docs/browser', 'docs/browser'],
  ['docs/data', 'docs/data'],
  ['docs/training', 'docs/training'],
  ['docs/index.md', 'docs/index.md'],
  ['docs/product', 'docs/product']
]

for (const [from, to] of copies) {
  const src = resolve(root, from)
  const dest = resolve(defaults, to)
  if (!existsSync(src)) continue
  mkdirSync(dirname(dest), { recursive: true })
  cpSync(src, dest, {
    recursive: true,
    filter: (source) => !source.includes(`${'local'}`) || source.endsWith('local') || source.includes('.gitkeep') || source.includes('.gitignore')
  })
}

console.log(`Defaults snapshot written to ${defaults}`)
