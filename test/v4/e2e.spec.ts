import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { login } from '../__helpers/e2e/auth/login.js'
import { openNav } from '../__helpers/e2e/toggleNav.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../__setup/e2e/initPage.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.describe('v4 custom navigation', () => {
  let page: Page
  let serverURL: string

  test.beforeAll(async ({ browser }) => {
    ;({ serverURL } = await initPayloadE2ENoConfig({ dirname }))
    const context = await browser.newContext()
    ;({ page } = await initPage({ context, serverURL }))
    await login({ page, serverURL })
  })

  test.afterAll(async () => {
    await page.context().close()
  })

  test('should align a custom sidebar row with built-in navigation links', async () => {
    await page.goto(`${serverURL}/admin`)
    await openNav(page)

    const customRow = page.locator('.sidebar-row')
    const customTitle = customRow.locator('.sidebar-row__title')
    const builtInRow = page.locator('.nav__link').first()
    const builtInTitle = builtInRow.locator('.nav__link-label')
    const [customRowBox, customTitleBox, builtInRowBox, builtInTitleBox] = await Promise.all([
      customRow.boundingBox(),
      customTitle.boundingBox(),
      builtInRow.boundingBox(),
      builtInTitle.boundingBox(),
    ])

    expect(customRowBox).not.toBeNull()
    expect(customTitleBox).not.toBeNull()
    expect(builtInRowBox).not.toBeNull()
    expect(builtInTitleBox).not.toBeNull()
    expect(Math.abs(customRowBox!.height - builtInRowBox!.height)).toBeLessThanOrEqual(1)
    expect(Math.abs(customTitleBox!.x - builtInTitleBox!.x)).toBeLessThanOrEqual(1)
  })

  test('should show a focus indicator on a custom sidebar link', async () => {
    await page.goto(`${serverURL}/admin`)
    await openNav(page)
    const customRow = page.locator('.sidebar-row')
    const customGroupToggle = page
      .locator('.nav-group')
      .filter({ hasText: 'Component Gallery' })
      .getByRole('button')

    await customGroupToggle.focus()
    await page.keyboard.press('Tab')

    await expect(customRow).toBeFocused()
    const focusOutline = await customRow.evaluate((element) => {
      const styles = getComputedStyle(element, '::before')

      return { style: styles.outlineStyle, width: styles.outlineWidth }
    })

    expect(focusOutline.style).not.toBe('none')
    expect(Number.parseFloat(focusOutline.width)).toBeGreaterThan(0)
  })

  test('should allow document scrolling after reaching the end of the desktop sidebar', async () => {
    await page.setViewportSize({ height: 400, width: 1280 })
    await page.goto(`${serverURL}/admin`)
    await openNav(page)

    const scrollRegionPoint = await page.locator('.nav').evaluate((sidebar) => {
      const scrollRegion = Array.from(sidebar.querySelectorAll<HTMLElement>('*')).find(
        (element) => {
          const { overflowY } = getComputedStyle(element)

          return (
            ['auto', 'scroll'].includes(overflowY) && element.scrollHeight > element.clientHeight
          )
        },
      )

      if (!scrollRegion) {
        throw new Error('Expected the sidebar to contain a scrollable region')
      }

      scrollRegion.scrollTop = scrollRegion.scrollHeight
      const bounds = scrollRegion.getBoundingClientRect()

      return { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 }
    })

    await page.mouse.move(scrollRegionPoint.x, scrollRegionPoint.y)
    await page.mouse.wheel(0, 600)

    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  })
})
