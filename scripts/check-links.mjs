import { existsSync, readFileSync } from 'node:fs'
import { globSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const files = globSync('**/*.md', {
  cwd: root,
  exclude: [
    'node_modules/**',
    'docs/.vitepress/**',
    'docs/public/**',
    'defaults/**',
    'playwright-report/**',
    'test-results/**'
  ]
})

const markdownLink = /\[[^\]]*]\(([^)]+)\)/g
const skip = /^(mailto:|tel:|#)/i
const ignoreHosts = new Set(['example.com', 'example.org', 'localhost'])

/** @type {string[]} */
const failures = []
/** @type {string[]} */
const warnings = []

function isExternal(href) {
  return /^https?:\/\//i.test(href)
}

function stripHashAndQuery(href) {
  return href.split('#')[0].split('?')[0]
}

for (const relative of files) {
  const filePath = resolve(root, relative)
  const content = readFileSync(filePath, 'utf8')
  const dir = dirname(filePath)
  let match

  markdownLink.lastIndex = 0
  while ((match = markdownLink.exec(content))) {
    const href = match[1].trim()
    if (!href || skip.test(href) || href.startsWith('<')) continue

    if (isExternal(href)) {
      let url
      try {
        url = new URL(href)
      } catch {
        failures.push(`${relative}: invalid URL ${href}`)
        continue
      }
      if (ignoreHosts.has(url.hostname)) continue
      // External URLs are fetched below in a second pass.
      continue
    }

    if (href.startsWith('/')) {
      // VitePress root-relative link inside docs/.
      const withoutSlash = stripHashAndQuery(href).replace(/^\//, '')
      const candidates = [
        resolve(root, 'docs', `${withoutSlash}.md`),
        resolve(root, 'docs', withoutSlash, 'index.md'),
        resolve(root, 'docs', withoutSlash)
      ]
      if (!candidates.some((candidate) => existsSync(candidate))) {
        failures.push(`${relative}: missing internal page ${href}`)
      }
      continue
    }

    const localTarget = resolve(dir, stripHashAndQuery(href))
    const localCandidates = [
      localTarget,
      `${localTarget}.md`,
      resolve(localTarget, 'index.md')
    ]
    if (!localCandidates.some((candidate) => existsSync(candidate))) {
      failures.push(`${relative}: missing relative file ${href}`)
    }
  }
}

const external = new Set()
for (const relative of files) {
  const content = readFileSync(resolve(root, relative), 'utf8')
  let match
  markdownLink.lastIndex = 0
  while ((match = markdownLink.exec(content))) {
    const href = match[1].trim()
    if (isExternal(href)) {
      try {
        const url = new URL(href)
        if (!ignoreHosts.has(url.hostname)) external.add(href)
      } catch {
        // already recorded
      }
    }
  }
}

async function checkExternal(href) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15_000)
  try {
    let response = await fetch(href, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'saas-support-handbook-link-check' }
    })
    if ([404, 405, 501].includes(response.status)) {
      response = await fetch(href, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'user-agent': 'saas-support-handbook-link-check' }
      })
    }
    if (response.status >= 400 && response.status !== 429) {
      failures.push(`external ${href} → HTTP ${response.status}`)
    } else if (response.status === 429) {
      warnings.push(`external ${href} → HTTP 429 (rate limited, treated as warning)`)
    }
  } catch (error) {
    warnings.push(`external ${href} → ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    clearTimeout(timer)
  }
}

await Promise.all([...external].map((href) => checkExternal(href)))

if (warnings.length) {
  console.warn(`Link check warnings (${warnings.length}):`)
  for (const warning of warnings) console.warn(`  ${warning}`)
}

if (failures.length) {
  console.error(`Link check failed (${failures.length}):`)
  for (const failure of failures) console.error(`  ${failure}`)
  process.exit(1)
}

console.log(
  `Checked ${files.length} markdown files and ${external.size} external URLs. No broken internal links.`
)
