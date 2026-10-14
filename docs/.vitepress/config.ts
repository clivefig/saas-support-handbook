import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type DefaultTheme, type HeadConfig } from 'vitepress'

const __dirname = dirname(fileURLToPath(import.meta.url))
const docsRoot = resolve(__dirname, '..')
const publicDir = resolve(docsRoot, 'public')

const includeProduct = process.env.INCLUDE_PRODUCT_RUNBOOKS === 'true'

type NavFile = {
  nav: DefaultTheme.NavItem[]
  sidebar: DefaultTheme.SidebarItem[]
  productSidebar?: DefaultTheme.SidebarItem[]
}

const navConfig = JSON.parse(
  readFileSync(resolve(docsRoot, 'nav.json'), 'utf8')
) as NavFile

const sidebar: DefaultTheme.SidebarItem[] = [
  ...navConfig.sidebar,
  ...(includeProduct ? navConfig.productSidebar ?? [] : [])
]

const nav: DefaultTheme.NavItem[] = [
  ...navConfig.nav,
  ...(includeProduct ? [{ text: 'Product', link: '/product/' }] : [])
]

// Optional static assets — drop files in docs/public/ (see docs/setup/BRANDING.md)
const faviconPath = existsSync(resolve(publicDir, 'favicon.svg'))
  ? '/favicon.svg'
  : existsSync(resolve(publicDir, 'favicon.ico'))
    ? '/favicon.ico'
    : undefined
const logoPath = existsSync(resolve(publicDir, 'logo.svg'))
  ? '/logo.svg'
  : existsSync(resolve(publicDir, 'logo.png'))
    ? '/logo.png'
    : undefined

const head: HeadConfig[] = []
if (faviconPath) {
  head.push(['link', { rel: 'icon', href: faviconPath }])
}

export default defineConfig({
  lang: 'en-US',
  title: 'The SaaS Support Handbook',
  description:
    'Definitive training and desk-side reference for SaaS support teams: HTTP and API errors, HAR files, SQL, MongoDB, and the support craft.',
  base: process.env.VITEPRESS_BASE || '/',
  cleanUrls: true,
  lastUpdated: true,
  head,
  srcExclude: includeProduct ? ['setup/**'] : ['product/**', 'setup/**'],
  ignoreDeadLinks: [
    /^https?:\/\/localhost/,
    './../../netlify.toml',
    './../../.env.example'
  ],
  themeConfig: {
    logo: logoPath,
    search: {
      provider: 'local'
    },
    nav,
    sidebar,
    outline: [2, 3],
    socialLinks: [],
    footer: {
      message: includeProduct
        ? 'Private build — product runbooks included.'
        : 'Public craft handbook. Product runbooks are excluded from this build.',
      copyright:
        'Written for SaaS support teams. Keep customer secrets out of tickets, HARs, and this repo.'
    }
  }
})
