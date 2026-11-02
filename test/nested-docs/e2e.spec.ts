import { expect, test } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { Config } from './payload-types.js'

import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../__setup/e2e/initPage.js'
import { foldersSlug, pagesSlug } from './shared.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
let serverURL: string
let payload: PayloadTestSDK<Config>
let savedCollectionPreferences: unknown

test.describe('Nested document tree', () => {
  test.beforeAll(async ({ browser }) => {
    ;({ serverURL, payload } = await initPayloadE2ENoConfig<Config>({ dirname }))
    const page = await browser.newPage()
    try {
      await initPage({ page, serverURL })
      const response = await page.request.get(
        `${serverURL}/api/payload-preferences/collection-${pagesSlug}`,
      )
      savedCollectionPreferences = response.ok() ? (await response.json()).value : undefined
    } finally {
      await page.close()
    }
  })

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage()
    try {
      await initPage({ page, serverURL })
      const preferenceURL = `${serverURL}/api/payload-preferences/collection-${pagesSlug}`
      const response =
        savedCollectionPreferences === undefined
          ? await page.request.delete(preferenceURL)
          : await page.request.post(preferenceURL, { data: { value: savedCollectionPreferences } })
      expect(response.ok()).toBe(true)
    } finally {
      await page.close()
    }
  })

  test.beforeEach(async ({ page }) => {
    await initPage({ page, serverURL })
    await page.goto(`${serverURL}/admin/collections/${pagesSlug}?sort=-title&limit=10`)
    await page.getByRole('radio', { name: 'Tree', exact: true }).check()
  })

  test('should expand with the keyboard, append children on scroll and retain focus', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 480 })
    const expand = page.getByRole('button', { name: 'Expand: About us', exact: true })

    await expand.focus()
    await expect(expand).toBeFocused()
    await expand.press('Enter')

    const collapse = page.getByRole('button', { name: 'Collapse: About us', exact: true })

    await expect(collapse).toHaveAttribute('aria-expanded', 'true')
    await expect(collapse).toBeFocused()
    await page
      .getByRole('button', { name: 'Load more: About us', exact: true })
      .scrollIntoViewIfNeeded()
    await expect(page.getByRole('link', { name: 'Department 01', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Expand: Our team', exact: true }).click()
    await expect(page.getByRole('link', { name: 'Careers', exact: true })).toBeVisible()
    await expect(
      page
        .getByRole('gridcell')
        .filter({ has: page.getByRole('link', { name: 'Careers', exact: true }) }),
    ).toHaveAccessibleName('Parent document: Our team. Careers')
    await expect(
      page.getByRole('button', { name: 'Load more: About us', exact: true }),
    ).toHaveCount(0)

    await collapse.click()
    await expect(page.getByRole('link', { name: 'Careers', exact: true })).toHaveCount(0)
  })

  test('should keep the parent stable and show one aligned placeholder while a branch loads', async ({
    page,
  }) => {
    let release = () => {}
    const pending = new Promise<void>((resolve) => {
      release = resolve
    })

    await page.route('**/admin/collections/nested-pages**', async (route) => {
      if (route.request().postData()?.includes('table-state')) {
        await pending
      }
      await route.continue()
    })
    try {
      const expand = page.getByRole('button', { name: 'Expand: Academy', exact: true })
      const before = await expand.boundingBox()

      await expand.click()
      const collapse = page.getByRole('button', { name: 'Collapse: Academy', exact: true })
      const loadingRow = page.locator('.nested-docs-load-more--pending')

      await expect(loadingRow.locator('.nested-docs-load-more__skeleton')).toBeVisible()
      await expect(collapse.locator('.icon--spinner')).toBeVisible()
      await expect(collapse).toBeFocused()
      expect(await collapse.boundingBox()).toEqual(before)
      await expect(loadingRow).toHaveCount(1)
      await expect(loadingRow.getByRole('gridcell')).toHaveCount(
        await page.locator('.table thead th').count(),
      )

      const parentRow = page.locator('tr').filter({ has: collapse })
      const parentHeight = (await parentRow.boundingBox())!.height
      const loadingHeight = (await loadingRow.boundingBox())!.height

      expect(Math.abs(parentHeight - loadingHeight)).toBeLessThanOrEqual(1)
      release()
      await expect(page.getByRole('link', { name: 'Courses', exact: true })).toBeVisible()
      await expect(loadingRow).toHaveCount(0)
      await expect(collapse.locator('.icon--spinner')).toHaveCount(0)
      await expect(collapse).toBeFocused()
    } finally {
      release()
    }
  })

  test('should clear the mouse focus highlight while retaining keyboard and selection highlights', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Expand: About us', exact: true }).click()
    await page.mouse.move(0, 0)
    const collapse = page.getByRole('button', { name: 'Collapse: About us', exact: true })
    const row = page
      .locator('tr')
      .filter({ has: page.getByRole('link', { name: 'About us', exact: true }) })

    await expect(collapse).toBeFocused()
    await expect(row).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    await page.keyboard.press('Tab')
    await collapse.focus()
    await expect(row).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    await row.getByRole('checkbox').check()
    await collapse.click()
    await page.mouse.move(0, 0)
    await expect(row).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  })

  test('should clear the load-more highlight after a mouse click and retain it for keyboard loading', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const Observer = window.IntersectionObserver

      window.IntersectionObserver = class extends Observer {
        observe(target: Element) {
          if (!target.matches('.nested-docs-load-more')) {
            super.observe(target)
          }
        }
      }
    })
    await page.goto(`${serverURL}/admin/collections/${pagesSlug}?sort=title&limit=2`)
    await page.getByRole('button', { name: 'Expand: About us', exact: true }).click()
    const more = page.getByRole('button', { name: 'Load more: About us', exact: true })
    const row = page.locator('tr').filter({ has: more })

    await more.click()
    await expect(page.getByRole('link', { name: 'Department 04', exact: true })).toBeVisible()
    await page.mouse.move(0, 0)
    await expect(row).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    await page.keyboard.press('Tab')
    await more.focus()
    await expect(row).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    await more.press('Enter')
    await expect(page.getByRole('link', { name: 'Department 06', exact: true })).toBeVisible()
    await expect(row).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  })

  test('should reopen a cached branch without another request or list navigation', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 480 })
    const requests: string[] = []
    page.on('request', (request) => {
      if (
        request.postData()?.includes('table-state') ||
        (request.method() === 'GET' && request.headers().rsc === '1')
      ) {
        requests.push(request.url())
      }
    })
    await page.getByRole('button', { name: 'Expand: About us', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Expand: Our team', exact: true })).toBeVisible()
    const firstLoad = requests.length

    expect(firstLoad).toBeGreaterThan(0)
    await page.getByRole('button', { name: 'Collapse: About us', exact: true }).click()
    await page.getByRole('button', { name: 'Expand: About us', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Expand: Our team', exact: true })).toBeVisible()
    expect(requests).toHaveLength(firstLoad)
  })

  test('should load more with the keyboard when automatic scrolling is unavailable', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const Observer = window.IntersectionObserver

      window.IntersectionObserver = class extends Observer {
        observe(target: Element) {
          if (!target.matches('.nested-docs-load-more')) {
            super.observe(target)
          }
        }
      }
    })
    await page.goto(`${serverURL}/admin/collections/${pagesSlug}?sort=-title&limit=10`)
    await page.getByRole('button', { name: 'Expand: About us', exact: true }).click()
    const loadMore = page.getByRole('button', { name: 'Load more: About us', exact: true })

    await expect(loadMore).toHaveText('Load more')
    await loadMore.focus()
    await loadMore.press('Enter')
    await expect(page.getByRole('link', { name: 'Department 01', exact: true })).toBeVisible()
    await expect
      .poll(() => page.evaluate(() => Boolean(document.activeElement?.closest('.table'))))
      .toBe(true)
  })

  test('should append root documents on scroll and include them in select all', async ({
    page,
  }) => {
    const { totalDocs: rootCount } = await payload.find({
      collection: pagesSlug,
      draft: true,
      limit: 1,
      where: {
        or: [{ parent: { exists: false } }, { parent: { equals: null } }],
      },
    })
    const ids: number[] = []
    try {
      for (let index = 1; index <= 12; index++) {
        const doc = await payload.create({
          collection: pagesSlug,
          data: { title: `Scroll root ${String(index).padStart(2, '0')}` },
          overrideAccess: true,
        })
        ids.push(doc.id)
      }
      await page.setViewportSize({ width: 1280, height: 480 })
      await page.goto(`${serverURL}/admin/collections/${pagesSlug}?sort=-title&limit=10`)
      await expect(page.getByRole('button', { name: 'Next table page' })).toHaveCount(0)
      await page
        .getByRole('button', { name: 'Load more: Nested Pages', exact: true })
        .scrollIntoViewIfNeeded()
      await expect(page.getByRole('link', { name: 'About us', exact: true })).toBeVisible()
      await expect(page.getByRole('link', { name: /^Scroll root/ })).toHaveCount(12)
      await page.getByRole('checkbox', { name: 'Select all rows', exact: true }).check()
      await expect(page.locator('.table tbody input[type="checkbox"]:checked')).toHaveCount(
        rootCount + ids.length,
      )
      await page.getByRole('checkbox', { name: 'Deselect all rows', exact: true }).press('Space')
      await expect(page.locator('.table tbody input[type="checkbox"]:checked')).toHaveCount(0)
    } finally {
      await payload.delete({
        collection: pagesSlug,
        where: { id: { in: ids } },
        overrideAccess: true,
      })
    }
  })

  test('should respect the collection base filter when loading a branch', async ({ page }) => {
    const {
      docs: [about],
    } = await payload.find({
      collection: pagesSlug,
      where: { title: { equals: 'About us' } },
      overrideAccess: true,
    })
    const hidden = await payload.create({
      collection: pagesSlug,
      data: { title: 'Hidden from tree', parent: about.id },
      overrideAccess: true,
    })
    try {
      await page.goto(`${serverURL}/admin/collections/${pagesSlug}?sort=-title&limit=10`)
      await page.getByRole('button', { name: 'Expand: About us', exact: true }).click()
      await expect(
        page.getByRole('button', { name: 'Expand: Our team', exact: true }),
      ).toBeVisible()
      await expect(page.getByRole('link', { name: 'Hidden from tree', exact: true })).toHaveCount(0)
    } finally {
      await payload.delete({ collection: pagesSlug, id: hidden.id, overrideAccess: true })
    }
  })

  test('should allow retry after a branch request fails', async ({ page }) => {
    let shouldFail = true
    await page.route('**/admin/collections/nested-pages**', async (route) => {
      if (shouldFail && route.request().postData()?.includes('table-state')) {
        shouldFail = false
        await route.abort()
      } else {
        await route.continue()
      }
    })
    await page.getByRole('button', { name: 'Expand: About us', exact: true }).click()
    const message = page.locator('.nested-docs-load-more [role="alert"]')
    const retry = page.getByRole('button', { name: 'Retry: About us', exact: true })

    await expect(message).toHaveText("Couldn't load items.")
    await expect
      .poll(async () => {
        const messageBox = (await message.boundingBox())!
        const retryBox = (await retry.boundingBox())!

        return Math.abs(messageBox.y + messageBox.height / 2 - retryBox.y - retryBox.height / 2)
      })
      .toBeLessThanOrEqual(1)
    await retry.click()
    await expect(page.getByRole('button', { name: 'Expand: Our team', exact: true })).toBeVisible()
    await expect(page.locator('.nested-docs-load-more [role="alert"]')).toHaveCount(0)
  })

  test('should open the real document editor with independent parent and folder controls', async ({
    page,
  }) => {
    await page.getByRole('radio', { name: 'Table', exact: true }).check()
    await page.getByRole('textbox', { name: 'Search', exact: true }).fill('Careers')
    await page.getByRole('link', { name: 'Careers', exact: true }).click()

    const editor = page.locator('.collection-edit')

    await expect(editor.getByLabel('Title', { exact: false })).toHaveValue('Careers')
    await expect(editor.locator('#field-parent')).toBeVisible()
    await expect(
      editor.locator('.relationship').filter({ hasText: 'Parent document' }),
    ).toBeVisible()
    await expect(
      editor.getByRole('button', { name: 'Folder location: None', exact: true }),
    ).toBeVisible()
  })

  test('should find descendants while searching and restore the expanded tree when cleared', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Expand: About us', exact: true }).click()
    await page.getByRole('textbox', { name: 'Search', exact: true }).fill('Careers')
    await expect(
      page.getByRole('status').filter({ hasText: 'Showing matching documents' }),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'Careers', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Collapse: About us', exact: true })).toHaveCount(
      0,
    )

    await page.getByRole('textbox', { name: 'Search', exact: true }).fill('')
    await expect(
      page.getByRole('button', { name: 'Collapse: About us', exact: true }),
    ).toBeVisible()
  })

  test('should move a document through the sidebar and preserve its folder assignment', async ({
    page,
  }) => {
    const {
      docs: [contact],
    } = await payload.find({
      collection: pagesSlug,
      where: { title: { equals: 'Contact' } },
      overrideAccess: true,
    })
    const {
      docs: [about],
    } = await payload.find({
      collection: pagesSlug,
      where: { title: { equals: 'About us' } },
      overrideAccess: true,
    })
    const {
      docs: [folder],
    } = await payload.find({
      collection: foldersSlug,
      where: { title: { equals: 'Editorial' } },
      overrideAccess: true,
    })
    const doc = await payload.create({
      collection: pagesSlug,
      data: { title: 'Move through sidebar', parent: about.id, '_h_page-folders': folder.id },
      overrideAccess: true,
    })

    try {
      await page.getByRole('textbox', { name: 'Search', exact: true }).fill('Move through sidebar')
      await page.getByRole('link', { name: 'Move through sidebar', exact: true }).click()

      const editor = page.locator('.collection-edit')

      await editor.getByRole('combobox', { name: 'Parent document', exact: true }).fill('Contact')
      await page.getByRole('option', { name: 'Contact', exact: true }).click()
      await editor.getByRole('button', { name: 'Save Draft', exact: true }).click()
      await expect(editor.getByRole('button', { name: 'Save Draft', exact: true })).toBeDisabled()
      await expect
        .poll(
          async () =>
            (
              await payload.find({
                collection: pagesSlug,
                where: { id: { equals: doc.id } },
                draft: true,
                depth: 0,
                overrideAccess: true,
              })
            ).docs[0].parent,
        )
        .toBe(contact.id)

      await expect
        .poll(
          async () =>
            (
              await payload.find({
                collection: pagesSlug,
                where: { id: { equals: doc.id } },
                draft: true,
                depth: 0,
                overrideAccess: true,
              })
            ).docs[0]['_h_page-folders'],
        )
        .toBe(folder.id)
      await page.goto(`${serverURL}/admin/collections/${pagesSlug}?sort=-title&limit=10`)
      await page.getByRole('button', { name: 'Expand: Contact', exact: true }).click()
      await expect(
        page.getByRole('link', { name: 'Move through sidebar', exact: true }),
      ).toBeVisible()
    } finally {
      await payload.delete({ collection: pagesSlug, id: doc.id, overrideAccess: true })
    }
  })
})
