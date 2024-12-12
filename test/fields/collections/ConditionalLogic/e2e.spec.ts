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

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, beforeEach, describe } = test

let payload: PayloadTestSDK<Config>
let client: RESTClient
let page: Page
let serverURL: string
// If we want to make this run in parallel: test.describe.configure({ mode: 'parallel' })
let url: AdminUrlUtil

describe('Conditional Logic', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig({
      dirname,
      // prebuild,
    }))

    url = new AdminUrlUtil(serverURL, 'conditional-logic')

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

  test('should toggle conditional field when data changes', async () => {
    await page.goto(url.create)
    const toggleField = page.locator('label[for=field-toggleField]')

    // eslint-disable-next-line playwright/no-conditional-in-test
    if (!(await toggleField.isChecked())) {
      await toggleField.click()
    }

    await expect(page.locator('label[for=field-toggleField]')).toBeChecked()
    const fieldWithCondition = page.locator('input#field-fieldWithCondition')
    await expect(fieldWithCondition).toBeVisible()
  })

  test('should toggle conditional custom client field', async () => {
    await page.goto(url.create)
    const toggleField = page.locator('label[for=field-toggleField]')

    // eslint-disable-next-line playwright/no-conditional-in-test
    if (!(await toggleField.isChecked())) {
      await toggleField.click()
    }

    await expect(page.locator('label[for=field-toggleField]')).toBeChecked()
    const customFieldWithCondition = page.locator('#custom-client-field')
    await expect(customFieldWithCondition).toBeVisible()
  })

  test('should toggle conditional custom server field', async () => {
    await page.goto(url.create)
    const toggleField = page.locator('label[for=field-toggleField]')

    // eslint-disable-next-line playwright/no-conditional-in-test
    if (!(await toggleField.isChecked())) {
      await toggleField.click()
    }

    await expect(page.locator('label[for=field-toggleField]')).toBeChecked()
    const customFieldWithCondition = page.locator('#custom-server-field')
    await expect(customFieldWithCondition).toBeVisible()
  })

  test('should show conditional field based on user data', async () => {
    await page.goto(url.create)
    const userConditional = page.locator('input#field-userConditional')
    await expect(userConditional).toBeVisible()
  })

  test('should show conditional field based on fields nested within data', async () => {
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

  test('should show conditional field based on fields nested within siblingData', async () => {
    await page.goto(url.create)

    const toggle = page.locator('label[for=field-parentGroup__enableParentGroupFields]')
    await toggle.click()

    const fieldRelyingOnSiblingData = page.locator('input#field-reliesOnParentGroup')
    await expect(fieldRelyingOnSiblingData).toBeVisible()
  })
})
