import type { BrowserContext, Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../helpers/sdk/index.js'
import type { Config } from '../../payload-types.js'

import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  // throttleTest,
} from '../../../helpers.js'
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
let context: BrowserContext

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
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({
      dirname,
      // prebuild,
    }))

    url = new AdminUrlUtil(serverURL, conditionalLogicSlug)

    context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ page, serverURL })
  })

  beforeEach(async () => {
    // await throttleTest({
    //   page,
    //   context,
    //   delay: 'Fast 4G',
    // })

    await reInitializeDB({
      serverURL,
      snapshotKey: 'fieldsTest',
      uploadsDir: path.resolve(dirname, './collections/Upload/uploads'),
    })

    if (client) {
      await client.logout()
    }

    client = new RESTClient({ defaultSlug: 'users', serverURL })
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
    await page.locator('#field-arrayWithConditionalField .array-field__add-row').click()
    const shimmer = '#field-arrayWithConditionalField .collapsible__content > .shimmer-effect'

    await expect(page.locator(shimmer)).toBeVisible()

    await expect(page.locator(shimmer)).toBeHidden()

    // Do not use `waitForSelector` here, as it will wait for the selector to appear, not disappear
    // eslint-disable-next-line playwright/no-wait-for-selector
    const wasFieldAttached = await page
      .waitForSelector('input#field-arrayWithConditionalField__0__textWithCondition', {
        state: 'attached',
        timeout: 100, // A small timeout to catch any transient rendering
      })
      .catch(() => false) // If it doesn't appear, this resolves to `false`

    expect(wasFieldAttached).toBeFalsy()

    const fieldToToggle = page.locator('input#field-enableConditionalFields')
    await fieldToToggle.click()

    await expect(
      page.locator('input#field-arrayWithConditionalField__0__textWithCondition'),
    ).toBeVisible()
  })

  test('should render field based on path argument', async () => {
    await page.goto(url.create)

    const arrayOneButton = page.locator('#field-arrayOne .array-field__add-row')
    await arrayOneButton.click()

    const arrayTwoButton = page.locator('#arrayOne-row-0 .array-field__add-row')
    await arrayTwoButton.click()

    const arrayThreeButton = page.locator('#arrayOne-0-arrayTwo-row-0 .array-field__add-row')
    await arrayThreeButton.click()

    const numberField = page.locator('#field-arrayOne__0__arrayTwo__0__arrayThree__0__numberField')

    await expect(numberField).toBeHidden()

    const selectField = page.locator('#field-arrayOne__0__arrayTwo__0__selectOptions')

    await selectField.click({ delay: 100 })
    const options = page.locator('.rs__option')

    await options.locator('text=Option Two').click()

    await expect(numberField).toBeVisible()
  })
})
