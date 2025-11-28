/* eslint-disable perfectionist/sort-classes */

import type { WidgetWidth } from 'payload'

import { expect, type Page } from '@playwright/test'

export class DashboardHelper {
  private page: Page

  constructor(page: Page) {
    this.page = page
  }

  get dashboard() {
    return this.page.locator('.grid-layout')
  }

  get widgets() {
    return this.page.locator('.widget')
  }

  get stepNavLast() {
    return this.page.locator('.step-nav__last')
  }

  widgetByPos = (pos: number) => this.page.locator(`.grid-layout > :nth-child(${pos})`)

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
    const widthPopup = widget.locator('.popup')
    await expect(widthPopup).toBeVisible()
    await widthPopup.click()
    const widthOptions = widthPopup.locator('.popup-button-list__button')
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
    const widthPopup = widget.locator('.popup')
    await expect(widthPopup).toBeVisible()
    if (await widthPopup.isDisabled()) {
      await expect(widget).toHaveAttribute('data-width', arg.min)
      await expect(widget).toHaveAttribute('data-width', arg.max)
      return
    }
    await widthPopup.click()
    const widthOptions = widthPopup.locator('.popup-button-list__button')
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
    await this.stepNavLast.locator('button').nth(0).click()
    await this.page.locator('.drawer__content').getByText(slug).click()
  }

  deleteWidget = async (position: number) => {
    const widgetsCount = await this.widgets.count()
    const widget = this.widgetByPos(position)
    const widgetDomElem = await widget.elementHandle()
    await widget.hover()
    await widget.getByTitle('Delete widget').click()
    expect(await widgetDomElem?.isHidden()).toBe(true)
    await expect(this.widgets).toHaveCount(widgetsCount - 1)
  }

  cancelEditing = async () => {
    await this.stepNavLast.locator('button').nth(2).click()
  }

  resetLayout = async () => {
    await this.stepNavLast.locator('button').nth(1).click()
  }

  saveChanges = async () => {
    await this.stepNavLast.locator('button').nth(1).click()
  }
}
