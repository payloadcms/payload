import type { Page } from '@playwright/test'

import { test } from '@playwright/test'
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

  describe('Edit view', () => {})

  describe('List view', () => {})
})
