import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'
import { test } from '__helpers/e2e/playwright.js'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../__helpers/shared/sdk/index.js'
import type { Config } from '../../payload-types.js'

import { AdminUrlUtil } from '../../../__helpers/shared/adminUrlUtil.js'
import { reInitializeDB } from '../../../__helpers/shared/clearAndSeed/reInitializeDB.js'
import { initPayloadE2ENoConfig } from '../../../__helpers/shared/initPayloadE2ENoConfig.js'
import { RESTClient } from '../../../__helpers/shared/rest.js'
import { ensureCompilationIsDone } from '../../../__setup/e2e/ensureCompilationIsDone.js'
import { initPage } from '../../../__setup/e2e/initPage.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { uiSlug } from '../../slugs.js'

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
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({
      dirname,
      // prebuild,
    }))

    url = new AdminUrlUtil(serverURL, uiSlug)

    const context = await browser.newContext()
    ;({ page } = await initPage({ context, serverURL }))
  })

  beforeEach(async () => {
    await reInitializeDB({
      serverURL,
    })
    if (client) {
      await client.logout()
    }
    client = new RESTClient({ defaultSlug: 'users', serverURL })
    await client.login()
    await ensureCompilationIsDone({ page, serverURL })
  })

  test('should show custom: client configuration', { framework: 'rsc' }, async () => {
    await page.goto(url.create)

    const uiField = page.locator('#uiCustomClient')

    await expect(uiField).toBeVisible()
    await expect(uiField).toContainText('client-side-configuration')
  })

  test(
    'should render custom server Cell component in list view',
    { framework: 'rsc' },
    async () => {
      await page.goto(url.list)

      await expect(page.locator('.ui-custom-server-cell').first()).toHaveText('cell: text')
    },
  )

  test('should not render custom Cell component in edit view', { framework: 'next' }, async () => {
    const {
      docs: [existingDoc],
    } = await payload.find({
      collection: uiSlug,
      overrideAccess: true,
    })

    const response = await page.goto(url.edit(existingDoc!.id))

    await expect(page.locator('#field-text')).toHaveValue('text')
    expect(await response?.text()).not.toContain('ui-custom-server-cell')
  })
})
