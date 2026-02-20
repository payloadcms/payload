/* eslint-disable perfectionist/sort-classes */

import type { WidgetWidth } from 'payload'

import { expect, type Page } from '@playwright/test'

export class DashboardHelper {
  private page: Page

  constructor(page: Page) {
    this.page = page
  }

  get dashboard() {
    return this.page.locator('.modular-dashboard')
  }

  get widgets() {
    return this.page.locator('.widget')
  }

  get stepNavLast() {
    return this.page.locator('.step-nav__last')
  }

  widgetByPos = (pos: number) => this.page.locator(`.modular-dashboard > :nth-child(${pos})`)

  getSnapshot = async (): Promise<[slug: string, width: WidgetWidth][]> => {
    const widgets: [slug: string, width: WidgetWidth][] = await Promise.all(
      (await this.widgets.all()).map(async (widget) => [
        (await widget.getAttribute('data-slug'))!,
        (await widget.getAttribute('data-width')) as WidgetWidth,
      ]),
    )
    return widgets
  }

  /**
   * - Verify that flex wrap is working correctly (If a node exceeds 100% of the available width, it should go in the row below)
   * - Verify that the nodes are positioned without gaps or overlap
   * - Verify that all nodes in a row have the same height
   */
  validateLayout = async () => {
    const WIDTH_TO_COLS = {
      'x-small': 3,
      small: 4,
      medium: 6,
      large: 8,
      'x-large': 9,
      full: 12,
    }
    const widgets = await this.widgets.all()
    let currentPos = 0
    for (let index = 0; index < widgets.length; index++) {
      const widget = widgets[index]!
      const width = await widget.getAttribute('data-width')
      if (!width) {
        throw new Error(`Widget has no width`)
      }
      const cols = WIDTH_TO_COLS[width as WidgetWidth]
      const dashboardBox = await this.dashboard.boundingBox()
      const widgetBox = await widget.boundingBox()
      if (!widgetBox || !dashboardBox) {
        throw new Error('Widget or dashboard box not found')
      }

      // Determine expected position
      let expectedX: number
      if (currentPos === 0 || currentPos + cols > 12) {
        // Widget is at the start of a new row
        expectedX = dashboardBox.x
      } else {
        // Widget continues on the same row
        const previousWidgetBox = (await widgets[index - 1]!.boundingBox())!
        expectedX = previousWidgetBox.x + previousWidgetBox.width
        expect(widgetBox.y + widgetBox.height).toBe(previousWidgetBox.y + previousWidgetBox.height)
        const innerWidgetBox = (await widget.locator('.draggable').boundingBox())!
        expect(innerWidgetBox.y + innerWidgetBox.height).toBe(widgetBox.y + widgetBox.height - 6) // 6px padding
      }

      expect(widgetBox.x).toBe(expectedX)

      // Update currentPos, wrapping to new row if needed
      currentPos += cols
      if (currentPos >= 12) {
        expect(widgetBox.x + widgetBox.width).toBe(dashboardBox.x + dashboardBox.width)
        currentPos = 0
      }
    }
  }

  resizeWidget = async (position: number, width: WidgetWidth) => {
    const widget = this.widgetByPos(position)
    await widget.hover()
    const widthButton = widget.locator('.widget-wrapper__size-btn')
    await expect(widthButton).toBeVisible()
    await widthButton.click()
    const activePopup = this.page.locator('.popup__content:visible')
    await expect(activePopup).toBeVisible()
    const widthOptions = activePopup.locator('.popup-button-list__button')
    await widthOptions.getByText(width).click()
    const slug = await widget.getAttribute('data-slug')
    if (!slug) {
      throw new Error(`Widget at position ${position} has no slug`)
    }
    await this.assertWidget(position, slug, width)
  }

  assertWidthRange = async (arg: { max: WidgetWidth; min: WidgetWidth; position: number }) => {
    const widget = this.widgetByPos(arg.position)
    await widget.hover()
    const widthButton = widget.locator('.widget-wrapper__size-btn')
    if ((await widthButton.count()) === 0) {
      await expect(widget).toHaveAttribute('data-width', arg.min)
      await expect(widget).toHaveAttribute('data-width', arg.max)
      return
    }
    await expect(widthButton).toBeVisible()
    await widthButton.click()
    const activePopup = this.page.locator('.popup__content:visible')
    await expect(activePopup).toBeVisible()
    const widthOptions = activePopup.locator('.popup-button-list__button')
    await expect(widthOptions.first().locator('span').first()).toHaveText(arg.min)
    await expect(widthOptions.last().locator('span').first()).toHaveText(arg.max)
  }

  assertWidget = async (pos: number, slug: string, width: WidgetWidth) => {
    const widget = this.widgetByPos(pos)
    await expect(widget).toHaveAttribute('data-slug', new RegExp(`^${slug}`))
    await expect(widget).toHaveAttribute('data-width', width)
  }

  setEditing = async () => {
    await this.stepNavLast.locator('button').click()
    await this.stepNavLast.getByText('Edit Dashboard').click()
    await expect(this.stepNavLast.getByText('Editing Dashboard')).toBeVisible()
  }

  resetLayout = async () => {
    await this.stepNavLast.locator('button').click()
    await this.stepNavLast.getByText('Reset Layout').click()
  }

  assertIsEditing = async (shouldBe: boolean) => {
    if (shouldBe) {
      await expect(this.stepNavLast.getByText('Editing Dashboard')).toBeVisible()
      await expect(this.stepNavLast.locator('button')).toHaveCount(3)
      await expect(this.stepNavLast.locator('button').nth(0)).toHaveText('Add +')
      await expect(this.stepNavLast.locator('button').nth(1)).toHaveText('Save Changes')
      await expect(this.stepNavLast.locator('button').nth(2)).toHaveText('Cancel')
    } else {
      await expect(this.stepNavLast.locator('button')).toHaveCount(1)
      await expect(this.stepNavLast.getByTitle('Dashboard')).toBeVisible()
    }
  }

  addWidget = async (slug: string) => {
    const widgetsCount = await this.widgets.count()
    await this.stepNavLast.locator('button').nth(0).click()
    await this.page.locator('.drawer__content').getByText(slug).click()
    await expect(this.widgets).toHaveCount(widgetsCount + 1)
    // Wait for highlight animation to complete (1.5s animation + buffer)
    await this.page.waitForTimeout(1600)
  }

  openAddWidgetDrawer = async () => {
    await this.stepNavLast.locator('button').nth(0).click()
    await expect(this.page.locator('.drawer__content')).toBeVisible()
  }

  getWidgetLabelsInDrawer = async (): Promise<string[]> => {
    const labels: string[] = []
    const cards = this.page.locator('.drawer__content .thumbnail-card__label')
    const count = await cards.count()
    for (let i = 0; i < count; i++) {
      const text = await cards.nth(i).textContent()
      if (text) {
        labels.push(text)
      }
    }
    return labels
  }

  deleteWidget = async (position: number) => {
    const widgetsCount = await this.widgets.count()
    const widget = this.widgetByPos(position)
    const widgetDomElem = await widget.elementHandle()
    await widget.hover()
    await widget.getByText('Delete widget').click()
    expect(await widgetDomElem?.isHidden()).toBe(true)
    await expect(this.widgets).toHaveCount(widgetsCount - 1)
  }

  editWidget = async (position: number, title: string) => {
    const widget = this.widgetByPos(position)
    await widget.hover()
    await widget.locator('.widget-wrapper__edit-btn').click()

    const drawer = this.page.locator('.drawer__content:visible')
    await expect(drawer).toBeVisible()
    const titleInput = drawer.locator('input[name="title"], input[name="data.title"]').first()
    await expect(titleInput).toBeVisible({ timeout: 60000 })
    await titleInput.fill(title)
    await drawer.getByRole('button', { name: 'Save Changes' }).click()
  }

  cancelEditing = async () => {
    await this.stepNavLast.locator('button').nth(2).click()
    const confirmButton = this.page.locator('#confirm-action')
    await confirmButton.click()
    await this.assertIsEditing(false)
    // Wait for any layout changes/transitions to settle
    await this.page.waitForTimeout(200)
  }

  saveChangesAndValidate = async () => {
    const snapshot = await this.getSnapshot()
    await this.assertIsEditing(true)
    await this.stepNavLast.locator('button').nth(1).click()
    await this.assertIsEditing(false)
    await this.validateLayout()
    await this.page.reload()
    await this.validateLayout()
    const snapshotAfter = await this.getSnapshot()
    expect(snapshotAfter).toEqual(snapshot)
  }

  moveWidget = async (from: number, to: number, place: 'after' | 'before' = 'before') => {
    const srcWidget = this.widgetByPos(from)
    const srcWidgetBox = (await srcWidget.boundingBox())!
    const targetWidget = this.widgetByPos(to)
    const snapshot = await this.getSnapshot()

    // there are two droppable widgets for each widget: one before and one after
    await expect(this.page.locator('.droppable-widget')).toHaveCount(snapshot.length * 2)

    // all droppable widgets should be transparent
    for (const droppable of await this.page.locator('.droppable-widget').all()) {
      const bgColor = await droppable.evaluate((el) => window.getComputedStyle(el).backgroundColor)
      expect(bgColor).toBe('rgba(0, 0, 0, 0)') // transparent
    }

    // here we make the DnD
    await this.page.mouse.move(
      srcWidgetBox.x + srcWidgetBox.width / 2,
      srcWidgetBox.y + srcWidgetBox.height / 2,
    )
    await this.page.mouse.down()
    await targetWidget.scrollIntoViewIfNeeded()
    const targetWidgetBox = (await targetWidget.boundingBox())!
    await this.page.mouse.move(
      targetWidgetBox.x + targetWidgetBox.width / 2 + (place === 'after' ? 5 : -5),
      targetWidgetBox.y + targetWidgetBox.height / 2,
      {
        // steps is important: move slightly to trigger the drag sensor of DnD-kit
        steps: 10,
      },
    )
    // the droppable widget should be highlighted
    const droppable = this.page.getByTestId(`${snapshot[to - 1]![0]}-${place}`)
    const bgColor = await droppable.evaluate((el) => window.getComputedStyle(el).backgroundColor)
    expect(bgColor).not.toBe('rgba(0, 0, 0, 0)')
    await this.page.mouse.up()
    await this.page.waitForTimeout(400) // dndkit animation

    // validate that the move was successful with the new order
    const snapshotAfter = await this.getSnapshot()
    const expectedSnapshot = moveArrayItem(snapshot, from, to, place)
    expect(snapshotAfter).toEqual(expectedSnapshot)
  }
}

// utility function to move an item in an array
// from and to are 1-based positions (not 0-based indices)
function moveArrayItem<T>(
  arr: T[],
  from: number,
  to: number,
  place: 'after' | 'before' = 'before',
): T[] {
  const copy: T[] = [...arr]

  // Convert 1-based positions to 0-based indices
  const fromIndex = from - 1
  const toIndex = to - 1

  const item = copy.splice(fromIndex, 1)[0]!

  let insertIndex = toIndex
  if (place === 'after') {
    insertIndex = toIndex + 1
  }

  // Adjust insert index if we removed an item before it
  if (fromIndex < insertIndex) {
    insertIndex -= 1
  }

  copy.splice(insertIndex, 0, item)

  return copy
}
