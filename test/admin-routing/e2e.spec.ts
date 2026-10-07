import { expect, type Page } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { currentFramework, test } from '../__helpers/e2e/playwright.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../__setup/e2e/initPage.js'
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
    ;({ page } = await initPage({ context, serverURL }))
  })

  describe('Route transitions', () => {
    const clientChunkPattern = /\/assets\/[^/]+\.js(?:\?.*)?$/
    const isPostsCreateRSCRequest = (url: URL) =>
      url.pathname.endsWith(`/admin/collections/${postsSlug}/create`) &&
      url.searchParams.has('_rsc')
    const serverFunctionPattern = /\/_serverFn\//
    const routeLoadPattern =
      currentFramework === 'tanstack-start' ? serverFunctionPattern : isPostsCreateRSCRequest

    let releaseClientChunk: (() => void) | undefined
    let pendingClientChunk: Promise<void> | undefined
    let releaseRouteLoad: (() => void) | undefined
    let pendingRouteLoad: Promise<void> | undefined

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

    const blockNextRouteLoad = async (page: Page) => {
      let isRouteLoadBlocked = false
      const routeLoadGate = new Promise<void>((resolve) => {
        releaseRouteLoad = resolve
      })

      await page.route(
        routeLoadPattern,
        async (route) => {
          isRouteLoadBlocked = true
          pendingRouteLoad = (async () => {
            await routeLoadGate
            await route.continue()
          })()
          await pendingRouteLoad
        },
        { times: 1 },
      )

      return () => isRouteLoadBlocked
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
      releaseRouteLoad?.()
      await pendingClientChunk
      await pendingRouteLoad
      releaseClientChunk = undefined
      pendingClientChunk = undefined
      releaseRouteLoad = undefined
      pendingRouteLoad = undefined
      await page.unroute(clientChunkPattern)
      await page.unroute(routeLoadPattern)
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

    test('should show route progress during navigation', async () => {
      await page.goto(postsURL.admin)
      await expect(page.locator('.progress-bar')).toBeHidden()

      const isRouteLoadBlocked = await blockNextRouteLoad(page)

      await page.locator(`#card-${postsSlug} .card__actions a`).click()
      await expect.poll(isRouteLoadBlocked).toBe(true)
      await expectVisibleRouteProgress(page)

      releaseRouteLoad?.()
      releaseRouteLoad = undefined

      await expect(page).toHaveURL(postsURL.create)
      await expect(page.locator('#field-title')).toBeVisible()
      await expect(page.locator('.progress-bar')).toBeHidden()
    })

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
        const isRouteLoadBlocked = await blockNextRouteLoad(page)

        await page.locator(`#card-${postsSlug} .card__actions a`).click()
        await expect.poll(isRouteLoadBlocked).toBe(true)
        await expectVisibleRouteProgress(page)

        releaseRouteLoad?.()
        releaseRouteLoad = undefined

        await expect.poll(isClientChunkBlocked).toBe(true)
        await expectVisibleRouteProgress(page)

        releaseClientChunk?.()
        releaseClientChunk = undefined

        await expect(page).toHaveURL(postsURL.create)
        await expect(page.locator('#field-title')).toBeVisible()
        await expect(page.locator('.progress-bar')).toBeHidden()
      },
    )
  })
})
