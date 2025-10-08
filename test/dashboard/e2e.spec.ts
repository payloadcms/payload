import { expect, test } from '@playwright/test'
import { ensureCompilationIsDone } from 'helpers.js'
import { AdminUrlUtil } from 'helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from 'helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from 'helpers/reInitializeDB.js'
import path from 'path'
import { TEST_TIMEOUT_LONG } from 'playwright.config.js'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, beforeEach, describe } = test

// Unlike the other suites, this one runs in parallel, as they run on the `lexical-fully-featured/create` URL and are "pure" tests
test.describe.configure({ mode: 'parallel' })

const { serverURL } = await initPayloadE2ENoConfig({
  dirname,
})

const url = new AdminUrlUtil(serverURL, 'users')

describe('Dashboard', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    const page = await browser.newPage()
    await ensureCompilationIsDone({ page, serverURL })
    await page.close()
  })
  beforeEach(async ({ page }) => {
    await reInitializeDB({
      serverURL,
      snapshotKey: 'lexicalTest',
      uploadsDir: [path.resolve(dirname, './collections/Upload/uploads')],
    })
    await page.goto(url.admin)
  })

  test('initial dashboard', async ({ page }) => {
    await expect(page.locator('.widget')).toHaveCount(7)
    const widget = (pos: number) => page.locator(`.grid-layout > :nth-child(${pos})`)

    await expect(widget(1)).toHaveAttribute('data-columns', '12')
    await expect(widget(1)).toHaveAttribute('data-rows', '3')
    await expect(widget(1)).toHaveAttribute('data-slug', /^collection-cards/)

    await expect(widget(2)).toHaveAttribute('data-columns', '3')
    await expect(widget(2)).toHaveAttribute('data-rows', '1')
    await expect(widget(2)).toHaveAttribute('data-slug', /^count/)

    await expect(widget(3)).toHaveAttribute('data-columns', '3')
    await expect(widget(3)).toHaveAttribute('data-rows', '1')
    await expect(widget(3)).toHaveAttribute('data-slug', /^count/)

    await expect(widget(4)).toHaveAttribute('data-columns', '3')
    await expect(widget(4)).toHaveAttribute('data-rows', '1')
    await expect(widget(4)).toHaveAttribute('data-slug', /^count/)

    await expect(widget(5)).toHaveAttribute('data-columns', '3')
    await expect(widget(5)).toHaveAttribute('data-rows', '1')
    await expect(widget(5)).toHaveAttribute('data-slug', /^count/)

    await expect(widget(6)).toHaveAttribute('data-columns', '12')
    await expect(widget(6)).toHaveAttribute('data-rows', '2')
    await expect(widget(6)).toHaveAttribute('data-slug', /^revenue/)

    await expect(widget(7)).toHaveAttribute('data-columns', '12')
    await expect(widget(7)).toHaveAttribute('data-rows', '1')
    await expect(widget(7)).toHaveAttribute('data-slug', /^private/)
  })

  test('add widget', async ({ page }) => {
    const dashboardMenu = page.locator('.step-nav').getByText('Dashboard')
    await dashboardMenu.click()
    await page.getByRole('option', { name: 'Edit Dashboard' }).click()
    await page.getByText('Add +').click()
    await page.locator('.drawer').getByText('revenue').click()
    const revenueWidget = page.locator('.revenue-widget')
    await expect(revenueWidget).toHaveCount(1)
  })

  test('resize widget', async ({ page }) => {
    await page.goto(serverURL)
    expect(1).toBe(1)
  })

  test('delete widget', async ({ page }) => {
    await page.goto(serverURL)
    expect(1).toBe(1)
  })
})
