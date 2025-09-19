import type { Locator, Page } from 'playwright'

import { expect } from '@playwright/test'
import { wait } from 'payload/shared'

export class LexicalHelpers {
  page: Page
  constructor(page: Page) {
    this.page = page
  }

  async addLine(
    type: 'check' | 'h1' | 'h2' | 'ordered' | 'paragraph' | 'unordered',
    text: string,
    indent: number,
    startWithEnter = true,
  ) {
    if (startWithEnter) {
      await this.page.keyboard.press('Enter')
    }
    await this.slashCommand(type)
    // Outdent 10 times to be sure we are at the beginning of the line
    for (let i = 0; i < 10; i++) {
      await this.page.keyboard.press('Shift+Tab')
    }
    const adjustedIndent = ['check', 'ordered', 'unordered'].includes(type) ? indent - 1 : indent
    for (let i = 0; i < adjustedIndent; i++) {
      await this.page.keyboard.press('Tab')
    }
    await this.page.keyboard.type(text)
  }

  async clickFixedToolbarButton({
    buttonKey,
    dropdownKey,
  }: {
    buttonKey?: string
    dropdownKey?: string
  }): Promise<{
    dropdownItems?: Locator
  }> {
    if (dropdownKey) {
      await this.fixedToolbar.locator(`[data-dropdown-key="${dropdownKey}"]`).click()

      const dropdownItems = this.page.locator(`.toolbar-popup__dropdown-items`)
      await expect(dropdownItems).toBeVisible()

      if (buttonKey) {
        await dropdownItems.locator(`[data-item-key="${buttonKey}"]`).click()
      }
      return {
        dropdownItems,
      }
    }

    if (buttonKey) {
      await this.fixedToolbar.locator(`[data-item-key="${buttonKey}"]`).click()
    }
    return {}
  }

  async clickInlineToolbarButton({
    buttonKey,
    dropdownKey,
  }: {
    buttonKey?: string
    dropdownKey?: string
  }): Promise<{
    dropdownItems?: Locator
  }> {
    if (dropdownKey) {
      await this.inlineToolbar.locator(`[data-dropdown-key="${dropdownKey}"]`).click()

      const dropdownItems = this.page.locator(`.toolbar-popup__dropdown-items`)
      await expect(dropdownItems).toBeVisible()

      if (buttonKey) {
        await dropdownItems.locator(`[data-item-key="${buttonKey}"]`).click()
      }
      return {
        dropdownItems,
      }
    }

    if (buttonKey) {
      await this.inlineToolbar.locator(`[data-item-key="${buttonKey}"]`).click()
    }
    return {}
  }

  async paste(type: 'html' | 'markdown', text: string) {
    await this.page.evaluate(
      async ([text, type]) => {
        const blob = new Blob([text!], { type: type === 'html' ? 'text/html' : 'text/markdown' })
        const clipboardItem = new ClipboardItem({ 'text/html': blob })
        await navigator.clipboard.write([clipboardItem])
      },
      [text, type],
    )
    await this.page.keyboard.press(`ControlOrMeta+v`)
  }

  async save(container: 'document' | 'drawer') {
    if (container === 'drawer') {
      await this.drawer.getByText('Save').click()
    } else {
      throw new Error('Not implemented')
    }
    await this.page.waitForTimeout(1000)
  }

  async slashCommand(
    // prettier-ignore
    command: ('block' | 'check' | 'code' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' |'h6' | 'inline'
    | 'link' | 'ordered' | 'paragraph' | 'quote' | 'relationship' | 'table' | 'unordered'|'upload') | ({} & string),
    expectMenuToClose = true,
  ) {
    await this.page.keyboard.press(`/`)

    const slashMenuPopover = this.page.locator('#slash-menu .slash-menu-popup')
    await expect(slashMenuPopover).toBeVisible()
    await this.page.keyboard.type(command)
    await wait(200)
    await this.page.keyboard.press(`Enter`)
    if (expectMenuToClose) {
      await expect(slashMenuPopover).toBeHidden()
    }
  }

  get decorator() {
    return this.editor.locator('[data-lexical-decorator="true"]')
  }

  get drawer() {
    return this.page.locator('.drawer__content')
  }

  get editor() {
    return this.page.locator('[data-lexical-editor="true"]')
  }

  get fixedToolbar() {
    return this.page.locator('.fixed-toolbar')
  }

  get inlineToolbar() {
    return this.page.locator('.inline-toolbar-popup')
  }

  get paragraph() {
    return this.editor.locator('p')
  }
}
