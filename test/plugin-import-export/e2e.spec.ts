import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
import { postsWithS3ExportSlug, postsWithS3ImportSlug, postsWithS3Slug } from './shared.js'

test.describe('Import Export Plugin', () => {
  let page: Page
  let exportsURL: AdminUrlUtil
  let importsURL: AdminUrlUtil
  let postsURL: AdminUrlUtil
  let customIdPagesURL: AdminUrlUtil
  let s3ExportsURL: AdminUrlUtil
  let s3ImportsURL: AdminUrlUtil
  let payload: PayloadTestSDK<Config>
  let serverURL: string

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    const { payload: payloadFromInit, serverURL: url } = await initPayloadE2ENoConfig<Config>({
      dirname: __dirname,
    })
    serverURL = url
    exportsURL = new AdminUrlUtil(serverURL, 'exports')
    importsURL = new AdminUrlUtil(serverURL, 'imports')
    postsURL = new AdminUrlUtil(serverURL, 'posts')
    customIdPagesURL = new AdminUrlUtil(serverURL, 'custom-id-pages')
    s3ExportsURL = new AdminUrlUtil(serverURL, postsWithS3ExportSlug)
    s3ImportsURL = new AdminUrlUtil(serverURL, postsWithS3ImportSlug)

    payload = payloadFromInit

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ page, serverURL })
  })

  test.describe('Export', () => {
    test('should navigate to exports collection and create a CSV export', async () => {
      await page.goto(exportsURL.create)
      await expect(page.locator('.collection-edit')).toBeVisible()

      await saveDocAndAssert(page, '#action-save')

      await runJobsQueue({ serverURL })

      await expect(async () => {
        await page.reload()

        const exportFilename = page.locator('.file-details__main-detail')
        await expect(exportFilename).toBeVisible()
        await expect(exportFilename).toContainText('.csv')
      }).toPass({ timeout: POLL_TOPASS_TIMEOUT })
    })

    test('should navigate to exports collection and create a JSON export', async () => {
      await page.goto(exportsURL.create)
      await expect(page.locator('.collection-edit')).toBeVisible()

      const formatField = page.locator('#field-format .rs__control')
      await expect(formatField).toBeVisible()
      await formatField.click()
      await page.locator('.rs__menu .rs__option:has-text("json")').click()

      await saveDocAndAssert(page)

      await runJobsQueue({ serverURL })

      await expect(async () => {
        await page.reload()

        const exportFilename = page.locator('.file-details__main-detail')
        await expect(exportFilename).toBeVisible()
        await expect(exportFilename).toContainText('.json')
      }).toPass({ timeout: POLL_TOPASS_TIMEOUT })
    })

    test('should show export in list view after creation', async () => {
      await page.goto(exportsURL.create)

      await saveDocAndAssert(page)

      await page.goto(exportsURL.list)

      await expect(page.locator('.row-1')).toBeVisible()
    })

    test('should access export from list menu in pages collection', async () => {
      await page.goto(postsURL.list)
      await expect(page.locator('.collection-list')).toBeVisible()

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

      await expect(async () => {
        await expect(page.locator('.export-preview')).toBeVisible()
      }).toPass({ timeout: POLL_TOPASS_TIMEOUT })
    })

    test('should download directly in the browser', async () => {
      await page.goto(exportsURL.create)
      await expect(page.locator('.collection-edit')).toBeVisible()

      const downloadButton = page.locator('.doc-controls__controls button', {
        hasText: 'Download',
      })

      await expect(downloadButton).toBeVisible()

      const [download] = await Promise.all([page.waitForEvent('download'), downloadButton.click()])

      const downloadPath = await download.path()
      expect(downloadPath).not.toBeNull()

      const suggestedFilename = download.suggestedFilename()
      expect(suggestedFilename).toMatch(/\.csv|\.json/)
    })

    test('should enforce format restriction in UI and API when format is configured', async () => {
      const postsNoJobsQueueURL = new AdminUrlUtil(serverURL, 'posts-no-jobs-queue')
      await page.goto(postsNoJobsQueueURL.list)
      await expect(page.locator('.collection-list')).toBeVisible()

      const listMenuButton = page.locator('#list-menu')
      await expect(listMenuButton).toBeVisible()
      await listMenuButton.click()

      const createExportButton = page.locator('.popup__scroll-container button', {
        hasText: 'Export',
      })
      await expect(createExportButton).toBeVisible()
      await createExportButton.click()

      await expect(async () => {
        await expect(page.locator('.export-preview')).toBeVisible()
      }).toPass({ timeout: POLL_TOPASS_TIMEOUT })

      const formatField = page.locator('#field-format')
      await expect(formatField).toBeVisible()

      const formatControl = formatField.locator('.rs__control')
      await expect(formatControl).toHaveClass(/rs__control--is-disabled/)

      await expect(formatField.locator('.rs__single-value')).toHaveText('CSV')

      const response = await page.request.post(
        `${serverURL}/api/posts-no-jobs-queue-export/download`,
        {
          data: {
            data: {
              name: 'test-export',
              collectionSlug: 'posts-no-jobs-queue',
              format: 'json',
              sort: '-createdAt',
            },
          },
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      expect(response.status()).toBe(400)
      const responseBody = await response.json()
      expect(responseBody.errors).toBeDefined()
      expect(responseBody.errors[0].message).toContain('format')
    })

    test.describe('Custom ID Exports', () => {
      test('should export documents with custom IDs through UI', async () => {
        const uniqueId = Date.now()

        await payload.create({
          collection: 'custom-id-pages' as any,
          data: {
            id: `e2e-export-${uniqueId}-1`,
            title: 'E2E Export Custom Page 1',
          },
        })

        await payload.create({
          collection: 'custom-id-pages' as any,
          data: {
            id: `e2e-export-${uniqueId}-2`,
            title: 'E2E Export Custom Page 2',
          },
        })

        await page.goto(customIdPagesURL.list)
        await expect(page.locator('.collection-list')).toBeVisible()

        const listMenuButton = page.locator('#list-menu')
        await expect(listMenuButton).toBeVisible()
        await listMenuButton.click()

        const createExportButton = page.locator('.popup__scroll-container button', {
          hasText: 'Export',
        })
        await expect(createExportButton).toBeVisible()
        await createExportButton.click()

        await expect(async () => {
          await expect(page.locator('.export-preview')).toBeVisible()
        }).toPass({ timeout: POLL_TOPASS_TIMEOUT })

        await saveDocAndAssert(page, '#action-save')

        await expect(page).toHaveURL(/\/exports\//)

        await runJobsQueue({ serverURL })

        await expect(async () => {
          await page.reload()

          const exportFilename = page.locator('.file-details__main-detail')
          await expect(exportFilename).toBeVisible()
          await expect(exportFilename).toContainText('.csv')
        }).toPass({ timeout: POLL_TOPASS_TIMEOUT })

        const downloadLink = page.locator('.file-details__main-detail a')
        await expect(downloadLink).toHaveAttribute('href', /.+/)

        const [download] = await Promise.all([page.waitForEvent('download'), downloadLink.click()])

        const tempPath = path.join(os.tmpdir(), `export-test-${uniqueId}.csv`)
        await download.saveAs(tempPath)
        const content = fs.readFileSync(tempPath, 'utf8')
        fs.unlinkSync(tempPath)

        expect(content).toContain(`e2e-export-${uniqueId}-1`)
        expect(content).toContain(`e2e-export-${uniqueId}-2`)
        expect(content).toContain('E2E Export Custom Page 1')
        expect(content).toContain('E2E Export Custom Page 2')
      })
    })

    test.describe('Collection Selector', () => {
      test('should show only collections without custom export collections in base exports selector', async () => {
        await page.goto(exportsURL.create)
        await expect(page.locator('.collection-edit')).toBeVisible()

        const collectionField = page.locator('#field-collectionSlug')
        await expect(collectionField).toBeVisible()
        await collectionField.locator('.rs__control').click()

        const menu = page.locator('.rs__menu')
        await expect(menu).toBeVisible()

        await expect(menu.locator('.rs__option:text-is("Pages")')).toBeVisible()
        await expect(menu.locator('.rs__option:text-is("Custom Id Pages")')).toBeVisible()
        await expect(menu.locator('.rs__option:text-is("Posts Exports Only")')).toBeVisible()
        await expect(menu.locator('.rs__option:text-is("Media")')).toBeVisible()

        await expect(menu.locator('.rs__option:text-is("Posts")')).toBeHidden()
        await expect(menu.locator('.rs__option:text-is("Posts No Jobs Queue")')).toBeHidden()

        await expect(menu.locator('.rs__option:text-is("Payload Jobs")')).toBeHidden()
        await expect(menu.locator('.rs__option:text-is("Users")')).toBeHidden()
        await expect(menu.locator('.rs__option:text-is("Exports")')).toBeHidden()
        await expect(menu.locator('.rs__option:text-is("Imports")')).toBeHidden()

        await expect(menu.locator('.rs__option:text-is("Posts Imports Only")')).toBeHidden()
      })

      test('custom export collection should only show its target collection', async () => {
        const postsExportURL = new AdminUrlUtil(serverURL, 'posts-export')
        await page.goto(postsExportURL.create)
        await expect(page.locator('.collection-edit')).toBeVisible()

        const collectionField = page.locator('#field-collectionSlug')
        await expect(collectionField).toBeVisible()

        const control = collectionField.locator('.rs__control')
        await expect(control).toHaveAttribute('aria-disabled', 'true')

        const singleValue = collectionField.locator('.rs__single-value')
        await expect(singleValue).toContainText('Posts')
      })

      test('should show correct collections after exporting via dropdown then navigating to create page', async () => {
        await page.goto(customIdPagesURL.list)
        await expect(page.locator('.collection-list')).toBeVisible()

        const listMenuButton = page.locator('#list-menu')
        await expect(listMenuButton).toBeVisible()
        await listMenuButton.click()

        const createExportButton = page.locator('.popup__scroll-container button', {
          hasText: 'Export',
        })
        await expect(createExportButton).toBeVisible()
        await createExportButton.click()

        await expect(page.locator('.drawer__content')).toBeVisible()

        await page.keyboard.press('Escape')
        await expect(page.locator('.drawer__content')).toBeHidden()

        await page.goto(exportsURL.create)
        await expect(page.locator('.collection-edit')).toBeVisible()

        const collectionField = page.locator('#field-collectionSlug')
        await expect(collectionField).toBeVisible()
        await collectionField.locator('.rs__control').click()

        const menu = page.locator('.rs__menu')
        await expect(menu).toBeVisible()

        await expect(menu.locator('.rs__option:text-is("Pages")')).toBeVisible()
        await expect(menu.locator('.rs__option:text-is("Custom Id Pages")')).toBeVisible()

        await expect(menu.locator('.rs__option:text-is("Payload Jobs")')).toBeHidden()
      })

      test('should show same collections after page refresh', async () => {
        await page.goto(exportsURL.create)
        await expect(page.locator('.collection-edit')).toBeVisible()

        const collectionField = page.locator('#field-collectionSlug')
        await expect(collectionField).toBeVisible()
        await collectionField.locator('.rs__control').click()

        let menu = page.locator('.rs__menu')
        await expect(menu).toBeVisible()

        let optionsBefore = 0
        await expect(async () => {
          optionsBefore = await menu.locator('.rs__option').count()
          expect(optionsBefore).toBeGreaterThan(0)
        }).toPass({ timeout: POLL_TOPASS_TIMEOUT })

        await page.keyboard.press('Escape')
        await page.reload()
        await expect(page.locator('.collection-edit')).toBeVisible()

        await collectionField.locator('.rs__control').click()
        menu = page.locator('.rs__menu')
        await expect(menu).toBeVisible()

        await expect(async () => {
          const optionsAfter = await menu.locator('.rs__option').count()
          expect(optionsAfter).toBe(optionsBefore)
        }).toPass({ timeout: POLL_TOPASS_TIMEOUT })

        await expect(menu.locator('.rs__option:text-is("Pages")')).toBeVisible()
        await expect(menu.locator('.rs__option:text-is("Custom Id Pages")')).toBeVisible()
      })
    })
  })

  test.describe('Import', () => {
    const tempFiles: string[] = []
    const createdPageTitlePatterns: string[] = []
    const createdPageIDs: (number | string)[] = []

    test.afterEach(async () => {
      for (const filePath of tempFiles) {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }
      }
      tempFiles.length = 0

      for (const pattern of createdPageTitlePatterns) {
        await payload.delete({
          collection: 'pages',
          where: {
            title: { contains: pattern },
          },
        })
      }
      createdPageTitlePatterns.length = 0

      for (const id of createdPageIDs) {
        await payload.delete({
          collection: 'pages',
          id,
        })
      }
      createdPageIDs.length = 0
    })

    test('should navigate to imports collection and see upload interface', async () => {
      await page.goto(importsURL.create)
      await expect(page.locator('.collection-edit')).toBeVisible()

      await expect(page.locator('input[type="file"]')).toBeAttached()

      const collectionField = page.locator('#field-collectionSlug')
      await expect(collectionField).toBeVisible()
    })

    test('should import a CSV file successfully', async () => {
      const csvContent =
        'title,excerpt\n"E2E Import Test 1","Test excerpt 1"\n"E2E Import Test 2","Test excerpt 2"'
      const csvPath = path.join(__dirname, 'uploads', 'e2e-test-import.csv')

      fs.writeFileSync(csvPath, csvContent)
      tempFiles.push(csvPath)
      createdPageTitlePatterns.push('E2E Import Test')

      await page.goto(importsURL.create)
      await expect(page.locator('.collection-edit')).toBeVisible()

      await page.setInputFiles('input[type="file"]', csvPath)
      await expect(page.locator('.file-field__filename')).toHaveValue('e2e-test-import.csv')

      const collectionField = page.locator('#field-collectionSlug')
      await collectionField.click()
      await page.locator('.rs__option:text-is("Pages")').click()

      const importModeField = page.locator('#field-importMode')
      await importModeField.click()
      await page.locator('.rs__option:has-text("create")').first().click()

      await saveDocAndAssert(page)

      await runJobsQueue({ serverURL })

      const importedDocs = await payload.find({
        collection: 'pages',
        where: {
          title: { contains: 'E2E Import Test' },
        },
      })

      expect(importedDocs.docs.length).toBeGreaterThanOrEqual(2)
    })

    test('should import a JSON file successfully', async () => {
      const jsonContent = JSON.stringify([
        { excerpt: 'JSON excerpt 1', title: 'E2E JSON Import 1' },
        { excerpt: 'JSON excerpt 2', title: 'E2E JSON Import 2' },
      ])
      const jsonPath = path.join(__dirname, 'uploads', 'e2e-test-import.json')

      fs.writeFileSync(jsonPath, jsonContent)
      tempFiles.push(jsonPath)
      createdPageTitlePatterns.push('E2E JSON Import')

      await page.goto(importsURL.create)
      await expect(page.locator('.collection-edit')).toBeVisible()

      await page.setInputFiles('input[type="file"]', jsonPath)
      await expect(page.locator('.file-field__filename')).toHaveValue('e2e-test-import.json')

      const collectionField = page.locator('#field-collectionSlug')
      await collectionField.click()
      await page.locator('.rs__option:text-is("Pages")').click()

      const importModeField = page.locator('#field-importMode')
      await importModeField.click()
      await page.locator('.rs__option:has-text("create")').first().click()

      await saveDocAndAssert(page)

      await runJobsQueue({ serverURL })

      const importedDocs = await payload.find({
        collection: 'pages',
        where: {
          title: { contains: 'E2E JSON Import' },
        },
      })

      expect(importedDocs.docs.length).toBeGreaterThanOrEqual(2)
    })

    test('should show import in list view after creation', async () => {
      const csvContent = 'title\n"E2E List View Test"'
      const csvPath = path.join(__dirname, 'uploads', 'e2e-list-test.csv')

      fs.writeFileSync(csvPath, csvContent)
      tempFiles.push(csvPath)
      createdPageTitlePatterns.push('E2E List View Test')

      await page.goto(importsURL.create)

      await page.setInputFiles('input[type="file"]', csvPath)
      await expect(page.locator('.file-field__filename')).toHaveValue('e2e-list-test.csv')

      const collectionField = page.locator('#field-collectionSlug')
      await collectionField.click()
      await page.locator('.rs__option:text-is("Pages")').click()

      await saveDocAndAssert(page)

      await page.goto(importsURL.list)

      await expect(page.locator('.row-1')).toBeVisible()
    })

    test('should access import from list menu in pages collection', async () => {
      await page.goto(postsURL.list)
      await expect(page.locator('.collection-list')).toBeVisible()

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

      await expect(async () => {
        await expect(page.locator('.import-preview')).toBeVisible()
      }).toPass({ timeout: POLL_TOPASS_TIMEOUT })
    })

    test('should handle import with update mode', async () => {
      const existingDoc = await payload.create({
        collection: 'pages',
        data: {
          excerpt: 'Original excerpt',
          title: 'E2E Update Test Original',
        },
      })

      createdPageIDs.push(existingDoc.id)

      const csvContent = `id,title,excerpt\n${existingDoc.id},"E2E Update Test Modified","Modified excerpt"`
      const csvPath = path.join(__dirname, 'uploads', 'e2e-update-test.csv')

      fs.writeFileSync(csvPath, csvContent)
      tempFiles.push(csvPath)

      await page.goto(importsURL.create)

      await page.setInputFiles('input[type="file"]', csvPath)
      await expect(page.locator('.file-field__filename')).toHaveValue('e2e-update-test.csv')

      const collectionField = page.locator('#field-collectionSlug')
      await collectionField.click()
      await page.locator('.rs__option:text-is("Pages")').click()

      const importModeField = page.locator('#field-importMode')
      await expect(importModeField).toBeVisible()
      await importModeField.click()
      await page.locator('.rs__option:has-text("Update existing documents")').click()

      await saveDocAndAssert(page)

      await runJobsQueue({ serverURL })

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
    })

    test.describe('Custom ID Imports', () => {
      test('should show custom IDs in import preview', async () => {
        const csvContent = `id,title\ncustom-preview-1,Preview Custom Page 1\ncustom-preview-2,Preview Custom Page 2`

        await page.goto(importsURL.create)
        await expect(page.locator('.collection-edit')).toBeVisible()

        const collectionField = page.locator('#field-collectionSlug')
        await collectionField.locator('.rs__control').click()
        await expect(page.locator('.rs__menu')).toBeVisible()
        await page.locator('.rs__option:has-text("Custom Id Pages")').click()

        const fileInput = page.locator('input[type="file"]')
        await fileInput.setInputFiles({
          name: 'custom-id-preview.csv',
          buffer: Buffer.from(csvContent),
          mimeType: 'text/csv',
        })

        await expect(async () => {
          await expect(page.locator('.import-preview table')).toBeVisible()
        }).toPass({ timeout: POLL_TOPASS_TIMEOUT })

        const previewTable = page.locator('.import-preview table')
        await expect(previewTable).toContainText('custom-preview-1')
        await expect(previewTable).toContainText('Preview Custom Page 1')
        await expect(previewTable).toContainText('custom-preview-2')
      })

      test('should import documents with custom IDs through UI', async () => {
        const uniqueId = Date.now()
        const csvContent = `id,title\ne2e-custom-${uniqueId}-1,E2E Custom Page 1\ne2e-custom-${uniqueId}-2,E2E Custom Page 2`

        await page.goto(importsURL.create)
        await expect(page.locator('.collection-edit')).toBeVisible()

        const collectionField = page.locator('#field-collectionSlug')
        await collectionField.locator('.rs__control').click()
        await expect(page.locator('.rs__menu')).toBeVisible()
        await page.locator('.rs__option:has-text("Custom Id Pages")').click()

        const fileInput = page.locator('input[type="file"]')
        await fileInput.setInputFiles({
          name: 'custom-id-import.csv',
          buffer: Buffer.from(csvContent),
          mimeType: 'text/csv',
        })

        await expect(async () => {
          await expect(page.locator('.import-preview table')).toBeVisible()
        }).toPass({ timeout: POLL_TOPASS_TIMEOUT })

        await saveDocAndAssert(page, '#action-save')

        await runJobsQueue({ serverURL })

        await expect(async () => {
          await page.reload()
          const statusField = page.locator('#field-status')
          await expect(statusField).toBeVisible()
          await expect(statusField).toContainText(/completed|partial/i)
        }).toPass({ timeout: POLL_TOPASS_TIMEOUT })

        const importedPages = await payload.find({
          collection: 'custom-id-pages' as any,
          where: {
            id: { contains: `e2e-custom-${uniqueId}` },
          },
        })

        expect(importedPages.totalDocs).toBe(2)
        expect(importedPages.docs[0]?.id).toContain(`e2e-custom-${uniqueId}`)
      })
    })
  })

  test.describe('S3 Storage', () => {
    test('should import CSV file stored in S3 via jobs queue', async () => {
      const uniqueId = Date.now()
      const csvFilename = `s3-e2e-import-${uniqueId}.csv`
      const csvPath = path.join(__dirname, 'uploads', csvFilename)

      const csvContent = `title\n"S3 E2E Import 1"\n"S3 E2E Import 2"\n"S3 E2E Import 3"`
      fs.writeFileSync(csvPath, csvContent)

      await page.goto(s3ImportsURL.create)
      await expect(page.locator('.collection-edit')).toBeVisible()

      await page.setInputFiles('input[type="file"]', csvPath)
      await expect(page.locator('.file-field__filename')).toHaveValue(csvFilename)

      // Collection field is disabled since this custom import only targets one collection
      const collectionField = page.locator('#field-collectionSlug')
      await expect(collectionField.locator('.rs__control')).toHaveAttribute('aria-disabled', 'true')
      await expect(collectionField.locator('.rs__single-value')).toContainText('Posts With S3s')

      await saveDocAndAssert(page)

      await expect(async () => {
        await runJobsQueue({ serverURL })
        const { docs } = await payload.find({
          collection: postsWithS3ImportSlug as any,
          where: {},
          sort: '-createdAt',
          limit: 1,
        })
        expect(docs[0]?.status).toBe('completed')
      }).toPass({ timeout: POLL_TOPASS_TIMEOUT })

      const posts = await payload.find({
        collection: postsWithS3Slug,
        where: {
          title: { contains: 'S3 E2E Import' },
        },
      })

      expect(posts.totalDocs).toBeGreaterThanOrEqual(3)
    })

    test('should export to S3 via jobs queue and download file', async () => {
      await payload.create({
        collection: postsWithS3Slug,
        data: { title: 'S3 E2E Export 1' },
      })
      await payload.create({
        collection: postsWithS3Slug,
        data: { title: 'S3 E2E Export 2' },
      })

      await page.goto(s3ExportsURL.create)
      await expect(page.locator('.collection-edit')).toBeVisible()

      await saveDocAndAssert(page, '#action-save')

      await expect(async () => {
        await runJobsQueue({ serverURL })
        await page.reload()
        const exportFilename = page.locator('.file-details__main-detail')
        await expect(exportFilename).toBeVisible()
        await expect(exportFilename).toContainText('.csv')
      }).toPass({ timeout: POLL_TOPASS_TIMEOUT })

      const downloadLink = page.locator('.file-details__main-detail a')
      await expect(downloadLink).toHaveAttribute('href', /.+/)

      const [download] = await Promise.all([page.waitForEvent('download'), downloadLink.click()])

      const downloadPath = await download.path()
      const content = fs.readFileSync(downloadPath, 'utf8')

      expect(content).toContain('S3 E2E Export 1')
      expect(content).toContain('S3 E2E Export 2')
    })
  })

  test.describe('Streaming and Preview', () => {
    test('should download large export via streaming without truncation', async () => {
      await page.goto(postsURL.list)
      await expect(page.locator('.collection-list')).toBeVisible()

      const listMenuButton = page.locator('#list-menu')
      await expect(listMenuButton).toBeVisible()
      await listMenuButton.click()

      const createExportButton = page.locator('.popup__scroll-container button', {
        hasText: 'Export Posts',
      })
      await expect(createExportButton).toBeVisible()
      await createExportButton.click()

      await expect(async () => {
        await expect(page.locator('.export-preview')).toBeVisible()
      }).toPass({ timeout: POLL_TOPASS_TIMEOUT })

      const downloadButton = page.locator('.doc-controls__controls button', {
        hasText: 'Download',
      })
      await expect(downloadButton).toBeVisible()

      const [download] = await Promise.all([page.waitForEvent('download'), downloadButton.click()])

      const downloadPath = await download.path()
      expect(downloadPath).not.toBeNull()

      const stats = fs.statSync(downloadPath)
      expect(stats.size).toBeGreaterThan(1000)

      const content = fs.readFileSync(downloadPath, 'utf-8')
      const lines = content.split('\n').filter((line) => line.trim())
      expect(lines.length).toBeGreaterThan(50)

      const suggestedFilename = download.suggestedFilename()
      expect(suggestedFilename).toMatch(/\.csv/)
    })

    test('should show export preview with pagination limited to 10 rows', async () => {
      await page.goto(postsURL.list)
      await expect(page.locator('.collection-list')).toBeVisible()

      const listMenuButton = page.locator('#list-menu')
      await expect(listMenuButton).toBeVisible()
      await listMenuButton.click()

      const createExportButton = page.locator('.popup__scroll-container button', {
        hasText: 'Export Posts',
      })
      await expect(createExportButton).toBeVisible()
      await createExportButton.click()

      await expect(async () => {
        await expect(page.locator('.export-preview')).toBeVisible()
      }).toPass({ timeout: POLL_TOPASS_TIMEOUT })

      await expect(async () => {
        await expect(page.locator('.export-preview table')).toBeVisible()
      }).toPass({ timeout: POLL_TOPASS_TIMEOUT })

      const tableBody = page.locator('.export-preview table tbody')
      await expect(tableBody).toBeVisible()

      const dataRows = page.locator('.export-preview table tbody tr')
      const rowCount = await dataRows.count()

      expect(rowCount).toBeLessThanOrEqual(10)
      expect(rowCount).toBeGreaterThan(0)

      const exportCount = page.locator('.export-preview__export-count')
      await expect(exportCount).toContainText('documents to export')
    })
  })

  test.describe('Max Limit Enforcement', () => {
    let postsWithLimitsURL: AdminUrlUtil
    let postsWithLimitsExportURL: AdminUrlUtil
    let postsWithLimitsImportURL: AdminUrlUtil

    test.beforeAll(async () => {
      postsWithLimitsURL = new AdminUrlUtil(serverURL, 'posts-with-limits')
      postsWithLimitsExportURL = new AdminUrlUtil(serverURL, 'posts-with-limits-export')
      postsWithLimitsImportURL = new AdminUrlUtil(serverURL, 'posts-with-limits-import')

      // Create 10 test documents (more than the limit of 5)
      for (let i = 0; i < 10; i++) {
        await payload.create({
          collection: 'posts-with-limits',
          data: { title: `E2E Limit Test Post ${i}` },
        })
      }
    })

    test.afterAll(async () => {
      // Clean up test documents
      await payload.delete({
        collection: 'posts-with-limits',
        where: {
          title: { contains: 'E2E Limit Test Post' },
        },
      })
    })

    test('should show maxLimit in export preview and cap document count', async () => {
      await page.goto(postsWithLimitsURL.list)
      await expect(page.locator('.collection-list')).toBeVisible()

      const listMenuButton = page.locator('#list-menu')
      await expect(listMenuButton).toBeVisible()
      await listMenuButton.click()

      const createExportButton = page.locator('.popup__scroll-container button', {
        hasText: 'Export Posts With Limits',
      })
      await expect(createExportButton).toBeVisible()
      await createExportButton.click()

      await expect(async () => {
        await expect(page.locator('.export-preview')).toBeVisible()
      }).toPass({ timeout: POLL_TOPASS_TIMEOUT })

      await expect(async () => {
        await expect(page.locator('.export-preview table')).toBeVisible()
      }).toPass({ timeout: POLL_TOPASS_TIMEOUT })

      // The export count should show 5 (the maxLimit), not 10
      const exportCount = page.locator('.export-preview__export-count')
      await expect(exportCount).toContainText('5 documents to export')
    })

    test('should show limit capped warning when user limit exceeds maxLimit', async () => {
      await page.goto(postsWithLimitsURL.list)
      await expect(page.locator('.collection-list')).toBeVisible()

      const listMenuButton = page.locator('#list-menu')
      await expect(listMenuButton).toBeVisible()
      await listMenuButton.click()

      const createExportButton = page.locator('.popup__scroll-container button', {
        hasText: 'Export Posts With Limits',
      })
      await expect(createExportButton).toBeVisible()
      await createExportButton.click()

      await expect(async () => {
        await expect(page.locator('.export-preview')).toBeVisible()
      }).toPass({ timeout: POLL_TOPASS_TIMEOUT })

      const limitField = page.locator('input[name="limit"]')
      await limitField.fill('10')

      await expect(async () => {
        await expect(page.locator('.export-preview table')).toBeVisible()
      }).toPass({ timeout: POLL_TOPASS_TIMEOUT })

      const exportCount = page.locator('.export-preview__export-count')
      await expect(exportCount).toContainText('5 documents to export')

      const limitCapped = page.locator('.export-preview__limit-capped')
      await expect(limitCapped).toBeVisible()
      await expect(limitCapped).toContainText('Limit capped to maximum of 5')

      const tableRows = page.locator('.export-preview table tbody tr')
      await expect(tableRows).toHaveCount(5)
    })

    test('should enforce maxLimit when creating export', async () => {
      await page.goto(postsWithLimitsURL.list)
      await expect(page.locator('.collection-list')).toBeVisible()

      const listMenuButton = page.locator('#list-menu')
      await expect(listMenuButton).toBeVisible()
      await listMenuButton.click()

      const createExportButton = page.locator('.popup__scroll-container button', {
        hasText: 'Export Posts With Limits',
      })
      await expect(createExportButton).toBeVisible()
      await createExportButton.click()

      await expect(async () => {
        await expect(page.locator('.export-preview table')).toBeVisible()
      }).toPass({ timeout: POLL_TOPASS_TIMEOUT })

      await saveDocAndAssert(page, '#action-save')

      await expect(async () => {
        await page.reload()

        const exportFilename = page.locator('.file-details__main-detail')
        await expect(exportFilename).toBeVisible()
        await expect(exportFilename).toContainText('.csv')
      }).toPass({ timeout: POLL_TOPASS_TIMEOUT })

      const downloadLink = page.locator('.file-details__main-detail a')
      await expect(downloadLink).toHaveAttribute('href', /.+/)

      const [download] = await Promise.all([page.waitForEvent('download'), downloadLink.click()])

      const downloadPath = await download.path()
      const content = fs.readFileSync(downloadPath, 'utf8')
      const lines = content.split('\n').filter((line) => line.trim())

      expect(lines.length).toBe(6)
    })

    test('should show warning in import preview when file exceeds maxLimit', async () => {
      const csvContent = Array.from({ length: 10 }, (_, i) => `"E2E Import Limit Test ${i}"`).join(
        '\n',
      )
      const csvFile = `title\n${csvContent}`

      await page.goto(postsWithLimitsImportURL.create)
      await expect(page.locator('.collection-edit')).toBeVisible()

      // Collection field is disabled since this custom import only targets one collection
      const collectionField = page.locator('#field-collectionSlug')
      await expect(collectionField.locator('.rs__control')).toHaveAttribute('aria-disabled', 'true')
      await expect(collectionField.locator('.rs__single-value')).toContainText('Posts With Limits')

      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles({
        name: 'exceed-limit-test.csv',
        buffer: Buffer.from(csvFile),
        mimeType: 'text/csv',
      })

      await expect(async () => {
        await expect(page.locator('.import-preview__import-count')).toBeVisible()
      }).toPass({ timeout: POLL_TOPASS_TIMEOUT })

      const importCount = page.locator('.import-preview__import-count')
      await expect(importCount).toContainText('10 documents to import')
    })
  })

  test.describe('Dynamic User-Based Limits', () => {
    let postsWithLimitsURL: AdminUrlUtil
    let postsWithLimitsImportURL: AdminUrlUtil

    test.beforeAll(async () => {
      postsWithLimitsURL = new AdminUrlUtil(serverURL, 'posts-with-limits')
      postsWithLimitsImportURL = new AdminUrlUtil(serverURL, 'posts-with-limits-import')

      // Update the dev user's limit to 7
      const devUsers = await payload.find({
        collection: 'users',
        where: { email: { equals: 'dev@payloadcms.com' } },
      })

      await payload.update({
        id: devUsers.docs[0]!.id,
        collection: 'users',
        data: { limit: 7 },
      })

      // Create 10 test documents (more than both limits)
      for (let i = 0; i < 10; i++) {
        await payload.create({
          collection: 'posts-with-limits',
          data: { title: `E2E Dynamic Limit Post ${i}` },
        })
      }
    })

    test.afterAll(async () => {
      // Reset the dev user's limit
      const devUsers = await payload.find({
        collection: 'users',
        where: { email: { equals: 'dev@payloadcms.com' } },
      })

      await payload.update({
        id: devUsers.docs[0]!.id,
        collection: 'users',
        data: { limit: null as unknown as number },
      })

      // Clean up test documents
      await payload.delete({
        collection: 'posts-with-limits',
        where: {
          title: { contains: 'E2E Dynamic Limit Post' },
        },
      })
    })

    test('should show dynamic maxLimit of 7 in export preview when user limit is 7', async () => {
      await page.goto(postsWithLimitsURL.list)
      await expect(page.locator('.collection-list')).toBeVisible()

      const listMenuButton = page.locator('#list-menu')
      await expect(listMenuButton).toBeVisible()
      await listMenuButton.click()

      const createExportButton = page.locator('.popup__scroll-container button', {
        hasText: 'Export Posts With Limits',
      })
      await expect(createExportButton).toBeVisible()
      await createExportButton.click()

      await expect(async () => {
        await expect(page.locator('.export-preview')).toBeVisible()
      }).toPass({ timeout: POLL_TOPASS_TIMEOUT })

      await expect(async () => {
        await expect(page.locator('.export-preview table')).toBeVisible()
      }).toPass({ timeout: POLL_TOPASS_TIMEOUT })

      // The export count should show 7 (the dynamic user limit), not 5
      const exportCount = page.locator('.export-preview__export-count')
      await expect(exportCount).toContainText('7 documents to export')
    })

    test('should export exactly 7 documents with dynamic user limit', async () => {
      await page.goto(postsWithLimitsURL.list)
      await expect(page.locator('.collection-list')).toBeVisible()

      const listMenuButton = page.locator('#list-menu')
      await expect(listMenuButton).toBeVisible()
      await listMenuButton.click()

      const createExportButton = page.locator('.popup__scroll-container button', {
        hasText: 'Export Posts With Limits',
      })
      await expect(createExportButton).toBeVisible()
      await createExportButton.click()

      await expect(async () => {
        await expect(page.locator('.export-preview table')).toBeVisible()
      }).toPass({ timeout: POLL_TOPASS_TIMEOUT })

      await saveDocAndAssert(page, '#action-save')

      await expect(async () => {
        await page.reload()

        const exportFilename = page.locator('.file-details__main-detail')
        await expect(exportFilename).toBeVisible()
        await expect(exportFilename).toContainText('.csv')
      }).toPass({ timeout: POLL_TOPASS_TIMEOUT })

      const downloadLink = page.locator('.file-details__main-detail a')
      await expect(downloadLink).toHaveAttribute('href', /.+/)

      const [download] = await Promise.all([page.waitForEvent('download'), downloadLink.click()])

      const downloadPath = await download.path()
      const content = fs.readFileSync(downloadPath, 'utf8')
      const lines = content.split('\n').filter((line) => line.trim())

      // 7 data rows + 1 header row = 8 lines
      expect(lines.length).toBe(8)
    })

    test('should show limit capped to 7 when user limit exceeds dynamic maxLimit', async () => {
      await page.goto(postsWithLimitsURL.list)
      await expect(page.locator('.collection-list')).toBeVisible()

      const listMenuButton = page.locator('#list-menu')
      await expect(listMenuButton).toBeVisible()
      await listMenuButton.click()

      const createExportButton = page.locator('.popup__scroll-container button', {
        hasText: 'Export Posts With Limits',
      })
      await expect(createExportButton).toBeVisible()
      await createExportButton.click()

      await expect(async () => {
        await expect(page.locator('.export-preview')).toBeVisible()
      }).toPass({ timeout: POLL_TOPASS_TIMEOUT })

      const limitField = page.locator('input[name="limit"]')
      await limitField.fill('20')

      await expect(async () => {
        await expect(page.locator('.export-preview table')).toBeVisible()
      }).toPass({ timeout: POLL_TOPASS_TIMEOUT })

      const exportCount = page.locator('.export-preview__export-count')
      await expect(exportCount).toContainText('7 documents to export')

      const limitCapped = page.locator('.export-preview__limit-capped')
      await expect(limitCapped).toBeVisible()
      await expect(limitCapped).toContainText('Limit capped to maximum of 7')

      const tableRows = page.locator('.export-preview table tbody tr')
      await expect(tableRows).toHaveCount(7)
    })

    test('should still show import limit of 5 despite user limit of 7', async () => {
      const csvContent = Array.from(
        { length: 10 },
        (_, i) => `"E2E Dynamic Import Test ${i}"`,
      ).join('\n')
      const csvFile = `title\n${csvContent}`

      await page.goto(postsWithLimitsImportURL.create)
      await expect(page.locator('.collection-edit')).toBeVisible()

      // Collection field is disabled since this custom import only targets one collection
      const collectionField = page.locator('#field-collectionSlug')
      await expect(collectionField.locator('.rs__control')).toHaveAttribute('aria-disabled', 'true')
      await expect(collectionField.locator('.rs__single-value')).toContainText('Posts With Limits')

      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles({
        name: 'dynamic-limit-import-test.csv',
        buffer: Buffer.from(csvFile),
        mimeType: 'text/csv',
      })

      await expect(async () => {
        await expect(page.locator('.import-preview__import-count')).toBeVisible()
      }).toPass({ timeout: POLL_TOPASS_TIMEOUT })

      const importCount = page.locator('.import-preview__import-count')
      await expect(importCount).toContainText('10 documents to import')
    })
  })
})
