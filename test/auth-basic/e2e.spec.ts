import type { Page } from '@playwright/test'
import type { SanitizedConfig } from 'payload'

import { expect, test } from '@playwright/test'
import { devUser } from 'credentials.js'
import path from 'path'
import { formatAdminURL } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../helpers/shared/sdk/index.js'
import type { Config } from './payload-types.js'

import {
  ensureCompilationIsDone,
  getRoutes,
  initPageConsoleErrorCatch,
} from '../helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../helpers/shared/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../helpers/shared/clearAndSeed/reInitializeDB.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../playwright.config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: PayloadTestSDK<Config>

const { beforeAll, beforeEach, describe } = test

const createFirstUser = async ({
  page,
  serverURL,
}: {
  customAdminRoutes?: SanitizedConfig['admin']['routes']
  customRoutes?: SanitizedConfig['routes']
  page: Page
  serverURL: string
}) => {
  const {
    admin: {
      routes: { createFirstUser: createFirstUserRoute },
    },
    routes: { admin: adminRoute },
  } = getRoutes({})

  // wait for create first user route
  await page.goto(serverURL + `${adminRoute}${createFirstUserRoute}`)

  // forget to fill out confirm password
  await page.locator('#field-email').fill(devUser.email)
  await page.locator('#field-password').fill(devUser.password)
  await page.locator('.form-submit > button').click()
  await expect(page.locator('.field-type.confirm-password .field-error')).toHaveText(
    'This field is required.',
  )

  // make them match, but does not pass password validation
  await page.locator('#field-email').fill(devUser.email)
  await page.locator('#field-password').fill('12')
  await page.locator('#field-confirm-password').fill('12')
  await page.locator('.form-submit > button').click()
  await expect(page.locator('.field-type.password .field-error')).toHaveText(
    'This value must be longer than the minimum length of 3 characters.',
  )

  await page.locator('#field-email').fill(devUser.email)
  await page.locator('#field-password').fill(devUser.password)
  await page.locator('#field-confirm-password').fill(devUser.password)
  await page.locator('.form-submit > button').click()

  await expect
    .poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT })
    .not.toContain('create-first-user')
}

describe('Auth (Basic)', () => {
  let page: Page
  let url: AdminUrlUtil
  let serverURL: string
  let adminRoute: string

  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))
    url = new AdminUrlUtil(serverURL, 'users')

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
    const {
      routes: { admin },
    } = getRoutes({})
    adminRoute = admin

    await ensureCompilationIsDone({
      page,
      serverURL,
      readyURL: formatAdminURL({ path: '/**', serverURL, adminRoute }),
      noAutoLogin: true,
    })

    // Undo onInit seeding, as we need to test this without having a user created, or testing create-first-user
    await reInitializeDB({
      serverURL,
      snapshotKey: 'auth-basic',
      deleteOnly: true,
    })

    await payload.delete({
      collection: 'users',
      where: {
        id: {
          exists: true,
        },
      },
    })

    await ensureCompilationIsDone({
      page,
      serverURL,
      readyURL: formatAdminURL({ path: '/create-first-user', serverURL, adminRoute }),
    })
  })

  beforeEach(async () => {
    await payload.delete({
      collection: 'users',
      where: {
        id: {
          exists: true,
        },
      },
    })
  })

  describe('unauthenticated users', () => {
    test('ensure create first user page only has 3 fields', async () => {
      await page.goto(url.admin + '/create-first-user')

      // Ensure there are only 2 elements with class field-type
      await expect(page.locator('.field-type')).toHaveCount(3) // Email, Password, Confirm Password
    })

    test('ensure first user can be created', async () => {
      await createFirstUser({ page, serverURL })

      // use the api key in a fetch to assert that it is disabled
      await expect(async () => {
        const users = await payload.find({
          collection: 'users',
        })

        expect(users.totalDocs).toBe(1)
        expect(users.docs[0].email).toBe(devUser.email)
      }).toPass({
        timeout: POLL_TOPASS_TIMEOUT,
      })
    })
  })
})
