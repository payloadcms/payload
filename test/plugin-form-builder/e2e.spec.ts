import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import * as path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../helpers/shared/sdk/index.js'
import type { Config } from './payload-types.js'

import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../helpers/shared/initPayloadE2ENoConfig.js'
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

      const titleCell = page.locator('.row-2 .cell-title a')
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

      const firstSubmissionCell = page.locator('.table .cell-id a').last()
      const href = await firstSubmissionCell.getAttribute('href')

      await firstSubmissionCell.click()
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
        where: {
          title: {
            contains: 'Contact',
          },
        },
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

      await expect(page.locator('#field-submissionData__0__value')).toHaveValue('New tester')
      await expect(page.locator('#field-submissionData__1__value')).toHaveValue('new@example.com')
    })

    test('can create form submission from the admin panel', async () => {
      await page.goto(submissionsUrl.create)
      await page.locator('#field-form').click({ delay: 100 })
      const options = page.locator('.rs__option')
      await options.locator('text=Contact Form').click()

      await expect(page.locator('#field-form').locator('.rs__value-container')).toContainText(
        'Contact Form',
      )

      await page.locator('#field-submissionData button.array-field__add-row').click()
      await page.locator('#field-submissionData__0__field').fill('name')
      await page.locator('#field-submissionData__0__value').fill('Test Submission')
      await saveDocAndAssert(page)

      // Check that the fields are still editable, as this user is an admin
      await expect(page.locator('#field-submissionData__0__field')).toBeEditable()
      await expect(page.locator('#field-submissionData__0__value')).toBeEditable()
    })

    test('can create form submission - with date field', async () => {
      const { docs } = await payload.find({
        collection: 'forms',
        where: {
          title: {
            contains: 'Booking',
          },
        },
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
            {
              field: 'date',
              value: '2025-10-01T00:00:00.000Z',
            },
          ],
        },
      })

      await page.goto(submissionsUrl.edit(createdSubmission.id))

      await expect(page.locator('#field-submissionData__0__value')).toHaveValue('New tester')
      await expect(page.locator('#field-submissionData__1__value')).toHaveValue('new@example.com')
      await expect(page.locator('#field-submissionData__2__value')).toHaveValue(
        '2025-10-01T00:00:00.000Z',
      )
    })
  })
})
