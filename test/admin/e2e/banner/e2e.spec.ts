import type { BrowserContext, Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { formatAdminURL } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { Config } from '../../payload-types.js'

import {
  ensureCompilationIsDone,
  getRoutes,
  initPageConsoleErrorCatch,
} from '../../../__helpers/e2e/helpers.js'
import { reInitializeDB } from '../../../__helpers/shared/clearAndSeed/reInitializeDB.js'
import { initPayloadE2ENoConfig } from '../../../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { BASE_PATH, customAdminRoutes } from '../../shared.js'

process.env.NEXT_BASE_PATH = BASE_PATH

const { beforeAll, beforeEach, describe } = test

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const bannerTypes = ['default', 'error', 'info', 'success', 'warning'] as const

describe('Banner', () => {
  let page: Page
  let context: BrowserContext
  let serverURL: string
  let adminRoute: string

  const getBackgroundColor = async (type: string): Promise<string> =>
    page
      .locator(`#banner-showcase .banner--type-${type}`)
      .evaluate((el) => window.getComputedStyle(el).backgroundColor)

  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    process.env.SEED_IN_CONFIG_ONINIT = 'false'
    ;({ serverURL } = await initPayloadE2ENoConfig<Config>({ dirname, prebuild: false }))

    context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ customAdminRoutes, page, serverURL })

    adminRoute = getRoutes({ customAdminRoutes }).routes.admin
  })

  beforeEach(async () => {
    await reInitializeDB({ serverURL, snapshotKey: 'adminTests' })

    await ensureCompilationIsDone({ customAdminRoutes, page, serverURL })

    await page.goto(formatAdminURL({ adminRoute, path: '/banner-styles', serverURL }))
  })

  test('should render a banner for every supported type', async () => {
    for (const type of bannerTypes) {
      await expect(page.locator(`#banner-showcase .banner--type-${type}`)).toBeVisible()
    }
  })

  test('should give the warning type its own background color', async () => {
    const warningBackground = await getBackgroundColor('warning')
    const defaultBackground = await getBackgroundColor('default')

    expect(warningBackground).not.toBe(defaultBackground)
  })

  test('should style the warning type with the warning theme token', async () => {
    const warningBackground = await getBackgroundColor('warning')

    // The token resolves to a hex string, so paint it onto a probe element to
    // normalise it into the rgb() form that getComputedStyle reports.
    const warningToken = await page
      .locator('#banner-showcase .banner--type-warning')
      .evaluate((el) => {
        const tokenValue = window
          .getComputedStyle(el)
          .getPropertyValue('--theme-warning-100')
          .trim()
        const probe = document.createElement('div')

        probe.style.backgroundColor = tokenValue
        document.body.appendChild(probe)

        const normalised = window.getComputedStyle(probe).backgroundColor

        probe.remove()

        return normalised
      })

    expect(warningBackground).toBe(warningToken)
  })

  test('should keep the warning type distinct from the other styled types', async () => {
    const styledTypes = ['default', 'error', 'success', 'warning']

    const backgrounds = await Promise.all(styledTypes.map((type) => getBackgroundColor(type)))

    expect(new Set(backgrounds).size).toBe(styledTypes.length)
  })
})
