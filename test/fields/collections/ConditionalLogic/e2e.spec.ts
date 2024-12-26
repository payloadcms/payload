import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../helpers/sdk/index.js'
import type { Config } from '../../payload-types.js'

import { ensureCompilationIsDone, initPageConsoleErrorCatch } from '../../../helpers.js'
import { AdminUrlUtil } from '../../../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../../../helpers/reInitializeDB.js'
import { RESTClient } from '../../../helpers/rest.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { conditionalLogicSlug } from '../../slugs.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, beforeEach, describe } = test

let payload: PayloadTestSDK<Config>
let client: RESTClient
let page: Page
let serverURL: string
let url: AdminUrlUtil

const toggleConditionAndCheckField = async (toggleLocator: string, fieldLocator: string) => {
  const toggle = page.locator(toggleLocator)

  if (!(await toggle.isChecked())) {
    await expect(page.locator(fieldLocator)).toBeHidden()
    await toggle.click()
    await expect(page.locator(fieldLocator)).toBeVisible()
  } else {
    await expect(page.locator(fieldLocator)).toBeVisible()
    await toggle.click()
    await expect(page.locator(fieldLocator)).toBeHidden()
  }
}

describe('Conditional Logic', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig({
      dirname,
      // prebuild,
    }))

    url = new AdminUrlUtil(serverURL, conditionalLogicSlug)

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ page, serverURL })
  })

  beforeEach(async () => {
    await reInitializeDB({
      serverURL,
      snapshotKey: 'fieldsTest',
      uploadsDir: path.resolve(dirname, './collections/Upload/uploads'),
    })
    if (client) {
      await client.logout()
    }
    client = new RESTClient(null, { defaultSlug: 'users', serverURL })
    await client.login()
    await ensureCompilationIsDone({ page, serverURL })
  })

  test("should conditionally render field based on another field's data", async () => {
    await page.goto(url.create)

    await toggleConditionAndCheckField(
      'label[for=field-toggleField]',
      'label[for=field-fieldWithCondition]',
    )

    expect(true).toBe(true)
  })

  test('should conditionally render custom field that renders a Payload field', async () => {
    await page.goto(url.create)

    await toggleConditionAndCheckField(
      'label[for=field-toggleField]',
      'label[for=field-customFieldWithField]',
    )

    expect(true).toBe(true)
  })

  test('should conditionally render custom field that wraps itself with the withCondition HOC (legacy)', async () => {
    await page.goto(url.create)

    await toggleConditionAndCheckField(
      'label[for=field-toggleField]',
      'label[for=field-customFieldWithHOC]',
    )

    expect(true).toBe(true)
  })

  test('should toggle conditional custom client field', async () => {
    await page.goto(url.create)
    await toggleConditionAndCheckField('label[for=field-toggleField]', '#custom-client-field')
    expect(true).toBe(true)
  })

  test('should conditionally render custom server field', async () => {
    await page.goto(url.create)
    await toggleConditionAndCheckField('label[for=field-toggleField]', '#custom-server-field')
    expect(true).toBe(true)
  })

  test('should conditionally render rich text fields', async () => {
    await page.goto(url.create)
    await toggleConditionAndCheckField(
      'label[for=field-toggleField]',
      '.field-type.rich-text-lexical',
    )
    expect(true).toBe(true)
  })

  test('should show conditional field based on user data', async () => {
    await page.goto(url.create)
    const userConditional = page.locator('input#field-userConditional')
    await expect(userConditional).toBeVisible()
  })

  test('should show conditional field based on nested field data', async () => {
    await page.goto(url.create)

    const parentGroupFields = page.locator(
      'div#field-parentGroup > .group-field__wrap > .render-fields',
    )
    await expect(parentGroupFields).toHaveCount(1)

    const toggle = page.locator('label[for=field-parentGroup__enableParentGroupFields]')
    await toggle.click()

    const toggledField = page.locator('input#field-parentGroup__siblingField')

    await expect(toggledField).toBeVisible()
  })

  test('should show conditional field based on siblingData', async () => {
    await page.goto(url.create)

    const toggle = page.locator('label[for=field-parentGroup__enableParentGroupFields]')
    await toggle.click()

    const fieldRelyingOnSiblingData = page.locator('input#field-reliesOnParentGroup')
    await expect(fieldRelyingOnSiblingData).toBeVisible()
  })

  test('should not render fields when adding array or blocks rows until form state returns', async () => {
    await page.goto(url.create)
    const addRowButton = page.locator('.array-field__add-row')
    const fieldWithConditionSelector = 'input#field-arrayWithConditionalField__0__textWithCondition'
    await addRowButton.click()

    const wasFieldAttached = await page
      .waitForSelector(fieldWithConditionSelector, {
        state: 'attached',
        timeout: 100, // A small timeout to catch any transient rendering
      })
      .catch(() => false) // If it doesn't appear, this resolves to `false`

    expect(wasFieldAttached).toBeFalsy()
    const fieldToToggle = page.locator('input#field-enableConditionalFields')
    await fieldToToggle.click()
    await expect(page.locator(fieldWithConditionSelector)).toBeVisible()
  })
})
