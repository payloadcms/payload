import type { Page } from '@playwright/test'

import { test } from '@playwright/test'
import * as path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../helpers/sdk/index.js'
import type { Config } from './payload-types.js'

import { ensureCompilationIsDone, initPageConsoleErrorCatch } from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const { beforeAll, describe } = test

let page: Page
let pagesUrl: AdminUrlUtil
let payload: PayloadTestSDK<Config>
let serverURL: string

describe('List Filters', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))

    pagesUrl = new AdminUrlUtil(serverURL, 'pages')

    const context = await browser.newContext()
    page = await context.newPage()

    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ page, serverURL })
  })

  test.skip('displays shared filters when user has at least one', () => {
    // TODO: create a filter, and ensure it is displayed in the list
  })

  test.skip('only show edit and delete controls until a filter is selected', () => {
    // deselect potentially active filter, open dropdown controls, and ensure edit and delete are not visible
  })

  test.skip('can deselect a filter', () => {
    // select a filter, ensure it is selected, deselect it, and ensure it is no longer selected
  })

  test.skip('can delete a filter', () => {
    // TODO: select a filter, open dropdown controls, click "Delete", and ensure the filter is removed from the list
  })

  test.skip('can edit a filter through the document drawer', () => {
    // TODO: select a filter, open dropdown controls, click "Edit", and ensure the document drawer is displayed
  })

  test.skip('can manage all filters through the list drawer', () => {
    // TODO: open dropdown controls, click "Manage filters", and ensure the list drawer is displayed
  })

  test.skip('only show reset when a filter has active changes', () => {
    // select a filter, make a change to the filters, and ensure the reset button is visible
  })

  test.skip('can reset active changes', () => {
    // select a filter, make a change to the filters, click "reset", and ensure the changes are reverted
  })

  test.skip('only show save for everyone when a filter has active changes', () => {
    // select a filter, make a change to the filters, and ensure the "save for everyone" button is visible
  })

  test.skip('can save for everyone', () => {
    // select a filter, make a change to the filters, click "save for everyone", and ensure the changes are saved
  })
})
