import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  cpSync,
  rmSync
} from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const REPO_ROOT = resolve(__dirname, '..')
export const DOCS_ROOT = resolve(REPO_ROOT, 'docs')
export const DEFAULTS_ROOT = resolve(REPO_ROOT, 'defaults')

const BLOCKED = ['node_modules', '.vitepress/cache', '.vitepress/dist', 'product/local']

export function isSafeDocsPath(relPath) {
  if (!relPath || typeof relPath !== 'string') return false
  const normalized = relPath.replace(/\\/g, '/').replace(/^\/+/, '')
  if (normalized.includes('..')) return false
  if (normalized.startsWith('product/local')) return false
  if (!normalized.startsWith('docs/') && normalized !== 'docs') return false
  return true
}

export function resolveDocsFile(relPath) {
  const normalized = relPath.replace(/\\/g, '/').replace(/^\/+/, '')
  if (!isSafeDocsPath(normalized)) {
    throw new Error('Path not allowed')
  }
  const abs = resolve(REPO_ROOT, normalized)
  if (!abs.startsWith(REPO_ROOT + sep) && abs !== REPO_ROOT) {
    throw new Error('Path escapes repo')
  }
  return abs
}

export function listMarkdownArticles() {
  const results = []
  function walk(dir) {
    for (const name of readdirSync(dir)) {
      const abs = join(dir, name)
      const rel = relative(REPO_ROOT, abs).replace(/\\/g, '/')
      if (BLOCKED.some((b) => rel.includes(b))) continue
      const st = statSync(abs)
      if (st.isDirectory()) {
        walk(abs)
      } else if (name.endsWith('.md')) {
        results.push({
          path: rel,
          title: extractTitle(abs) || name.replace(/\.md$/, '')
        })
      }
    }
  }
  walk(DOCS_ROOT)
  return results.sort((a, b) => a.path.localeCompare(b.path))
}

function extractTitle(abs) {
  try {
    const text = readFileSync(abs, 'utf8')
    const m = text.match(/^#\s+(.+)$/m)
    return m ? m[1].trim() : null
  } catch {
    return null
  }
}

export function readRepoFile(relPath) {
  const abs = resolveDocsFile(relPath)
  if (!existsSync(abs)) throw new Error('File not found')
  const buf = readFileSync(abs)
  const isText = /\.(md|json|css|html|svg|txt)$/i.test(relPath)
  return {
    path: relPath.replace(/\\/g, '/'),
    content: isText ? buf.toString('utf8') : buf.toString('base64'),
    encoding: isText ? 'utf8' : 'base64'
  }
}

export function writeRepoFile(relPath, content, encoding = 'utf8') {
  const abs = resolveDocsFile(relPath)
  mkdirSync(dirname(abs), { recursive: true })
  const data = encoding === 'base64' ? Buffer.from(content, 'base64') : content
  writeFileSync(abs, data)
  return { path: relPath.replace(/\\/g, '/'), ok: true }
}

export function readJson(relPath) {
  const { content } = readRepoFile(relPath)
  return JSON.parse(content)
}

export function writeJson(relPath, data) {
  return writeRepoFile(relPath, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

export function resetToDefaults() {
  if (!existsSync(DEFAULTS_ROOT)) {
    throw new Error('defaults/ snapshot missing — run npm run snapshot:defaults')
  }
  const restored = []
  function walk(dir) {
    for (const name of readdirSync(dir)) {
      const abs = join(dir, name)
      const relFromDefaults = relative(DEFAULTS_ROOT, abs).replace(/\\/g, '/')
      if (relFromDefaults.includes('product/local') && !name.startsWith('.')) {
        // keep local secrets; only restore templates under product/
        if (statSync(abs).isDirectory() && name === 'local') continue
      }
      const st = statSync(abs)
      if (st.isDirectory()) {
        walk(abs)
      } else {
        const dest = resolve(REPO_ROOT, relFromDefaults)
        mkdirSync(dirname(dest), { recursive: true })
        cpSync(abs, dest)
        restored.push(relFromDefaults)
      }
    }
  }
  walk(DEFAULTS_ROOT)
  return { restored }
}

export function articleTemplate({ title, slug }) {
  return `# ${title}

## What the customer sees

TODO: describe the symptom in customer language.

## What it actually means

TODO: technical meaning.

## What to check in 2 minutes

1. TODO
2. TODO
3. TODO

## What to ask

- TODO

## When to escalate

TODO: conditions that need engineering or incident response.

<!-- slug: ${slug} -->
`
}

export function createArticle({ section, slug, title, navSectionText }) {
  const safeSlug = slug.replace(/[^a-z0-9-_]/gi, '-').toLowerCase()
  const sectionDir = section.replace(/^\/+|\/+$/g, '')
  const relPath = `docs/${sectionDir}/${safeSlug}.md`
  const abs = resolveDocsFile(relPath)
  if (existsSync(abs)) throw new Error('Article already exists')
  writeRepoFile(relPath, articleTemplate({ title, slug: safeSlug }))

  const nav = readJson('docs/nav.json')
  const link = `/${sectionDir}/${safeSlug}`.replace(/\/+/g, '/')
  let sectionNode = nav.sidebar.find((s) => s.text === navSectionText)
  if (!sectionNode) {
    sectionNode = { text: navSectionText || sectionDir, collapsed: false, items: [] }
    nav.sidebar.push(sectionNode)
  }
  sectionNode.items = sectionNode.items || []
  if (!sectionNode.items.some((i) => i.link === link)) {
    sectionNode.items.push({ text: title, link })
  }
  writeJson('docs/nav.json', nav)
  return { path: relPath, link }
}
