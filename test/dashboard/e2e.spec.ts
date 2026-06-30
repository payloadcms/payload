/* eslint-disable playwright/expect-expect */
import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import { ensureCompilationIsDone } from '../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { reInitializeDB } from '../__helpers/shared/clearAndSeed/reInitializeDB.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { DashboardHelper } from './utils.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, beforeEach, describe } = test

const { serverURL } = await initPayloadE2ENoConfig({
  dirname,
})

const TOTAL_WIDGETS = 14
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
    const d = new DashboardHelper(page)
    await expect(d.widgets).toHaveCount(TOTAL_WIDGETS)

    await d.assertIsEditing(false)
    await d.assertWidget(1, 'collections', 'full')
    await d.assertWidget(2, 'count', 'x-small')
    await d.assertWidget(3, 'count', 'x-small')
    await d.assertWidget(4, 'count', 'x-small')
    await d.assertWidget(5, 'count', 'x-small')
    await d.assertWidget(6, 'revenue', 'full')
    await d.assertWidget(7, 'private', 'full')
    await d.assertWidget(8, 'collection-query', 'medium')
    await d.assertWidget(9, 'collection-query', 'medium')
    await d.assertWidget(10, 'collection-query', 'x-small')
    await d.assertWidget(11, 'collection-query', 'x-small')
    await d.assertWidget(12, 'collection-query', 'x-small')
    await d.assertWidget(13, 'collection-query', 'x-small')
    await d.assertWidget(14, 'collection-query', 'medium')
    await d.validateLayout()
  })

  test('collection-query default layout includes valid and stale config examples', async ({
    page,
  }) => {
    const d = new DashboardHelper(page)

    await d.assertWidget(8, 'collection-query', 'medium')
    await d.assertWidget(9, 'collection-query', 'medium')
    await d.assertWidget(10, 'collection-query', 'x-small')
    await d.assertWidget(11, 'collection-query', 'x-small')
    await d.assertWidget(12, 'collection-query', 'x-small')
    await d.assertWidget(13, 'collection-query', 'x-small')
    await expect(
      d.widgetByPos(8).locator('.collection-query-widget .collection-query-widget__title'),
    ).toHaveText('Top revenue entries')
    await expect(
      d.widgetByPos(9).locator('.collection-query-widget .collection-query-widget__title'),
    ).toHaveText('Event timeline')
  })

  test('collection-query short widget grows to its row height', async ({ page }) => {
    const d = new DashboardHelper(page)

    const shortCard = d.widgetByPos(8).locator('.collection-query-widget')
    const longCard = d.widgetByPos(9).locator('.collection-query-widget')
    const shortRows = shortCard.locator('.collection-query-widget__row')

    await expect(shortRows).toHaveCount(3)
    await expect(async () => {
      const shortCardBox = (await shortCard.boundingBox())!
      const longCardBox = (await longCard.boundingBox())!

      expect(shortCardBox.height).toBe(longCardBox.height)
    }).toPass({ timeout: 1000 })
    await expect(async () => {
      const hasScrollableRows = await shortCard
        .locator('.collection-query-widget__rows')
        .evaluate((el) => {
          return el.scrollHeight > el.clientHeight
        })

      expect(hasScrollableRows).toBe(false)
    }).toPass({ timeout: 1000 })
  })

  test('collection-query row metadata shows configured sort values', async ({ page }) => {
    const d = new DashboardHelper(page)

    const shortCard = d.widgetByPos(8).locator('.collection-query-widget')
    const longCard = d.widgetByPos(9).locator('.collection-query-widget')

    await expect(async () => {
      const amountLabels = await shortCard
        .locator('.collection-query-widget__row-meta')
        .allTextContents()

      expect(amountLabels).toHaveLength(3)
      for (const amountLabel of amountLabels) {
        expect(amountLabel.trim()).toMatch(/^\d/)
      }
    }).toPass({ timeout: 1000 })

    await expect(async () => {
      const dateLabels = (
        await longCard.locator('.collection-query-widget__row-meta').allTextContents()
      ).map((label) => label.trim())

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
    const timelineCard = d.widgetByPos(9).locator('.collection-query-widget')

    // Spanish relative time via Intl.RelativeTimeFormat('es'): "hace ...", "dentro de ...",
    // "la semana pasada", "el próximo mes". None of these strings appear in the English output.
    const englishMarker = /(?:\sago$|^in\s|^now$|^today$|^tomorrow$|^yesterday$|^(?:next|last)\s)/
    const spanishPast = /^hace\s|pasad[ao]|^ayer$|^anteayer$/
    const spanishFuture = /^dentro de\s|^en\s|próxim[ao]|^mañana$/

    await expect(async () => {
      const dateLabels = (
        await timelineCard.locator('.collection-query-widget__row-meta').allTextContents()
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

    const longCard = d.widgetByPos(9).locator('.collection-query-widget')
    const longRows = longCard.locator('.collection-query-widget__row')
    const maxVisibleRows = 5

    // Matches the number of seeded "Dashboard demo" events in test/dashboard/seed.ts.
    await expect(longRows).toHaveCount(22)
    await expect(async () => {
      const hasScrollableRows = await longCard
        .locator('.collection-query-widget__rows')
        .evaluate((el) => {
          return el.scrollHeight > el.clientHeight
        })
      expect(hasScrollableRows).toBe(true)
    }).toPass({ timeout: 1000 })
    await expect(async () => {
      const rowViewport = await longCard.locator('.collection-query-widget__rows').evaluate(
        (el, { maxVisibleRows }) => {
          const rows = Array.from(el.querySelectorAll<HTMLElement>('.collection-query-widget__row'))
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
    await longCard.locator('.collection-query-widget__rows').evaluate((el) => {
      el.scrollTop = el.scrollHeight
    })
    await expect(longCard.locator('.collection-query-widget__title')).toBeVisible()
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

    const nestedCard = d.widgetByPos(14).locator('.collection-query-widget')

    await expect(nestedCard.locator('.collection-query-widget__title')).toHaveText(
      'Events by priority',
    )
    // The nested sort field is valid, so the widget renders rows instead of a config error.
    await expect(d.widgetByPos(14).locator('.collection-query-widget--error')).toHaveCount(0)

    const rows = nestedCard.locator('.collection-query-widget__row')
    await expect(rows).toHaveCount(4)

    // Row metadata reflects `details.priority`, sorted descending (seed priorities: 10, 30, 20, 5).
    await expect(async () => {
      const priorityLabels = (
        await nestedCard.locator('.collection-query-widget__row-meta').allTextContents()
      ).map((label) => label.trim())

      expect(priorityLabels).toEqual(['30', '20', '10', '5'])
    }).toPass({ timeout: 1000 })
  })

  test('respects min and max width', async ({ page }) => {
    const d = new DashboardHelper(page)
    await d.setEditing()
    await d.assertWidthRange({ max: 'full', min: 'full', position: 1 })
    await d.assertWidthRange({ max: 'medium', min: 'x-small', position: 2 })
    await d.assertWidthRange({ max: 'medium', min: 'x-small', position: 3 })
    await d.assertWidthRange({ max: 'medium', min: 'x-small', position: 4 })
    await d.assertWidthRange({ max: 'medium', min: 'x-small', position: 5 })
    await d.assertWidthRange({ max: 'full', min: 'medium', position: 6 })
    await d.assertWidthRange({ max: 'full', min: 'x-small', position: 7 })
    await d.assertWidthRange({ max: 'full', min: 'x-small', position: 8 })
    await d.assertWidthRange({ max: 'full', min: 'x-small', position: 9 })
    await d.assertWidthRange({ max: 'full', min: 'x-small', position: 10 })
    await d.assertWidthRange({ max: 'full', min: 'x-small', position: 11 })
    await d.assertWidthRange({ max: 'full', min: 'x-small', position: 12 })
    await d.assertWidthRange({ max: 'full', min: 'x-small', position: 13 })
    await d.assertWidthRange({ max: 'full', min: 'x-small', position: 14 })
  })

  test('resize widget', async ({ page }) => {
    const d = new DashboardHelper(page)
    await d.setEditing()
    await d.assertWidget(2, 'count', 'x-small')
    await d.resizeWidget(2, 'medium')
    await d.assertWidget(2, 'count', 'medium')
    await d.saveChangesAndValidate()
  })

  test('add widget', async ({ page }) => {
    const d = new DashboardHelper(page)
    await d.setEditing()
    await d.addWidget('revenue')
    await d.assertWidget(TOTAL_WIDGETS + 1, 'revenue', 'medium')
    await d.saveChangesAndValidate()
  })

  test('delete widget', async ({ page }) => {
    const d = new DashboardHelper(page)
    await d.setEditing()
    await d.deleteWidget(1)
    await d.assertWidget(1, 'count', 'x-small')
    await d.assertWidget(6, 'private', 'full')
    await expect(d.widgets).toHaveCount(TOTAL_WIDGETS - 1)
    await d.saveChangesAndValidate()
  })

  test('edit widget data is reverted when dashboard editing is canceled', async ({ page }) => {
    const d = new DashboardHelper(page)
    await d.setEditing()
    let secondWidget = d.widgetByPos(2)
    let secondWidgetTitle = secondWidget.locator('.count-widget h3')
    await expect(secondWidgetTitle).toHaveText('Tickets')

    await d.editWidget(2, 'Open Tickets')
    await expect(secondWidgetTitle).toHaveText('Open Tickets')

    await d.cancelEditing()

    secondWidget = d.widgetByPos(2)
    secondWidgetTitle = secondWidget.locator('.count-widget h3')
    await expect(secondWidgetTitle).toHaveText('Tickets')
  })

  test('edit widget data persists after dashboard save and reload', async ({ page }) => {
    const d = new DashboardHelper(page)
    await d.setEditing()
    const secondWidget = d.widgetByPos(2)
    const secondWidgetTitle = secondWidget.locator('.count-widget h3')
    await expect(secondWidgetTitle).toHaveText('Tickets')

    await d.editWidget(2, 'Open Tickets')
    await expect(secondWidgetTitle).toHaveText('Open Tickets')

    await d.stepNavLast.locator('button').nth(1).click()
    await expect(secondWidgetTitle).toHaveText('Open Tickets')

    // Re-enter edit mode without page refresh and edit again.
    await d.setEditing()
    await expect(secondWidgetTitle).toHaveText('Open Tickets')
    await d.editWidget(2, 'Title changed again')
    await expect(secondWidgetTitle).toHaveText('Title changed again')

    await d.saveChangesAndValidate()
    await expect(secondWidgetTitle).toHaveText('Title changed again')
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
    await d.deleteWidget(2)
    await d.deleteWidget(2)
    await d.resizeWidget(4, 'medium')
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
    // moveWidget already contains validations
    await d.moveWidget(2, 1) // to first position
    await d.moveWidget(1, 2, 'after') // after last in row
    await d.moveWidget(2, TOTAL_WIDGETS, 'after') // to last position
    await d.moveWidget(TOTAL_WIDGETS, 5, 'before') // before first full-width row after counts
    await d.saveChangesAndValidate()
  })

  test('cannot move or edit widgets when not editing', async ({ page }) => {
    const d = new DashboardHelper(page)
    await d.assertIsEditing(false)

    // Delete buttons should not be visible when not editing
    const widget = d.widgetByPos(1)
    await widget.hover()
    await expect(widget.getByText('Delete widget')).toBeHidden()

    // Widgets should not have draggable attributes when not editing
    await expect(widget.locator('.draggable')).not.toHaveAttribute('aria-disabled')

    // verify the opposite:
    await d.setEditing()
    await expect(widget.getByText('Delete widget')).toBeVisible()
    await expect(widget.locator('.draggable')).toHaveAttribute('aria-disabled', 'false')
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

    const widget = d.widgetByPos(2)
    await widget.hover()
    await widget.locator('.widget-wrapper__edit-btn').click()

    const drawer = page.locator('.drawer__content:visible')
    await expect(drawer).toBeVisible()

    const titleInput = drawer.locator('input[name="title"]').first()
    await expect(titleInput).toBeVisible({ timeout: 60000 })

    await titleInput.fill('')
    await page.waitForTimeout(500)
    await drawer.getByRole('button', { name: 'Save Changes' }).click()

    await expect(drawer.locator('.field-error')).toBeVisible()
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

    await expect(drawer.locator('.field-error .tooltip-content')).toContainText(
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
    test.skip(process.env.PAYLOAD_FRAMEWORK === 'tanstack-start', 'TanStack: known post-hydration RSC view remount detaches the view mid-interaction (see framework adapter notes); re-enable when the TanStack RSC hydration is fixed.')
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
