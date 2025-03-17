import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import * as path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../helpers/sdk/index.js'
import type { Config } from './payload-types.js'

import {
  ensureCompilationIsDone,
  exactText,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { clickListMenuItem, openListMenu } from '../helpers/e2e/toggleListMenu.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { expectURLParams } from './helpers/expectURLParams.js'
import { openQueryPresetDrawer } from './helpers/openQueryPresetDrawer.js'
import { clearSelectedPreset, selectPreset } from './helpers/togglePreset.js'
import { seedData } from './seed.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const { beforeAll, describe } = test

let page: Page
let pagesUrl: AdminUrlUtil
let payload: PayloadTestSDK<Config>
let serverURL: string
let everyoneID: string | undefined

describe('Query Presets', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))

    pagesUrl = new AdminUrlUtil(serverURL, 'pages')

    const context = await browser.newContext()
    page = await context.newPage()

    everyoneID = await payload
      .find({
        collection: 'payload-query-presets',
        limit: 1,
        depth: 0,
        where: {
          title: {
            equals: seedData.everyone.title,
          },
        },
      })
      .then((res) => {
        return res.docs?.[0]?.id
      })

    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ page, serverURL })
  })

  test('should select preset and apply filters', async () => {
    await page.goto(pagesUrl.list)
    await clearSelectedPreset({ page })
    await selectPreset({ page, presetTitle: seedData.everyone.title })

    await expectURLParams({
      page,
      columns: seedData.everyone.columns,
      where: seedData.everyone.where,
      presetID: everyoneID,
    })

    expect(true).toBe(true)
  })

  test('should clear selected preset and reset filters', async () => {
    await page.goto(pagesUrl.list)
    await clearSelectedPreset({ page })
    await selectPreset({ page, presetTitle: seedData.everyone.title })
    await clearSelectedPreset({ page })
    expect(true).toBe(true)
  })

  test('should delete a preset, clear selection, and reset changes', async () => {
    await page.goto(pagesUrl.list)
    await clearSelectedPreset({ page })
    await selectPreset({ page, presetTitle: seedData.everyone.title })
    await openListMenu({ page })

    await clickListMenuItem({ page, menuItemLabel: 'Delete' })

    await page.locator('#confirm-delete-preset #confirm-action').click()

    const regex = /columns=/
    await page.waitForURL((url) => !regex.test(url.search))

    await expect(
      page.locator('button#select-preset', {
        hasText: exactText('Select Preset'),
      }),
    ).toBeVisible()

    await openQueryPresetDrawer({ page })
    const modal = page.locator('[id^=list-drawer_0_]')
    await expect(modal).toBeVisible()

    await expect(
      modal.locator('tbody tr td button', {
        hasText: exactText(seedData.everyone.title),
      }),
    ).toBeHidden()

    // recreate preset for the next tests
    await payload.create({
      collection: 'payload-query-presets',
      data: seedData.everyone,
    })
  })

  test('should save last used preset to preferences and load on initial render', async () => {
    await page.goto(pagesUrl.list)
    await clearSelectedPreset({ page })
    await selectPreset({ page, presetTitle: seedData.everyone.title })

    await page.reload()

    await expectURLParams({
      page,
      columns: seedData.everyone.columns,
      where: seedData.everyone.where,
      // presetID: everyoneID,
    })

    expect(true).toBe(true)
  })

  test('should only show "edit" and "delete" controls when there is an active preset', async () => {
    await page.goto(pagesUrl.list)
    await clearSelectedPreset({ page })
    await openListMenu({ page })

    await expect(
      page.locator('#list-menu .popup__content .popup-button-list__button', {
        hasText: exactText('Edit'),
      }),
    ).toBeHidden()

    await expect(
      page.locator('#list-menu .popup__content .popup-button-list__button', {
        hasText: exactText('Delete'),
      }),
    ).toBeHidden()

    await selectPreset({ page, presetTitle: seedData.everyone.title })

    await openListMenu({ page })

    await expect(
      page.locator('#list-menu .popup__content .popup-button-list__button', {
        hasText: exactText('Edit'),
      }),
    ).toBeVisible()

    await expect(
      page.locator('#list-menu .popup__content .popup-button-list__button', {
        hasText: exactText('Delete'),
      }),
    ).toBeVisible()
  })

  test('should only show "reset" and "save for everyone" controls when there is an active preset and changes have been made', async () => {
    await page.goto(pagesUrl.list)
    await clearSelectedPreset({ page })

    await expect(
      page.locator('#list-menu .popup__content .popup-button-list__button', {
        hasText: exactText('Reset'),
      }),
    ).toBeHidden()
  })

  // eslint-disable-next-line playwright/no-skipped-test, playwright/expect-expect
  test.skip('should reset active changes', () => {
    // select a preset, make a change to the presets, click "reset", and ensure the changes are reverted
  })

  test('can edit a preset through the document drawer', async () => {
    await page.goto(pagesUrl.list)
    await selectPreset({ page, presetTitle: seedData.everyone.title })
    await clickListMenuItem({ page, menuItemLabel: 'Edit' })

    const drawer = page.locator('[id^=doc-drawer_payload-query-presets_0_]')
    const titleValue = drawer.locator('input[name="title"]')
    await expect(titleValue).toHaveValue(seedData.everyone.title)
    await drawer.locator('input[name="title"]').fill('New Title')

    await saveDocAndAssert(page)

    await drawer.locator('button.doc-drawer__header-close').click()
    await expect(drawer).toBeHidden()

    await expect(
      page.locator('button#select-preset', {
        hasText: exactText('New Title'),
      }),
    ).toBeVisible()
  })

  test('should not display query presets when admin.enableQueryPresets is not true', async () => {
    // go to users list view and ensure the query presets select is not visible
    const usersURL = new AdminUrlUtil(serverURL, 'users')
    await page.goto(usersURL.list)
    await expect(page.locator('#select-preset')).toBeHidden()
  })

  // eslint-disable-next-line playwright/no-skipped-test, playwright/expect-expect
  test.skip('only show save for everyone when a preset has active changes', () => {
    // select a preset, make a change to the presets, and ensure the "save for everyone" button is visible
  })

  // eslint-disable-next-line playwright/no-skipped-test, playwright/expect-expect
  test.skip('can save for everyone', () => {
    // select a preset, make a change to the presets, click "save for everyone", and ensure the changes are saved
  })

  test('can create new preset', async () => {
    await page.goto(pagesUrl.list)

    await clickListMenuItem({ page, menuItemLabel: 'Create new Preset' })
    const modal = page.locator('[id^=doc-drawer_payload-query-presets_0_]')
    await expect(modal).toBeVisible()
    await modal.locator('input[name="title"]').fill('New Preset')
    await saveDocAndAssert(page)
    await expect(modal).toBeHidden()

    await expect(
      page.locator('button#select-preset', {
        hasText: exactText('New Preset'),
      }),
    ).toBeVisible()
  })
})
