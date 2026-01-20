import type { BrowserContext, Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { copyPasteField } from 'helpers/e2e/copyPasteField.js'
import {
  addBlock,
  addBlockBelow,
  duplicateBlock,
  openBlocksDrawer,
  reorderBlocks,
} from 'helpers/e2e/fields/blocks/index.js'
import { scrollEntirePage } from 'helpers/e2e/scrollEntirePage.js'
import { toggleBlockOrArrayRow } from 'helpers/e2e/toggleCollapsible.js'
import path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
  // throttleTest,
} from '../../../helpers.js'
import { AdminUrlUtil } from '../../../helpers/adminUrlUtil.js'
import { assertToastErrors } from '../../../helpers/assertToastErrors.js'
import { assertNetworkRequests } from '../../../helpers/e2e/assertNetworkRequests.js'
import { initPayloadE2ENoConfig } from '../../../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../../../helpers/reInitializeDB.js'
import { RESTClient } from '../../../helpers/rest.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../../../playwright.config.js'

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
    /*await throttleTest({
      page,
      context,
      delay: 'Slow 4G',
    })*/
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
      blockToSelect: 'Content',
    })

    // ensure the block was appended to the rows
    const addedRow = page.locator('#field-blocks .blocks-field__row').last()
    await expect(addedRow).toBeVisible()
    await expect(addedRow.locator('.blocks-field__block-header')).toHaveText(
      'Custom Block Label: Content 05',
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

    await addBlockBelow(page, { fieldName: 'blocks', blockToSelect: 'Content' })

    // ensure the block was inserted beneath the first in the rows
    const addedRow = page.locator('#field-blocks #blocks-row-1')

    await expect(addedRow).toBeVisible()

    await expect(addedRow.locator('.blocks-field__block-header')).toHaveText(
      'Custom Block Label: Content 02',
    ) // went from `Number` to `Content`
  })

  test('should duplicate block', async () => {
    await page.goto(url.create)

    const { rowCount } = await duplicateBlock(page, { fieldName: 'blocks' })

    expect(rowCount).toEqual(5)
  })

  test('should save when duplicating subblocks', async () => {
    await page.goto(url.create)

    const { rowCount } = await duplicateBlock(page, { fieldName: 'blocks', rowIndex: 2 })

    expect(rowCount).toEqual(5)

    await saveDocAndAssert(page)
  })

  test('should initialize block rows with collapsed state', async () => {
    await page.goto(url.create)

    await addBlock({
      page,
      fieldName: 'collapsedByDefaultBlocks',
      blockToSelect: 'Localized Content',
    })

    const row = page.locator(`#collapsedByDefaultBlocks-row-4`)
    const toggler = row.locator('button.collapsible__toggle')

    await expect(toggler).toHaveClass(/collapsible__toggle--collapsed/)
    await expect(page.locator(`#field-collapsedByDefaultBlocks__4__text`)).toBeHidden()
  })

  test('should not collapse block rows on input change', async () => {
    await page.goto(url.create)

    await addBlock({
      page,
      fieldName: 'collapsedByDefaultBlocks',
      blockToSelect: 'Localized Content',
    })

    const row = page.locator(`#collapsedByDefaultBlocks-row-4`)
    const toggler = row.locator('button.collapsible__toggle')

    await expect(toggler).toHaveClass(/collapsible__toggle--collapsed/)
    await expect(page.locator(`#field-collapsedByDefaultBlocks__4__text`)).toBeHidden()

    await toggleBlockOrArrayRow({
      page,
      fieldName: 'collapsedByDefaultBlocks',
      targetState: 'open',
      rowIndex: 4,
    })

    await page.locator('input#field-collapsedByDefaultBlocks__4__text').fill('Hello, world!')

    // wait for form state to return, in the future can wire this into watch network requests (if needed)
    await wait(1000)

    await expect(toggler).toHaveClass(/collapsible__toggle--open/)
    await expect(page.locator(`#field-collapsedByDefaultBlocks__4__text`)).toBeVisible()
  })

  test('should use i18n block labels', async () => {
    await page.goto(url.create)
    await expect(page.locator('#field-i18nBlocks .blocks-field__header')).toContainText('Block en')

    await addBlock({
      page,
      fieldName: 'i18nBlocks',
      blockToSelect: 'Text en',
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
      blockToSelect: 'Content',
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
      blockToSelect: 'Block A',
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
      blockToSelect: 'Block B',
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
  })

  test('should fail min rows validation when rows are present', async () => {
    await page.goto(url.create)

    await addBlock({
      page,
      fieldName: 'blocksWithMinRows',
      blockToSelect: 'Block With Min Row',
    })

    const firstRow = page.locator('input[name="blocksWithMinRows.0.blockTitle"]')
    await expect(firstRow).toBeVisible()
    await firstRow.fill('first row')
    await expect(firstRow).toHaveValue('first row')

    await page.click('#action-save', { delay: 100 })
    await assertToastErrors({
      page,
      errors: ['Blocks With Min Rows'],
    })
  })

  test('ensure functions passed to blocks field labels property are respected', async () => {
    await page.goto(url.create)

    const blocksFieldWithLabels = page.locator('#field-blockWithLabels')

    await expect(blocksFieldWithLabels.locator('.blocks-field__drawer-toggler')).toHaveText(
      'Add Account',
    )
  })

  test('should only apply error styling to block with error', async () => {
    await page.goto(url.create)

    const firstBlockTextInput = page.locator('#field-blocks__0__text')
    await firstBlockTextInput.fill('')

    await page.click('#action-save')

    const blockNameInput = page.locator('#blocks-row-1 input#blocks\\.1\\.blockName').first()

    await expect(blockNameInput).toHaveValue('Second block')
    await expect(blockNameInput).not.toHaveCSS('color', 'rgb(123, 41, 39)')
  })

  describe('row manipulation', () => {
    test('moving rows should immediately move custom row labels', async () => {
      await page.goto(url.create)
      // Ensure blocks are loaded
      await expect(page.locator('.shimmer-effect')).toHaveCount(0)

      // first ensure that the first block has the custom header, and that the second block doesn't

      await expect(
        page.locator('#field-blocks #blocks-row-0 .blocks-field__block-header'),
      ).toHaveText('Custom Block Label: Content 01')

      const secondBlockHeader = page.locator(
        '#field-blocks #blocks-row-1 .blocks-field__block-header',
      )

      await expect(secondBlockHeader.locator('.blocks-field__block-pill')).toHaveText('Number')

      await expect(secondBlockHeader.locator('input[id="blocks.1.blockName"]')).toHaveValue(
        'Second block',
      )

      await wait(1000)

      await reorderBlocks({
        page,
        fieldName: 'blocks',
        fromBlockIndex: 0,
        toBlockIndex: 1,
      })

      // Important: do _not_ poll here, use `textContent()` instead of `toHaveText()`
      // This will prevent Playwright from polling for the change to the DOM
      await expect(async () => {
        const text = await page
          .locator('#field-blocks #blocks-row-1 .blocks-field__block-header')
          .textContent()
        expect(text).toMatch(/^Custom Block Label: Content/)
      }).toPass()
    })

    describe('react hooks', () => {
      test('should add 2 new block rows', async () => {
        await page.goto(url.create)
        // Ensure blocks are loaded
        await expect(page.locator('.shimmer-effect')).toHaveCount(0)

        await scrollEntirePage(page)

        await page
          .locator('.custom-blocks-field-management')
          .getByRole('button', { name: 'Add Block 1' })
          .click()
        // Ensure blocks are loaded
        await expect(page.locator('.shimmer-effect')).toHaveCount(0)

        await expect(
          page.locator('#field-customBlocks input[name="customBlocks.0.block1Title"]'),
        ).toHaveValue('Block 1: Prefilled Title')

        await page
          .locator('.custom-blocks-field-management')
          .getByRole('button', { name: 'Add Block 2' })
          .click()
        // Ensure blocks are loaded
        await expect(page.locator('.shimmer-effect')).toHaveCount(0)

        await expect(
          page.locator('#field-customBlocks input[name="customBlocks.1.block2Title"]'),
        ).toHaveValue('Block 2: Prefilled Title')

        await page
          .locator('.custom-blocks-field-management')
          .getByRole('button', { name: 'Replace Block 2' })
          .click()
        // Ensure blocks are loaded
        await expect(page.locator('.shimmer-effect')).toHaveCount(0)

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

  describe('blockNames', () => {
    test('should show blockName field', async () => {
      await page.goto(url.create)

      const blockWithBlockname = page.locator('#field-blocks .blocks-field__rows #blocks-row-1')

      const blocknameField = blockWithBlockname.locator('.section-title')

      await expect(async () => await expect(blocknameField).toBeVisible()).toPass({
        timeout: POLL_TOPASS_TIMEOUT,
      })

      await expect(blocknameField).toHaveAttribute('data-value', 'Second block')
    })

    test("should not show blockName field when it's disabled", async () => {
      await page.goto(url.create)
      const blockWithBlockname = page.locator('#field-blocks .blocks-field__rows #blocks-row-3')

      await expect(
        async () => await expect(blockWithBlockname.locator('.section-title')).toBeHidden(),
      ).toPass({
        timeout: POLL_TOPASS_TIMEOUT,
      })
    })
  })

  describe('block groups', () => {
    test('should render group labels', async () => {
      await page.goto(url.create)
      const addButton = page.locator('#field-groupedBlocks > .blocks-field__drawer-toggler')
      await addButton.click()

      const blocksDrawer = page.locator('[id^=drawer_1_blocks-drawer-]')
      await expect(blocksDrawer).toBeVisible()

      const groupLabel = blocksDrawer.locator('.blocks-drawer__block-group-label').first()
      await expect(groupLabel).toBeVisible()
      await expect(groupLabel).toHaveText('Group')
    })

    test('should render localized group labels', async () => {
      await page.goto(url.create)
      const addButton = page.locator('#field-groupedBlocks > .blocks-field__drawer-toggler')
      await addButton.click()

      const blocksDrawer = page.locator('[id^=drawer_1_blocks-drawer-]')
      await expect(blocksDrawer).toBeVisible()

      const groupLabel = blocksDrawer.locator('.blocks-drawer__block-group-label').nth(1)
      await expect(groupLabel).toBeVisible()
      await expect(groupLabel).toHaveText('Group in en')
    })
  })

  describe('copy paste', () => {
    test('should prevent copying an empty block field', async () => {
      await page.goto(url.create)
      const popupBtn = page.locator(
        '#field-i18nBlocks .popup.clipboard-action__popup button.popup-button',
      )
      await popupBtn.click()
      const disabledCopyBtn = page.locator(
        '.popup__content div.popup-button-list__disabled:has-text("Copy Field")',
      )
      await expect(disabledCopyBtn).toBeVisible()
    })

    test('should prevent pasting into readonly block field', async () => {
      await page.goto(url.create)
      await copyPasteField({
        fieldName: 'readOnly',
        page,
      })
      const popupBtn = page.locator(
        '#field-readOnly .popup.clipboard-action__popup button.popup-button',
      )
      await expect(popupBtn).toBeVisible()
      await popupBtn.click()
      const disabledPasteBtn = page.locator(
        '.popup__content div.popup-button-list__disabled:has-text("Paste Field")',
      )
      await expect(disabledPasteBtn).toBeVisible()
    })

    test('should prevent pasting into block field with different schema', async () => {
      await page.goto(url.create)
      await copyPasteField({
        fieldName: 'readOnly',
        page,
      })
      await copyPasteField({
        fieldName: 'groupedBlocks',
        page,
        action: 'paste',
      })
      const pasteErrorToast = page
        .locator('.payload-toast-item.toast-error')
        .filter({ hasText: 'Invalid clipboard data.' })
      await expect(pasteErrorToast).toBeVisible()
    })

    test('should copy and paste block fields', async () => {
      await page.goto(url.create)
      const field = page.locator('#field-blocks')
      const row = field.locator('#blocks-row-0')
      const rowTextInput = row.locator('#field-blocks__0__text')

      const textVal = 'row one copy'
      await rowTextInput.fill(textVal)

      await copyPasteField({
        page,
        fieldName: 'blocks',
      })

      await page.reload()

      await expect(rowTextInput).toHaveValue('first block')

      await copyPasteField({
        page,
        action: 'paste',
        fieldName: 'blocks',
      })

      await expect(rowTextInput).toHaveValue(textVal)
    })

    test('should copy and paste block rows', async () => {
      await page.goto(url.create)
      const field = page.locator('#field-blocks')
      const row = field.locator('#blocks-row-0')
      const rowTextInput = row.locator('#field-blocks__0__text')

      const textVal = 'row one copy'
      await rowTextInput.fill(textVal)

      await copyPasteField({
        page,
        fieldName: 'blocks',
        rowIndex: 0,
      })

      await page.reload()

      await expect(rowTextInput).toHaveValue('first block')

      await copyPasteField({
        page,
        action: 'paste',
        fieldName: 'blocks',
        rowIndex: 0,
      })

      await expect(rowTextInput).toHaveValue(textVal)
    })

    test('should copy a block row and paste into a field with the same schema', async () => {
      await page.goto(url.create)

      await copyPasteField({
        page,
        fieldName: 'blocks',
        rowIndex: 1,
      })

      await copyPasteField({
        page,
        fieldName: 'duplicate',
        action: 'paste',
      })

      const rowsContainer = page.locator('#field-duplicate > div.blocks-field__rows').first()
      await expect(rowsContainer).toBeVisible()
      const rowTextInput = rowsContainer.locator('#field-duplicate__0__number')
      await expect(rowTextInput).toHaveValue('342')
    })

    test('should copy a block field and paste into a row with the same schema', async () => {
      await page.goto(url.create)

      const originalField = page.locator('#field-blocks')
      const originalRow = originalField.locator('#blocks-row-0')
      const originalInput = originalRow.locator('#field-blocks__0__text')

      const textVal = 'row one copy'
      await originalInput.fill(textVal)

      await copyPasteField({
        page,
        fieldName: 'blocks',
      })

      const field = page.locator('#field-duplicate')
      const fieldInput = field.locator('#field-duplicate__0__text')
      await expect(fieldInput).toHaveValue('first block')

      await copyPasteField({ page, action: 'paste', fieldName: 'duplicate', rowIndex: 0 })

      const rowsContainer = page.locator('#field-duplicate > div.blocks-field__rows').first()
      await expect(rowsContainer).toBeVisible()
      const rowTextInput = rowsContainer.locator('#field-duplicate__0__text')
      await expect(rowTextInput).toHaveValue('row one copy')
    })

    test('should correctly paste a row with nested blocks into a row with no children', async () => {
      await page.goto(url.create)

      const field = page.locator('#field-blocks')
      await addBlock({ page, fieldName: 'blocks', blockToSelect: 'Sub Block' })

      const textInputRowOne = field.locator('#field-blocks__2__subBlocks__1__text')
      await expect(textInputRowOne).toBeVisible()

      const textInputRowOneValue = 'copied second sub block'
      await textInputRowOne.fill(textInputRowOneValue)

      await copyPasteField({
        page,
        fieldName: 'blocks',
        rowIndex: 2,
      })

      await copyPasteField({
        page,
        fieldName: 'blocks',
        rowIndex: 4,
        action: 'paste',
      })

      const textInputRowTwo = field.locator('#field-blocks__4__subBlocks__1__text')
      await expect(textInputRowTwo).toBeVisible()
      await expect(textInputRowTwo).toHaveValue(textInputRowOneValue)
    })

    test('should replace the rows of a nested block field with those of its paste counterpart', async () => {
      await page.goto(url.create)

      await addBlock({
        page,
        fieldName: 'blocks',
        blockToSelect: 'Sub Block',
      })

      const field = page.locator('#field-blocks')

      const subArrayContainer = field.locator(
        '#field-blocks__2__subBlocks > div.blocks-field__rows > div',
      )
      const subArrayContainer2 = field.locator(
        '#field-blocks__4__subBlocks > div.blocks-field__rows > div',
      )
      await expect(subArrayContainer).toHaveCount(2)
      await expect(subArrayContainer2).toHaveCount(0)

      await copyPasteField({
        page,
        fieldName: 'blocks',
        rowIndex: 4,
      })

      await copyPasteField({
        page,
        fieldName: 'blocks',
        rowIndex: 2,
        action: 'paste',
      })

      await expect(subArrayContainer).toHaveCount(0)
      await expect(subArrayContainer2).toHaveCount(0)
    })
  })

  describe('conditional blocks', () => {
    test('ensure static filterOptions are respected', async () => {
      await page.goto(url.create)
      const addButton = page.locator(
        '#field-blocksWithFilterOptions > .blocks-field__drawer-toggler',
      )
      await addButton.click()

      const blocksDrawer = page.locator('[id^=drawer_1_blocks-drawer-]')
      await expect(blocksDrawer).toBeVisible()

      const labels = blocksDrawer.locator('.thumbnail-card__label')

      // There should ONLY be blockFour and blockFive available

      await expect(labels).toHaveCount(2)
      await expect(labels.nth(0)).toHaveText('Block Four')
      await expect(labels.nth(1)).toHaveText('Block Five')
    })

    test('ensure dynamic filterOptions are respected', async () => {
      await page.goto(url.create)

      /**
       * ######## All blocks enabled by default, add BlockOne ########
       */
      const addButton = page.locator(
        '#field-blocksWithDynamicFilterOptions > .blocks-field__drawer-toggler',
      )
      await addButton.click()

      const blocksDrawer = page.locator('[id^=drawer_1_blocks-drawer-]')
      await expect(blocksDrawer).toBeVisible()

      const labels = blocksDrawer.locator('.thumbnail-card__label')

      // All blocks available by default
      await expect(labels).toHaveCount(3)
      await expect(labels.nth(0)).toHaveText('Block One')
      await expect(labels.nth(1)).toHaveText('Block Two')
      await expect(labels.nth(2)).toHaveText('Block Three')

      // Close the drawer
      const drawerClose = page.locator('.drawer__header__close')

      // Click Block One and ensure drawer closes
      await labels.nth(0).click()

      await expect(blocksDrawer).toBeHidden()

      await expect(page.locator('#blocksWithDynamicFilterOptions-row-0')).toBeVisible()
      // Ensure no shimmer is present
      await expect(page.locator('.shimmer-effect')).toHaveCount(0)

      /**
       * ######## No blocks enabled if enabledBlocks is set and matches no block slug ########
       */
      await assertNetworkRequests(
        page,
        '/admin/collections/block-fields/create',
        async () => {
          await page.locator('#field-enabledBlocks').fill('nonexistentblock')
        },
        {
          minimumNumberOfRequests: 1,
          allowedNumberOfRequests: 2,
        },
      )
      await wait(200) // To be safe, wait to ensure form state has been merged back on the client-side

      await addButton.click()
      await expect(blocksDrawer).toBeVisible()
      await expect(labels).toHaveCount(0)
      await drawerClose.click()
      await expect(blocksDrawer).toBeHidden()

      /**
       * ######## Enable only BlockTwo, validation error should be thrown as BlockOne is in the data ########
       */
      await assertNetworkRequests(
        page,
        '/admin/collections/block-fields/create',
        async () => {
          await page.locator('#field-enabledBlocks').fill('blockTwo')
        },
        {
          minimumNumberOfRequests: 1,
          allowedNumberOfRequests: 2,
        },
      )
      await wait(200) // To be safe, wait to ensure form state has been merged back on the client-side

      await addButton.click()
      await expect(blocksDrawer).toBeVisible()
      await expect(labels).toHaveCount(1)
      await expect(labels.nth(0)).toHaveText('Block Two')
      await drawerClose.click()
      await expect(blocksDrawer).toBeHidden()

      // Block should still be visible
      await expect(page.locator('#blocksWithDynamicFilterOptions-row-0')).toBeVisible()

      // Save page and ensure validation error is thrown
      await saveDocAndAssert(page, '#action-save', 'error')

      await expect(
        page.locator(
          '#field-blocksWithDynamicFilterOptions .blocks-field__header .error-pill__count',
        ),
      ).toHaveText('1')

      await expect(
        page.locator('#blocksWithDynamicFilterOptions-row-0 .error-pill__count'),
      ).toHaveText('1')

      /**
       * ######## Enable only Block One, no validation error should be thrown ########
       */
      await assertNetworkRequests(
        page,
        '/admin/collections/block-fields/create',
        async () => {
          await page.locator('#field-enabledBlocks').fill('blockOne')
        },
        {
          minimumNumberOfRequests: 1,
          allowedNumberOfRequests: 2,
        },
      )
      await wait(200) // To be safe, wait to ensure form state has been merged back on the client-side

      // After form state request, error pills should disappear
      await expect(
        page.locator(
          '#field-blocksWithDynamicFilterOptions .blocks-field__header .error-pill__count',
        ),
      ).toBeHidden()

      await expect(
        page.locator('#blocksWithDynamicFilterOptions-row-0 .error-pill__count'),
      ).toBeHidden()

      await addButton.click()
      await expect(blocksDrawer).toBeVisible()
      await expect(labels).toHaveCount(1)
      await expect(labels.nth(0)).toHaveText('Block One')
      await drawerClose.click()
      await expect(blocksDrawer).toBeHidden()

      // Ensure no validation error is thrown when saving page
      await saveDocAndAssert(page)
    })
  })
})
