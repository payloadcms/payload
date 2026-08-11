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
import { runAxeScan } from '../../../__helpers/e2e/runAxeScan.js'
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

type BannerType = (typeof bannerTypes)[number]

/** Types that define their own colours. `info` inherits the base banner styles. */
const styledBannerTypes = ['default', 'error', 'success', 'warning'] as const satisfies BannerType[]

const themes = ['light', 'dark'] as const

/**
 * The token the warning type uses for its resting background. It sits one step
 * deeper than the other types so the warning colour reads apart from the error one.
 */
const WARNING_BACKGROUND_TOKEN = '--theme-warning-150'

type BannerTarget = {
  /** Selects the actionable showcase row, whose banners carry `banner--has-action`. */
  hasAction?: boolean
  type: BannerType
}

describe('Banner', () => {
  let page: Page
  let context: BrowserContext
  let serverURL: string
  let adminRoute: string

  const setTheme = async ({ theme }: { theme: (typeof themes)[number] }): Promise<void> => {
    await page.evaluate(
      (nextTheme) => document.documentElement.setAttribute('data-theme', nextTheme),
      theme,
    )
  }

  const getBanner = ({ type, hasAction }: BannerTarget) =>
    page.locator(`#banner-showcase${hasAction ? '-with-action' : ''} .banner--type-${type}`)

  const getBackgroundColor = async ({ type }: Pick<BannerTarget, 'type'>): Promise<string> =>
    getBanner({ type }).evaluate((el) => window.getComputedStyle(el).backgroundColor)

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
    const warningBackground = await getBackgroundColor({ type: 'warning' })
    const defaultBackground = await getBackgroundColor({ type: 'default' })

    expect(warningBackground).not.toBe(defaultBackground)
  })

  test('should style the warning type with the warning theme token', async () => {
    const warningBackground = await getBackgroundColor({ type: 'warning' })

    // The token resolves to a hex string, so paint it onto a probe element to
    // normalise it into the rgb() form that getComputedStyle reports.
    const warningToken = await getBanner({ type: 'warning' }).evaluate((el, token) => {
      const tokenValue = window.getComputedStyle(el).getPropertyValue(token).trim()
      const probe = document.createElement('div')

      probe.style.backgroundColor = tokenValue
      document.body.appendChild(probe)

      const normalised = window.getComputedStyle(probe).backgroundColor

      probe.remove()

      return normalised
    }, WARNING_BACKGROUND_TOKEN)

    expect(warningBackground).toBe(warningToken)
  })

  test('should keep the warning type distinct from the other styled types', async () => {
    const backgrounds = await Promise.all(
      styledBannerTypes.map((type) => getBackgroundColor({ type })),
    )

    expect(new Set(backgrounds).size).toBe(styledBannerTypes.length)
  })

  test('should darken the warning background on hover when the banner has an action', async () => {
    const warning = getBanner({ type: 'warning', hasAction: true })

    const restBackground = await warning.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor,
    )

    await warning.hover()

    await expect
      .poll(() => warning.evaluate((el) => window.getComputedStyle(el).backgroundColor))
      .not.toBe(restBackground)
  })

  for (const theme of themes) {
    test(`should have no accessibility violations at rest in the ${theme} theme`, async () => {
      await setTheme({ theme })

      const results = await runAxeScan({
        include: ['#banner-showcase'],
        page,
        testInfo: test.info(),
      })

      expect(results.violations).toEqual([])
    })

    // Axe reads the resolved styles of the current DOM, so hovering or pressing a
    // banner first means the scan reports the colours of that state.
    test(`should have no accessibility violations while a banner is hovered in the ${theme} theme`, async () => {
      await setTheme({ theme })

      for (const type of styledBannerTypes) {
        await getBanner({ type, hasAction: true }).hover()

        const results = await runAxeScan({
          include: [`#banner-showcase-with-action .banner--type-${type}`],
          page,
          testInfo: test.info(),
        })

        expect(results.violations, `${type} hovered in ${theme}`).toEqual([])
      }
    })

    test(`should have no accessibility violations while a banner is pressed in the ${theme} theme`, async () => {
      await setTheme({ theme })

      for (const type of styledBannerTypes) {
        await getBanner({ type, hasAction: true }).hover()
        await page.mouse.down()

        const results = await runAxeScan({
          include: [`#banner-showcase-with-action .banner--type-${type}`],
          page,
          testInfo: test.info(),
        })

        await page.mouse.up()

        expect(results.violations, `${type} pressed in ${theme}`).toEqual([])
      }
    })
  }
})
