import type { BrowserContext, Page } from '@playwright/test'

import { expect, test } from '@playwright/test'

import type { Config } from './payload-types.js'

import { initPageConsoleErrorCatch } from '../helpers.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { BASE_PATH } from './shared.js'

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

  beforeAll(async ({ browser }) => {
    await initPayloadE2ENoConfig<Config>({
      dirname,
      prebuild: false,
    })

    context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
  })

  test('repro', async () => {
    for (let i = 0; i < 100; i++) {
      await page.goto('http://localhost:3000/admin')
      expect(true).toBe(true)
    }
  })
})
