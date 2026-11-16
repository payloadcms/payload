import { expect, test } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { Config } from './payload-types.js'

import { runAxeScan } from '../__helpers/e2e/runAxeScan.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../__setup/e2e/initPage.js'
import { articlesSlug, pagesSlug } from './shared.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
let serverURL: string
let payload: PayloadTestSDK<Config>
let savedCollectionPreferences: unknown
let aboutID: number | string

test.describe('Nested document tree', () => {
  test.beforeAll(async ({ browser }) => {
    ;({ serverURL, payload } = await initPayloadE2ENoConfig<Config>({ dirname }))
    const {
      docs: [about],
    } = await payload.find({ collection: pagesSlug, where: { title: { equals: 'About us' } } })
    aboutID = about.id
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
    const preference = await page.request.post(
      `${serverURL}/api/payload-preferences/collection-${pagesSlug}`,
      { data: { value: { documentLayout: 'tree', layoutQueries: { table: {}, tree: {} } } } },
    )

    expect(preference.ok()).toBe(true)
    await page.goto(
      `${serverURL}/admin/collections/${pagesSlug}?listLayout=tree&sort=-title&limit=10`,
    )
    await page.getByRole('radio', { name: 'Tree', exact: true }).check()
  })

  test('should keep Table and Tree working states independent across switches and reloads', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Expand: About us', exact: true }).click()
    await page.getByRole('radio', { name: 'Table', exact: true }).check()
    await expect(page).toHaveURL(/listLayout=table/)
    const search = page.getByRole('textbox', { name: 'Search', exact: true })
    await search.fill('Careers')
    await expect(page.getByRole('link', { name: 'Careers', exact: true })).toBeVisible()
    await expect(page).toHaveURL(/search=Careers/)

    await page.getByRole('radio', { name: 'Tree', exact: true }).check()
    await expect(search).toHaveValue('')
    await expect(
      page.getByRole('button', { name: 'Collapse: About us', exact: true }),
    ).toBeVisible()
    await expect(page).not.toHaveURL(/search=Careers/)
    await search.fill('Contact')
    await expect(
      page.getByRole('status').filter({ hasText: 'Showing matching documents' }),
    ).toBeVisible()
    await page.reload()
    await expect(search).toHaveValue('Contact')

    await page.getByRole('radio', { name: 'Table', exact: true }).check()
    await expect(search).toHaveValue('Careers')
    await expect(page.getByRole('link', { name: 'Careers', exact: true })).toBeVisible()
    await page.getByRole('radio', { name: 'Tree', exact: true }).check()
    await expect(search).toHaveValue('Contact')
    await page.goto(`${serverURL}/admin/collections/${pagesSlug}`)
    await expect(search).toHaveValue('Contact')
    await search.fill('')
    await expect(
      page.getByRole('button', { name: 'Collapse: About us', exact: true }),
    ).toBeVisible()
  })

  test('should isolate grouping, sorting, filters and page size while sharing columns', async ({
    page,
  }) => {
    const tableURL = new URL(`${serverURL}/admin/collections/${pagesSlug}`)
    tableURL.searchParams.set('listLayout', 'table')
    tableURL.searchParams.set('sort', 'title')
    tableURL.searchParams.set('limit', '2')
    tableURL.searchParams.set('groupBy', 'title')
    tableURL.searchParams.set('where[title][equals]', 'Careers')
    tableURL.searchParams.set('columns', JSON.stringify(['title', 'slug']))
    await page.goto(tableURL.toString())
    await expect(page.getByRole('radio', { name: 'Table', exact: true })).toBeChecked()
    await page.getByRole('radio', { name: 'Tree', exact: true }).check()
    await expect(page.getByRole('button', { name: 'Expand: About us', exact: true })).toBeVisible()
    const treeQuery = new URL(page.url()).searchParams
    expect(treeQuery.get('limit')).toBe('10')
    expect(treeQuery.get('sort')).toBe('-title')
    expect(treeQuery.has('groupBy')).toBe(false)
    expect(treeQuery.has('where[title][equals]')).toBe(false)
    expect(JSON.parse(treeQuery.get('columns')!)).toContain('slug')

    await page.getByRole('radio', { name: 'Table', exact: true }).check()
    await expect(page).toHaveURL(/groupBy=title/)
    const restoredQuery = new URL(page.url()).searchParams
    expect(restoredQuery.get('limit')).toBe('2')
    expect(restoredQuery.get('sort')).toBe('title')
    expect(restoredQuery.get('where[title][equals]')).toBe('Careers')
    expect(JSON.parse(restoredQuery.get('columns')!)).toContain('slug')
  })

  test('should retain a fully collapsed tree when searching and clearing results', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Expand: About us', exact: true }).click()
    await page.getByRole('textbox', { name: 'Search', exact: true }).fill('Careers')
    await expect(page.getByRole('link', { name: 'Careers', exact: true })).toBeVisible()
    await page.getByRole('textbox', { name: 'Search', exact: true }).fill('')
    await page.getByRole('button', { name: 'Collapse: About us', exact: true }).click()
    await page.getByRole('textbox', { name: 'Search', exact: true }).fill('Careers')
    await expect(page.getByRole('link', { name: 'Careers', exact: true })).toBeVisible()
    await page.getByRole('textbox', { name: 'Search', exact: true }).fill('')
    await expect(page.getByRole('button', { name: 'Expand: About us', exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('button', { name: 'Expand: About us', exact: true })).toBeVisible()
  })

  test('should preserve saved state when another layout is clicked during a pending switch', async ({
    page,
  }) => {
    await page.goto(
      `${serverURL}/admin/collections/${pagesSlug}?listLayout=table&search=Careers&sort=title&limit=2`,
    )
    await expect(page.getByRole('link', { name: 'Careers', exact: true })).toBeVisible()
    let release = () => {}
    let preferenceWrites = 0
    const pending = new Promise<void>((resolve) => {
      release = resolve
    })
    await page.route('**/api/payload-preferences/collection-nested-pages', async (route) => {
      if (route.request().method() === 'POST') {
        preferenceWrites++
        await pending
      }
      await route.continue()
    })
    try {
      await page.getByRole('radio', { name: 'Tree', exact: true }).click()
      await expect.poll(() => preferenceWrites).toBe(1)
      await page.getByRole('radio', { name: 'Table', exact: true }).click()
      await expect(page.getByRole('radio', { name: 'Tree', exact: true })).toBeChecked()
      release()
      await expect(
        page.getByRole('button', { name: 'Expand: About us', exact: true }),
      ).toBeVisible()
      await expect(page.getByRole('textbox', { name: 'Search', exact: true })).toHaveValue('')
      await page.getByRole('radio', { name: 'Table', exact: true }).check()
      await expect(page.getByRole('textbox', { name: 'Search', exact: true })).toHaveValue(
        'Careers',
      )
    } finally {
      release()
    }
  })

  test('should save the outgoing layout without changing another collection after navigation', async ({
    page,
  }) => {
    await page.goto(
      `${serverURL}/admin/collections/${pagesSlug}?listLayout=table&search=Contact&sort=title&limit=2`,
    )
    await page.getByRole('radio', { name: 'Tree', exact: true }).check()
    await expect(page.getByRole('button', { name: 'Expand: About us', exact: true })).toBeVisible()

    const destinationPreferenceURL = `${serverURL}/api/payload-preferences/collection-${articlesSlug}`
    const previousPreference = await page.request.get(destinationPreferenceURL)
    const previousValue = previousPreference.ok()
      ? (await previousPreference.json()).value
      : undefined

    await page.request.post(destinationPreferenceURL, {
      data: {
        value: { documentLayout: 'table', layoutQueries: { table: { search: 'Article' } } },
      },
    })

    let release = () => {}
    let hasSavedPreference = false
    const pending = new Promise<void>((resolve) => {
      release = resolve
    })
    const preferenceURL = `${serverURL}/api/payload-preferences/collection-${pagesSlug}`

    await page.route(preferenceURL, async (route) => {
      const response = await route.fetch()

      hasSavedPreference = true
      await pending
      await route.fulfill({ response })
    })
    try {
      await page.getByRole('radio', { name: 'Table', exact: true }).check()
      await expect.poll(() => hasSavedPreference).toBe(true)
      await page.getByRole('link', { name: 'Articles', exact: true }).click()
      await expect
        .poll(() => new URL(page.url()).pathname)
        .toBe(`/admin/collections/${articlesSlug}`)
      await expect(page).toHaveURL(/search=Article/)
      const destinationURL = page.url()
      const staleNavigation = page
        .waitForRequest(
          (request) =>
            request.method() === 'GET' &&
            request.url().includes(`/admin/collections/${articlesSlug}?`) &&
            new URL(request.url()).searchParams.get('search') === 'Contact',
          { timeout: 1000 },
        )
        .catch(() => null)
      const preferenceResponse = page.waitForResponse(
        (response) => response.url() === preferenceURL && response.request().method() === 'POST',
      )

      release()
      await (await preferenceResponse).finished()
      expect(await staleNavigation).toBeNull()
      await expect(page).toHaveURL(destinationURL)
      const saved = await page.request.get(preferenceURL)

      expect((await saved.json()).value.documentLayout).toBe('table')
    } finally {
      release()
      if (previousValue === undefined) {
        await page.request.delete(destinationPreferenceURL)
      } else {
        await page.request.post(destinationPreferenceURL, { data: { value: previousValue } })
      }
    }
  })

  test('should migrate legacy flat preferences without applying them to Tree', async ({ page }) => {
    const preference = await page.request.post(
      `${serverURL}/api/payload-preferences/collection-${pagesSlug}`,
      { data: { value: { documentLayout: 'table', groupBy: 'title', limit: 2, sort: 'title' } } },
    )

    expect(preference.ok()).toBe(true)
    await page.goto(`${serverURL}/admin/collections/${pagesSlug}`)
    await expect(page).toHaveURL(/groupBy=title/)
    await expect(page.getByRole('radio', { name: 'Table', exact: true })).toBeChecked()
    await page.getByRole('radio', { name: 'Tree', exact: true }).check()
    await expect(page.getByRole('button', { name: 'Expand: About us', exact: true })).toBeVisible()

    const treeQuery = new URL(page.url()).searchParams

    expect(treeQuery.has('groupBy')).toBe(false)
    expect(treeQuery.get('limit')).not.toBe('2')
    await page.getByRole('radio', { name: 'Table', exact: true }).check()
    await expect(page).toHaveURL(/groupBy=title/)
    expect(new URL(page.url()).searchParams.get('limit')).toBe('2')
    expect(new URL(page.url()).searchParams.get('sort')).toBe('title')
  })

  test('should restore reachable expanded branches without requesting unknown or offscreen IDs', async ({
    page,
  }) => {
    const {
      docs: [about],
    } = await payload.find({ collection: pagesSlug, where: { title: { equals: 'About us' } } })
    const {
      docs: [team],
    } = await payload.find({ collection: pagesSlug, where: { title: { equals: 'Our team' } } })
    const offscreen = await payload.create({
      collection: pagesSlug,
      data: { title: 'A offscreen parent' },
    })
    const child = await payload.create({
      collection: pagesSlug,
      data: { title: 'Offscreen child', parent: offscreen.id },
    })
    const fillerIDs: number[] = []
    for (let index = 0; index < 8; index++) {
      const filler = await payload.create({
        collection: pagesSlug,
        data: { title: `Abc filler ${index}` },
      })
      fillerIDs.push(filler.id)
    }
    const requests: string[] = []

    page.on('request', (request) => {
      const body = request.postData()
      if (body?.includes('table-state')) {
        requests.push(body)
      }
    })
    try {
      await page.setViewportSize({ width: 1280, height: 480 })
      await page.goto(
        `${serverURL}/admin/collections/${pagesSlug}?sort=-title&treeExpanded[0]=${about.id}&treeExpanded[1]=${team.id}&treeExpanded[2]=${offscreen.id}&treeExpanded[3]=999999`,
      )
      await expect(page.getByRole('link', { name: 'Careers', exact: true })).toBeVisible()
      const requestedParents = requests.flatMap((body) =>
        [...body.matchAll(/"parentID":\s*"?(\d+)"?/g)].map((match) => match[1]),
      )
      expect(requestedParents).toContain(String(about.id))
      expect(requestedParents).toContain(String(team.id))
      expect(requestedParents).not.toContain(String(offscreen.id))
      expect(requestedParents).not.toContain('999999')
      expect(requests.length).toBeLessThanOrEqual(3)
      await expect(page.getByRole('link', { name: 'Offscreen child', exact: true })).toHaveCount(0)
    } finally {
      await payload.delete({ collection: pagesSlug, id: child.id })
      await payload.delete({ collection: pagesSlug, id: offscreen.id })
      await payload.delete({ collection: pagesSlug, where: { id: { in: fillerIDs } } })
    }
  })

  test('should indent child connectors and titles by one tree column', async ({ page }) => {
    await page.goto(
      `${serverURL}/admin/collections/${pagesSlug}?sort=title&treeExpanded=${aboutID}`,
    )
    const parent = page
      .getByRole('row')
      .filter({ has: page.getByRole('link', { name: 'About us', exact: true }) })
    const child = page
      .getByRole('row')
      .filter({ has: page.getByRole('link', { name: 'Department 01', exact: true }) })
    await expect(child).toBeVisible()
    const connectorX = (row: typeof parent) =>
      row.locator('.tree-connectors__incoming').evaluate((line) => line.getBoundingClientRect().x)
    const parentX = await connectorX(parent)
    const childX = await connectorX(child)
    const parentPadding = await parent
      .locator('.tree-item')
      .evaluate((cell) => parseFloat(getComputedStyle(cell).paddingInlineStart))
    const childPadding = await child
      .locator('.tree-item')
      .evaluate((cell) => parseFloat(getComputedStyle(cell).paddingInlineStart))
    expect(parentPadding).toBeGreaterThan(0)
    expect(childX - parentX).toBeGreaterThan(0)
    expect(childPadding - parentPadding).toBeCloseTo(childX - parentX, 0)
    const childTitleX = await child
      .getByRole('link', { name: 'Department 01', exact: true })
      .evaluate((link) => link.getBoundingClientRect().x)
    expect(childTitleX).toBeGreaterThan(childX)
  })

  test('should continue root guides only when another root follows the expanded branch', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 480 })
    await page.goto(
      `${serverURL}/admin/collections/${pagesSlug}?sort=title&treeExpanded=${aboutID}`,
    )
    const followedChild = page
      .getByRole('row')
      .filter({ has: page.getByRole('link', { name: 'Department 01', exact: true }) })

    await expect(followedChild).toBeVisible()
    await expect(followedChild.locator('.tree-connectors__ancestor[data-level="0"]')).toHaveCount(1)
    await expect(
      page.locator(`tr[data-id="load-node:${aboutID}"] .tree-connectors__ancestor[data-level="0"]`),
    ).toHaveCount(1)
    await page.goto(
      `${serverURL}/admin/collections/${pagesSlug}?sort=-title&treeExpanded=${aboutID}`,
    )
    const terminalChild = page
      .getByRole('row')
      .filter({ has: page.getByRole('link', { name: 'Department 12', exact: true }) })

    await expect(terminalChild).toBeVisible()
    await expect(terminalChild.locator('.tree-connectors__ancestor[data-level="0"]')).toHaveCount(0)
    await expect(
      page.locator(`tr[data-id="load-node:${aboutID}"] .tree-connectors__ancestor[data-level="0"]`),
    ).toHaveCount(0)
  })

  test('should match document link styling between Tree and Table layouts', async ({ page }) => {
    const treeLink = page.locator('.table').getByRole('link', { name: 'Contact', exact: true })
    await expect(treeLink).toHaveCSS('text-decoration-line', 'underline')
    const readStyles = (element: HTMLElement) => {
      const style = getComputedStyle(element)
      return {
        color: style.textDecorationColor,
        decoration: style.textDecorationLine,
        offset: style.textUnderlineOffset,
        position: style.textUnderlinePosition,
        weight: style.fontWeight,
      }
    }
    const treeStyles = await treeLink.evaluate(readStyles)
    await page.getByRole('radio', { name: 'Table', exact: true }).check()
    await page.goto(`${serverURL}/admin/collections/${pagesSlug}?search=Contact&limit=10`)
    const tableLink = page.locator('.table').getByRole('link', { name: 'Contact', exact: true })
    await expect(tableLink).toBeVisible()
    expect(await tableLink.evaluate(readStyles)).toEqual(treeStyles)
  })

  test('should retain Grid browsing for nested document collections', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Search', exact: true }).fill('Contact')
    await page.getByRole('radio', { name: 'Grid', exact: true }).check()
    await expect(
      page.locator('.card-grid').getByRole('link', { name: 'Contact', exact: true }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Expand: About us', exact: true })).toHaveCount(0)
  })

  test('should retain keyboard focus while switching layouts', async ({ page }, testInfo) => {
    const tableToggle = page.getByRole('radio', { name: 'Table', exact: true })
    await tableToggle.focus()
    await tableToggle.press('Space')
    await expect(page.getByRole('button', { name: 'Expand: About us', exact: true })).toHaveCount(0)
    await expect(tableToggle).toBeFocused()
    const treeToggle = page.getByRole('radio', { name: 'Tree', exact: true })
    await treeToggle.focus()
    await treeToggle.press('Space')
    await expect(page.getByRole('button', { name: 'Expand: About us', exact: true })).toBeVisible()
    await expect(treeToggle).toBeFocused()
    await page
      .locator('html')
      .evaluate((element) => element.setAttribute('data-enhanced-contrast', ''))
    await expect(page.locator('html')).toHaveAttribute('data-enhanced-contrast', '')
    const results = await runAxeScan({
      page,
      testInfo,
      include: ['.collection-list'],
      screenshotViolations: false,
    })
    expect(results.violations).toEqual([])
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
      const expand = page.getByRole('button', { name: 'Expand: About us', exact: true })
      const before = await expand.boundingBox()

      await expand.click()
      const collapse = page.getByRole('button', { name: 'Collapse: About us', exact: true })
      const loadingRow = page.locator('.nested-docs-continuation-row--pending')

      await expect(loadingRow.locator('.nested-docs-continuation-row__skeleton')).toBeVisible()
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
      await expect(page.getByRole('link', { name: 'Our team', exact: true })).toBeVisible()
      await expect(loadingRow).toHaveCount(0)
      await expect(collapse.locator('.icon--spinner')).toHaveCount(0)
      await expect(collapse).toBeFocused()
    } finally {
      release()
    }
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
          if (!target.matches('.nested-docs-continuation-row')) {
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
        .getByRole('button', { name: 'Load more: Pages', exact: true })
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
    const message = page.locator('.nested-docs-continuation-row [role="alert"]')
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
    await expect(page.locator('.nested-docs-continuation-row [role="alert"]')).toHaveCount(0)
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
  }, testInfo) => {
    await page.getByRole('button', { name: 'Expand: About us', exact: true }).click()
    const search = page.getByRole('textbox', { name: 'Search', exact: true })

    await search.fill('Car')
    await expect(
      page.getByRole('status').filter({ hasText: 'Showing matching documents' }),
    ).toBeVisible()
    await expect(search).toBeFocused()
    await search.pressSequentially('eers')
    await expect(search).toHaveValue('Careers')
    await expect(page.getByRole('link', { name: 'Careers', exact: true })).toBeVisible()
    await expect(page.locator('.collection-list__tree-search-banner .banner')).toBeVisible()
    await page.screenshot({ path: testInfo.outputPath('tree-search-banner.png') })
    await expect(page.getByRole('button', { name: 'Collapse: About us', exact: true })).toHaveCount(
      0,
    )

    await page.getByRole('textbox', { name: 'Search', exact: true }).fill('')
    await expect(page.locator('.collection-list__tree-search-banner')).toHaveCount(0)
    await expect(
      page.getByRole('button', { name: 'Collapse: About us', exact: true }),
    ).toBeVisible()
  })
})
