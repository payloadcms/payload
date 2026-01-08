import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { checkFocusIndicators } from 'helpers/e2e/checkFocusIndicators.js'
import { addArrayRow } from 'helpers/e2e/fields/array/index.js'
import { runAxeScan } from 'helpers/e2e/runAxeScan.js'
import path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../helpers/sdk/index.js'
import type { Config } from '../../payload-types.js'

import { ensureCompilationIsDone, initPageConsoleErrorCatch } from '../../../helpers.js'
import { AdminUrlUtil } from '../../../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../../../helpers/reInitializeDB.js'
import { RESTClient } from '../../../helpers/rest.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { collapsibleFieldsSlug } from '../../slugs.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, beforeEach, describe } = test

let payload: PayloadTestSDK<Config>
let client: RESTClient
let page: Page
let serverURL: string
let url: AdminUrlUtil

describe('Collapsibles', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({
      dirname,
      // prebuild,
    }))

    url = new AdminUrlUtil(serverURL, collapsibleFieldsSlug)

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

  test('should render collapsible as collapsed if initCollapsed is true', async () => {
    await page.goto(url.create)
    const collapsedCollapsible = page.locator(
      '#field-collapsible-_index-1 .collapsible__toggle--collapsed',
    )
    await expect(collapsedCollapsible).toBeVisible()
  })

  test('should render CollapsibleLabel using a function', async () => {
    const label = 'custom row label'
    await page.goto(url.create)
    await page.locator('#field-collapsible-_index-3-1 #field-nestedTitle').fill(label)
    await wait(100)
    const customCollapsibleLabel = page.locator(
      `#field-collapsible-_index-3-1 .collapsible-field__row-label-wrap :text("${label}")`,
    )
    await expect(customCollapsibleLabel).toContainText(label)
  })

  test('should render CollapsibleLabel using a component', async () => {
    const label = 'custom row label as component'
    await page.goto(url.create)
    await page.locator('#field-arrayWithCollapsibles').scrollIntoViewIfNeeded()

    const arrayWithCollapsibles = page.locator('#field-arrayWithCollapsibles')
    await expect(arrayWithCollapsibles).toBeVisible()

    await addArrayRow(page, { fieldName: 'arrayWithCollapsibles' })

    const innerTextField = page.locator(
      '#arrayWithCollapsibles-row-0 #field-collapsible-arrayWithCollapsibles__0___index-0 #field-arrayWithCollapsibles__0__innerCollapsible',
    )
    await expect(innerTextField).toBeVisible()
    await innerTextField.fill(label)

    const customCollapsibleLabel = page.locator(
      `#field-arrayWithCollapsibles >> #arrayWithCollapsibles-row-0 >> .collapsible-field__row-label-wrap :text("${label}")`,
    )

    await expect(customCollapsibleLabel).toBeVisible()
    await expect(customCollapsibleLabel).toHaveCSS('text-transform', 'uppercase')
  })

  describe('A11y', () => {
    test.fixme('Edit view should have no accessibility violations', async ({}, testInfo) => {
      await page.goto(url.create)
      await page.locator('#field-text').waitFor()

      const scanResults = await runAxeScan({
        page,
        testInfo,
        include: ['.collection-edit__main'],
        exclude: ['.field-description'], // known issue - reported elsewhere @todo: remove this once fixed - see report https://github.com/payloadcms/payload/discussions/14489
      })

      expect(scanResults.violations.length).toBe(0)
    })

    test('Collapsible fields have focus indicators', async ({}, testInfo) => {
      await page.goto(url.create)
      await page.locator('#field-text').waitFor()

      const scanResults = await checkFocusIndicators({
        page,
        testInfo,
        selector: '.collection-edit__main',
      })

      expect(scanResults.totalFocusableElements).toBeGreaterThan(0)
      expect(scanResults.elementsWithoutIndicators).toBe(0)
    })
  })
})
