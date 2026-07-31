import { expect, type Page } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { ensureCompilationIsDone } from '../__helpers/e2e/helpers.js'
import { test } from '../__helpers/e2e/playwright.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { postsSlug } from './collections/Posts.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const { beforeAll, describe } = test

let page: Page
let postsURL: AdminUrlUtil
let serverURL: string

describe('Admin routing', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ serverURL } = await initPayloadE2ENoConfig({ dirname }))
    postsURL = new AdminUrlUtil(serverURL, postsSlug)

    const context = await browser.newContext()
    page = await context.newPage()

    await ensureCompilationIsDone({ page, serverURL })
  })

  describe('Route transitions', () => {
    const clientChunkPattern = /\/assets\/[^/]+\.js(?:\?.*)?$/
    const isPostsListRSCRequest = (url: URL) =>
      url.pathname.endsWith(`/admin/collections/${postsSlug}`) && url.searchParams.has('_rsc')
    const serverFunctionPattern = /\/_serverFn\//

    let releaseClientChunk: (() => void) | undefined
    let pendingClientChunk: Promise<void> | undefined
    let releaseNextRSCRequest: (() => void) | undefined
    let pendingNextRSCRequest: Promise<void> | undefined
    let releaseServerFunction: (() => void) | undefined
    let pendingServerFunction: Promise<void> | undefined

    const blockNextClientChunk = async (page: Page) => {
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

      return () => isClientChunkBlocked
    }

    const expectVisibleRouteProgress = async (page: Page) => {
      await expect
        .poll(async () => {
          return page.locator('.progress-bar').evaluateAll((elements) => {
            return elements.some((element) => {
              const progress = element.querySelector('.progress-bar__progress')
              const progressWidth = progress?.getBoundingClientRect().width ?? 0

              return (
                getComputedStyle(element).opacity !== '0' &&
                progressWidth > 1 &&
                progressWidth < window.innerWidth
              )
            })
          })
        })
        .toBe(true)
    }

    test.afterEach(async () => {
      releaseClientChunk?.()
      releaseNextRSCRequest?.()
      releaseServerFunction?.()
      await pendingClientChunk
      await pendingNextRSCRequest
      await pendingServerFunction
      releaseClientChunk = undefined
      pendingClientChunk = undefined
      releaseNextRSCRequest = undefined
      pendingNextRSCRequest = undefined
      releaseServerFunction = undefined
      pendingServerFunction = undefined
      await page.unroute(clientChunkPattern)
      await page.unroute(isPostsListRSCRequest)
      await page.unroute(serverFunctionPattern)
    })

    test(
      'should keep the previous admin view painted during index-to-splat navigation',
      { framework: 'tanstack-start' },
      async () => {
        test.skip(
          process.env.PAYLOAD_TEST_PROD !== 'true',
          'Production client chunks are required to suspend the next RSC payload.',
        )

        await page.goto(postsURL.admin)

        const isClientChunkBlocked = await blockNextClientChunk(page)

        await page.locator(`#card-${postsSlug} .card__actions a`).click()
        await expect.poll(isClientChunkBlocked).toBe(true)

        await expect(page.locator('.template-default')).toBeVisible()
        await expect(page.locator(`#card-${postsSlug}`)).toBeVisible()

        releaseClientChunk?.()
        releaseClientChunk = undefined

        await expect(page).toHaveURL(postsURL.create)
        await expect(page.locator('#field-title')).toBeVisible()
      },
    )

    test(
      'should show route progress until the next admin view is ready',
      { framework: 'tanstack-start' },
      async () => {
        test.skip(
          process.env.PAYLOAD_TEST_PROD !== 'true',
          'Production client chunks are required to suspend the next RSC payload.',
        )

        await page.goto(postsURL.admin)
        await expect(page.locator('.progress-bar')).toBeHidden()

        const isClientChunkBlocked = await blockNextClientChunk(page)

        let isServerFunctionBlocked = false
        const serverFunctionGate = new Promise<void>((resolve) => {
          releaseServerFunction = resolve
        })

        await page.route(
          serverFunctionPattern,
          async (route) => {
            isServerFunctionBlocked = true
            pendingServerFunction = (async () => {
              await serverFunctionGate
              await route.continue()
            })()
            await pendingServerFunction
          },
          { times: 1 },
        )

        await page.locator(`#card-${postsSlug} .card__actions a`).click()
        await expect.poll(() => isServerFunctionBlocked).toBe(true)
        await expectVisibleRouteProgress(page)

        releaseServerFunction?.()
        releaseServerFunction = undefined

        await expect.poll(isClientChunkBlocked).toBe(true)
        await expectVisibleRouteProgress(page)

        releaseClientChunk?.()
        releaseClientChunk = undefined

        await expect(page).toHaveURL(postsURL.create)
        await expect(page.locator('#field-title')).toBeVisible()
        await expect(page.locator('.progress-bar')).toBeHidden()
      },
    )

    test('should show progress bar on page navigation', { framework: 'next' }, async () => {
      test.skip(
        process.env.PAYLOAD_TEST_PROD !== 'true',
        'A production RSC request is required to hold the route transition open.',
      )

      let isNextRSCRequestBlocked = false
      const nextRSCRequestGate = new Promise<void>((resolve) => {
        releaseNextRSCRequest = resolve
      })

      await page.route(
        isPostsListRSCRequest,
        async (route) => {
          isNextRSCRequestBlocked = true
          pendingNextRSCRequest = (async () => {
            await nextRSCRequestGate
            await route.continue()
          })()
          await pendingNextRSCRequest
        },
        { times: 1 },
      )

      await page.goto(postsURL.admin)
      await expect(page.locator('.progress-bar')).toBeHidden()
      await page.locator('.collections__card-list .card').first().click()
      await expect.poll(() => isNextRSCRequestBlocked).toBe(true)
      await expectVisibleRouteProgress(page)

      releaseNextRSCRequest?.()
      releaseNextRSCRequest = undefined

      await expect(page.locator('.list-header')).toBeVisible()
      expect(page.url()).toContain(postsURL.list)
      await expect(page.locator('.progress-bar')).toBeHidden()
    })
  })
})
