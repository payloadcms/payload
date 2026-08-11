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

type BannerType = (typeof bannerTypes)[number]

/** Types that define their own colours. `info` inherits the base banner styles. */
const styledBannerTypes = ['default', 'error', 'success', 'warning'] as const satisfies BannerType[]

/** WCAG 2.1 minimum contrast ratio for normal-sized body text. */
const MINIMUM_CONTRAST_RATIO = 4.5

const themes = ['light', 'dark'] as const

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

  /**
   * Returns the WCAG 2.1 contrast ratio between a banner's text and its background.
   *
   * The calculation runs in the browser so it reads the resolved colours, including
   * any that a `:hover` or `:active` state applies. `getComputedStyle` reports colours
   * as `rgb()` or `rgba()` strings, so each is reduced to its numeric channels, then
   * converted to a relative luminance with the sRGB gamma curve. The ratio is
   * `(lighter + 0.05) / (darker + 0.05)`, so the result reads the same whichever of
   * the two colours is lighter.
   *
   * @returns A ratio from 1 (identical colours) to 21 (black against white).
   */
  const getContrastRatio = async ({ type, hasAction }: BannerTarget): Promise<number> =>
    getBanner({ type, hasAction }).evaluate((el) => {
      const toChannels = (color: string) =>
        color
          .match(/\d+(?:\.\d+)?/g)
          .slice(0, 3)
          .map(Number)

      const relativeLuminance = (channels: number[]) =>
        channels
          .map((channel) => {
            const ratio = channel / 255
            return ratio <= 0.03928 ? ratio / 12.92 : Math.pow((ratio + 0.055) / 1.055, 2.4)
          })
          .reduce((total, value, index) => total + [0.2126, 0.7152, 0.0722][index] * value, 0)

      const styles = window.getComputedStyle(el)
      const foreground = relativeLuminance(toChannels(styles.color))
      const background = relativeLuminance(toChannels(styles.backgroundColor))
      const [lighter, darker] =
        foreground > background ? [foreground, background] : [background, foreground]

      return (lighter + 0.05) / (darker + 0.05)
    })

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
    const warningToken = await getBanner({ type: 'warning' }).evaluate((el) => {
      const tokenValue = window.getComputedStyle(el).getPropertyValue('--theme-warning-100').trim()
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

  for (const type of styledBannerTypes) {
    test(`should keep the ${type} type readable at rest in both themes`, async () => {
      for (const theme of themes) {
        await setTheme({ theme })

        await expect
          .poll(() => getContrastRatio({ type }), { message: `${type} at rest in ${theme}` })
          .toBeGreaterThanOrEqual(MINIMUM_CONTRAST_RATIO)
      }
    })

    test(`should keep the ${type} type readable on hover in both themes`, async () => {
      for (const theme of themes) {
        await setTheme({ theme })
        await getBanner({ type, hasAction: true }).hover()

        await expect
          .poll(() => getContrastRatio({ type, hasAction: true }), {
            message: `${type} on hover in ${theme}`,
          })
          .toBeGreaterThanOrEqual(MINIMUM_CONTRAST_RATIO)
      }
    })

    test(`should keep the ${type} type readable while pressed in both themes`, async () => {
      for (const theme of themes) {
        await setTheme({ theme })
        await getBanner({ type, hasAction: true }).hover()
        await page.mouse.down()

        await expect
          .poll(() => getContrastRatio({ type, hasAction: true }), {
            message: `${type} while pressed in ${theme}`,
          })
          .toBeGreaterThanOrEqual(MINIMUM_CONTRAST_RATIO)

        await page.mouse.up()
      }
    })
  }
})
