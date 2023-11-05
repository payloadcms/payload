import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'

import type { RESTClient } from '../helpers/rest'

import { AdminUrlUtil } from '../helpers/adminUrlUtil'

const { describe } = test

export const lexicalE2E = (client: RESTClient, page: Page, serverURL: string) => {
  async function navigateToRichTextFields() {
    const url: AdminUrlUtil = new AdminUrlUtil(serverURL, 'rich-text-fields')
    await page.goto(url.list)
    await page.locator('.row-1 .cell-title a').click()
  }

  return () => {
    describe('todo', () => {
      test.skip('todo', async () => {
        await navigateToRichTextFields()

        await page.locator('todo').first().click()
      })
    })
  }
}
