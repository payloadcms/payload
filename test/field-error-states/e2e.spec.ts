import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'

import { initPageConsoleErrorCatch, saveDocAndAssert } from '../helpers'
import { AdminUrlUtil } from '../helpers/adminUrlUtil'
import { initPayloadE2E } from '../helpers/configHelpers'
import { slugs } from './shared'

const { beforeAll, describe } = test

let validateDraftsOff: AdminUrlUtil
let validateDraftsOn: AdminUrlUtil
let validateDraftsOnAutosave: AdminUrlUtil
let prevValue: AdminUrlUtil
let prevValueRelation: AdminUrlUtil

describe('field error states', () => {
  let serverURL: string
  let page: Page

  beforeAll(async ({ browser }) => {
    ;({ serverURL } = await initPayloadE2E(__dirname))
    validateDraftsOff = new AdminUrlUtil(serverURL, slugs.validateDraftsOff)
    validateDraftsOn = new AdminUrlUtil(serverURL, slugs.validateDraftsOn)
    prevValue = new AdminUrlUtil(serverURL, slugs.prevValue)
    prevValueRelation = new AdminUrlUtil(serverURL, slugs.prevValueRelation)
    validateDraftsOnAutosave = new AdminUrlUtil(serverURL, slugs.validateDraftsOnAutosave)
    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
  })

  test('Remove row should remove error states from parent fields', async () => {
    await page.goto(`${serverURL}/admin/collections/error-fields/create`)

    // add parent array
    await page.locator('#field-parentArray > .array-field__add-row').click()

    // add first child array
    await page.locator('#parentArray-row-0 .collapsible__content .array-field__add-row').click()
    await page.locator('#field-parentArray__0__childArray__0__childArrayText').focus()
    await page.keyboard.type('T1')

    // add second child array
    await page.locator('#parentArray-row-0 .collapsible__content .array-field__add-row').click()
    await page.locator('#field-parentArray__0__childArray__1__childArrayText').focus()
    await page.keyboard.type('T2')

    // add third child array
    await page.locator('#parentArray-row-0 .collapsible__content .array-field__add-row').click()
    await page.locator('#parentArray-0-childArray-row-2 .array-actions__button').click()
    await page
      .locator('#parentArray-0-childArray-row-2 .array-actions__action.array-actions__remove')
      .click()

    await page.locator('#action-save').click()

    const errorPill = await page.waitForSelector(
      '#parentArray-row-0 > .collapsible > .collapsible__toggle-wrap .array-field__row-error-pill',
      { state: 'hidden', timeout: 500 },
    )
    expect(errorPill).toBeNull()
  })

  describe('draft validations', () => {
    // eslint-disable-next-line playwright/expect-expect
    test('should not validate drafts by default', async () => {
      await page.goto(validateDraftsOff.create)
      await page.locator('#field-title').fill('temp')
      await page.locator('#field-title').fill('')
      await saveDocAndAssert(page, '#action-save-draft')
    })

    // eslint-disable-next-line playwright/expect-expect
    test('should validate drafts when enabled', async () => {
      await page.goto(validateDraftsOn.create)
      await page.locator('#field-title').fill('temp')
      await page.locator('#field-title').fill('')
      await saveDocAndAssert(page, '#action-save-draft', 'error')
    })

    // eslint-disable-next-line playwright/expect-expect
    test('should show validation errors when validate and autosave are enabled', async () => {
      await page.goto(validateDraftsOnAutosave.create)
      await page.locator('#field-title').fill('valid')
      await saveDocAndAssert(page)
      await page.locator('#field-title').fill('')
      await saveDocAndAssert(page, '#action-save', 'error')
    })
  })

  describe('previous values', () => {
    test('should pass previous value into validate function', async () => {
      // save original
      await page.goto(prevValue.create)
      await page.locator('#field-title').fill('original value')
      await saveDocAndAssert(page)
      await page.locator('#field-title').fill('original value 2')
      await saveDocAndAssert(page)

      // create relation to doc
      await page.goto(prevValueRelation.create)
      await page.locator('#field-previousValueRelation .react-select').click()
      await page.locator('#field-previousValueRelation .rs__option').first().click()
      await saveDocAndAssert(page)

      // go back to doc
      await page.goto(prevValue.list)
      await page.locator('.row-1 a').click()
      await page.locator('#field-description').fill('some description')
      await saveDocAndAssert(page)
      await page.locator('#field-title').fill('changed')
      await saveDocAndAssert(page, '#action-save', 'error')

      // ensure value is the value before relationship association
      await page.reload()
      await expect(page.locator('#field-title')).toHaveValue('original value 2')
    })
  })
})
