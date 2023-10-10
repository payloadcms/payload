import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'

import { saveDocAndAssert } from '../helpers'
import { AdminUrlUtil } from '../helpers/adminUrlUtil'
import { initPayloadTest } from '../helpers/configHelpers'

const { beforeAll, describe } = test
let url: AdminUrlUtil

const slug = 'nested-fields'

let page: Page

describe('Nested Fields', () => {
  beforeAll(async ({ browser }) => {
    const { serverURL } = await initPayloadTest({
      __dirname,
      init: {
        local: false,
      },
    })

    url = new AdminUrlUtil(serverURL, slug)

    const context = await browser.newContext()
    page = await context.newPage()
  })

  test('should save deeply nested fields', async () => {
    const assertionValue = 'sample block value'

    await page.goto(url.create)

    await page.locator('#field-array > button').click()
    await page.locator('#field-array__0__group__namedTab__blocks > button').click()
    await page.locator('button[title="Block With Field"]').click()

    await page.locator('#field-array__0__group__namedTab__blocks__0__text').fill(assertionValue)

    await saveDocAndAssert(page)

    await expect(page.locator('#field-array__0__group__namedTab__blocks__0__text')).toHaveValue(
      assertionValue,
    )
  })
})
