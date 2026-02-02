import type { APIRequestContext, Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../helpers/shared/sdk/index.js'
import type { Config } from './payload-types.js'

import { ensureCompilationIsDone, initPageConsoleErrorCatch } from '../helpers/e2e/helpers.js'
import { login } from '../helpers/e2e/auth/login.js'
import { initPayloadE2ENoConfig } from '../helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const { beforeAll, beforeEach, describe } = test

let payload: PayloadTestSDK<Config>
let serverURL: string

describe('Queues', () => {
  let page: Page
  let apiContext: APIRequestContext

  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL })

    await login({ page, serverURL })

    // Create an API context that shares cookies with the page
    apiContext = context.request
  })

  beforeEach(async () => {
    // Clear simple collection before each test
    await payload.delete({
      collection: 'simple',
      where: {
        id: { exists: true },
      },
    })

    // Clear jobs collection before each test
    await payload.delete({
      collection: 'payload-jobs',
      where: {
        id: { exists: true },
      },
    })
  })

  describe('External workflow handlers', () => {
    /**
     * We have the samee tests in int.spec.ts. This is to ensure that the external workflow handlers work correctly in the Next.js bundled environment.
     */
    test('can queue and run external workflow with external task handler within Next.js', async () => {
      // Queue a job using the externalWorkflow which uses file path handlers
      // This tests that dynamic imports work correctly in the Next.js bundled environment
      await payload.create({
        collection: 'payload-jobs',
        data: {
          input: {
            message: 'externalWorkflowE2E',
          },
          workflowSlug: 'externalWorkflow',
        },
      })

      // Run the job via the jobs endpoint (this runs within Next.js context)
      // Using apiContext to make authenticated requests (shares cookies with page)
      const runResponse = await apiContext.get(`${serverURL}/api/payload-jobs/run?silent=true`)
      expect(runResponse.ok()).toBeTruthy()

      const runResult = await runResponse.json()
      expect(runResult.message).toMatch(/success/i)

      // Verify the job was executed by checking if a simple document was created
      await expect
        .poll(
          async () => {
            const allSimples = await payload.find({
              collection: 'simple',
              limit: 100,
            })
            return allSimples.totalDocs
          },
          { timeout: 10000 },
        )
        .toBe(1)

      const allSimples = await payload.find({
        collection: 'simple',
        limit: 100,
      })
      expect(allSimples.docs[0]?.title).toEqual('externalWorkflowE2E')
    })

    test('can queue and run external task with file path handler within Next.js', async () => {
      // Queue a task directly using the ExternalTask which uses a file path handler
      await payload.create({
        collection: 'payload-jobs',
        data: {
          input: {
            message: 'externalTaskE2E',
          },
          taskSlug: 'ExternalTask',
        },
      })

      const runResponse = await apiContext.get(`${serverURL}/api/payload-jobs/run?silent=true`)
      expect(runResponse.ok()).toBeTruthy()

      // Verify the job was executed
      await expect
        .poll(
          async () => {
            const allSimples = await payload.find({
              collection: 'simple',
              limit: 100,
            })
            return allSimples.totalDocs
          },
          { timeout: 10000 },
        )
        .toBe(1)

      const allSimples = await payload.find({
        collection: 'simple',
        limit: 100,
      })
      expect(allSimples.docs[0]?.title).toEqual('externalTaskE2E')
    })
  })
})
