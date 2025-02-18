import type { BrowserContext, Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { addBlock } from 'helpers/e2e/addBlock.js'
import { openBlocksDrawer } from 'helpers/e2e/openBlocksDrawer.js'
import path from 'path'
import { fileURLToPath } from 'url'

import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../../../helpers.js'
import { AdminUrlUtil } from '../../../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../../../helpers/reInitializeDB.js'
import { RESTClient } from '../../../helpers/rest.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, beforeEach, describe } = test

let client: RESTClient
let page: Page
let serverURL: string
let context: BrowserContext

// If we want to make this run in parallel: test.describe.configure({ mode: 'parallel' })

describe('Block fields', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ serverURL } = await initPayloadE2ENoConfig({
      dirname,
    }))

    context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ page, serverURL })
  })

  beforeEach(async () => {
    await reInitializeDB({
      serverURL,
      snapshotKey: 'fieldsTest',
      uploadsDir: path.resolve(dirname, './collections/Upload/uploads'),
    })

    if (client) {
      await client.logout()
    }
    client = new RESTClient({ defaultSlug: 'users', serverURL })
    await client.login()

    await ensureCompilationIsDone({ page, serverURL })
  })

  let url: AdminUrlUtil

  beforeAll(() => {
    url = new AdminUrlUtil(serverURL, 'block-fields')
  })

  test('should open blocks drawer and select first block', async () => {
    await page.goto(url.create)

    await addBlock({
      page,
      fieldName: 'blocks',
      blockLabel: 'Content',
    })

    // ensure the block was appended to the rows
    const addedRow = page.locator('#field-blocks .blocks-field__row').last()
    await expect(addedRow).toBeVisible()
    await expect(addedRow.locator('.blocks-field__block-header')).toHaveText(
      'Custom Block Label: Content 04',
    )
  })

  test('should reset search state in blocks drawer on re-open', async () => {
    await page.goto(url.create)

    const blocksDrawer = await openBlocksDrawer({
      page,
      fieldName: 'blocks',
    })

    const searchInput = page.locator('.block-search__input')
    await searchInput.fill('Number')

    // select the first block in the drawer

    const firstBlockSelector = blocksDrawer
      .locator('.blocks-drawer__blocks .blocks-drawer__block')
      .first()

    await expect(firstBlockSelector).toContainText('Number')

    await page.locator('.drawer__header__close').click()
    const addButton = page.locator('#field-blocks > .blocks-field__drawer-toggler')
    await addButton.click()

    await expect(blocksDrawer).toBeVisible()
    await expect(searchInput).toHaveValue('')
    await expect(firstBlockSelector).toContainText('Content')
  })

  test('should open blocks drawer from block row and add below', async () => {
    await page.goto(url.create)
    const firstRow = page.locator('#field-blocks #blocks-row-0')
    const rowActions = firstRow.locator('.collapsible__actions')
    await expect(rowActions).toBeVisible()

    await rowActions.locator('.array-actions__button').click()
    const addBelowButton = rowActions.locator('.array-actions__action.array-actions__add')
    await expect(addBelowButton).toBeVisible()
    await addBelowButton.click()

    const blocksDrawer = page.locator('[id^=drawer_1_blocks-drawer-]')
    await expect(blocksDrawer).toBeVisible()

    // select the first block in the drawer
    const firstBlockSelector = blocksDrawer
      .locator('.blocks-drawer__blocks .blocks-drawer__block')
      .first()

    await expect(firstBlockSelector).toContainText('Content')
    await firstBlockSelector.click()

    // ensure the block was inserted beneath the first in the rows
    const addedRow = page.locator('#field-blocks #blocks-row-1')
    await expect(addedRow).toBeVisible()
    await expect(addedRow.locator('.blocks-field__block-header')).toHaveText(
      'Custom Block Label: Content 02',
    ) // went from `Number` to `Content`
  })

  test('should duplicate block', async () => {
    await page.goto(url.create)
    const firstRow = page.locator('#field-blocks #blocks-row-0')
    const rowActions = firstRow.locator('.collapsible__actions')
    await expect(rowActions).toBeVisible()

    await rowActions.locator('.array-actions__button').click()
    const duplicateButton = rowActions.locator('.array-actions__action.array-actions__duplicate')
    await expect(duplicateButton).toBeVisible()
    await duplicateButton.click()

    const blocks = page.locator('#field-blocks > .blocks-field__rows > div')
    expect(await blocks.count()).toEqual(4)
  })

  test('should save when duplicating subblocks', async () => {
    await page.goto(url.create)
    const subblocksRow = page.locator('#field-blocks #blocks-row-2')
    const rowActions = subblocksRow.locator('.collapsible__actions').first()
    await expect(rowActions).toBeVisible()

    await rowActions.locator('.array-actions__button').click()
    const duplicateButton = rowActions.locator('.array-actions__action.array-actions__duplicate')
    await expect(duplicateButton).toBeVisible()
    await duplicateButton.click()

    const blocks = page.locator('#field-blocks > .blocks-field__rows > div')
    expect(await blocks.count()).toEqual(4)

    await page.click('#action-save')
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
  })

  test('should use i18n block labels', async () => {
    await page.goto(url.create)
    await expect(page.locator('#field-i18nBlocks .blocks-field__header')).toContainText('Block en')

    await addBlock({
      page,
      fieldName: 'i18nBlocks',
      blockLabel: 'Text en',
    })

    // ensure the block was appended to the rows
    const firstRow = page.locator('#field-i18nBlocks .blocks-field__row').first()
    await expect(firstRow).toBeVisible()
    await expect(firstRow.locator('.blocks-field__block-pill-textInI18nBlock')).toContainText(
      'Text en',
    )
  })

  test('should render custom block row label', async () => {
    await page.goto(url.create)

    await addBlock({
      page,
      fieldName: 'blocks',
      blockLabel: 'Content',
    })

    await expect(
      page.locator('#field-blocks .blocks-field__row .blocks-field__block-header', {
        hasText: 'Custom Block Label',
      }),
    ).toBeVisible()
  })

  test('should add different blocks with similar field configs', async () => {
    await page.goto(url.create)

    await addBlock({
      page,
      fieldName: 'blocksWithSimilarConfigs',
      blockLabel: 'Block A',
    })

    await page
      .locator('#blocksWithSimilarConfigs-row-0')
      .getByRole('button', { name: 'Add Item' })
      .click()

    await page
      .locator('input[name="blocksWithSimilarConfigs.0.items.0.title"]')
      .fill('items>0>title')

    await expect(
      page.locator('input[name="blocksWithSimilarConfigs.0.items.0.title"]'),
    ).toHaveValue('items>0>title')

    await addBlock({
      page,
      fieldName: 'blocksWithSimilarConfigs',
      blockLabel: 'Block B',
    })

    await page
      .locator('#blocksWithSimilarConfigs-row-1')
      .getByRole('button', { name: 'Add Item' })
      .click()

    await page
      .locator('input[name="blocksWithSimilarConfigs.1.items.0.title2"]')
      .fill('items>1>title')

    await expect(
      page.locator('input[name="blocksWithSimilarConfigs.1.items.0.title2"]'),
    ).toHaveValue('items>1>title')
  })

  test('should bypass min rows validation when no rows present and field is not required', async () => {
    await page.goto(url.create)
    await saveDocAndAssert(page)
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
  })

  test('should fail min rows validation when rows are present', async () => {
    await page.goto(url.create)

    await addBlock({
      page,
      fieldName: 'blocksWithMinRows',
      blockLabel: 'Block With Min Row',
    })

    const firstRow = page.locator('input[name="blocksWithMinRows.0.blockTitle"]')
    await expect(firstRow).toBeVisible()
    await firstRow.fill('first row')
    await expect(firstRow).toHaveValue('first row')

    await page.click('#action-save', { delay: 100 })
    await expect(page.locator('.payload-toast-container')).toContainText(
      'The following field is invalid: Blocks With Min Rows',
    )
  })

  test('ensure functions passed to blocks field labels property are respected', async () => {
    await page.goto(url.create)

    const blocksFieldWithLabels = page.locator('#field-blockWithLabels')

    await expect(blocksFieldWithLabels.locator('.blocks-field__drawer-toggler')).toHaveText(
      'Add Account',
    )
  })

  describe('row manipulation', () => {
    describe('react hooks', () => {
      test('should add 2 new block rows', async () => {
        await page.goto(url.create)

        await page
          .locator('.custom-blocks-field-management')
          .getByRole('button', { name: 'Add Block 1' })
          .click()

        const customBlocks = page.locator(
          '#field-customBlocks input[name="customBlocks.0.block1Title"]',
        )

        await page.mouse.wheel(0, 1750)

        await customBlocks.scrollIntoViewIfNeeded()

        await expect(customBlocks).toHaveValue('Block 1: Prefilled Title')

        await page
          .locator('.custom-blocks-field-management')
          .getByRole('button', { name: 'Add Block 2' })
          .click()

        await expect(
          page.locator('#field-customBlocks input[name="customBlocks.1.block2Title"]'),
        ).toHaveValue('Block 2: Prefilled Title')

        await page
          .locator('.custom-blocks-field-management')
          .getByRole('button', { name: 'Replace Block 2' })
          .click()

        await expect(
          page.locator('#field-customBlocks input[name="customBlocks.1.block1Title"]'),
        ).toHaveValue('REPLACED BLOCK')
      })
    })
  })

  describe('sortable blocks', () => {
    test('should not render sort controls when sorting is disabled', async () => {
      await page.goto(url.create)
      const field = page.locator('#field-disableSort > div > div > .array-actions__action-chevron')
      expect(await field.count()).toEqual(0)
    })

    test('should not render drag handle when sorting is disabled', async () => {
      await page.goto(url.create)
      const field = page.locator(
        '#field-disableSort > .blocks-field__rows > div > div > .collapsible__drag',
      )
      expect(await field.count()).toEqual(0)
    })
  })
})
