/* eslint-disable playwright/expect-expect */
import { expect, test } from '@playwright/test'
import { rm, rmdir } from 'node:fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

import { getSelectMenu, openSelectMenu, selectInput } from '../__helpers/e2e/selectInput.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { reInitializeDB } from '../__helpers/shared/clearAndSeed/reInitializeDB.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { ensureCompilationIsDone } from '../__setup/e2e/ensureCompilationIsDone.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { DashboardHelper } from './utils.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, beforeEach, describe } = test

const { serverURL } = await initPayloadE2ENoConfig({
  dirname,
})

const TOTAL_WIDGETS = 16
const url = new AdminUrlUtil(serverURL, 'users')

describe('Dashboard', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    const page = await browser.newPage()
    await ensureCompilationIsDone({ page, serverURL })
    await page.close()
  })
  beforeEach(async ({ page }) => {
    await reInitializeDB({
      serverURL,
    })
    await page.goto(url.admin)
  })

  test('initial dashboard', async ({ page }) => {
    const d = new DashboardHelper(page)
    await expect(d.widgets).toHaveCount(TOTAL_WIDGETS)

    await d.assertIsEditing(false)
    await d.assertWidget(1, 'welcome', 'full')
    await expect(d.widgetByPos(1).getByRole('heading', { level: 1 })).toContainText('Welcome')
    await d.assertWidget(2, 'activity', 'full')
    await d.assertWidget(3, 'collections', 'full')
    const welcomeBox = await d.widgetByPos(1).locator('.welcome-widget').boundingBox()
    const activityBox = await d.widgetByPos(2).locator('.widget-content').boundingBox()
    const collectionsBox = await d.widgetByPos(3).locator('.widget-content').boundingBox()

    expect(welcomeBox).not.toBeNull()
    expect(activityBox).not.toBeNull()
    expect(collectionsBox).not.toBeNull()
    expect(activityBox!.y - (welcomeBox!.y + welcomeBox!.height)).toBe(24)
    expect(collectionsBox!.y - (activityBox!.y + activityBox!.height)).toBe(24)
    await d.assertWidget(4, 'count', 'x-small')
    await d.assertWidget(5, 'count', 'x-small')
    await d.assertWidget(6, 'count', 'x-small')
    await d.assertWidget(7, 'count', 'x-small')
    await d.assertWidget(8, 'revenue', 'full')
    await d.assertWidget(9, 'private', 'full')
    await d.assertWidget(10, 'collection-query', 'medium')
    await d.assertWidget(11, 'collection-query', 'medium')
    await d.assertWidget(12, 'collection-query', 'x-small')
    await d.assertWidget(13, 'collection-query', 'x-small')
    await d.assertWidget(14, 'collection-query', 'x-small')
    await d.assertWidget(15, 'collection-query', 'x-small')
    await d.assertWidget(16, 'collection-query', 'medium')
    await d.validateLayout()
  })

  test('collection cards match the dashboard tile layout and reveal create on hover or focus', async ({
    page,
  }) => {
    const wrap = page.locator('.collections__wrap')
    const group = wrap.locator('.collections__group').first()
    const card = group.locator('.card').first()
    const actions = card.locator('.card__actions')
    const createLink = card.getByRole('link', { name: 'Create new Users' })

    await expect
      .poll(async () => {
        const [wrapBox, cardBox] = await Promise.all([wrap.boundingBox(), card.boundingBox()])

        if (!wrapBox || !cardBox) {
          return null
        }

        return {
          height: cardBox.height,
          xOffset: cardBox.x - wrapBox.x,
          yOffset: cardBox.y - wrapBox.y,
        }
      })
      .toEqual({ height: 64, xOffset: 0, yOffset: 34 })
    await expect(card).toHaveCSS('border-radius', '13px')
    await expect(actions).toHaveCSS('opacity', '0')
    const defaultBackground = await card.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    )

    for (const selector of [
      '.count-widget.card',
      '.revenue-widget.card',
      '.private-widget.card',
      '.widget-card.card:not(.recents-widget)',
    ]) {
      const widgetCard = page.locator(selector).first()

      await expect(widgetCard).toHaveCSS('background-color', defaultBackground)
      await expect(widgetCard).toHaveCSS('border-radius', '13px')
      await expect(widgetCard).toHaveCSS('padding-top', '12px')
    }

    await expect(async () => {
      await card.hover()
      await expect(actions).toHaveCSS('opacity', '1')
      await expect(card).not.toHaveCSS('background-color', defaultBackground)
    }).toPass({ timeout: 5000 })

    await expect(async () => {
      await createLink.hover()
      await expect(page.getByRole('tooltip')).toContainText('Create new Users')
    }).toPass({ timeout: 5000 })

    await page.mouse.move(0, 0)
    await card.getByRole('link', { name: 'Show all Users' }).focus()
    await page.keyboard.press('Tab')

    await expect(createLink).toBeFocused()
    await expect(actions).toHaveCSS('opacity', '1')
  })

  test('collection-query default layout includes valid and stale config examples', async ({
    page,
  }) => {
    const d = new DashboardHelper(page)

    await d.assertWidget(10, 'collection-query', 'medium')
    await d.assertWidget(11, 'collection-query', 'medium')
    await d.assertWidget(12, 'collection-query', 'x-small')
    await d.assertWidget(13, 'collection-query', 'x-small')
    await d.assertWidget(14, 'collection-query', 'x-small')
    await d.assertWidget(15, 'collection-query', 'x-small')
    await expect(
      d.widgetByPos(10).locator('.collection-query-widget .widget-card__title'),
    ).toHaveText('Top revenue entries')
    await expect(
      d.widgetByPos(11).locator('.collection-query-widget .widget-card__title'),
    ).toHaveText('Event timeline')
  })

  test('collection-query short widget grows to its row height', async ({ page }) => {
    const d = new DashboardHelper(page)

    const shortCard = d.widgetByPos(10).locator('.collection-query-widget')
    const longCard = d.widgetByPos(11).locator('.collection-query-widget')
    const shortRows = shortCard.locator('.widget-card__row')

    await expect(shortRows).toHaveCount(3)
    await expect(async () => {
      const shortCardBox = (await shortCard.boundingBox())!
      const longCardBox = (await longCard.boundingBox())!

      expect(shortCardBox.height).toBe(longCardBox.height)
    }).toPass({ timeout: 1000 })
    await expect(async () => {
      const hasScrollableRows = await shortCard.locator('.widget-card__rows').evaluate((el) => {
        return el.scrollHeight > el.clientHeight
      })

      expect(hasScrollableRows).toBe(false)
    }).toPass({ timeout: 1000 })
  })

  test('collection-query row metadata shows configured sort values', async ({ page }) => {
    const d = new DashboardHelper(page)

    const shortCard = d.widgetByPos(10).locator('.collection-query-widget')
    const longCard = d.widgetByPos(11).locator('.collection-query-widget')

    await expect(async () => {
      const amountLabels = await shortCard.locator('.widget-card__row-meta').allTextContents()

      expect(amountLabels).toHaveLength(3)
      for (const amountLabel of amountLabels) {
        expect(amountLabel.trim()).toMatch(/^\d/)
      }
    }).toPass({ timeout: 1000 })

    await expect(async () => {
      const dateLabels = (await longCard.locator('.widget-card__row-meta').allTextContents()).map(
        (label) => label.trim(),
      )

      expect(new Set(dateLabels).size).toBeGreaterThan(1)
      // The timeline spans past and future, so labels render in both relative directions
      // (e.g. "5m ago", "last week", "in 2d", "next month") via Intl.RelativeTimeFormat.
      for (const dateLabel of dateLabels) {
        expect(dateLabel).toMatch(
          /^(?:now|today|yesterday|tomorrow|last\s.+|next\s.+|in\s.+|.+\sago)$/,
        )
      }
      expect(dateLabels.some((label) => /\sago|^yesterday$|^last\s/.test(label))).toBe(true)
      expect(dateLabels.some((label) => /^in\s|^tomorrow$|^next\s/.test(label))).toBe(true)
    }).toPass({ timeout: 1000 })
  })

  test('collection-query renders relative dates in the active admin language', async ({ page }) => {
    // Force the admin UI language to Spanish for this request. The server resolves the
    // language from the `payload-lng` cookie, which the widget reads via req.i18n.language.
    await page.context().addCookies([
      {
        name: 'payload-lng',
        domain: new URL(serverURL).hostname,
        path: '/',
        value: 'es',
      },
    ])
    await page.goto(url.admin)

    const d = new DashboardHelper(page)
    const timelineCard = d.widgetByPos(11).locator('.collection-query-widget')

    // Spanish relative time via Intl.RelativeTimeFormat('es'): "hace ...", "dentro de ...",
    // "la semana pasada", "el próximo mes". None of these strings appear in the English output.
    const englishMarker = /(?:\sago$|^in\s|^now$|^today$|^tomorrow$|^yesterday$|^(?:next|last)\s)/
    const spanishPast = /^hace\s|pasad[ao]|^ayer$|^anteayer$/
    const spanishFuture = /^dentro de\s|^en\s|próxim[ao]|^mañana$/

    await expect(async () => {
      const dateLabels = (
        await timelineCard.locator('.widget-card__row-meta').allTextContents()
      ).map((label) => label.trim())

      expect(dateLabels.length).toBeGreaterThan(1)
      for (const dateLabel of dateLabels) {
        expect(dateLabel).not.toMatch(englishMarker)
      }
      expect(dateLabels.some((label) => spanishPast.test(label))).toBe(true)
      expect(dateLabels.some((label) => spanishFuture.test(label))).toBe(true)
    }).toPass({ timeout: 1000 })
  })

  test('collection-query long widget shows five rows at a time and scrolls', async ({ page }) => {
    const d = new DashboardHelper(page)

    const longCard = d.widgetByPos(11).locator('.collection-query-widget')
    const longRows = longCard.locator('.widget-card__row')
    const maxVisibleRows = 5

    // Matches the number of seeded "Dashboard demo" events in test/dashboard/seed.ts.
    await expect(longRows).toHaveCount(22)
    await expect(async () => {
      const hasScrollableRows = await longCard.locator('.widget-card__rows').evaluate((el) => {
        return el.scrollHeight > el.clientHeight
      })
      expect(hasScrollableRows).toBe(true)
    }).toPass({ timeout: 1000 })
    await expect(async () => {
      const rowViewport = await longCard.locator('.widget-card__rows').evaluate(
        (el, { maxVisibleRows }) => {
          const rows = Array.from(el.querySelectorAll<HTMLElement>('.widget-card__row'))
          const rowGap = Number.parseFloat(window.getComputedStyle(el).rowGap)
          const expectedHeight =
            rows
              .slice(0, maxVisibleRows)
              .reduce((height, row) => height + row.getBoundingClientRect().height, 0) +
            rowGap * (maxVisibleRows - 1)
          const rowsBox = el.getBoundingClientRect()
          const sixthRowBox = rows[maxVisibleRows]!.getBoundingClientRect()

          return {
            actualHeight: rowsBox.height,
            expectedHeight,
            isSixthRowVisible: sixthRowBox.top < rowsBox.bottom,
          }
        },
        { maxVisibleRows },
      )

      expect(Math.abs(rowViewport.actualHeight - rowViewport.expectedHeight)).toBeLessThanOrEqual(1)
      expect(rowViewport.isSixthRowVisible).toBe(false)
    }).toPass({ timeout: 1000 })
    await longCard.locator('.widget-card__rows').evaluate((el) => {
      el.scrollTop = el.scrollHeight
    })
    await expect(longCard.locator('.widget-card__title')).toBeVisible()
  })

  test('collection-query stale config widgets show parameter errors', async ({ page }) => {
    const errorWidgets = page.locator('.collection-query-widget--error')

    await expect(errorWidgets).toHaveCount(4)
    await expect(errorWidgets.nth(0)).toContainText('Collection "archived-posts" does not exist.')
    await expect(errorWidgets.nth(1)).toContainText(
      'Sort field "assignee" is not sortable on collection "tickets".',
    )
    await expect(errorWidgets.nth(2)).toContainText(
      'Filter field "visibility" does not exist on collection "events".',
    )
    await expect(errorWidgets.nth(3)).toContainText(
      'Sort field "total" does not exist on collection "revenue".',
    )
    await expect(errorWidgets.nth(3)).toContainText(
      'Filter field "channel" does not exist on collection "revenue".',
    )

    await expect(async () => {
      const errorBorderColor = await errorWidgets.first().evaluate((el) => {
        return window.getComputedStyle(el).borderColor
      })

      expect(errorBorderColor).not.toBe('rgba(0, 0, 0, 0)')
    }).toPass({ timeout: 1000 })
  })

  test('collection-query sorts and renders a nested (dot-path) field', async ({ page }) => {
    const d = new DashboardHelper(page)

    const nestedCard = d.widgetByPos(16).locator('.collection-query-widget')

    await expect(nestedCard.locator('.widget-card__title')).toHaveText('Events by priority')
    // The nested sort field is valid, so the widget renders rows instead of a config error.
    await expect(d.widgetByPos(16).locator('.collection-query-widget--error')).toHaveCount(0)

    const rows = nestedCard.locator('.widget-card__row')
    await expect(rows).toHaveCount(4)

    // Row metadata reflects `details.priority`, sorted descending (seed priorities: 10, 30, 20, 5).
    await expect(async () => {
      const priorityLabels = (
        await nestedCard.locator('.widget-card__row-meta').allTextContents()
      ).map((label) => label.trim())

      expect(priorityLabels).toEqual(['30', '20', '10', '5'])
    }).toPass({ timeout: 1000 })
  })

  test('activity widget lists recently viewed documents, most recent first', async ({ page }) => {
    const ticketsUrl = new AdminUrlUtil(serverURL, 'tickets')

    // Fetch two tickets to view. page.request shares the authenticated browser context cookies.
    const response = await page.request.get(`${serverURL}/api/tickets?limit=2&sort=title`)
    const { docs } = await response.json()
    const [firstDoc, secondDoc] = docs

    // Visiting a document edit view records it as recently viewed server-side in renderDocument.
    await page.goto(ticketsUrl.edit(firstDoc.id))
    await expect(page.locator('#field-title')).toHaveValue(firstDoc.title)
    await page.goto(ticketsUrl.edit(secondDoc.id))
    await expect(page.locator('#field-title')).toHaveValue(secondDoc.title)

    await page.goto(url.admin)

    const d = new DashboardHelper(page)
    const activityCard = d.widgetByPos(2).locator('.recently-viewed-widget')

    await expect(activityCard.locator('.widget-card__title')).toHaveText('Recents and pinned')
    await activityCard.getByRole('button', { name: 'Recently viewed' }).click()

    const rowTitles = activityCard.locator('.document-card__title')
    await expect(rowTitles).toHaveCount(2)
    // The most recently viewed document is listed first.
    await expect(rowTitles.nth(0)).toHaveText(secondDoc.title)
    await expect(rowTitles.nth(1)).toHaveText(firstDoc.title)
    await expect(activityCard.locator('.recents-widget__meta').first()).toContainText('Tickets')
    const recentlyViewed = await (
      await page.request.get(`${serverURL}/api/payload-preferences/recently-viewed`)
    ).json()

    await expect(activityCard.locator('.recents-widget__meta time').first()).toHaveAttribute(
      'datetime',
      recentlyViewed.value.items[0].viewedAt,
    )
  })

  test('activity widget persists pin and unpin actions in preferences', async ({ page }) => {
    const ticket = (await (await page.request.get(`${serverURL}/api/tickets?limit=1`)).json())
      .docs[0]
    const preferenceResponse = await page.request.post(
      `${serverURL}/api/payload-preferences/recently-viewed`,
      {
        data: {
          value: {
            items: [
              { id: ticket.id, collectionSlug: 'tickets', viewedAt: new Date().toISOString() },
            ],
          },
        },
      },
    )

    expect(preferenceResponse.ok()).toBe(true)
    await page.setViewportSize({ height: 900, width: 1920 })
    await page.goto(url.admin)

    const dashboard = new DashboardHelper(page)
    await dashboard.setEditing()
    await dashboard.resizeWidget(2, 'full')
    await dashboard.stepNavButtons.nth(1).click()
    await dashboard.assertIsEditing(false)

    const widget = page.locator('.recents-widget')
    await widget.getByRole('button', { name: 'Recently viewed' }).click()
    await expect(widget.locator('.document-card__title')).toHaveText(ticket.title)
    const pinnedButton = widget.getByRole('button', { name: 'Pinned', exact: true })

    await expect(widget.getByRole('button', { name: 'List view' })).toHaveCount(0)
    await expect(widget.locator('.recents-widget__pin')).toHaveCount(0)
    await pinnedButton.click()
    await widget.getByRole('button', { name: 'Pin document', exact: true }).click()
    const drawer = page.locator('.list-drawer.drawer--is-open')

    await selectInput({
      multiSelect: false,
      option: 'Ticket',
      page,
      selectLocator: drawer.locator('.list-header__select-collection'),
    })
    await drawer.getByRole('button', { name: ticket.title, exact: true }).click()
    await expect(widget.locator('.document-card__title')).toHaveText(ticket.title)
    const unpinButton = widget.getByRole('button', { name: `Unpin document: ${ticket.title}` })
    await expect(unpinButton).toBeEnabled()
    await page.mouse.move(0, 0)
    await expect(unpinButton).toHaveCSS('opacity', '0')
    await widget.locator('.recents-widget__item').first().hover()
    await expect(unpinButton).toHaveCSS('opacity', '1')

    const pins = await (
      await page.request.get(`${serverURL}/api/payload-preferences/pinned-documents`)
    ).json()

    expect(pins.value.items).toHaveLength(1)
    expect(pins.value.items[0]).toEqual({ id: ticket.id, collectionSlug: 'tickets' })

    await widget.getByRole('button', { name: 'Recently viewed' }).click()
    await expect(widget.locator('.document-card__title')).toHaveText(ticket.title)
    await widget.locator('.document-card__title').hover()
    await expect(widget.locator('.recents-widget__pin')).toHaveCount(0)

    await page.reload()
    await page
      .locator('.recents-widget')
      .getByRole('button', { name: 'Pinned', exact: true })
      .click()
    await expect(page.locator('.document-card__title')).toHaveText(ticket.title)

    await page
      .locator('.recents-widget')
      .getByRole('button', { name: `Unpin document: ${ticket.title}` })
      .click()
    await expect(page.locator('.recents-widget__empty-title')).toHaveText('No pinned documents')
    await expect(page.locator('.recents-widget__empty-description')).toHaveText(
      'Documents you pin will appear here',
    )
  })

  test('should preserve concurrent unpin changes from two dashboard tabs', async ({
    page,
    context,
  }) => {
    const documents = (await (await page.request.get(`${serverURL}/api/tickets?limit=2`)).json())
      .docs
    const saved = await page.request.post(`${serverURL}/api/payload-preferences/pinned-documents`, {
      data: { value: { items: documents.map(({ id }) => ({ id, collectionSlug: 'tickets' })) } },
    })

    expect(saved.ok()).toBe(true)
    await page.setViewportSize({ height: 900, width: 1920 })
    await page.reload()
    const otherPage = await context.newPage()

    await otherPage.goto(url.admin)
    for (const tab of [page, otherPage]) {
      await expect(tab.locator('.recents-widget .document-card__title')).toHaveCount(2)
      await tab.route('**/api/payload-preferences/pinned-documents', async (route) => {
        if (route.request().method() === 'GET') {
          const response = await route.fetch()

          // Make the read overlap with the other tab's update if writes are not serialized.
          await new Promise((resolve) => setTimeout(resolve, 100))
          await route.fulfill({ response })
        } else {
          await route.continue()
        }
      })
    }
    await Promise.all([
      page
        .getByRole('button', { name: `Unpin document: ${documents[0].title}`, exact: true })
        .click(),
      otherPage
        .getByRole('button', { name: `Unpin document: ${documents[1].title}`, exact: true })
        .click(),
    ])
    await expect
      .poll(async () => {
        const preference = await (
          await page.request.get(`${serverURL}/api/payload-preferences/pinned-documents`)
        ).json()

        return preference.value.items
      })
      .toEqual([])
    await Promise.all([page.reload(), otherPage.reload()])
    for (const tab of [page, otherPage]) {
      await expect(tab.locator('.recents-widget__empty-title')).toHaveText('No pinned documents')
    }
  })

  test('should select documents from different collections through the activity widget pin placeholder', async ({
    page,
  }) => {
    test.slow()
    await page.setViewportSize({ height: 900, width: 1920 })
    await page.reload()
    const ticket = (await (await page.request.get(`${serverURL}/api/tickets?limit=1`)).json())
      .docs[0]
    const event = (await (await page.request.get(`${serverURL}/api/events?limit=1`)).json()).docs[0]
    const widget = page.locator('.recents-widget')
    const addPin = widget.getByRole('button', { name: 'Pin document', exact: true })
    const drawer = page.locator('.list-drawer.drawer--is-open')

    await expect(widget.locator('.recents-widget__item--add-pin')).toHaveCount(1)
    await expect(addPin).toHaveAttribute('aria-haspopup', 'dialog')
    await expect(widget.locator('.recents-widget__empty-icon--pinned')).toBeVisible()
    const [emptyBox, gridBox, buttonBox] = await Promise.all([
      widget.locator('.recents-widget__empty').boundingBox(),
      widget.locator('.recents-widget__items').boundingBox(),
      addPin.boundingBox(),
    ])

    expect(emptyBox?.width).toBe(gridBox?.width)
    expect(buttonBox!.width).toBeLessThan(emptyBox!.width)
    await expect(addPin).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    for (const { collectionLabel, collectionSlug, document } of [
      { collectionLabel: 'Ticket', collectionSlug: 'tickets', document: ticket },
      { collectionLabel: 'Event', collectionSlug: 'events', document: event },
    ]) {
      await addPin.click()
      await expect(drawer).toBeVisible()
      await selectInput({
        multiSelect: false,
        option: collectionLabel,
        page,
        selectLocator: drawer.locator('.list-header__select-collection'),
      })
      await openSelectMenu({
        page,
        selectLocator: drawer.locator('.list-header__select-collection'),
      })
      await expect(
        getSelectMenu({ page }).getByText(/Pinned documents|Preferences|Locked documents/i),
      ).toHaveCount(0)
      await getSelectMenu({ page }).getByText(collectionLabel, { exact: true }).click()
      await expect(drawer.getByRole('link', { name: 'Create New', exact: true })).toHaveCount(0)
      await drawer.getByRole('button', { name: document.title, exact: true }).click()
      await expect(drawer).toBeHidden()
      await expect(widget.getByRole('link', { name: new RegExp(document.title) })).toBeVisible()
      await expect(widget.getByRole('button', { name: 'Pinned', exact: true })).toBeFocused()
      const pins = await (
        await page.request.get(`${serverURL}/api/payload-preferences/pinned-documents`)
      ).json()

      expect(
        pins.value.items.filter(
          (pin) => pin.collectionSlug === collectionSlug && pin.id === document.id,
        ),
      ).toHaveLength(1)
    }
    const pins = await (
      await page.request.get(`${serverURL}/api/payload-preferences/pinned-documents`)
    ).json()

    expect(pins.value.items).toHaveLength(2)
    for (const { collectionLabel, document } of [
      { collectionLabel: 'Ticket', document: ticket },
      { collectionLabel: 'Event', document: event },
    ]) {
      await addPin.click()
      await selectInput({
        multiSelect: false,
        option: collectionLabel,
        page,
        selectLocator: drawer.locator('.list-header__select-collection'),
      })
      await expect(drawer.getByRole('heading')).toBeVisible()
      await expect(drawer.getByRole('button', { name: document.title, exact: true })).toHaveCount(0)
      await page.keyboard.press('Escape')
      await expect(drawer).toBeHidden()
    }
    await expect(widget.locator('.document-card__title')).toHaveCount(2)
    await expect(widget.locator('.recents-widget__item--add-pin')).toHaveCount(1)
    await page.reload()
    await expect(widget.locator('.document-card__title')).toHaveCount(2)
  })

  test('should reserve a placeholder page for four pins and report failed pin saves', async ({
    page,
  }) => {
    const tickets = (await (await page.request.get(`${serverURL}/api/tickets?limit=5`)).json()).docs

    const response = await page.request.post(
      `${serverURL}/api/payload-preferences/pinned-documents`,
      {
        data: {
          value: {
            items: tickets
              .slice(0, 4)
              .map((ticket) => ({ id: ticket.id, collectionSlug: 'tickets' })),
          },
        },
      },
    )

    expect(response.ok()).toBe(true)
    await page.setViewportSize({ height: 900, width: 1920 })
    await page.reload()
    const widget = page.locator('.recents-widget')
    const addPin = widget.getByRole('button', { name: 'Pin document', exact: true })
    const drawer = page.locator('.list-drawer.drawer--is-open')

    await expect(widget.locator('.document-card__title')).toHaveCount(4)
    await expect(widget.locator('.recents-widget__item--add-pin')).toHaveCount(0)
    await expect(addPin).toHaveCount(0)
    await expect(widget.locator('.recents-widget__pagination')).toContainText('1 of 2')
    const viewportBox = await widget.locator('.recents-widget__viewport').boundingBox()
    const paginationBox = await widget.locator('.recents-widget__pagination').boundingBox()
    const pageStatusBox = await widget.locator('.recents-widget__page-status').boundingBox()
    const previousBox = await widget
      .getByRole('button', { name: 'Previous', exact: true })
      .boundingBox()
    const nextBox = await widget.getByRole('button', { name: 'Next', exact: true }).boundingBox()

    expect(paginationBox!.y + paginationBox!.height).toBeLessThanOrEqual(viewportBox!.y)
    expect(previousBox!.x + previousBox!.width).toBeLessThanOrEqual(pageStatusBox!.x)
    expect(nextBox!.x).toBeGreaterThanOrEqual(pageStatusBox!.x + pageStatusBox!.width)
    expect(previousBox!.y + previousBox!.height / 2).toBeCloseTo(
      pageStatusBox!.y + pageStatusBox!.height / 2,
      1,
    )
    expect(nextBox!.y + nextBox!.height / 2).toBeCloseTo(
      pageStatusBox!.y + pageStatusBox!.height / 2,
      1,
    )
    await expect(widget.locator('.document-card__thumbnail--empty .icon--document')).toHaveCount(4)
    const pins = widget.locator('.recents-widget__pin')

    await page.mouse.move(0, 0)
    await expect(pins.nth(0)).toHaveCSS('opacity', '0')
    await widget.locator('.document-card__title').first().hover()
    await expect(pins.nth(0)).toHaveCSS('opacity', '1')
    await expect(pins.nth(1)).toHaveCSS('opacity', '0')
    await widget.locator('.document-card__title').first().focus()
    await page.mouse.move(0, 0)
    await expect(pins.nth(0)).toHaveCSS('opacity', '1')
    await expect(pins.nth(1)).toHaveCSS('opacity', '0')
    await widget.getByRole('button', { name: 'Next', exact: true }).click()
    await expect(widget.locator('.document-card__title')).toHaveCount(0)
    await expect(widget.locator('.recents-widget__pagination')).toContainText('2 of 2')
    await expect(widget.locator('.recents-widget__item--add-pin')).toHaveCount(1)
    await expect(widget.locator('.recents-widget__item--empty')).toHaveCount(0)
    await page.route('**/api/payload-preferences/pinned-documents', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ body: '{}', contentType: 'application/json', status: 403 })
      } else {
        await route.continue()
      }
    })
    await addPin.click()
    await selectInput({
      multiSelect: false,
      option: 'Ticket',
      page,
      selectLocator: drawer.locator('.list-header__select-collection'),
    })
    await expect(drawer.getByRole('button', { name: tickets[4].title, exact: true })).toBeVisible()
    for (const ticket of tickets.slice(0, 4)) {
      await expect(drawer.getByRole('button', { name: ticket.title, exact: true })).toHaveCount(0)
    }
    await drawer.getByRole('button', { name: tickets[4].title, exact: true }).click()
    await expect(widget.locator('.recents-widget__status')).toContainText(
      'Could not save pinned documents.',
    )
    await expect(widget.locator('.document-card__title')).toHaveCount(0)
    await page.unroute('**/api/payload-preferences/pinned-documents')
    await addPin.click()
    await selectInput({
      multiSelect: false,
      option: 'Ticket',
      page,
      selectLocator: drawer.locator('.list-header__select-collection'),
    })
    await drawer.getByRole('button', { name: tickets[4].title, exact: true }).click()
    await expect(widget.locator('.recents-widget__pagination')).toContainText('1 of 2')
    await expect(widget.locator('.document-card__title').first()).toHaveText(tickets[4].title)
    await widget.getByRole('button', { name: 'Next', exact: true }).click()
    await expect(widget.locator('.document-card__title')).toHaveCount(1)
    await expect(widget.locator('.recents-widget__item--add-pin')).toHaveCount(1)
  })

  test('activity widget paginates one grid row and resets the page when changing tabs', async ({
    page,
  }) => {
    const tickets = (await (await page.request.get(`${serverURL}/api/tickets?limit=7`)).json()).docs

    expect(tickets).toHaveLength(7)
    await page.request.post(`${serverURL}/api/payload-preferences/recently-viewed`, {
      data: {
        value: {
          items: tickets.map((ticket) => ({
            id: ticket.id,
            collectionSlug: 'tickets',
            viewedAt: new Date().toISOString(),
          })),
        },
      },
    })
    await page.setViewportSize({ height: 900, width: 1920 })
    await page.goto(url.admin)
    const dashboard = new DashboardHelper(page)

    await dashboard.setEditing()
    await dashboard.resizeWidget(2, 'full')
    await dashboard.stepNavButtons.nth(1).click()
    const widget = page.locator('.recents-widget')

    await widget.getByRole('button', { name: 'Recently viewed' }).click()
    await expect(widget.locator('.document-card__title')).toHaveCount(4)
    await expect(widget.locator('.recents-widget__pagination')).toContainText('1 of 2')
    await widget.getByRole('button', { name: 'Next', exact: true }).click()
    await expect(widget.locator('.document-card__title')).toHaveCount(3)
    await expect(widget.locator('.document-card__title').first()).toHaveText(tickets[4].title)
    await expect(widget.getByRole('button', { name: 'Next', exact: true })).toBeDisabled()
    await widget.getByRole('button', { name: 'Pinned', exact: true }).click()
    await widget.getByRole('button', { name: 'Recently viewed' }).click()
    await expect(widget.locator('.recents-widget__pagination')).toContainText('1 of 2')
    await expect(widget.locator('.document-card__title').first()).toHaveText(tickets[0].title)

    await page.setViewportSize({ height: 900, width: 375 })
    await expect(widget.locator('.document-card__title')).toHaveCount(1)
    await expect(widget.locator('.recents-widget__pagination')).toContainText('1 of 7')
  })

  test('activity widget retains pinned draft documents without a separate drafts tab', async ({
    page,
  }) => {
    const response = await page.request.post(`${serverURL}/api/draft-posts?draft=true`, {
      data: { title: 'Widget draft' },
    })
    expect(response.ok()).toBe(true)
    const { doc } = await response.json()
    const pin = await page.request.post(`${serverURL}/api/payload-preferences/pinned-documents`, {
      data: { value: { items: [{ id: doc.id, collectionSlug: 'draft-posts' }] } },
    })
    expect(pin.ok()).toBe(true)
    await page.reload()
    const widget = page.locator('.recents-widget')

    await expect(
      widget
        .getByRole('group', { name: 'Recents and pinned', exact: true })
        .first()
        .getByRole('button'),
    ).toHaveCount(2)
    await expect(widget.getByRole('button', { name: 'Recent drafts', exact: true })).toHaveCount(0)
    await expect(widget.locator('.document-card__title')).toHaveText('Widget draft')
    await expect(widget.locator('.recents-widget__status-pill')).toHaveText('Draft')
    await widget.getByRole('link', { name: /Widget draft/ }).click()
    await expect(page.locator('#field-title')).toHaveValue('Widget draft')
  })

  test('activity widget collections filter shows inclusion checkboxes and excludes unchecked', async ({
    page,
  }) => {
    const ticketsUrl = new AdminUrlUtil(serverURL, 'tickets')
    const eventsUrl = new AdminUrlUtil(serverURL, 'events')

    const ticket = (await (await page.request.get(`${serverURL}/api/tickets?limit=1`)).json())
      .docs[0]
    const event = (await (await page.request.get(`${serverURL}/api/events?limit=1`)).json()).docs[0]
    const pin = await page.request.post(`${serverURL}/api/payload-preferences/pinned-documents`, {
      data: { value: { items: [{ id: ticket.id, collectionSlug: 'tickets' }] } },
    })

    expect(pin.ok()).toBe(true)

    // Record both documents as recently viewed.
    await page.goto(ticketsUrl.edit(ticket.id))
    await expect(page.locator('#field-title')).toHaveValue(ticket.title)
    await page.goto(eventsUrl.edit(event.id))
    await expect(page.locator('#field-title')).toHaveValue(event.title)

    await page.goto(url.admin)

    const d = new DashboardHelper(page)
    const activityCard = d.widgetByPos(2).locator('.recently-viewed-widget')
    await activityCard.getByRole('button', { name: 'Recently viewed' }).click()
    await expect(activityCard.locator('.document-card__title')).toHaveCount(2)

    // Open the activity widget configuration.
    await d.setEditing()
    const widget = d.widgetByPos(2)
    await widget.hover()
    await widget.locator('.widget-wrapper__edit-btn').click()

    const drawer = page.locator('.drawer__content:visible')
    await expect(drawer).toBeVisible()

    const collectionsField = drawer.locator('.recently-viewed-collections-field')
    await expect(collectionsField).toBeVisible()
    await expect(collectionsField).toHaveAccessibleDescription('Filter Recently viewed only.')
    await expect(collectionsField.locator('.field-description')).toHaveText(
      'Filter Recently viewed only.',
    )

    // Every collection is included (checked) by default - the stored exclusion list is empty.
    const checkboxes = collectionsField.locator('.checkbox-input')

    await expect.poll(() => checkboxes.count()).toBeGreaterThanOrEqual(3)
    const checkboxCount = await checkboxes.count()

    await expect(collectionsField.locator('.checkbox-input--checked')).toHaveCount(checkboxCount)

    // Unchecking "Tickets" adds it to the stored exclusion list.
    const ticketsOption = collectionsField.locator('.recently-viewed-collections-field__option', {
      hasText: 'Tickets',
    })
    await expect(ticketsOption.locator('input[type="checkbox"]')).toBeEnabled()
    await ticketsOption.locator('label').click()
    await expect(ticketsOption.locator('.checkbox-input')).not.toHaveClass(
      /checkbox-input--checked/,
    )

    await drawer.getByRole('button', { name: 'Save Changes' }).click()
    await expect(drawer).toBeHidden()

    await d.saveChangesAndValidate()

    // The excluded collection's document drops out; the remaining document still renders.
    await activityCard.getByRole('button', { name: 'Recently viewed' }).click()
    const rowTitles = activityCard.locator('.document-card__title')
    await expect(rowTitles).toHaveCount(1)
    await expect(rowTitles.nth(0)).toHaveText(event.title)
    await activityCard.getByRole('button', { name: 'Pinned', exact: true }).click()
    await expect(rowTitles).toHaveText(ticket.title)
  })

  test('respects min and max width', async ({ page }) => {
    const d = new DashboardHelper(page)
    await d.setEditing()
    await d.assertWidthRange({ max: 'full', min: 'full', position: 1 })
    await d.assertWidthRange({ max: 'full', min: 'small', position: 2 })
    await d.assertWidthRange({ max: 'full', min: 'full', position: 3 })
    await d.assertWidthRange({ max: 'medium', min: 'x-small', position: 4 })
    await d.assertWidthRange({ max: 'medium', min: 'x-small', position: 5 })
    await d.assertWidthRange({ max: 'medium', min: 'x-small', position: 6 })
    await d.assertWidthRange({ max: 'medium', min: 'x-small', position: 7 })
    await d.assertWidthRange({ max: 'full', min: 'medium', position: 8 })
    await d.assertWidthRange({ max: 'full', min: 'x-small', position: 9 })
    await d.assertWidthRange({ max: 'full', min: 'x-small', position: 10 })
    await d.assertWidthRange({ max: 'full', min: 'x-small', position: 11 })
    await d.assertWidthRange({ max: 'full', min: 'x-small', position: 12 })
    await d.assertWidthRange({ max: 'full', min: 'x-small', position: 13 })
    await d.assertWidthRange({ max: 'full', min: 'x-small', position: 14 })
    await d.assertWidthRange({ max: 'full', min: 'x-small', position: 15 })
    await d.assertWidthRange({ max: 'full', min: 'x-small', position: 16 })
  })

  test('resize widget', async ({ page }) => {
    const d = new DashboardHelper(page)
    await d.setEditing()
    await d.assertWidget(4, 'count', 'x-small')
    await d.resizeWidget(4, 'medium')
    await d.assertWidget(4, 'count', 'medium')
    await d.saveChangesAndValidate()
  })

  test('add widget', async ({ page }) => {
    const d = new DashboardHelper(page)
    await d.setEditing()
    await d.addWidget('revenue')
    await d.assertWidget(TOTAL_WIDGETS + 1, 'revenue', 'medium')
    await d.saveChangesAndValidate()
  })

  test('should include every upload collection by default and use the selected destination', async ({
    page,
  }) => {
    test.setTimeout(60000)
    const d = new DashboardHelper(page)

    await expect(page.locator('.upload-dropzone-widget')).toHaveCount(0)
    await d.setEditing()
    await d.addWidget('Upload files')

    const widget = d.widgetByPos(TOTAL_WIDGETS + 1)
    await widget.hover()
    await widget.locator('.widget-wrapper__edit-btn').click()

    const drawer = page.locator('.drawer__content:visible')
    const collectionsField = drawer
    await expect(
      collectionsField.getByRole('checkbox', { name: 'Media', exact: true }),
    ).toBeChecked()
    await expect(
      collectionsField.getByRole('checkbox', { name: 'Media Alts', exact: true }),
    ).toBeChecked()
    await drawer.getByRole('button', { name: 'Save Changes' }).click()
    await expect(drawer).toBeHidden()
    await d.saveChangesAndValidate()

    const dropzone = widget.locator('.upload-dropzone-widget__dropzone')
    await expect(dropzone).toBeVisible()
    const icon = widget.locator('.upload-dropzone-widget__icon')
    await expect(icon).toHaveCSS('color', 'rgb(0, 123, 229)')
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark'
    })
    await expect(icon).toHaveCSS('color', 'rgb(128, 202, 255)')
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'light'
    })
    await widget.getByRole('button', { name: 'Upload files' }).click()

    const modal = page.locator('#bulk-upload-modal-slug-1')
    await expect(modal).toBeVisible()
    await expect(modal.locator('.bulk-upload--add-files')).toBeVisible()
    const destination = modal.locator('.bulk-upload--add-files__collectionSelect')
    await expect(destination).toBeVisible()
    await selectInput({
      multiSelect: false,
      option: 'Media Alt',
      page,
      selectLocator: destination,
    })
    await expect(destination).toContainText('Media Alt')
    await modal
      .locator('.dropzone input[type="file"]')
      .setInputFiles(path.resolve(dirname, 'test/uploads/image.png'))
    await expect(modal.getByText('image.png')).toBeVisible()
    await expect(modal.locator('#field-description')).toBeVisible()
    await modal.locator('#field-description').fill('Description before switching')
    const fileDestination = modal.locator('.file-selections__collectionSelect')
    await expect(fileDestination).toBeVisible()

    await openSelectMenu({ page, selectLocator: fileDestination })
    await getSelectMenu({ page }).getByText('Media', { exact: true }).click()
    await expect(fileDestination.locator('.react-select--single-value')).toHaveText('Media')
    await expect(modal.locator('#field-description')).toHaveCount(0)
    await expect(modal.getByText('image.png')).toBeVisible()

    const fileManager = modal.locator('.file-manager')
    await fileManager.locator('.file-manager__remove').click()
    const replacementInput = fileManager.locator('.upload-dropzone-content__hidden-input')
    await replacementInput.setInputFiles({
      name: 'incompatible.pdf',
      buffer: Buffer.from('pdf'),
      mimeType: 'application/pdf',
    })
    await expect(fileManager.locator('.file-manager__selected-preview')).toHaveCount(0)
    await replacementInput.setInputFiles(path.resolve(dirname, 'test/uploads/image.png'))
    await expect(fileManager.locator('#field-filemanager-filename')).toHaveValue('image.png')

    await modal.getByRole('button', { name: 'Add Files' }).click()
    const addMoreFiles = page.locator('#bulk-upload-modal--add-more-files')
    const addMoreInput = addMoreFiles.locator('.upload-dropzone-content__hidden-input')
    await expect(addMoreInput).toHaveAttribute('accept', 'image/*')
    await addMoreInput.setInputFiles({
      name: 'incompatible.pdf',
      buffer: Buffer.from('pdf'),
      mimeType: 'application/pdf',
    })
    await expect(addMoreFiles).toBeVisible()
    await expect(modal.getByText('incompatible.pdf')).toHaveCount(0)
    await addMoreFiles.getByRole('button', { name: 'Close', exact: true }).click()

    await selectInput({
      multiSelect: false,
      option: 'Media Alt',
      page,
      selectLocator: fileDestination,
    })
    await expect(modal.locator('#field-description')).toBeVisible()
    await expect(modal.locator('#field-description')).toHaveValue('Description before switching')

    await modal.getByRole('button', { name: 'Add Files' }).click()
    await expect(addMoreFiles.locator('.bulk-upload--add-files__collectionSelect')).toBeVisible()
    await addMoreFiles.locator('.dropzone input[type="file"]').setInputFiles({
      name: 'dashboard.pdf',
      buffer: Buffer.from('pdf'),
      mimeType: 'application/pdf',
    })
    await expect(modal.getByText('dashboard.pdf')).toBeVisible()
    await expect(fileDestination).toBeVisible()
    await openSelectMenu({ page, selectLocator: fileDestination })
    const incompatibleDestination = getSelectMenu({ page }).getByRole('option', {
      name: 'Media (Accepts: image/*)',
      exact: true,
    })
    await expect(incompatibleDestination).toHaveAttribute('aria-disabled', 'true')
    await incompatibleDestination.click({ force: true })
    await expect(fileDestination.locator('.react-select--single-value')).toHaveText('Media Alt')
    await modal.locator('.dialog-title').click()

    await modal.getByRole('button', { name: 'Add Files' }).click()
    const addMoreDestination = addMoreFiles.locator('.bulk-upload--add-files__collectionSelect')
    await expect(addMoreDestination).toBeVisible()
    await openSelectMenu({ page, selectLocator: addMoreDestination })
    await expect(
      getSelectMenu({ page }).getByRole('option', {
        name: 'Media (Accepts: image/*)',
        exact: true,
      }),
    ).toHaveAttribute('aria-disabled', 'true')
    await addMoreFiles.locator('.dialog-title').click()
    await addMoreFiles.getByRole('button', { name: 'Close', exact: true }).click()
    await modal
      .locator('.file-selections__fileRowContainer')
      .filter({ hasText: 'dashboard.pdf' })
      .locator('.file-selections__remove--overlay')
      .click()
    await expect(fileDestination).toBeVisible()
    await openSelectMenu({ page, selectLocator: fileDestination })
    await expect(
      getSelectMenu({ page }).getByRole('option', { name: 'Media', exact: true }),
    ).not.toHaveAttribute('aria-disabled', 'true')
    await modal.locator('.dialog-title').click()

    await modal.locator('#field-description').fill('Uploaded from the dashboard')
    try {
      await modal.locator('.bulk-upload--actions-bar__saveButtons button').click()
      await expect(modal).toBeHidden()
      const uploadedMedia = await page.request.get(`${serverURL}/api/media-alt?limit=10`)
      expect(uploadedMedia.ok()).toBe(true)
      expect((await uploadedMedia.json()).docs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            description: 'Uploaded from the dashboard',
            filename: 'image.png',
          }),
        ]),
      )

      await dropzone.dispatchEvent('dragenter')
      await expect(dropzone).toHaveClass(/dragging/)
      await expect(dropzone.getByText('Drop files to upload')).toBeVisible()

      await dropzone.evaluate((element) => {
        const transfer = new DataTransfer()
        transfer.items.add(new File(['pdf'], 'dashboard.pdf', { type: 'application/pdf' }))
        element.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: transfer }))
      })

      await expect(modal).toBeVisible()
      await expect(modal.getByText('dashboard.pdf')).toBeVisible()
      await expect(fileDestination).toBeVisible()
      await openSelectMenu({ page, selectLocator: fileDestination })
      await expect(
        getSelectMenu({ page }).getByRole('option', {
          name: 'Media (Accepts: image/*)',
          exact: true,
        }),
      ).toHaveAttribute('aria-disabled', 'true')
    } finally {
      const uploadDirectory = path.resolve(dirname, 'media-alt')
      await rm(path.join(uploadDirectory, 'image.png'), { force: true })
      await rmdir(uploadDirectory).catch((err: NodeJS.ErrnoException) => {
        if (err.code !== 'ENOENT' && err.code !== 'ENOTEMPTY') {
          throw err
        }
      })
    }
  })

  test('should exclude an upload collection and preserve the choice after reload', async ({
    page,
  }) => {
    const d = new DashboardHelper(page)
    await d.setEditing()
    await d.addWidget('Upload files')
    const widget = d.widgetByPos(TOTAL_WIDGETS + 1)
    await widget.hover()
    await widget.locator('.widget-wrapper__edit-btn').click()

    const drawer = page.locator('.drawer__content:visible')
    const collectionsField = drawer.locator('.recently-viewed-collections-field')
    await collectionsField.getByRole('checkbox', { name: 'Media', exact: true }).uncheck()
    await expect(
      collectionsField.getByRole('checkbox', { name: 'Media Alts', exact: true }),
    ).toBeChecked()
    await drawer.getByRole('button', { name: 'Save Changes' }).click()
    await d.saveChangesAndValidate()
    await page.reload()

    const dropzoneWidget = page.locator('.upload-dropzone-widget')
    await dropzoneWidget.getByRole('button', { name: 'Upload files' }).click()
    const modal = page.locator('#bulk-upload-modal-slug-1')
    await expect(modal.locator('.bulk-upload--add-files__collectionSelect')).toHaveCount(0)
    await modal.getByRole('button', { name: 'Close' }).click()

    await d.setEditing()
    await d.widgetByPos(TOTAL_WIDGETS + 1).hover()
    await d
      .widgetByPos(TOTAL_WIDGETS + 1)
      .locator('.widget-wrapper__edit-btn')
      .click()
    const savedField = page.locator('.drawer__content:visible')
    await expect(savedField.getByRole('checkbox', { name: 'Media', exact: true })).not.toBeChecked()
    await expect(
      savedField.getByRole('checkbox', { name: 'Media Alts', exact: true }),
    ).toBeChecked()
  })

  test('delete widget', async ({ page }) => {
    const d = new DashboardHelper(page)
    await d.setEditing()
    await d.deleteWidget(3)
    await d.assertWidget(3, 'count', 'x-small')
    await d.assertWidget(8, 'private', 'full')
    await expect(d.widgets).toHaveCount(TOTAL_WIDGETS - 1)
    await d.saveChangesAndValidate()
  })

  test('edit widget data is reverted when dashboard editing is canceled', async ({ page }) => {
    const d = new DashboardHelper(page)
    await d.setEditing()
    let countWidget = d.widgetByPos(4)
    let countWidgetTitle = countWidget.locator('.count-widget h3')
    await expect(countWidgetTitle).toHaveText('Tickets')

    await d.editWidget(4, 'Open Tickets')
    await expect(countWidgetTitle).toHaveText('Open Tickets')

    await d.cancelEditing()

    countWidget = d.widgetByPos(4)
    countWidgetTitle = countWidget.locator('.count-widget h3')
    await expect(countWidgetTitle).toHaveText('Tickets')
  })

  test('edit widget data persists after dashboard save and reload', async ({ page }) => {
    const d = new DashboardHelper(page)
    await d.setEditing()
    const countWidget = d.widgetByPos(4)
    const countWidgetTitle = countWidget.locator('.count-widget h3')
    await expect(countWidgetTitle).toHaveText('Tickets')

    await d.editWidget(4, 'Open Tickets')
    await expect(countWidgetTitle).toHaveText('Open Tickets')

    await d.stepNavButtons.nth(1).click()
    await expect(countWidgetTitle).toHaveText('Open Tickets')

    // Re-enter edit mode without page refresh and edit again.
    await d.setEditing()
    await expect(countWidgetTitle).toHaveText('Open Tickets')
    await d.editWidget(4, 'Title changed again')
    await expect(countWidgetTitle).toHaveText('Title changed again')

    await d.saveChangesAndValidate()
    await expect(countWidgetTitle).toHaveText('Title changed again')
  })

  test('empty dashboard - delete all widgets', async ({ page }) => {
    const d = new DashboardHelper(page)
    await d.setEditing()
    while ((await d.widgets.count()) > 0) {
      await d.deleteWidget(1)
    }
    await expect(d.widgets).toHaveCount(0)
    await expect(page.getByText('There are no widgets on your dashboard')).toBeVisible()
    await d.saveChangesAndValidate()
  })

  test('Widgets should expand to the height of the tallest widget in the row', async ({ page }) => {
    // For this test we need to put 2 widgets with different default heights in the same row
    const d = new DashboardHelper(page)
    await d.setEditing()
    await d.deleteWidget(4)
    await d.deleteWidget(4)
    await d.resizeWidget(6, 'medium')
    // validateLayout already takes care of verifying that
    await d.saveChangesAndValidate()
  })

  test('cancel editing', async ({ page }) => {
    const d = new DashboardHelper(page)
    await d.setEditing()
    await d.addWidget('revenue')
    await d.cancelEditing()
    await expect(d.widgets).toHaveCount(TOTAL_WIDGETS)
    await d.validateLayout()
  })

  test('reset layout', async ({ page }) => {
    const d = new DashboardHelper(page)
    await d.setEditing()
    await d.addWidget('revenue')
    await d.saveChangesAndValidate()
    await d.resetLayout()
    await expect(d.widgets).toHaveCount(TOTAL_WIDGETS)
    await d.validateLayout()
  })

  test('move widgets', async ({ page }) => {
    const d = new DashboardHelper(page)
    await d.setEditing()
    // Fit the whole dashboard in the viewport so dragging never triggers a mid-drag scroll. dnd-kit
    // measures droppable rects at drag start, so an instant programmatic scroll (from
    // scrollIntoViewIfNeeded) would leave those rects stale and break collision detection.
    const { width } = page.viewportSize()!
    const contentHeight = await page.evaluate(() => document.body.scrollHeight)
    await page.setViewportSize({ height: Math.max(contentHeight + 100, 720), width })
    // moveWidget already contains validations
    await d.moveWidget(4, 1) // to first position
    await d.moveWidget(1, 2, 'after') // after the Welcome widget
    await d.moveWidget(2, TOTAL_WIDGETS, 'after') // to last position
    await d.moveWidget(TOTAL_WIDGETS, 7, 'before') // before first full-width row after counts
    await d.saveChangesAndValidate()
  })

  test('cannot move or edit widgets when not editing', async ({ page }) => {
    const d = new DashboardHelper(page)
    await d.assertIsEditing(false)

    // Delete buttons should not be visible when not editing
    const widget = d.widgetByPos(3)
    const dragHandle = widget.getByRole('button', { name: 'Drag to reorder' })

    await widget.hover()
    await expect(d.getDeleteWidgetButton(widget)).toBeHidden()

    await expect(dragHandle).toHaveCount(0)

    // verify the opposite:
    await d.setEditing()
    await expect(d.getDeleteWidgetButton(widget)).toBeVisible()
    await expect(dragHandle).toBeVisible()
    await expect(dragHandle).toBeEnabled()
  })

  test('Responsiveness - all widgets have a 100% width on mobile', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ height: 667, width: 500 })
    const d = new DashboardHelper(page)
    const widgets = await d.widgets.all()
    for (const widget of widgets) {
      await expect(async () => {
        const dashboardBox = (await d.dashboard.boundingBox())!
        const widgetBox = (await widget.boundingBox())!
        expect(widgetBox.width).toBe(dashboardBox.width)
      }).toPass({ timeout: 1000 })
    }
  })

  test('widget config drawer validates required fields on submit', async ({ page }) => {
    const d = new DashboardHelper(page)
    await d.setEditing()

    const widget = d.widgetByPos(4)
    await widget.hover()
    await widget.locator('.widget-wrapper__edit-btn').click()

    const drawer = page.locator('.drawer__content:visible')
    await expect(drawer).toBeVisible()

    const titleInput = drawer.locator('input[name="title"]').first()
    await expect(titleInput).toBeVisible({ timeout: 60000 })

    await titleInput.fill('')
    await page.waitForTimeout(500)
    await drawer.getByRole('button', { name: 'Save Changes' }).click()

    await expect(page.locator('[id^="field-error-title"]')).toBeVisible()
    await expect(drawer).toBeVisible()

    await titleInput.fill('Valid Title')
    await page.waitForTimeout(500)
    await drawer.getByRole('button', { name: 'Save Changes' }).click()
    await expect(drawer).toBeHidden()
  })

  // TODO: reorder widgets with keyboard (for a11y reasons)
  // It's already working. But I'd like to test it properly with a screen reader and everything.

  test('widget labels are displayed correctly in the add widget drawer', async ({ page }) => {
    const d = new DashboardHelper(page)
    await d.setEditing()
    await d.openAddWidgetDrawer()

    // Verify custom labels are displayed (English)
    await expect(async () => {
      const labels = await d.getWidgetLabelsInDrawer()
      expect(labels).toContain('Count Widget')
      expect(labels).toContain('Private Widget')
      expect(labels).toContain('Revenue Chart')
      // The default 'collections' widget should use toWords fallback
      expect(labels).toContain('Collections')
    }).toPass({ timeout: 1000 })
  })

  test('widget config drawer validates custom validate function', async ({ page }) => {
    const d = new DashboardHelper(page)
    await d.setEditing()
    await d.addWidget('configurable')
    const widgetCount = await d.widgets.count()
    const widget = d.widgetByPos(widgetCount)

    await widget.hover()
    await widget.locator('.widget-wrapper__edit-btn').click()

    const drawer = page.locator('.drawer__content:visible')
    await expect(drawer).toBeVisible()

    const titleInput = drawer.locator('input[name="title"]').first()
    await expect(titleInput).toBeVisible({ timeout: 60000 })

    await titleInput.fill('Test Title')

    const descriptionInput = drawer.locator('textarea[name="description"]')
    await descriptionInput.fill('short')
    await page.waitForTimeout(500)
    await drawer.getByRole('button', { name: 'Save Changes' }).click()

    await expect(page.locator('[id^="field-error-description"]')).toContainText(
      'Description must be at least 10 characters',
    )
    await expect(drawer).toBeVisible()

    await descriptionInput.fill('This description is long enough')
    await page.waitForTimeout(500)
    await drawer.getByRole('button', { name: 'Save Changes' }).click()
    await expect(drawer).toBeHidden()
  })

  test('widget config drawer supports relationship fields', async ({ page }) => {
    const d = new DashboardHelper(page)
    await d.setEditing()
    await d.addWidget('configurable')
    const widgetCount = await d.widgets.count()
    const widget = d.widgetByPos(widgetCount)

    await widget.hover()
    await widget.locator('.widget-wrapper__edit-btn').click()

    const drawer = page.locator('.drawer__content:visible')
    await expect(drawer).toBeVisible()

    const titleInput = drawer.locator('input[name="title"]').first()
    await expect(titleInput).toBeVisible({ timeout: 60000 })
    await titleInput.fill('Widget with Ticket')

    const relationshipField = drawer.locator('.field-type.relationship')
    await expect(relationshipField).toBeVisible()

    await relationshipField.locator('.rs__control').click()
    const firstOption = page.locator('.rs__option').first()
    await expect(firstOption).toBeVisible()
    await firstOption.click()

    await page.waitForTimeout(500)
    await drawer.getByRole('button', { name: 'Save Changes' }).click()
    await expect(drawer).toBeHidden()

    await widget.hover()
    await widget.locator('.widget-wrapper__edit-btn').click()
    await expect(drawer).toBeVisible()
    const selectedValue = drawer.locator('.field-type.relationship .rs__single-value')
    await expect(selectedValue).toBeVisible({ timeout: 60000 })
    await expect(selectedValue).not.toBeEmpty()
    await drawer.getByRole('button', { name: 'Save Changes' }).click()
    await expect(drawer).toBeHidden()
  })

  test('localized widget fields persist data per locale', async ({ page }) => {
    const d = new DashboardHelper(page)

    await d.setEditing()
    await d.addWidget('configurable')
    const widgetCount = await d.widgets.count()
    const widgetPos = widgetCount

    // Edit in English locale (default)
    const widget = d.widgetByPos(widgetPos)
    await widget.hover()
    await widget.locator('.widget-wrapper__edit-btn').click()

    let drawer = page.locator('.drawer__content:visible')
    await expect(drawer).toBeVisible()

    let titleInput = drawer.locator('input[name="title"]').first()
    await expect(titleInput).toBeVisible({ timeout: 60000 })
    await titleInput.fill('English Title')

    // Fill nested localized field (inside a group)
    let nestedInput = drawer.locator('input[name="nestedGroup.nestedText"]').first()
    await expect(nestedInput).toBeVisible()
    await nestedInput.fill('Nested English')

    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(500)
    await drawer.getByRole('button', { name: 'Save Changes' }).click()
    await expect(drawer).toBeHidden()

    await d.saveChangesAndValidate()

    // Switch to Spanish locale
    await page.goto(`${url.admin}?locale=es`)
    const d2 = new DashboardHelper(page)
    await d2.setEditing()

    const widgetEs = d2.widgetByPos(widgetPos)
    await widgetEs.hover()
    await widgetEs.locator('.widget-wrapper__edit-btn').click()

    drawer = page.locator('.drawer__content:visible')
    await expect(drawer).toBeVisible()

    titleInput = drawer.locator('input[name="title"]').first()
    await expect(titleInput).toBeVisible({ timeout: 60000 })
    // Localized fields should be empty in Spanish (not set yet)
    await expect(titleInput).toHaveValue('')

    nestedInput = drawer.locator('input[name="nestedGroup.nestedText"]').first()
    await expect(nestedInput).toHaveValue('')

    await titleInput.fill('Título en Español')
    await nestedInput.fill('Texto anidado')
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(500)
    await drawer.getByRole('button', { name: 'Save Changes' }).click()
    await expect(drawer).toBeHidden()

    await d2.saveChangesAndValidate()

    // Switch back to English and verify original values persisted
    await page.goto(`${url.admin}?locale=en`)
    const d3 = new DashboardHelper(page)
    await d3.setEditing()

    const widgetEn = d3.widgetByPos(widgetPos)
    await widgetEn.hover()
    await widgetEn.locator('.widget-wrapper__edit-btn').click()

    drawer = page.locator('.drawer__content:visible')
    await expect(drawer).toBeVisible()

    titleInput = drawer.locator('input[name="title"]').first()
    await expect(titleInput).toBeVisible({ timeout: 60000 })
    await expect(titleInput).toHaveValue('English Title')

    nestedInput = drawer.locator('input[name="nestedGroup.nestedText"]').first()
    await expect(nestedInput).toHaveValue('Nested English')

    await drawer.getByRole('button', { name: 'Save Changes' }).click()
    await expect(drawer).toBeHidden()
  })

  test('widget re-renders when query params change (= modular dashboard RSC rerenders)', async ({
    page,
  }) => {
    test.slow()

    const d = new DashboardHelper(page)
    await d.setEditing()
    await d.addWidget('page query')
    await d.assertWidget(TOTAL_WIDGETS + 1, 'page-query', 'x-small')
    await d.saveChangesAndValidate()

    // Find the page-query widget
    const pageQueryWidget = page.locator('.page-query-widget')
    await expect(pageQueryWidget).toBeVisible()

    // Initially, page should be 0 (default)
    await expect(pageQueryWidget.getByText(/Current page from query: 0/)).toBeVisible()

    // Click the increment button
    const incrementButton = pageQueryWidget.getByRole('button', { name: /Increment Page/ })
    await incrementButton.click()

    // The page number should update to 1 without a page refresh
    // This test will fail until the server component re-renders when query params change
    await expect(pageQueryWidget.getByText(/Current page from query: 1/)).toBeVisible()

    // Click again to increment to 2
    await incrementButton.click()
    await expect(pageQueryWidget.getByText(/Current page from query: 2/)).toBeVisible()
  })
})
