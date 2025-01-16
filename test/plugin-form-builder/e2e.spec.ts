import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import * as path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../helpers/sdk/index.js'
import type { Config } from './payload-types.js'

import { ensureCompilationIsDone, initPageConsoleErrorCatch } from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../playwright.config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.describe('Form Builder Plugin', () => {
  let page: Page
  let formsUrl: AdminUrlUtil
  let submissionsUrl: AdminUrlUtil
  let payload: PayloadTestSDK<Config>

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    const { payload: payloadFromInit, serverURL } = await initPayloadE2ENoConfig<Config>({
      dirname,
    })
    formsUrl = new AdminUrlUtil(serverURL, 'forms')
    submissionsUrl = new AdminUrlUtil(serverURL, 'form-submissions')

    payload = payloadFromInit

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ page, serverURL })
  })

  test.describe('Forms collection', () => {
    test('has contact form', async () => {
      await page.goto(formsUrl.list)

      await expect(() => expect(page.url()).toContain('forms')).toPass({
        timeout: POLL_TOPASS_TIMEOUT,
      })

      const titleCell = page.locator('.row-1 .cell-title a')
      await expect(titleCell).toHaveText('Contact Form')
      const href = await titleCell.getAttribute('href')

      await titleCell.click()
      await expect(() => expect(page.url()).toContain(href)).toPass({
        timeout: POLL_TOPASS_TIMEOUT,
      })

      const nameField = page.locator('#field-fields__0__name')
      await expect(nameField).toHaveValue('name')

      const addFieldsButton = page.locator('.blocks-field__drawer-toggler')

      await addFieldsButton.click()

      await expect(() => expect(page.locator('.drawer__header__title')).toBeVisible()).toPass({
        timeout: POLL_TOPASS_TIMEOUT,
      })

      await page
        .locator('button.thumbnail-card', {
          hasText: 'Text Area',
        })
        .click()

      await expect(() =>
        expect(
          page.locator('.pill__label', {
            hasText: 'Text Area',
          }),
        ).toBeVisible(),
      ).toPass({
        timeout: POLL_TOPASS_TIMEOUT,
      })
    })
  })

  test.describe('Form submissions collection', () => {
    test('has form submissions', async () => {
      await page.goto(submissionsUrl.list)

      await expect(() => expect(page.url()).toContain('form-submissions')).toPass({
        timeout: POLL_TOPASS_TIMEOUT,
      })

      const idCell = page.locator('.row-1 .cell-id a')
      const href = await idCell.getAttribute('href')

      await idCell.click()
      await expect(() => expect(page.url()).toContain(href)).toPass({
        timeout: POLL_TOPASS_TIMEOUT,
      })

      await expect(page.locator('#field-submissionData__0__value')).toHaveValue('Test Submission')
      await expect(page.locator('#field-submissionData__1__value')).toHaveValue(
        'tester@example.com',
      )
    })

    test('can create form submission', async () => {
      const { docs } = await payload.find({
        collection: 'forms',
      })

      const createdSubmission = await payload.create({
        collection: 'form-submissions',
        data: {
          form: docs[0].id,
          submissionData: [
            {
              field: 'name',
              value: 'New tester',
            },
            {
              field: 'email',
              value: 'new@example.com',
            },
          ],
        },
      })

      await page.goto(submissionsUrl.edit(createdSubmission.id))

      await expect(() => expect(page.url()).toContain(createdSubmission.id)).toPass({
        timeout: POLL_TOPASS_TIMEOUT,
      })

      await expect(page.locator('#field-submissionData__0__value')).toHaveValue('New tester')
      await expect(page.locator('#field-submissionData__1__value')).toHaveValue('new@example.com')
    })
  })
})
