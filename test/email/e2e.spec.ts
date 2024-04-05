import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import * as path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../helpers/sdk/index.js'
import type { Config } from './payload-types.js'

import { ensureAutoLoginAndCompilationIsDone, initPageConsoleErrorCatch } from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { POLL_TOPASS_TIMEOUT } from '../playwright.config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.describe('Emails', () => {
  let page: Page
  let url: AdminUrlUtil
  let payload: PayloadTestSDK<Config>

  test.beforeAll(async ({ browser }) => {
    const { payload: payloadFromConfig, serverURL } = await initPayloadE2ENoConfig({ dirname })
    url = new AdminUrlUtil(serverURL, 'posts')

    payload = payloadFromConfig

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
    await ensureAutoLoginAndCompilationIsDone({ page, serverURL })
  })

  test('can send email via API', async () => {
    const email = (await payload.sendEmail({
      to: 'test@example.com',
      subject: 'hello',
    })) as { response: string }

    await expect(() => expect(email?.response).toContain('Accepted')).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })
  })
})
