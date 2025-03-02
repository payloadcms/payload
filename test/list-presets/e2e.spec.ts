import type { Page } from '@playwright/test'
import type { ColumnPreference, Where } from 'payload'

import { expect, test } from '@playwright/test'
import * as path from 'path'
import { transformColumnsToSearchParams, transformWhereQuery } from 'payload/shared'
import * as qs from 'qs-esm'
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
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { seedData } from './seed.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const { beforeAll, describe } = test

let page: Page
let pagesUrl: AdminUrlUtil
let payload: PayloadTestSDK<Config>
let serverURL: string
let everyoneID: string | undefined

describe('List Presets', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))

    pagesUrl = new AdminUrlUtil(serverURL, 'pages')

    const context = await browser.newContext()
    page = await context.newPage()

    everyoneID = await payload
      .find({
        collection: 'payload-list-presets',
        limit: 1,
        depth: 0,
        where: {
          title: {
            equals: seedData.everyone.title,
          },
        },
      })
      .then((res) => res.docs?.[0]?.id)

    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ page, serverURL })
  })

  test('should select preset and apply filters', async () => {
    await page.goto(pagesUrl.list)
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
    await selectPreset({ page, presetTitle: seedData.everyone.title })
    await clearSelectedPreset({ page })
    expect(true).toBe(true)
  })

  test('should delete a preset, clear selection, and reset changes', async () => {
    await page.goto(pagesUrl.list)
    await selectPreset({ page, presetTitle: seedData.everyone.title })
    await openPresetsDropdown({ page })

    const deleteButton = page.locator('.list-presets .popup-button-list__button', {
      hasText: exactText('Delete'),
    })

    await deleteButton.click()
    await page.locator('#confirm-delete-filter #confirm-action').click()

    const regex = /columns=/
    await page.waitForURL((url) => !regex.test(url.search))

    await expect(
      page.locator('button.list-presets__select', {
        hasText: exactText('Select preset'),
      }),
    ).toBeVisible()

    await openListPresetDrawer({ page })
    const modal = page.locator('[id^=list-drawer_0_]')
    await expect(modal).toBeVisible()

    await expect(
      modal.locator('tbody tr td button', {
        hasText: exactText(seedData.everyone.title),
      }),
    ).toBeHidden()

    // recreate preset for the next tests
    await payload.create({
      collection: 'payload-list-presets',
      data: {
        title: seedData.everyone.title,
        where: seedData.onlyMe.where,
        access: seedData.onlyMe.access as any,
        columns: seedData.onlyMe.columns,
        relatedCollection: 'pages',
      },
    })
  })

  test('should save last used preset to preferences and load on initial render', async () => {
    await page.goto(pagesUrl.list)
    await selectPreset({ page, presetTitle: seedData.everyone.title })

    await page.reload()

    await expectURLParams({
      page,
      columns: seedData.everyone.columns,
      where: seedData.everyone.where,
      presetID: everyoneID,
    })

    expect(true).toBe(true)
  })

  test('should only show "edit" and "delete" controls when there is an active preset', async () => {
    await page.goto(pagesUrl.list)
    await clearSelectedPreset({ page })
    await openPresetsDropdown({ page })

    await expect(
      page.locator('.list-presets .popup-button-list__button', {
        hasText: exactText('Edit'),
      }),
    ).toBeHidden()

    await expect(
      page.locator('.list-presets .popup-button-list__button', {
        hasText: exactText('Delete'),
      }),
    ).toBeHidden()

    await selectPreset({ page, presetTitle: seedData.everyone.title })

    await openPresetsDropdown({ page })

    await expect(
      page.locator('.list-presets .popup-button-list__button', {
        hasText: exactText('Edit'),
      }),
    ).toBeVisible()

    await expect(
      page.locator('.list-presets .popup-button-list__button', {
        hasText: exactText('Delete'),
      }),
    ).toBeVisible()
  })

  test('should only show "reset" and "save for everyone" controls when there is an active preset and changes have been made', async () => {
    await page.goto(pagesUrl.list)
    await clearSelectedPreset({ page })

    await expect(
      page.locator('.list-presets .popup-button-list__button', {
        hasText: exactText('Reset'),
      }),
    ).toBeHidden()
  })

  test('should reset active changes', () => {
    // select a filter, make a change to the filters, click "reset", and ensure the changes are reverted
  })

  test('can edit a filter through the document drawer', async () => {
    await page.goto(pagesUrl.list)
    await selectPreset({ page, presetTitle: seedData.everyone.title })
    await openListPresetDrawer({ page })

    await page
      .locator('.list-presets .popup-button-list__button', {
        hasText: exactText('Edit'),
      })
      .click()

    // TODO: change the title, close the drawer, and ensure the changes are applied
  })

  test.skip('only show save for everyone when a filter has active changes', () => {
    // select a filter, make a change to the filters, and ensure the "save for everyone" button is visible
  })

  test.skip('can save for everyone', () => {
    // select a filter, make a change to the filters, click "save for everyone", and ensure the changes are saved
  })

  test('can create new preset', async () => {
    await page.goto(pagesUrl.list)
    await openPresetsDropdown({ page })

    await page
      .locator('.list-presets .popup-button-list__button', {
        hasText: exactText('Create new preset'),
      })
      .click()

    const modal = page.locator('[id^=doc-drawer_payload-list-presets_0_]')
    await expect(modal).toBeVisible()
    await modal.locator('input[name="title"]').fill('New Preset')
    await saveDocAndAssert(page)
    await expect(modal).toBeHidden()

    await expect(
      page.locator('button.list-presets__select', {
        hasText: exactText('New Preset'),
      }),
    ).toBeVisible()
  })
})

async function expectURLParams({
  page,
  columns,
  where,
  presetID,
}: {
  columns: ColumnPreference[]
  page: Page
  presetID: string | undefined
  where: Where
}) {
  const escapedColumns = encodeURIComponent(JSON.stringify(transformColumnsToSearchParams(columns)))

  // TODO: can't get columns to encode correctly
  // const whereQuery = qs.stringify(transformWhereQuery(where))
  // const encodedWhere = encodeURIComponent(whereQuery)

  const regex = new RegExp(`(?=.*columns=${escapedColumns})(?=.*preset=${presetID})`)

  await page.waitForURL(regex)
}

async function openListPresetDrawer({ page }: { page: Page }) {
  await page.click('button.list-presets__select')
}

async function selectPreset({ page, presetTitle }: { page: Page; presetTitle: string }) {
  await openListPresetDrawer({ page })
  const modal = page.locator('[id^=list-drawer_0_]')
  await expect(modal).toBeVisible()

  await modal
    .locator('tbody tr td button', {
      hasText: exactText(presetTitle),
    })
    .click()

  await expect(
    page.locator('button.list-presets__select', {
      hasText: exactText(presetTitle),
    }),
  ).toBeVisible()
}

async function openPresetsDropdown({ page }: { page: Page }) {
  const listPresetsControl = page.locator('.list-presets')
  await listPresetsControl.locator('button.popup-button').click()
  await expect(listPresetsControl.locator('.popup .popup__content')).toBeVisible()
}

async function clearSelectedPreset({ page }: { page: Page }) {
  const listPresetsControl = page.locator('.list-presets')
  const clearButton = listPresetsControl.locator('.list-presets__select__clear')

  if (await clearButton.isVisible()) {
    await clearButton.click()
  }

  const regex = /columns=/
  await page.waitForURL((url) => !regex.test(url.search))
  await expect(page.locator('.list-presets__select__clear')).toBeHidden()

  await expect(
    page.locator('button.list-presets__select', {
      hasText: exactText('Select preset'),
    }),
  ).toBeVisible()
}
