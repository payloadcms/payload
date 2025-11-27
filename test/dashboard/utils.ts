/* eslint-disable perfectionist/sort-classes */

import type { WidgetWidth } from 'payload'

import { expect, type Page } from '@playwright/test'

export class DashboardHelper {
  private page: Page

  constructor(page: Page) {
    this.page = page
  }

  get widgets() {
    return this.page.locator('.widget')
  }

  get stepNavLast() {
    return this.page.locator('.step-nav__last')
  }

  widgetByPos = (pos: number) => this.page.locator(`.grid-layout > :nth-child(${pos})`)

  resizeWidget = async (widgetId: string, width: WidgetWidth) => {
    await this.page.locator(`[data-slug="${widgetId}"]`).hover()
    await this.page.locator(`[data-slug="${widgetId}"]`).getByRole('button').nth(1).click()
    await this.page.getByRole('option', { name: width }).click()
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
    await expect(widthOptions.first()).toHaveText(arg.min)
    await expect(widthOptions.last()).toHaveText(arg.max)
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

  deleteWidget = async (widgetId: string) => {
    await this.page.locator(`[data-slug="${widgetId}"]`).hover()
    await this.page.locator(`[data-slug="${widgetId}"]`).getByRole('button').nth(2).click()
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
