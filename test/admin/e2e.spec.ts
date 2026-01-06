import type { BrowserContext, Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { formatAdminURL } from 'payload/shared'

import type { Config } from './payload-types.js'

import { ensureCompilationIsDone, getRoutes, initPageConsoleErrorCatch } from '../helpers.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { BASE_PATH, customAdminRoutes } from './shared.js'

process.env.NEXT_BASE_PATH = BASE_PATH

const { beforeAll, describe } = test

import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

describe('General', () => {
  let page: Page
  let context: BrowserContext
  let serverURL: string
  let adminRoutes: ReturnType<typeof getRoutes>
  let adminRoute: string

  beforeAll(async ({ browser }) => {
    ;({ serverURL } = await initPayloadE2ENoConfig<Config>({
      dirname,
      prebuild: false,
    }))

    context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ customAdminRoutes, page, serverURL })

    adminRoutes = getRoutes({ customAdminRoutes })
    adminRoute = adminRoutes.routes.admin
  })

  test('repro', async () => {
    for (let i = 0; i < 100; i++) {
      await page.goto(formatAdminURL({ path: '', serverURL, adminRoute }))
      expect(true).toBe(true)
    }
  })
})
