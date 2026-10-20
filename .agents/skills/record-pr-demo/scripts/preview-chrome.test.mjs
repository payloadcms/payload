import assert from 'node:assert/strict'
import { test } from 'node:test'
import { chromium } from '@playwright/test'
import { startChromePreview } from './preview-chrome.mjs'

// This tests the same component and controls shipped to the user, not a mock preview.
test('should scrub real responsive content without changing the title or footer geometry', async () => {
  const { server, url } = await startChromePreview({ port: 0 })
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ viewport: { width: 1120, height: 1000 } })
    await page.goto(url)
    await page.frameLocator('iframe').getByRole('heading', { name: 'Posts', exact: true }).waitFor()
    const footer = page.locator('#chrome [data-footer]')
    const initial = await footer.boundingBox()
    const slider = page.getByRole('slider')
    for (const milliseconds of [1600, 2000, 2800]) {
      await slider.evaluate((element, value) => {
        element.value = String(value)
        element.dispatchEvent(new Event('input', { bubbles: true }))
      }, milliseconds)
      assert.equal(
        await page
          .frameLocator('iframe')
          .locator('body')
          .evaluate(() => innerWidth),
        768,
      )
      assert.deepEqual(await footer.boundingBox(), initial)
      assert.equal(await page.locator('[data-step-count]').textContent(), 'Step 2 of 3')
    }
    for (const [milliseconds, step] of [
      [1300, 1],
      [3500, 2],
      [4000, 3],
    ]) {
      await slider.evaluate((element, value) => {
        element.value = String(value)
        element.dispatchEvent(new Event('input', { bubbles: true }))
      }, milliseconds)
      assert.equal(await page.locator('[data-step-count]').textContent(), `Step ${step} of 3`)
    }
    await slider.focus()
    await page.keyboard.press('End')
    assert.equal(await page.locator('#chrome [data-pagination]').textContent(), 'Step 3 of 3')
    assert.equal(
      await page
        .frameLocator('iframe')
        .locator('body')
        .evaluate(() => innerWidth),
      390,
    )
    assert.deepEqual(await footer.boundingBox(), initial)
    await page.getByLabel('Annotation', { exact: true }).uncheck()
    assert.equal(await page.locator('#chrome [data-title]').isVisible(), true)
    assert.equal(await page.locator('#chrome [data-note]').isVisible(), false)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.getByRole('button', { name: 'Desktop', exact: true }).click()
    await page.getByRole('button', { name: 'Play resize', exact: true }).click()
    assert.equal(await page.locator('#chrome [data-size]').textContent(), '390 × 720')
    await page.setViewportSize({ width: 320, height: 900 })
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    )
    assert.equal((await fetch(`${url}/package.json`)).status, 404)
  } finally {
    await browser.close()
    await new Promise((resolve) => server.close(resolve))
  }
})

test('should preview a real frame refresh beside dimensions with keyboard controls', async () => {
  const { server, url } = await startChromePreview({ port: 0 })
  const browser = await chromium.launch({ headless: true })
  try {
    const { expect } = await import('@playwright/test')
    const page = await browser.newPage({ viewport: { width: 1120, height: 1000 } })
    let loads = 0
    page.on('request', (request) => {
      if (request.url().endsWith('/preview/application.html')) loads++
    })
    await page.goto(url)
    await page.frameLocator('iframe').getByRole('heading', { name: 'Posts', exact: true }).waitFor()
    await page.getByRole('button', { name: 'Mobile', exact: true }).click()
    const button = page.getByRole('button', { name: 'Refresh frame', exact: true })
    await button.focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('#chrome').getByRole('status')).toHaveText('Refreshing…')
    await expect(page.locator('[data-size]')).toHaveText('390 × 720')
    await expect(page.locator('#chrome').getByRole('status')).toHaveText('Refreshed')
    assert.equal(loads, 2)
    assert.equal(await button.evaluate((e) => e === document.activeElement), true)
    await expect(page.locator('#chrome').getByRole('status')).toBeHidden()
    await page.getByLabel('Dimensions', { exact: true }).uncheck()
    await button.click()
    await expect(page.locator('#chrome').getByRole('status')).toHaveText('Refreshing…')
    await expect(page.locator('[data-size]')).toBeHidden()
  } finally {
    await browser.close()
    await new Promise((resolve) => server.close(resolve))
  }
})

test('should preview accessibility observations from real keyboard interactions', async () => {
  const { server, url } = await startChromePreview({ port: 0 })
  const browser = await chromium.launch({ headless: true })
  try {
    const { expect } = await import('@playwright/test')
    const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } })
    await page.goto(`${url}/?accessibility&announcements&kind=fix`)
    const app = page.frameLocator('iframe')
    const clickIntroduction = async () => {
      const box = await app.getByRole('button', { name: 'Move Introduction down' }).boundingBox()
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
    }
    await clickIntroduction()
    await expect(page.locator('[data-announcement]')).toHaveText(
      'Introduction moved to position 2 of 3.',
    )
    await page.keyboard.press('Shift+Tab')
    await expect(page.locator('[data-keystroke]')).toHaveText('Shift + Tab')
    await page.keyboard.press('Enter')
    await expect(page.locator('[data-keystroke]')).toHaveText('Enter')
    await expect(page.locator('[data-focus-highlight]')).toHaveCount(0)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.getByRole('button', { name: 'Refresh frame', exact: true }).click()
    await clickIntroduction()
    await expect(page.locator('[data-announcement]')).toHaveText(
      'Introduction moved to position 2 of 3.',
    )
  } finally {
    await browser.close()
    await new Promise((resolve) => server.close(resolve))
  }
})
