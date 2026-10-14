import assert from 'node:assert/strict'
import { test } from 'node:test'

import { chromium } from '@playwright/test'

import { createAnnotationInteraction } from './annotation-demo.mjs'

test('should render reusable floating and banner annotations without changing focus', async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { height: 720, width: 1280 } })

  try {
    await page.setContent(`<style>
      :root {
        --font-body: Inter, sans-serif;
        --color-bg-elevated: #fff;
        --color-text: #181818;
        --color-text-secondary: #555;
        --color-border: #ddd;
        --stroke-width-small: 1px;
        --radius-medium: 5px;
        --spacer-2-5: 12px;
        --spacer-3: 16px;
        --spacer-4: 24px;
        --elevation-300-tooltip: 0 5px 12px rgb(0 0 0 / 13%);
      }
    </style><input aria-label="Demo input">`)
    await page.getByRole('textbox', { name: 'Demo input' }).focus()

    const { hideAnnotation, showAnnotation } = createAnnotationInteraction({ page })

    await showAnnotation({
      body: '<script>Not markup</script>',
      position: { right: 32, top: 270 },
      title: 'What changed',
      type: 'floating',
      width: 300,
    })

    const floating = page.locator('[data-pr-demo-annotation="floating"]')
    assert.equal(await floating.count(), 1)
    assert.equal(await floating.getAttribute('aria-hidden'), 'true')
    assert.equal(await floating.getAttribute('popover'), 'manual')
    assert.equal(await floating.evaluate((element) => element.matches(':popover-open')), true)
    assert.equal(await floating.locator('script').count(), 0)
    assert.equal(
      await floating.locator('.pr-demo-annotation-body').textContent(),
      '<script>Not markup</script>',
    )
    assert.equal(
      await floating.evaluate((element) => getComputedStyle(element).pointerEvents),
      'none',
    )
    assert.equal(await floating.evaluate((element) => getComputedStyle(element).top), '270px')
    assert.equal(await floating.evaluate((element) => getComputedStyle(element).right), '32px')
    assert.equal(
      await floating
        .locator('.pr-demo-annotation-body')
        .evaluate((element) => getComputedStyle(element).fontSize),
      '13px',
    )
    assert.equal(
      await page.evaluate(() => document.activeElement?.getAttribute('aria-label')),
      'Demo input',
    )

    await showAnnotation({ body: 'A single result', title: 'Summary', type: 'banner' })
    assert.equal(await page.locator('.pr-demo-annotation-section').count(), 1)
    assert.equal(
      await page
        .locator('.pr-demo-annotation-section')
        .evaluate((element) => getComputedStyle(element).borderInlineStartWidth),
      '0px',
    )

    await showAnnotation({
      sections: [
        { body: '1,260 rich text fields', title: 'PR benchmark' },
        { figure: '93% faster', title: 'Result' },
      ],
      type: 'banner',
    })

    const banner = page.locator('[data-pr-demo-annotation="banner"]')
    assert.equal(await floating.count(), 0)
    assert.equal(await banner.locator('.pr-demo-annotation-section').count(), 2)
    assert.equal(await banner.evaluate((element) => element.matches(':popover-open')), true)
    assert.deepEqual(
      await banner.evaluate((element) => {
        const rect = element.getBoundingClientRect()
        return { left: rect.left, right: rect.right }
      }),
      { left: 0, right: 1280 },
    )
    assert.equal(
      await banner
        .locator('.pr-demo-annotation-figure')
        .evaluate((element) => getComputedStyle(element).fontSize),
      '28px',
    )
    assert.equal(
      await banner
        .locator('.pr-demo-annotation-section')
        .nth(1)
        .evaluate((element) => getComputedStyle(element).borderInlineStartWidth),
      '1px',
    )
    assert.equal(
      await page.evaluate(() => document.activeElement?.getAttribute('aria-label')),
      'Demo input',
    )

    await hideAnnotation()
    assert.equal(await page.locator('[data-pr-demo-annotation]').count(), 0)
  } finally {
    await browser.close()
  }
})

test('should reject incomplete annotation inputs before changing the page', async () => {
  const page = { evaluate: () => assert.fail('Invalid annotations must not touch the page') }
  const { showAnnotation } = createAnnotationInteraction({ page })

  await assert.rejects(
    showAnnotation({ type: 'floating', body: 'Missing position' }),
    /require body text and a position/,
  )
  await assert.rejects(showAnnotation({ type: 'banner', sections: [] }), /non-empty array/)
  await assert.rejects(showAnnotation({ type: 'banner' }), /needs a title, body, or figure/)
  await assert.rejects(
    showAnnotation({ type: 'banner', sections: [{}] }),
    /needs a title, body, or figure/,
  )
})
