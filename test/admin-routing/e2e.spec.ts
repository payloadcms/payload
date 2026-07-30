import { expect } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { ensureCompilationIsDone } from '../__helpers/e2e/helpers.js'
import { test } from '../__helpers/e2e/playwright.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { postsSlug } from './collections/Posts.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const clientChunkPattern = /\/assets\/[^/]+\.js(?:\?.*)?$/

let releaseClientChunk: (() => void) | undefined
let pendingClientChunk: Promise<void> | undefined

test.afterEach(async ({ page }) => {
  releaseClientChunk?.()
  await pendingClientChunk
  releaseClientChunk = undefined
  pendingClientChunk = undefined
  await page.unroute(clientChunkPattern)
})

test(
  'should preserve the admin subtree during index-to-splat navigation',
  { framework: 'tanstack-start' },
  async ({ page }) => {
    test.skip(
      process.env.PAYLOAD_TEST_PROD !== 'true',
      'Production client chunks are required to suspend the next RSC payload.',
    )

    const { serverURL } = await initPayloadE2ENoConfig({ dirname })
    const postsURL = new AdminUrlUtil(serverURL, postsSlug)

    await ensureCompilationIsDone({ page, serverURL })
    await page.goto(postsURL.admin)

    const adminTemplate = await page.locator('.template-default').elementHandle()
    let isClientChunkBlocked = false
    const clientChunkGate = new Promise<void>((resolve) => {
      releaseClientChunk = resolve
    })

    await page.route(
      clientChunkPattern,
      async (route) => {
        isClientChunkBlocked = true
        pendingClientChunk = (async () => {
          await clientChunkGate
          await route.continue()
        })()
        await pendingClientChunk
      },
      { times: 1 },
    )

    await page.locator(`#card-${postsSlug} .card__actions a`).click()
    await expect.poll(() => isClientChunkBlocked).toBe(true)

    expect(await adminTemplate?.evaluate((element) => element.isConnected)).toBe(true)
    await expect(page.locator('.template-default')).toBeVisible()

    releaseClientChunk?.()
    releaseClientChunk = undefined

    await expect(page).toHaveURL(postsURL.create)
    await expect(page.locator('#field-title')).toBeVisible()
  },
)
