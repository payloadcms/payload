import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { Config } from './payload-types.js'

import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  runJobsQueue,
  saveDocAndAssert,
} from '../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../playwright.config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.describe('Import Export Plugin', () => {
  let page: Page
  let pagesURL: AdminUrlUtil
  let exportsURL: AdminUrlUtil
  let importsURL: AdminUrlUtil
  let postsURL: AdminUrlUtil
  let payload: PayloadTestSDK<Config>
  let serverURL: string

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    const { payload: payloadFromInit, serverURL: url } = await initPayloadE2ENoConfig<Config>({
      dirname,
    })
    serverURL = url
    pagesURL = new AdminUrlUtil(serverURL, 'pages')
    exportsURL = new AdminUrlUtil(serverURL, 'exports')
    importsURL = new AdminUrlUtil(serverURL, 'imports')
    postsURL = new AdminUrlUtil(serverURL, 'posts')

    payload = payloadFromInit

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ page, serverURL })
  })

  test.describe('Export', () => {
    test('should navigate to exports collection and create a CSV export', async () => {
      // Navigate to exports create page
      await page.goto(exportsURL.create)
      await expect(page.locator('.collection-edit')).toBeVisible()

      // Save the export
      await saveDocAndAssert(page, '#action-save')

      await runJobsQueue({ serverURL })

      await page.reload()

      // Verify export was created
      const exportFilename = page.locator('.file-details__main-detail')
      await expect(exportFilename).toBeVisible()
      await expect(exportFilename).toContainText('.csv')
    })

    test('should navigate to exports collection and create a JSON export', async () => {
      // Navigate to exports create page
      await page.goto(exportsURL.create)
      await expect(page.locator('.collection-edit')).toBeVisible()

      // Select JSON format
      const formatField = page.locator('#field-format .rs__control')
      await expect(formatField).toBeVisible()
      await formatField.click()
      await page.locator('.rs__menu .rs__option:has-text("json")').click()

      // Save the export
      await saveDocAndAssert(page)

      await runJobsQueue({ serverURL })

      await page.reload()

      // Verify export was created
      const exportFilename = page.locator('.file-details__main-detail')
      await expect(exportFilename).toBeVisible()
      await expect(exportFilename).toContainText('.json')
    })

    test('should show export in list view after creation', async () => {
      // First create an export
      await page.goto(exportsURL.create)

      await saveDocAndAssert(page)

      // Navigate to list view
      await page.goto(exportsURL.list)

      // Verify at least one export exists
      await expect(page.locator('.row-1')).toBeVisible()
    })

    test('should access export from list menu in pages collection', async () => {
      // Navigate to pages list
      await page.goto(postsURL.list)
      await expect(page.locator('.collection-list')).toBeVisible()

      // Look for the list menu items
      const listControls = page.locator('.list-controls')
      await expect(listControls).toBeVisible()

      const listMenuButton = page.locator('#list-menu')
      await expect(listMenuButton).toBeVisible()

      await listMenuButton.click()

      const createExportButton = page.locator('.popup__scroll-container button', {
        hasText: 'Export Posts',
      })
      await expect(createExportButton).toBeVisible()

      await createExportButton.click()

      // Should navigate to exports page
      await expect(async () => {
        await expect(page.locator('.export-preview')).toBeVisible()
      }).toPass()
    })

    test('should download directly in the browser', async () => {
      // Navigate to exports create page
      await page.goto(exportsURL.create)
      await expect(page.locator('.collection-edit')).toBeVisible()

      const downloadButton = page.locator('.doc-controls__controls button', {
        hasText: 'Download',
      })

      await expect(downloadButton).toBeVisible()

      // Browser should download the file
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        // It is important to click the link/button that initiates the download
        downloadButton.click(),
      ])

      // Wait for the download process to complete
      const downloadPath = await download.path()
      expect(downloadPath).not.toBeNull()

      // Optionally, verify the filename
      const suggestedFilename = download.suggestedFilename()
      expect(suggestedFilename).toMatch(/\.csv|\.json/)
    })
  })

  test.describe('Import', () => {
    test('should navigate to imports collection and see upload interface', async () => {
      // Navigate to imports create page
      await page.goto(importsURL.create)
      await expect(page.locator('.collection-edit')).toBeVisible()

      // Verify file upload field is visible
      await expect(page.locator('input[type="file"]')).toBeAttached()

      // Verify collection selector is visible
      const collectionField = page.locator('#field-collectionSlug')
      await expect(collectionField).toBeVisible()
    })

    test('should import a CSV file successfully', async () => {
      // Create a test CSV file
      const csvContent =
        'title,excerpt\n"E2E Import Test 1","Test excerpt 1"\n"E2E Import Test 2","Test excerpt 2"'
      const csvPath = path.join(dirname, 'uploads', 'e2e-test-import.csv')
      fs.writeFileSync(csvPath, csvContent)

      try {
        // Navigate to imports create page
        await page.goto(importsURL.create)
        await expect(page.locator('.collection-edit')).toBeVisible()

        // Upload the CSV file
        await page.setInputFiles('input[type="file"]', csvPath)

        // Wait for file to be processed
        await expect(page.locator('.file-field__filename')).toHaveValue('e2e-test-import.csv')

        // Select collection to import to (pages)
        const collectionField = page.locator('#field-collectionSlug')
        await collectionField.click()
        await page.locator('.rs__option:has-text("pages")').click()

        // Select import mode (create)
        const importModeField = page.locator('#field-importMode')
        if (await importModeField.isVisible()) {
          await importModeField.click()
          await page.locator('.rs__option:has-text("create")').first().click()
        }

        // Save/submit the import
        await saveDocAndAssert(page)

        // Check status field shows completed
        const statusField = page.locator('[data-field-name="status"]')
        if (await statusField.isVisible()) {
          await expect(statusField).toContainText(/completed|partial/i)
        }

        await runJobsQueue({ serverURL })

        // Verify imported documents exist
        const importedDocs = await payload.find({
          collection: 'pages',
          where: {
            title: { contains: 'E2E Import Test' },
          },
        })
        expect(importedDocs.docs.length).toBeGreaterThanOrEqual(2)
      } finally {
        // Cleanup test file
        if (fs.existsSync(csvPath)) {
          fs.unlinkSync(csvPath)
        }
        // Cleanup imported documents
        await payload.delete({
          collection: 'pages',
          where: {
            title: { contains: 'E2E Import Test' },
          },
        })
      }
    })

    test('should import a JSON file successfully', async () => {
      // Create a test JSON file
      const jsonContent = JSON.stringify([
        { title: 'E2E JSON Import 1', excerpt: 'JSON excerpt 1' },
        { title: 'E2E JSON Import 2', excerpt: 'JSON excerpt 2' },
      ])
      const jsonPath = path.join(dirname, 'uploads', 'e2e-test-import.json')
      fs.writeFileSync(jsonPath, jsonContent)

      try {
        // Navigate to imports create page
        await page.goto(importsURL.create)
        await expect(page.locator('.collection-edit')).toBeVisible()

        // Upload the JSON file
        await page.setInputFiles('input[type="file"]', jsonPath)

        // Wait for file to be processed
        await expect(page.locator('.file-field__filename')).toHaveValue('e2e-test-import.json')

        // Select collection to import to (pages)
        const collectionField = page.locator('#field-collectionSlug')
        await collectionField.click()
        await page.locator('.rs__option:has-text("pages")').click()

        // Select import mode (create)
        const importModeField = page.locator('#field-importMode')
        if (await importModeField.isVisible()) {
          await importModeField.click()
          await page.locator('.rs__option:has-text("create")').first().click()
        }

        // Save/submit the import
        await saveDocAndAssert(page)

        await runJobsQueue({ serverURL })

        // Verify imported documents exist
        const importedDocs = await payload.find({
          collection: 'pages',
          where: {
            title: { contains: 'E2E JSON Import' },
          },
        })
        expect(importedDocs.docs.length).toBeGreaterThanOrEqual(2)
      } finally {
        // Cleanup test file
        if (fs.existsSync(jsonPath)) {
          fs.unlinkSync(jsonPath)
        }
        // Cleanup imported documents
        await payload.delete({
          collection: 'pages',
          where: {
            title: { contains: 'E2E JSON Import' },
          },
        })
      }
    })

    test('should show import in list view after creation', async () => {
      // Create a simple CSV for import
      const csvContent = 'title\n"E2E List View Test"'
      const csvPath = path.join(dirname, 'uploads', 'e2e-list-test.csv')
      fs.writeFileSync(csvPath, csvContent)

      try {
        // Create an import
        await page.goto(importsURL.create)

        await page.setInputFiles('input[type="file"]', csvPath)
        await expect(page.locator('.file-field__filename')).toHaveValue('e2e-list-test.csv')

        const collectionField = page.locator('#field-collectionSlug')
        await collectionField.click()
        await page.locator('.rs__option:has-text("pages")').click()

        await saveDocAndAssert(page)

        // Navigate to list view
        await page.goto(importsURL.list)

        // Verify at least one import exists
        await expect(page.locator('.row-1')).toBeVisible()
      } finally {
        // Cleanup
        if (fs.existsSync(csvPath)) {
          fs.unlinkSync(csvPath)
        }
        await payload.delete({
          collection: 'pages',
          where: {
            title: { equals: 'E2E List View Test' },
          },
        })
      }
    })

    test('should access import from list menu in pages collection', async () => {
      // Navigate to pages list
      await page.goto(postsURL.list)
      await expect(page.locator('.collection-list')).toBeVisible()

      // Look for the list menu items
      const listControls = page.locator('.list-controls')
      await expect(listControls).toBeVisible()

      const listMenuButton = page.locator('#list-menu')
      await expect(listMenuButton).toBeVisible()

      await listMenuButton.click()

      const createImportButton = page.locator('.popup__scroll-container button', {
        hasText: 'Import Posts',
      })
      await expect(createImportButton).toBeVisible()

      await createImportButton.click()

      // Should navigate to exports page
      await expect(async () => {
        await expect(page.locator('.import-preview')).toBeVisible()
      }).toPass()
    })

    test('should handle import with update mode', async () => {
      // First create a document to update
      const existingDoc = await payload.create({
        collection: 'pages',
        data: {
          title: 'E2E Update Test Original',
          excerpt: 'Original excerpt',
        },
      })

      // Create CSV that updates the document
      const csvContent = `id,title,excerpt\n${existingDoc.id},"E2E Update Test Modified","Modified excerpt"`
      const csvPath = path.join(dirname, 'uploads', 'e2e-update-test.csv')
      fs.writeFileSync(csvPath, csvContent)

      try {
        // Navigate to imports create page
        await page.goto(importsURL.create)

        // Upload the CSV file
        await page.setInputFiles('input[type="file"]', csvPath)
        await expect(page.locator('.file-field__filename')).toHaveValue('e2e-update-test.csv')

        // Select collection
        const collectionField = page.locator('#field-collectionSlug')
        await collectionField.click()
        await page.locator('.rs__option:has-text("pages")').click()

        // Select update mode
        const importModeField = page.locator('#field-importMode')
        await expect(importModeField).toBeVisible()
        await importModeField.click()
        await page.locator('.rs__option:has-text("Update existing documents")').click()

        // Save/submit the import
        await saveDocAndAssert(page)

        await runJobsQueue({ serverURL })

        // Verify the document was updated
        const {
          docs: [updatedDoc],
        } = await payload.find({
          collection: 'pages',
          where: {
            id: {
              equals: existingDoc.id,
            },
          },
        })
        expect(updatedDoc?.title).toBe('E2E Update Test Modified')
        expect(updatedDoc?.excerpt).toBe('Modified excerpt')
      } finally {
        // Cleanup
        // eslint-disable-next-line playwright/no-conditional-in-test
        if (fs.existsSync(csvPath)) {
          fs.unlinkSync(csvPath)
        }
        await payload.delete({
          collection: 'pages',
          id: existingDoc.id,
        })
      }
    })
  })
})
