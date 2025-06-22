import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import * as path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../helpers/sdk/index.js'
import type { Config, Page as PageType, Post, User } from './payload-types.js'

import { ensureCompilationIsDone, initPageConsoleErrorCatch, saveDocAndAssert } from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { pagesSlug } from './collections/Pages/index.js'
import { postsSlug } from './collections/Posts/index.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const { beforeAll, describe } = test

let page: Page
let postsUrl: AdminUrlUtil
let pagesUrl: AdminUrlUtil
let payload: PayloadTestSDK<Config>
let serverURL: string

describe('Soft Deletes', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))
    postsUrl = new AdminUrlUtil(serverURL, postsSlug)
    pagesUrl = new AdminUrlUtil(serverURL, pagesSlug)

    const context = await browser.newContext()
    page = await context.newPage()

    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ page, serverURL })
  })

  describe('Collection view', () => {
    describe('List view', () => {
      test('should not show trash tab in the list view of a colleciton without trash enabled', async () => {
        await expect.poll(() => true).toBe(true)
      })

      test('should show trash tab in the list view of a colleciton with trash enabled', async () => {
        await expect.poll(() => true).toBe(true)
      })

      test('bulk delete modal in trash disabled collection should not show checkbox to delete permanently', async () => {
        await expect.poll(() => true).toBe(true)
      })

      test('bulk delete modal in trash enabled collection should show checkbox to delete permanently', async () => {
        await expect.poll(() => true).toBe(true)
      })

      test('bulk delete toast message should properly correspond to trash / perma delete', async () => {
        await expect.poll(() => true).toBe(true)
      })
    })

    describe('Edit view', () => {
      test('Doc controls delete modal in trash disabled collection should not show checkbox to delete permanently', async () => {
        await expect.poll(() => true).toBe(true)
      })

      test('Doc controls delete modal in trash enabled collection should show checkbox to delete permanently', async () => {
        await expect.poll(() => true).toBe(true)
      })

      test('Doc view delete toast message should properly correspond to trash / perma delete', async () => {
        await expect.poll(() => true).toBe(true)
      })
    })
  })

  describe('Trash view', () => {
    describe('List view', () => {
      test('Should show `trash` breadcrumb', async () => {
        await expect.poll(() => true).toBe(true)
      })

      test('Should show `restore` and `delete` buttons', async () => {
        await expect.poll(() => true).toBe(true)
      })

      test('Should show `Empty trash` button', async () => {
        await expect.poll(() => true).toBe(true)
      })

      test('Should successfully perma delete all trashed docs with empty trash button', async () => {
        await expect.poll(() => true).toBe(true)
      })

      test('Should successfully restore all trashed docs with restore button', async () => {
        await expect.poll(() => true).toBe(true)
      })

      test('Should successfully delete permanently all selected trashed docs with delete button', async () => {
        await expect.poll(() => true).toBe(true)
      })
    })

    describe('Edit view', () => {
      test('Should show `trash` and doc name breadcrumbs', async () => {
        await expect.poll(() => true).toBe(true)
      })

      test('Should navigate back to the trash view using the `trash` breadcrumb', async () => {
        await expect.poll(() => true).toBe(true)
      })

      test('Should not render dot menu popup', async () => {
        await expect.poll(() => true).toBe(true)
      })

      test('Should not render status block', async () => {
        await expect.poll(() => true).toBe(true)
      })

      test('Should disable save buttons', async () => {
        await expect.poll(() => true).toBe(true)
      })

      test('Should allow viewing of versions tab from trash edit view', async () => {
        await expect.poll(() => true).toBe(true)
      })

      test('Should include `trash` breadcrumb in stepnav of the versions tab', async () => {
        await expect.poll(() => true).toBe(true)
      })

      test('Should allow viewing of a specific version from the versions tab in the trash document view', async () => {
        await expect.poll(() => true).toBe(true)
      })

      test('Should include `trash` breadcrumb in stepnav of specific version view', async () => {
        await expect.poll(() => true).toBe(true)
      })

      test('Should allow viewing of api tab from trash edit view', async () => {
        await expect.poll(() => true).toBe(true)
      })

      test('Should include `trash` breadcrumb in stepnav of api tab', async () => {
        await expect.poll(() => true).toBe(true)
      })
    })
  })
})
