import type { Page } from 'playwright'

import { expect } from '@playwright/test'

export class LexicalHelpers {
  page: Page
  constructor(page: Page) {
    this.page = page
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
    command: 'block' | 'check' | 'code' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' |'h6' | 'inline' 
    | 'link' | 'ordered' | 'paragraph' | 'quote' | 'relationship' | 'unordered' | 'upload',
  ) {
    await this.page.keyboard.press(`/`)

    const slashMenuPopover = this.page.locator('#slash-menu .slash-menu-popup')
    await expect(slashMenuPopover).toBeVisible()
    await this.page.keyboard.type(command)
    await this.page.keyboard.press(`Enter`)
    await expect(slashMenuPopover).toBeHidden()
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

  get paragraph() {
    return this.editor.locator('p')
  }
}
