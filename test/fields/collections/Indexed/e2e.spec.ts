import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../helpers/sdk/index.js'
import type { Config } from '../../payload-types.js'

import { ensureCompilationIsDone, initPageConsoleErrorCatch } from '../../../helpers.js'
import { AdminUrlUtil } from '../../../helpers/adminUrlUtil.js'
import { assertToastErrors } from '../../../helpers/assertToastErrors.js'
import { initPayloadE2ENoConfig } from '../../../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../../../helpers/reInitializeDB.js'
import { RESTClient } from '../../../helpers/rest.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { indexedFieldsSlug } from '../../slugs.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, beforeEach, describe } = test

let payload: PayloadTestSDK<Config>
let client: RESTClient
let page: Page
let serverURL: string
let url: AdminUrlUtil

describe('Radio', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({
      dirname,
      // prebuild,
    }))

    url = new AdminUrlUtil(serverURL, indexedFieldsSlug)

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
    client = new RESTClient({ defaultSlug: 'users', serverURL })
    await client.login()
    await ensureCompilationIsDone({ page, serverURL })
  })

  test('should display unique constraint error in ui', async () => {
    const uniqueText = 'uniqueText'
    const doc = await payload.create({
      collection: 'indexed-fields',
      data: {
        group: {
          unique: uniqueText,
        },
        localizedUniqueRequiredText: 'text',
        text: 'text',
        uniqueRequiredText: 'text',
        uniqueText,
      },
    })

    await payload.update({
      id: doc.id,
      collection: 'indexed-fields',
      data: {
        localizedUniqueRequiredText: 'es text',
      },
      locale: 'es',
    })

    await page.goto(url.create)

    await page.locator('#field-text').fill('test')
    await page.locator('#field-uniqueText').fill(uniqueText)
    await page.locator('#field-localizedUniqueRequiredText').fill('localizedUniqueRequired2')

    await wait(500)

    // attempt to save
    await page.click('#action-save', { delay: 200 })

    // toast error
    await assertToastErrors({
      page,
      errors: ['uniqueText'],
      dismissAfterAssertion: true,
    })

    await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('create')

    // field specific error
    await expect(page.locator('.field-type.text.error #field-uniqueText')).toBeVisible()

    // reset first unique field
    await page.locator('#field-uniqueText').clear()

    // nested in a group error
    await page.locator('#field-group__unique').fill(uniqueText)

    // TODO: used because otherwise the toast locator resolves to 2 items
    // at the same time. Instead we should uniquely identify each toast.
    await wait(2000)

    // attempt to save
    await page.locator('#action-save').click()

    // toast error
    await assertToastErrors({
      page,
      errors: ['group.unique'],
    })

    await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('create')

    // field specific error inside group
    await expect(page.locator('.field-type.text.error #field-group__unique')).toBeVisible()
  })
})
