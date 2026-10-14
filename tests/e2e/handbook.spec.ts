import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { test, expect } from '@playwright/test'

const distProduct = resolve(process.cwd(), 'docs/.vitepress/dist/product')

test.describe('public handbook', () => {
  test('home offers train and lookup modes', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'Start training' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Look up HTTP errors' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Capture a HAR' })).toBeVisible()
  })

  test('local search control is available', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /search/i }).click()
    await expect(page.getByPlaceholder(/search/i)).toBeVisible()
  })

  test('HTTP 401 vs 403 reference renders', async ({ page }) => {
    await page.goto('/errors/http-4xx')
    await expect(page.getByRole('heading', { name: /401 Unauthorized vs 403 Forbidden/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /400 Bad Request/i })).toBeVisible()
  })

  test('HAR capture page renders', async ({ page }) => {
    await page.goto('/browser/har')
    await expect(page.getByRole('heading', { name: /HAR files/i }).first()).toBeVisible()
    await expect(page.getByText(/Export HAR \(sanitized\)/)).toBeVisible()
  })

  test('SQL cheatsheet renders', async ({ page }) => {
    await page.goto('/data/sql')
    await expect(page.getByRole('heading', { name: /SQL for support/i })).toBeVisible()
    await expect(page.locator('code', { hasText: 'ILIKE' }).first()).toBeVisible()
  })

  test('MongoDB cheatsheet renders', async ({ page }) => {
    await page.goto('/data/mongodb')
    await expect(page.getByRole('heading', { name: /MongoDB for support/i })).toBeVisible()
    await expect(page.getByText('$lookup').first()).toBeVisible()
  })

  test('sidebar includes every public section', async ({ page }) => {
    await page.goto('/guide/how-to-use')
    const sidebar = page.locator('#VPSidebarNav, .VPSidebar')
    await expect(sidebar.getByRole('link', { name: 'Evidence standard' })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: 'Ticketing' })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: 'HTTP status codes' })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: 'API error shapes' })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: 'HAR files' })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: 'SQL for support' })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: '30-day path' })).toBeVisible()
    await expect(sidebar.getByText('Product runbooks')).toHaveCount(0)
  })

  test('public build does not emit product runbooks', async ({ page }) => {
    expect(existsSync(distProduct)).toBe(false)
    const response = await page.goto('/product/')
    expect(response).not.toBeNull()
    const status = response?.status() ?? 0
    const body = await page.locator('body').innerText()
    const missing = status >= 400 || /404/i.test(body)
    expect(missing).toBe(true)
  })

  test('privacy and disclaimer page renders', async ({ page }) => {
    await page.goto('/legal/privacy')
    await expect(page.getByRole('heading', { name: /Privacy and disclaimer/i })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Shepherd.js' }).first()).toBeVisible()
    await expect(page.getByText(/free and open source/i).first()).toBeVisible()
  })

  test('nav.json drives Privacy link and sidebar Legal section', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('navigation', { name: /main/i }).getByRole('link', { name: 'Privacy' })).toBeVisible()
    await page.goto('/legal/privacy')
    const sidebar = page.locator('#VPSidebarNav, .VPSidebar')
    await expect(sidebar.getByRole('link', { name: /Privacy and disclaimer/i })).toBeVisible()
  })

  test('admin SPA is published and shows login', async ({ page }) => {
    const adminIndex = resolve(process.cwd(), 'docs/.vitepress/dist/admin/index.html')
    expect(existsSync(adminIndex)).toBe(true)
    await page.goto('/admin/')
    await expect(page.getByRole('heading', { name: /Handbook Admin/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Sign in with GitHub/i })).toBeVisible()
  })
})
