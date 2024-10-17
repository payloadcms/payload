import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'

import type { RelationshipField, TextField } from './payload-types'

import payload from '../../packages/payload/src'
import wait from '../../packages/payload/src/utilities/wait'
import {
  exactText,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
  saveDocHotkeyAndAssert,
} from '../helpers'
import { AdminUrlUtil } from '../helpers/adminUrlUtil'
import { initPayloadE2E } from '../helpers/configHelpers'
import { RESTClient } from '../helpers/rest'
import { jsonDoc } from './collections/JSON/shared'
import { numberDoc } from './collections/Number/shared'
import { textDoc } from './collections/Text/shared'
import { clearAndSeedEverything } from './seed'
import {
  collapsibleFieldsSlug,
  pointFieldsSlug,
  relationshipFieldsSlug,
  tabsFieldsSlug,
  textFieldsSlug,
} from './slugs'

const { afterEach, beforeAll, beforeEach, describe } = test

let client: RESTClient
let page: Page
let serverURL: string
// If we want to make this run in parallel: test.describe.configure({ mode: 'parallel' })

describe('fields', () => {
  beforeAll(async ({ browser }) => {
    const config = await initPayloadE2E(__dirname)
    serverURL = config.serverURL
    client = new RESTClient(null, { defaultSlug: 'users', serverURL })
    await client.login()

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
  })
  beforeEach(async () => {
    await clearAndSeedEverything(payload)
    await client.logout()
    client = new RESTClient(null, { defaultSlug: 'users', serverURL })
    await client.login()
  })
  describe('text', () => {
    let url: AdminUrlUtil
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, textFieldsSlug)
    })

    test('should display field in list view', async () => {
      await page.goto(url.list)
      const textCell = page.locator('.row-1 .cell-text')
      await expect(textCell).toHaveText(textDoc.text)
    })

    test('should not display field in list view column selector if admin.disableListColumn is true', async () => {
      await page.goto(url.list)
      await page.locator('.list-controls__toggle-columns').click()

      await expect(page.locator('.column-selector')).toBeVisible()

      // Check if "Disable List Column Text" is not present in the column options
      await expect(
        page.locator(`.column-selector .column-selector__column`, {
          hasText: exactText('Disable List Column Text'),
        }),
      ).toBeHidden()
    })

    test('should not display admin.disableListColumn true field in list view column selector if toggling other fields', async () => {
      await page.goto(url.list)
      await page.locator('.list-controls__toggle-columns').click()

      await expect(page.locator('.column-selector')).toBeVisible()

      // Click another field in column selector
      const updatedAtButton = page.locator(`.column-selector .column-selector__column`, {
        hasText: exactText('Updated At'),
      })
      await updatedAtButton.click()

      // Check if "Disable List Column Text" is not present in the column options
      await expect(
        page.locator(`.column-selector .column-selector__column`, {
          hasText: exactText('Disable List Column Text'),
        }),
      ).toBeHidden()
    })

    test('should display field in list view filter selector if admin.disableListColumn is true and admin.disableListFilter is false', async () => {
      await page.goto(url.list)
      await page.locator('.list-controls__toggle-where').click()
      await page.waitForSelector('.list-controls__where.rah-static--height-auto')
      await page.locator('.where-builder__add-first-filter').click()

      const initialField = page.locator('.condition__field')
      await initialField.click()
      const initialFieldOptions = initialField.locator('.rs__option')

      // Get all text contents of options
      const optionsTexts = await initialFieldOptions.allTextContents()

      // Check if any option text contains "Disable List Column Text"
      const containsText = optionsTexts.some((text) => text.includes('Disable List Column Text'))

      // Assert that at least one option contains the desired text
      expect(containsText).toBeTruthy()
    })

    test('should display field in list view column selector if admin.disableListColumn is false and admin.disableListFilter is true', async () => {
      await page.goto(url.list)
      await page.locator('.list-controls__toggle-columns').click()

      await expect(page.locator('.column-selector')).toBeVisible()

      // Check if "Disable List Filter Text" is present in the column options
      await expect(
        page.locator(`.column-selector .column-selector__column`, {
          hasText: exactText('Disable List Filter Text'),
        }),
      ).toBeVisible()
    })

    test('should not display field in list view filter condition selector if admin.disableListFilter is true', async () => {
      await page.goto(url.list)
      await page.locator('.list-controls__toggle-where').click()
      await page.waitForSelector('.list-controls__where.rah-static--height-auto')
      await page.locator('.where-builder__add-first-filter').click()

      const initialField = page.locator('.condition__field')
      await initialField.click()
      const initialFieldOptions = initialField.locator('.rs__option')

      // Get all text contents of options
      const optionsTexts = await initialFieldOptions.allTextContents()

      // Check if any option text contains "Disable List Filter Text"
      const containsText = optionsTexts.some((text) => text.includes('Disable List Filter Text'))

      // Assert that none of the options contain the desired text
      expect(containsText).toBeFalsy()
    })

    test('should display i18n label in cells when missing field data', async () => {
      await page.goto(url.list)
      const textCell = page.locator('.row-1 .cell-i18nText')
      await expect(textCell).toHaveText('<No Text en>')
    })

    test('should show i18n label', async () => {
      await page.goto(url.create)

      await expect(page.locator('label[for="field-i18nText"]')).toHaveText('Text en')
    })

    test('should show i18n placeholder', async () => {
      await page.goto(url.create)
      await expect(page.locator('#field-i18nText')).toHaveAttribute('placeholder', 'en placeholder')
    })

    test('should show i18n descriptions', async () => {
      await page.goto(url.create)
      const description = page.locator('.field-description-i18nText')
      await expect(description).toHaveText('en description')
    })

    test('should render custom label', async () => {
      await page.goto(url.create)
      const label = page.locator('label.custom-label[for="field-customLabel"]')
      await expect(label).toHaveText('#label')
    })

    test('should render custom error', async () => {
      await page.goto(url.create)
      const input = page.locator('input[id="field-customError"]')
      await input.fill('ab')
      await expect(input).toHaveValue('ab')
      const error = page.locator('.custom-error:near(input[id="field-customError"])')
      const submit = page.locator('button[type="button"][id="action-save"]')
      await submit.click()
      await expect(error).toHaveText('#custom-error')
    })

    test('should render beforeInput and afterInput', async () => {
      await page.goto(url.create)
      const input = page.locator('input[id="field-beforeAndAfterInput"]')

      const prevSibling = await input.evaluateHandle((el) => {
        return el.previousElementSibling
      })
      const prevSiblingText = await page.evaluate((el) => el.textContent, prevSibling)
      expect(prevSiblingText).toEqual('#before-input')

      const nextSibling = await input.evaluateHandle((el) => {
        return el.nextElementSibling
      })
      const nextSiblingText = await page.evaluate((el) => el.textContent, nextSibling)
      expect(nextSiblingText).toEqual('#after-input')
    })

    test('should create hasMany with multiple texts', async () => {
      const input = 'five'
      const furtherInput = 'six'

      await page.goto(url.create)
      const requiredField = page.locator('#field-text')
      const field = page.locator('.field-hasMany')

      await requiredField.fill(String(input))
      await field.click()
      await page.keyboard.type(input)
      await page.keyboard.press('Enter')
      await page.keyboard.type(furtherInput)
      await page.keyboard.press('Enter')
      await saveDocAndAssert(page)
      await expect(field.locator('.rs__value-container')).toContainText(input)
      await expect(field.locator('.rs__value-container')).toContainText(furtherInput)
    })

    describe('hidden', () => {
      test('should be hidden in the edit view', async () => {
        await page.goto(url.create)
        await expect(page.locator('#field-text')).toBeVisible()
        await expect(page.locator('#field-hidden')).toBeHidden()
      })
      test('should be hidden in the list view', async () => {
        await page.goto(url.list)
        await page.locator('.list-controls__toggle-columns').click()

        // Make sure the locator is working and the column selectors are visible
        await expect(
          page.locator('.column-selector__column', {
            hasText: exactText('Text'),
          }),
        ).toBeVisible()

        // Expect the hidden field to be hidden in the column selector
        await expect(
          page.locator(`.column-selector__column`, {
            hasText: exactText('Hidden'),
          }),
        ).toBeHidden()
      })

      test('should be hidden in the version view', async () => {
        const doc = await payload.create({
          collection: textFieldsSlug,
          data: textDoc,
        })
        const versions = await payload.findVersions({
          collection: textFieldsSlug,
          where: { parent: { equals: doc.id } },
          limit: 1,
        })

        await page.goto(url.version(doc.id, versions.docs[0].id))

        await expect(
          page.locator('.field-diff-label', {
            hasText: exactText('Text'),
          }),
        ).toBeVisible()

        await expect(
          page.locator('.field-diff-label', {
            hasText: exactText('Hidden'),
          }),
        ).toBeHidden()
      })
    })

    describe('admin.hidden', () => {
      test('should be hidden in the edit view', async () => {
        await page.goto(url.create)
        await expect(page.locator('#field-text')).toBeVisible()
        await expect(page.locator('#field-adminHidden')).toBeHidden()
      })
    })

    describe('admin.hiddenInVersionView', () => {
      test('should be hidden in the version view', async () => {
        const doc = await payload.create({
          collection: textFieldsSlug,
          data: textDoc,
        })
        const versions = await payload.findVersions({
          collection: textFieldsSlug,
          where: { parent: { equals: doc.id } },
          limit: 1,
        })

        await page.goto(url.version(doc.id, versions.docs[0].id))

        await expect(
          page.locator('.field-diff-label', {
            hasText: exactText('Text'),
          }),
        ).toBeVisible()

        await expect(
          page.locator('.field-diff-label', {
            hasText: exactText('Hidden In Version View'),
          }),
        ).toBeHidden()
      })
    })
  })

  describe('number', () => {
    let url: AdminUrlUtil
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, 'number-fields')
    })

    test('should display field in list view', async () => {
      await page.goto(url.list)
      const textCell = page.locator('.row-1 .cell-number')
      await expect(textCell).toHaveText(String(numberDoc.number))
    })

    test('should filter Number fields in the collection view - greaterThanOrEqual', async () => {
      await page.goto(url.list)

      // should have 3 entries
      await expect(page.locator('table >> tbody >> tr')).toHaveCount(3)

      // open the filter options
      await page.locator('.list-controls__toggle-where').click()
      await expect(page.locator('.list-controls__where.rah-static--height-auto')).toBeVisible()
      await page.locator('.where-builder__add-first-filter').click()

      const initialField = page.locator('.condition__field')
      const operatorField = page.locator('.condition__operator')
      const valueField = page.locator('.condition__value >> input')

      // select Number field to filter on
      await initialField.click()
      const initialFieldOptions = initialField.locator('.rs__option')
      await initialFieldOptions.locator('text=number').first().click()
      await expect(initialField.locator('.rs__single-value')).toContainText('Number')

      // select >= operator
      await operatorField.click()
      const operatorOptions = operatorField.locator('.rs__option')
      await operatorOptions.last().click()
      await expect(operatorField.locator('.rs__single-value')).toContainText(
        'is greater than or equal to',
      )

      // enter value of 3
      await valueField.fill('3')
      await expect(valueField).toHaveValue('3')
      await wait(300)

      // should have 2 entries after filtering
      await expect(page.locator('table >> tbody >> tr')).toHaveCount(2)
    })

    test('should create', async () => {
      const input = 5

      await page.goto(url.create)
      const field = page.locator('#field-number')
      await field.fill(String(input))
      await saveDocAndAssert(page)
      await expect(field).toHaveValue(String(input))
    })

    test('should create hasMany', async () => {
      const input = 5

      await page.goto(url.create)
      const field = page.locator('.field-hasMany')
      await field.click()
      await page.keyboard.type(String(input))
      await page.keyboard.press('Enter')
      await saveDocAndAssert(page)
      await expect(field.locator('.rs__value-container')).toContainText(String(input))
    })

    test('should bypass min rows validation when no rows present and field is not required', async () => {
      await page.goto(url.create)
      await saveDocAndAssert(page)
      await expect(page.locator('.Toastify')).toContainText('successfully')
    })

    test('should fail min rows validation when rows are present', async () => {
      const input = 5

      await page.goto(url.create)
      await page.locator('.field-withMinRows').click()

      await page.keyboard.type(String(input))
      await page.keyboard.press('Enter')
      await page.click('#action-save', { delay: 100 })

      await expect(page.locator('.Toastify')).toContainText('Please correct invalid fields')
    })
  })

  describe('indexed', () => {
    let url: AdminUrlUtil
    beforeEach(() => {
      url = new AdminUrlUtil(serverURL, 'indexed-fields')
    })

    // TODO - This test is flaky. Rarely, but sometimes it randomly fails.
    test('should display unique constraint error in ui', async () => {
      const uniqueText = 'uniqueText'
      await payload.create({
        collection: 'indexed-fields',
        data: {
          group: {
            unique: uniqueText,
          },
          text: 'text',
          uniqueRequiredText: 'text',
          uniqueText,
        },
      })

      await page.goto(url.create)

      await page.locator('#field-text').fill('test')
      await page.locator('#field-uniqueText').fill(uniqueText)

      // attempt to save
      await page.click('#action-save', { delay: 100 })

      // toast error
      await expect(page.locator('.Toastify')).toContainText(
        'The following field is invalid: uniqueText',
      )

      // field specific error
      await expect(page.locator('.field-type.text.error #field-uniqueText')).toBeVisible()

      // reset first unique field
      await page.locator('#field-uniqueText').clear()

      // nested in a group error
      await page.locator('#field-group__unique').fill(uniqueText)

      // attempt to save
      await page.locator('#action-save').click()

      // toast error
      await expect(page.locator('.Toastify')).toContainText(
        'The following field is invalid: group.unique',
      )

      // field specific error inside group
      await expect(page.locator('.field-type.text.error #field-group__unique')).toBeVisible()
    })
  })

  describe('json', () => {
    let url: AdminUrlUtil
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, 'json-fields')
    })

    test('should display field in list view', async () => {
      await page.goto(url.list)
      const jsonCell = page.locator('.row-1 .cell-json')
      await expect(jsonCell).toHaveText(JSON.stringify(jsonDoc.json))
    })

    test('should create', async () => {
      const input = '{"foo": "bar"}'

      await page.goto(url.create)
      const jsonFieldInputArea = page.locator('.json-field .inputarea').first()
      await jsonFieldInputArea.fill(input)

      await saveDocAndAssert(page, '.form-submit button')
      const jsonField = page.locator('.json-field').first()
      await expect(jsonField).toContainText('"foo": "bar"')
    })

    test('should not unflatten json field containing keys with dots', async () => {
      const input = '{"foo.with.periods": "bar"}'

      await page.goto(url.create)
      const json = page.locator('.group-field .json-field .inputarea')
      await json.fill(input)

      await saveDocAndAssert(page, '.form-submit button')
      await expect(page.locator('.group-field .json-field')).toContainText(
        '"foo.with.periods": "bar"',
      )
    })
  })

  describe('radio', () => {
    let url: AdminUrlUtil
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, 'radio-fields')
    })

    test('should show i18n label in list', async () => {
      await page.goto(url.list)
      await expect(page.locator('.cell-radio')).toHaveText('Value One')
    })

    test('should show i18n label while editing', async () => {
      await page.goto(url.create)
      await expect(page.locator('label[for="field-radio"]')).toHaveText('Radio en')
    })

    test('should show i18n radio labels', async () => {
      await page.goto(url.create)
      await expect(page.locator('label[for="field-radio-one"] .radio-input__label')).toHaveText(
        'Value One',
      )
    })
  })

  describe('select', () => {
    let url: AdminUrlUtil
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, 'select-fields')
    })

    test('should use i18n option labels', async () => {
      await page.goto(url.create)

      const field = page.locator('#field-selectI18n')
      await field.click({ delay: 100 })
      const options = page.locator('.rs__option')
      // Select an option
      await options.locator('text=One').click()

      await saveDocAndAssert(page)
      await expect(field.locator('.rs__value-container')).toContainText('One')
    })

    test('should not allow filtering by hasMany field / equals / not equals', async () => {
      await page.goto(url.list)

      await page.locator('.list-controls__toggle-columns').click()
      await page.locator('.list-controls__toggle-where').click()
      await page.waitForSelector('.list-controls__where.rah-static--height-auto')
      await page.locator('.where-builder__add-first-filter').click()

      const conditionField = page.locator('.condition__field')
      await conditionField.click()

      const dropdownFieldOptions = conditionField.locator('.rs__option')
      await dropdownFieldOptions.locator('text=Select Has Many').nth(0).click()

      const operatorField = page.locator('.condition__operator')
      await operatorField.click()

      const dropdownOperatorOptions = operatorField.locator('.rs__option')

      await expect(dropdownOperatorOptions.locator('text=equals')).toBeHidden()
      await expect(dropdownOperatorOptions.locator('text=not equals')).toBeHidden()
    })
  })

  describe('point', () => {
    let url: AdminUrlUtil
    let filledGroupPoint
    let emptyGroupPoint
    beforeEach(async () => {
      url = new AdminUrlUtil(serverURL, pointFieldsSlug)
      filledGroupPoint = await payload.create({
        collection: pointFieldsSlug,
        data: {
          group: { point: [4, 2] },
          localized: [4, 2],
          point: [5, 5],
        },
      })
      emptyGroupPoint = await payload.create({
        collection: pointFieldsSlug,
        data: {
          group: {},
          localized: [3, -2],
          point: [5, 5],
        },
      })
    })

    test('should save point', async () => {
      await page.goto(url.create)
      const longField = page.locator('#field-longitude-point')
      await longField.fill('9')

      const latField = page.locator('#field-latitude-point')
      await latField.fill('-2')

      const localizedLongField = page.locator('#field-longitude-localized')
      await localizedLongField.fill('1')

      const localizedLatField = page.locator('#field-latitude-localized')
      await localizedLatField.fill('-1')

      const groupLongitude = page.locator('#field-longitude-group__point')
      await groupLongitude.fill('3')

      const groupLatField = page.locator('#field-latitude-group__point')
      await groupLatField.fill('-8')

      await saveDocAndAssert(page)
      await expect(longField).toHaveAttribute('value', '9')
      await expect(latField).toHaveAttribute('value', '-2')
      await expect(localizedLongField).toHaveAttribute('value', '1')
      await expect(localizedLatField).toHaveAttribute('value', '-1')
      await expect(groupLongitude).toHaveAttribute('value', '3')
      await expect(groupLatField).toHaveAttribute('value', '-8')
    })

    test('should update point', async () => {
      await page.goto(url.edit(emptyGroupPoint.id))
      const longField = page.locator('#field-longitude-point')
      await longField.fill('9')

      const latField = page.locator('#field-latitude-point')
      await latField.fill('-2')

      const localizedLongField = page.locator('#field-longitude-localized')
      await localizedLongField.fill('2')

      const localizedLatField = page.locator('#field-latitude-localized')
      await localizedLatField.fill('-2')

      const groupLongitude = page.locator('#field-longitude-group__point')
      await groupLongitude.fill('3')

      const groupLatField = page.locator('#field-latitude-group__point')
      await groupLatField.fill('-8')

      await saveDocAndAssert(page)

      await expect(longField).toHaveAttribute('value', '9')
      await expect(latField).toHaveAttribute('value', '-2')
      await expect(localizedLongField).toHaveAttribute('value', '2')
      await expect(localizedLatField).toHaveAttribute('value', '-2')
      await expect(groupLongitude).toHaveAttribute('value', '3')
      await expect(groupLatField).toHaveAttribute('value', '-8')
    })

    test('should be able to clear a value point', async () => {
      await page.goto(url.edit(filledGroupPoint.id))

      const groupLongitude = page.locator('#field-longitude-group__point')
      await groupLongitude.fill('')

      const groupLatField = page.locator('#field-latitude-group__point')
      await groupLatField.fill('')

      await saveDocAndAssert(page)

      await expect(groupLongitude).toHaveAttribute('value', '')
      await expect(groupLatField).toHaveAttribute('value', '')
    })
  })

  describe('collapsible', () => {
    let url: AdminUrlUtil
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, collapsibleFieldsSlug)
    })

    test('should render CollapsibleLabel using a function', async () => {
      const label = 'custom row label'
      await page.goto(url.create)
      await page.locator('#field-collapsible-3__1 >> #field-nestedTitle').fill(label)
      await wait(100)
      const customCollapsibleLabel = page.locator('#field-collapsible-3__1 >> .row-label')
      await expect(customCollapsibleLabel).toContainText(label)
    })

    test('should render CollapsibleLabel using a component', async () => {
      const label = 'custom row label as component'
      await page.goto(url.create)
      await page.locator('#field-arrayWithCollapsibles >> .array-field__add-row').click()

      await page
        .locator(
          '#field-collapsible-4__0-arrayWithCollapsibles__0 >> #field-arrayWithCollapsibles__0__innerCollapsible',
        )
        .fill(label)
      await wait(100)
      const customCollapsibleLabel = page.locator(
        `#field-collapsible-4__0-arrayWithCollapsibles__0 >> .row-label :text("${label}")`,
      )
      await expect(customCollapsibleLabel).toHaveCSS('text-transform', 'uppercase')
    })
  })

  describe('blocks', () => {
    let url: AdminUrlUtil
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, 'block-fields')
    })

    test('should open blocks drawer and select first block', async () => {
      await page.goto(url.create)
      const addButton = page.locator('#field-blocks > .blocks-field__drawer-toggler')
      await expect(addButton).toContainText('Add Block')
      await addButton.click()

      const blocksDrawer = page.locator('[id^=drawer_1_blocks-drawer-]')
      await expect(blocksDrawer).toBeVisible()

      // select the first block in the drawer
      const firstBlockSelector = blocksDrawer
        .locator('.blocks-drawer__blocks .blocks-drawer__block')
        .first()
      await expect(firstBlockSelector).toContainText('Content')
      await firstBlockSelector.click()

      // ensure the block was appended to the rows
      const addedRow = page.locator('#field-blocks .blocks-field__row').last()
      await expect(addedRow).toBeVisible()
      await expect(addedRow.locator('.blocks-field__block-pill-content')).toContainText('Content')
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
      await expect(addedRow.locator('.blocks-field__block-pill-content')).toContainText('Content') // went from `Number` to `Content`
    })

    test('should use i18n block labels', async () => {
      await page.goto(url.create)
      await expect(page.locator('#field-i18nBlocks .blocks-field__header')).toContainText(
        'Block en',
      )

      const addButton = page.locator('#field-i18nBlocks > .blocks-field__drawer-toggler')
      await expect(addButton).toContainText('Add Block en')
      await addButton.click()

      const blocksDrawer = page.locator('[id^=drawer_1_blocks-drawer-]')
      await expect(blocksDrawer).toBeVisible()

      // select the first block in the drawer
      const firstBlockSelector = blocksDrawer
        .locator('.blocks-drawer__blocks .blocks-drawer__block')
        .first()
      await expect(firstBlockSelector).toContainText('Text en')
      await firstBlockSelector.click()

      // ensure the block was appended to the rows
      const firstRow = page.locator('#field-i18nBlocks .blocks-field__row').first()
      await expect(firstRow).toBeVisible()
      await expect(firstRow.locator('.blocks-field__block-pill-text')).toContainText('Text en')
    })

    test('should add different blocks with similar field configs', async () => {
      await page.goto(url.create)

      async function addBlock(name: 'Block A' | 'Block B') {
        await page
          .locator('#field-blocksWithSimilarConfigs')
          .getByRole('button', { name: 'Add Blocks With Similar Config' })
          .click()
        await page.getByRole('button', { name }).click()
      }

      await addBlock('Block A')

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

      await addBlock('Block B')

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
      await expect(page.locator('.Toastify')).toContainText('successfully')
    })

    test('should fail min rows validation when rows are present', async () => {
      await page.goto(url.create)

      await page
        .locator('#field-blocksWithMinRows')
        .getByRole('button', { name: 'Add Blocks With Min Row' })
        .click()

      const blocksDrawer = page.locator('[id^=drawer_1_blocks-drawer-]')
      await expect(blocksDrawer).toBeVisible()

      const firstBlockSelector = blocksDrawer
        .locator('.blocks-drawer__blocks .blocks-drawer__block')
        .first()

      await firstBlockSelector.click()

      const firstRow = page.locator('input[name="blocksWithMinRows.0.blockTitle"]')
      await expect(firstRow).toBeVisible()
      await firstRow.fill('first row')
      await expect(firstRow).toHaveValue('first row')

      await page.click('#action-save', { delay: 100 })
      await expect(page.locator('.Toastify')).toContainText('Please correct invalid fields')
    })

    describe('row manipulation', () => {
      describe('react hooks', () => {
        test('should add 2 new block rows', async () => {
          await page.goto(url.create)

          await page
            .locator('.custom-blocks-field-management')
            .getByRole('button', { name: 'Add Block 1' })
            .click()
          await expect(
            page.locator('#field-customBlocks input[name="customBlocks.0.block1Title"]'),
          ).toHaveValue('Block 1: Prefilled Title')

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

    describe('admin.isSortable: false', () => {
      beforeAll(async () => {
        await page.goto(url.create)
      })

      test('the move action should be hidden', async () => {
        await expect(page.locator('#field-disableSort .array-actions__action-chevron')).toHaveCount(
          0,
        )
      })

      test('the drag handle should be hidden', async () => {
        await expect(page.locator('#field-disableSort .collapsible__drag')).toHaveCount(0)
      })
    })
  })

  describe('array', () => {
    let url: AdminUrlUtil
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, 'array-fields')
    })

    test('should be readOnly', async () => {
      await page.goto(url.create)
      const field = page.locator('#field-readOnly__0__text')
      await expect(field).toBeDisabled()
    })

    test('should have defaultValue', async () => {
      await page.goto(url.create)
      const field = page.locator('#field-readOnly__0__text')
      await expect(field).toHaveValue('defaultValue')
    })

    test('should render RowLabel using a function', async () => {
      const label = 'custom row label as function'
      await page.goto(url.create)
      await page.locator('#field-rowLabelAsFunction >> .array-field__add-row').click()

      await page.locator('#field-rowLabelAsFunction__0__title').fill(label)
      await wait(100)
      const customRowLabel = page.locator('#rowLabelAsFunction-row-0 >> .row-label')
      await expect(customRowLabel).toContainText(label)
    })

    test('should render RowLabel using a component', async () => {
      const label = 'custom row label as component'
      await page.goto(url.create)
      await page.locator('#field-rowLabelAsComponent >> .array-field__add-row').click()

      await page.locator('#field-rowLabelAsComponent__0__title').fill(label)
      await wait(100)
      const customRowLabel = page.locator(
        '#rowLabelAsComponent-row-0 >> .row-label :text("custom row label")',
      )
      await expect(customRowLabel).toHaveCSS('text-transform', 'uppercase')
    })

    test('should bypass min rows validation when no rows present and field is not required', async () => {
      await page.goto(url.create)
      await saveDocAndAssert(page)
      await expect(page.locator('.Toastify')).toContainText('successfully')
    })

    test('should fail min rows validation when rows are present', async () => {
      await page.goto(url.create)
      await page.locator('#field-arrayWithMinRows >> .array-field__add-row').click()

      await page.click('#action-save', { delay: 100 })
      await expect(page.locator('.Toastify')).toContainText('Please correct invalid fields')
    })

    describe('row manipulation', () => {
      test('should add, remove and duplicate rows', async () => {
        const assertText0 = 'array row 1'
        const assertGroupText0 = 'text in group in row 1'
        const assertText1 = 'array row 2'
        const assertText3 = 'array row 3'
        const assertGroupText3 = 'text in group in row 3'
        await page.goto(url.create)

        // Add 3 rows
        await page.locator('#field-potentiallyEmptyArray > .array-field__add-row').click()
        await page.locator('#field-potentiallyEmptyArray > .array-field__add-row').click()
        await page.locator('#field-potentiallyEmptyArray > .array-field__add-row').click()

        // Fill out row 1
        await page.locator('#field-potentiallyEmptyArray__0__text').fill(assertText0)
        await page
          .locator('#field-potentiallyEmptyArray__0__groupInRow__textInGroupInRow')
          .fill(assertGroupText0)
        // Fill out row 2
        await page.locator('#field-potentiallyEmptyArray__1__text').fill(assertText1)
        // Fill out row 3
        await page.locator('#field-potentiallyEmptyArray__2__text').fill(assertText3)
        await page
          .locator('#field-potentiallyEmptyArray__2__groupInRow__textInGroupInRow')
          .fill(assertGroupText3)

        // Remove row 1
        await page.locator('#potentiallyEmptyArray-row-0 .array-actions__button').click()
        await page
          .locator('#potentiallyEmptyArray-row-0 .popup__scroll-container .array-actions__remove')
          .click()
        // Remove row 2
        await page.locator('#potentiallyEmptyArray-row-0 .array-actions__button').click()
        await page
          .locator('#potentiallyEmptyArray-row-0 .popup__scroll-container .array-actions__remove')
          .click()

        // Save document
        await saveDocAndAssert(page)

        // Scroll to array row (fields are not rendered in DOM until on screen)
        await page.locator('#field-potentiallyEmptyArray__0__groupInRow').scrollIntoViewIfNeeded()

        // Expect the remaining row to be the third row
        const input = page.locator('#field-potentiallyEmptyArray__0__groupInRow__textInGroupInRow')
        await expect(input).toHaveValue(assertGroupText3)

        // Duplicate row
        await page.locator('#potentiallyEmptyArray-row-0 .array-actions__button').click()
        await page
          .locator(
            '#potentiallyEmptyArray-row-0 .popup__scroll-container .array-actions__duplicate',
          )
          .click()

        // Update duplicated row group field text
        await page
          .locator('#field-potentiallyEmptyArray__1__groupInRow__textInGroupInRow')
          .fill(`${assertGroupText3} duplicate`)

        // Save document
        await saveDocAndAssert(page)

        // Expect the second row to be a duplicate of the remaining row
        await expect(
          page.locator('#field-potentiallyEmptyArray__1__groupInRow__textInGroupInRow'),
        ).toHaveValue(`${assertGroupText3} duplicate`)

        // Remove row 1
        await page.locator('#potentiallyEmptyArray-row-0 .array-actions__button').click()
        await page
          .locator('#potentiallyEmptyArray-row-0 .popup__scroll-container .array-actions__remove')
          .click()

        // Save document
        await saveDocAndAssert(page)

        // Expect the remaining row to be the copy of the duplicate row
        await expect(
          page.locator('#field-potentiallyEmptyArray__0__groupInRow__textInGroupInRow'),
        ).toHaveValue(`${assertGroupText3} duplicate`)
      })
    })

    describe('admin.isSortable: false', () => {
      beforeAll(async () => {
        await page.goto(url.create)
      })

      test('the move action should be hidden', async () => {
        await expect(page.locator('#field-disableSort .array-actions__action-chevron')).toHaveCount(
          0,
        )
      })

      test('the drag handle should be hidden', async () => {
        await expect(page.locator('#field-disableSort .collapsible__drag')).toHaveCount(0)
      })
    })

    test('should bulk update', async () => {
      await Promise.all([
        payload.create({
          collection: 'array-fields',
          data: {
            title: 'for test 1',
            items: [
              {
                text: 'test 1',
              },
              {
                text: 'test 2',
              },
            ],
          },
        }),
        payload.create({
          collection: 'array-fields',
          data: {
            title: 'for test 2',
            items: [
              {
                text: 'test 3',
              },
            ],
          },
        }),
        payload.create({
          collection: 'array-fields',
          data: {
            title: 'for test 3',
            items: [
              {
                text: 'test 4',
              },
              {
                text: 'test 5',
              },
              {
                text: 'test 6',
              },
            ],
          },
        }),
      ])

      const bulkText = 'Bulk update text'
      await page.goto(url.list)
      await page.waitForSelector('.table > table > tbody > tr td.cell-title')
      const rows = page.locator('.table > table > tbody > tr', {
        has: page.locator('td.cell-title span', {
          hasText: 'for test',
        }),
      })
      const count = await rows.count()

      for (let i = 0; i < count; i++) {
        await rows
          .nth(i)
          .locator('td.cell-_select .checkbox-input__input > input[type="checkbox"]')
          .check()
      }
      await page.locator('.edit-many__toggle').click()
      await page.locator('.field-select .rs__control').click()

      const arrayOption = page.locator('.rs__option', {
        hasText: exactText('Items'),
      })

      await expect(arrayOption).toBeVisible()

      await arrayOption.click()
      const addRowButton = page.locator('#field-items > .btn.array-field__add-row')

      await expect(addRowButton).toBeVisible()

      await addRowButton.click()

      const targetInput = page.locator('#field-items__0__text')

      await expect(targetInput).toBeVisible()

      await targetInput.fill(bulkText)

      await page.locator('.form-submit button[type="submit"].edit-many__publish').click()
      await expect(page.locator('.Toastify__toast--success')).toContainText(
        'Updated 3 Array Fields successfully.',
      )
    })
  })

  describe('tabs', () => {
    let url: AdminUrlUtil
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, tabsFieldsSlug)
    })

    test('should fill and retain a new value within a tab while switching tabs', async () => {
      const textInRowValue = 'hello'
      const numberInRowValue = '23'
      const jsonValue = '{ "foo": "bar"}'

      await page.goto(url.create)

      await page.locator('.tabs-field__tab-button:has-text("Tab with Row")').click()
      await page.locator('#field-textInRow').fill(textInRowValue)
      await page.locator('#field-numberInRow').fill(numberInRowValue)
      await page.locator('.json-field .inputarea').fill(jsonValue)

      await wait(300)

      await page.locator('.tabs-field__tab-button:has-text("Tab with Array")').click()
      await page.locator('.tabs-field__tab-button:has-text("Tab with Row")').click()

      await wait(100)

      await expect(page.locator('#field-textInRow')).toHaveValue(textInRowValue)
      await expect(page.locator('#field-numberInRow')).toHaveValue(numberInRowValue)
      await expect(page.locator('.json-field .lines-content')).toContainText(jsonValue)
    })

    test('should retain updated values within tabs while switching between tabs', async () => {
      const textInRowValue = 'new value'
      const jsonValue = '{ "new": "value"}'
      await page.goto(url.list)
      await page.locator('.cell-id a').click()

      // Go to Row tab, update the value
      await page.locator('.tabs-field__tab-button:has-text("Tab with Row")').click()
      await page.locator('#field-textInRow').fill(textInRowValue)
      await page.locator('.json-field .inputarea').fill(jsonValue)

      await wait(250)

      // Go to Array tab, then back to Row. Make sure new value is still there
      await page.locator('.tabs-field__tab-button:has-text("Tab with Array")').click()
      await page.locator('.tabs-field__tab-button:has-text("Tab with Row")').click()

      await expect(page.locator('#field-textInRow')).toHaveValue(textInRowValue)
      await expect(page.locator('.json-field .lines-content')).toContainText(jsonValue)

      // Go to array tab, save the doc
      await page.locator('.tabs-field__tab-button:has-text("Tab with Array")').click()
      await page.click('#action-save', { delay: 100 })

      await wait(250)

      // Go back to row tab, make sure the new value is still present
      await page.locator('.tabs-field__tab-button:has-text("Tab with Row")').click()
      await expect(page.locator('#field-textInRow')).toHaveValue(textInRowValue)
    })

    test('should render array data within unnamed tabs', async () => {
      await page.goto(url.list)
      await page.locator('.cell-id a').click()
      await page.locator('.tabs-field__tab-button:has-text("Tab with Array")').click()
      await expect(page.locator('#field-array__0__text')).toHaveValue("Hello, I'm the first row")
    })

    test('should render array data within named tabs', async () => {
      await page.goto(url.list)
      await page.locator('.cell-id a').click()
      await page.locator('.tabs-field__tab-button:nth-child(5)').click()
      await expect(page.locator('#field-tab__array__0__text')).toHaveValue(
        "Hello, I'm the first row, in a named tab",
      )
    })
  })
  describe('richText', () => {
    async function navigateToRichTextFields() {
      const url: AdminUrlUtil = new AdminUrlUtil(serverURL, 'rich-text-fields')
      await page.goto(url.list)
      await page.locator('.row-1 .cell-title a').click()
    }

    describe('cell', () => {
      test('ensure cells are smaller than 300px in height', async () => {
        const url: AdminUrlUtil = new AdminUrlUtil(serverURL, 'rich-text-fields')
        await page.goto(url.list) // Navigate to rich-text list view

        const table = page.locator('.list-controls ~ .table')
        const lexicalCell = table.locator('.cell-lexicalCustomFields').first()
        const lexicalHtmlCell = table.locator('.cell-lexicalCustomFields_html').first()
        const entireRow = table.locator('.row-1').first()

        // Make sure each of the 3 above are no larger than 300px in height:
        expect((await lexicalCell.boundingBox()).height).toBeLessThanOrEqual(300)
        expect((await lexicalHtmlCell.boundingBox()).height).toBeLessThanOrEqual(300)
        expect((await entireRow.boundingBox()).height).toBeLessThanOrEqual(300)
      })
    })

    describe('toolbar', () => {
      test('should run url validation', async () => {
        await navigateToRichTextFields()

        // Open link drawer
        await page.locator('.rich-text__toolbar button:not([disabled]) .link').first().click()

        // find the drawer
        const editLinkModal = page.locator('[id^=drawer_1_rich-text-link-]')
        await expect(editLinkModal).toBeVisible()

        // Fill values and click Confirm
        await editLinkModal.locator('#field-text').fill('link text')
        await editLinkModal.locator('label[for="field-linkType-custom-2"]').click()
        await editLinkModal.locator('#field-url').fill('')
        await wait(200)
        await editLinkModal.locator('button[type="submit"]').click()
        const errorField = page.locator(
          '[id^=drawer_1_rich-text-link-] .render-fields > :nth-child(3)',
        )
        const hasErrorClass = await errorField.evaluate((el) => el.classList.contains('error'))
        expect(hasErrorClass).toBe(true)
      })

      test('should create new url custom link', async () => {
        await navigateToRichTextFields()

        // Open link drawer
        await page.locator('.rich-text__toolbar button:not([disabled]) .link').first().click()

        // find the drawer
        const editLinkModal = page.locator('[id^=drawer_1_rich-text-link-]')
        await expect(editLinkModal).toBeVisible()

        // Fill values and click Confirm
        await editLinkModal.locator('#field-text').fill('link text')
        await editLinkModal.locator('label[for="field-linkType-custom-2"]').click()
        await editLinkModal.locator('#field-url').fill('https://payloadcms.com')
        await wait(200)
        await editLinkModal.locator('button[type="submit"]').click()
        await saveDocAndAssert(page)

        // Remove link from editor body
        await page.locator('span >> text="link text"').click()
        const popup = page.locator('.popup--active .rich-text-link__popup')
        await expect(popup.locator('.rich-text-link__link-label')).toBeVisible()
        await popup.locator('.rich-text-link__link-close').click()
        await expect(page.locator('span >> text="link text"')).toHaveCount(0)
      })

      test('should create new internal link', async () => {
        await navigateToRichTextFields()

        // Open link drawer
        await page.locator('.rich-text__toolbar button:not([disabled]) .link').first().click()

        // find the drawer
        const editLinkModal = page.locator('[id^=drawer_1_rich-text-link-]')
        await expect(editLinkModal).toBeVisible()

        // Fill values and click Confirm
        await editLinkModal.locator('#field-text').fill('link text')
        await editLinkModal.locator('label[for="field-linkType-internal-2"]').click()
        await editLinkModal.locator('#field-doc .rs__control').click()
        await page.keyboard.type('dev@')
        await editLinkModal
          .locator('#field-doc .rs__menu .rs__option:has-text("dev@payloadcms.com")')
          .click()
        // await wait(200);
        await editLinkModal.locator('button[type="submit"]').click()
        await saveDocAndAssert(page)
      })

      test('should not create new url link when read only', async () => {
        await navigateToRichTextFields()

        // Attempt to open link popup
        const modalTrigger = page.locator('.rich-text--read-only .rich-text__toolbar button .link')
        await expect(modalTrigger).toBeDisabled()
      })

      test('should only list RTE enabled upload collections in drawer', async () => {
        await navigateToRichTextFields()

        // Open link drawer
        await page
          .locator('.rich-text__toolbar button:not([disabled]) .upload-rich-text-button')
          .first()
          .click()

        // open the list select menu
        await page.locator('.list-drawer__select-collection-wrap .rs__control').click()

        const menu = page.locator('.list-drawer__select-collection-wrap .rs__menu')
        // `uploads-3` has enableRichTextRelationship set to false
        await expect(menu).not.toContainText('Uploads3')
      })

      test('should search correct useAsTitle field after toggling collection in list drawer', async () => {
        await navigateToRichTextFields()

        // open link drawer
        const field = page.locator('#field-richText')
        const button = field.locator(
          'button.rich-text-relationship__list-drawer-toggler.list-drawer__toggler',
        )
        await button.click()

        // check that the search is on the `name` field of the `text-fields` collection
        const drawer = page.locator('[id^=list-drawer_1_]')
        await expect(drawer.locator('.search-filter__input')).toHaveAttribute(
          'placeholder',
          'Search by Text',
        )

        // change the selected collection to `array-fields`
        await page.locator('.list-drawer__select-collection-wrap .rs__control').click()
        const menu = page.locator('.list-drawer__select-collection-wrap .rs__menu')
        await menu.locator('.rs__option').getByText('Array Field').click()

        // check that `id` is now the default search field
        await expect(drawer.locator('.search-filter__input')).toHaveAttribute(
          'placeholder',
          'Search by ID',
        )
      })

      test('should only list RTE enabled collections in link drawer', async () => {
        await navigateToRichTextFields()

        await page.locator('.rich-text__toolbar button:not([disabled]) .link').first().click()

        const editLinkModal = page.locator('[id^=drawer_1_rich-text-link-]')
        await expect(editLinkModal).toBeVisible()

        await editLinkModal.locator('label[for="field-linkType-internal-2"]').click()
        await editLinkModal.locator('.relationship__wrap .rs__control').click()

        const menu = page.locator('.relationship__wrap .rs__menu')

        // array-fields has enableRichTextLink set to false
        await expect(menu).not.toContainText('Array Fields')
      })

      test('should only list non-upload collections in relationship drawer', async () => {
        await navigateToRichTextFields()

        // Open link drawer
        await page
          .locator('.rich-text__toolbar button:not([disabled]) .relationship-rich-text-button')
          .first()
          .click()

        // open the list select menu
        await page.locator('.list-drawer__select-collection-wrap .rs__control').click()

        const menu = page.locator('.list-drawer__select-collection-wrap .rs__menu')
        await expect(menu).not.toContainText('Uploads')
      })

      test('should respect customizing the default fields', async () => {
        const linkText = 'link'
        const value = 'test value'
        await navigateToRichTextFields()
        const field = page.locator('.rich-text', {
          has: page.locator('#field-richTextCustomFields'),
        })
        // open link drawer
        const button = field.locator('button.rich-text__button.link')
        await button.click()

        // fill link fields
        const linkDrawer = page.locator('[id^=drawer_1_rich-text-link-]')
        const fields = linkDrawer.locator('.render-fields > .field-type')
        await fields.locator('#field-text').fill(linkText)
        await fields.locator('#field-url').fill('https://payloadcms.com')
        const input = fields.locator('#field-fields__customLinkField')
        await input.fill(value)

        // submit link closing drawer
        await linkDrawer.locator('button[type="submit"]').click()
        const linkInEditor = field.locator(`.rich-text-link >> text="${linkText}"`)
        await saveDocAndAssert(page)

        // open modal again
        await linkInEditor.click()

        const popup = page.locator('.popup--active .rich-text-link__popup')
        await expect(popup).toBeVisible()

        await popup.locator('.rich-text-link__link-edit').click()

        const linkDrawer2 = page.locator('[id^=drawer_1_rich-text-link-]')
        const fields2 = linkDrawer2.locator('.render-fields > .field-type')
        const input2 = fields2.locator('#field-fields__customLinkField')

        await expect(input2).toHaveValue(value)
      })
    })

    describe('editor', () => {
      test('should populate url link', async () => {
        await navigateToRichTextFields()

        // Open link popup
        await page.locator('#field-richText span >> text="render links"').click()
        const popup = page.locator('.popup--active .rich-text-link__popup')
        await expect(popup).toBeVisible()
        await expect(popup.locator('a')).toHaveAttribute('href', 'https://payloadcms.com')

        // Open the drawer
        await popup.locator('.rich-text-link__link-edit').click()
        const editLinkModal = page.locator('[id^=drawer_1_rich-text-link-]')
        await expect(editLinkModal).toBeVisible()

        // Check the drawer values
        const textField = editLinkModal.locator('#field-text')
        await expect(textField).toHaveValue('render links')

        // Close the drawer
        await editLinkModal.locator('button[type="submit"]').click()
        await expect(editLinkModal).toBeHidden()
      })

      test('should populate relationship link', async () => {
        await navigateToRichTextFields()

        // Open link popup
        await page.locator('#field-richText span >> text="link to relationships"').click()
        const popup = page.locator('.popup--active .rich-text-link__popup')
        await expect(popup).toBeVisible()
        await expect(popup.locator('a')).toHaveAttribute(
          'href',
          /\/admin\/collections\/array-fields\/.*/,
        )

        // Open the drawer
        await popup.locator('.rich-text-link__link-edit').click()
        const editLinkModal = page.locator('[id^=drawer_1_rich-text-link-]')
        await expect(editLinkModal).toBeVisible()

        // Check the drawer values
        const textField = editLinkModal.locator('#field-text')
        await expect(textField).toHaveValue('link to relationships')

        // Close the drawer
        await editLinkModal.locator('button[type="submit"]').click()
        await expect(editLinkModal).toBeHidden()
      })

      test('should open upload drawer and render custom relationship fields', async () => {
        await navigateToRichTextFields()
        const field = page.locator('#field-richText')
        const button = field.locator('button.rich-text-upload__upload-drawer-toggler')

        await button.click()

        const documentDrawer = page.locator('[id^=drawer_1_upload-drawer-]')
        await expect(documentDrawer).toBeVisible()
        const caption = documentDrawer.locator('#field-caption')
        await expect(caption).toBeVisible()
      })

      test('should open upload document drawer from read-only field', async () => {
        await navigateToRichTextFields()
        const field = page.locator('#field-richTextReadOnly')
        const button = field.locator(
          'button.rich-text-upload__doc-drawer-toggler.doc-drawer__toggler',
        )

        await button.click()

        const documentDrawer = page.locator('[id^=doc-drawer_uploads_1_]')
        await expect(documentDrawer).toBeVisible()
      })

      test('should open relationship document drawer from read-only field', async () => {
        await navigateToRichTextFields()
        const field = page.locator('#field-richTextReadOnly')
        const button = field.locator(
          'button.rich-text-relationship__doc-drawer-toggler.doc-drawer__toggler',
        )

        await button.click()

        const documentDrawer = page.locator('[id^=doc-drawer_text-fields_1_]')
        await expect(documentDrawer).toBeVisible()
      })

      test('should populate new links', async () => {
        await navigateToRichTextFields()

        // Highlight existing text
        const headingElement = page.locator(
          '#field-richText h1 >> text="Hello, I\'m a rich text field."',
        )
        await headingElement.selectText()

        // click the toolbar link button
        await page.locator('.rich-text__toolbar button:not([disabled]) .link').first().click()

        // find the drawer and confirm the values
        const editLinkModal = page.locator('[id^=drawer_1_rich-text-link-]')
        await expect(editLinkModal).toBeVisible()
        const textField = editLinkModal.locator('#field-text')
        await expect(textField).toHaveValue("Hello, I'm a rich text field.")
      })
      test('should not take value from previous block', async () => {
        await navigateToRichTextFields()

        // check first block value
        const textField = page.locator('#field-blocks__0__text')
        await expect(textField).toHaveValue('Regular text')

        // remove the first block
        const editBlock = page.locator('#blocks-row-0 .popup-button')
        await editBlock.click()
        const removeButton = page.locator('#blocks-row-0').getByRole('button', { name: 'Remove' })
        await expect(removeButton).toBeVisible()
        await removeButton.click()

        // check new first block value
        const richTextField = page.locator('#field-blocks__0__text')
        const richTextValue = await richTextField.innerText()
        await expect(richTextValue).toContain('Rich text')
      })
    })
  })

  describe('date', () => {
    let url: AdminUrlUtil
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, 'date-fields')
    })

    test('should display formatted date in list view table cell', async () => {
      await page.goto(url.list)
      const formattedDateCell = page.locator('.row-1 .cell-timeOnly')
      await expect(formattedDateCell).toContainText(' Aug ')

      const notFormattedDateCell = page.locator('.row-1 .cell-default')
      await expect(notFormattedDateCell).toContainText('August')
    })

    test('should display formatted date in useAsTitle', async () => {
      await page.goto(url.list)
      await page.locator('.row-1 .cell-default a').click()
      await expect(page.locator('.collection-edit .doc-header__title.render-title')).toContainText(
        'August',
      )
    })

    test('should clear date', async () => {
      await page.goto(url.create)
      const dateField = page.locator('#field-default input')
      await expect(dateField).toBeVisible()
      await dateField.fill('02/07/2023')
      await expect(dateField).toHaveValue('02/07/2023')
      await wait(1000)
      const clearButton = page.locator('#field-default .date-time-picker__clear-button')
      await expect(clearButton).toBeVisible()
      await clearButton.click()
      await expect(dateField).toHaveValue('')
    })

    describe('localized dates', async () => {
      describe('EST', () => {
        test.use({
          geolocation: {
            latitude: 42.3314,
            longitude: -83.0458,
          },
          timezoneId: 'America/Detroit',
        })
        test('create EST day only date', async () => {
          await page.goto(url.create)
          const dateField = page.locator('#field-default input')

          // enter date in default date field
          await dateField.fill('02/07/2023')
          await page.locator('#action-save').click()

          // wait for navigation to update route
          await wait(500)

          // get the ID of the doc
          const routeSegments = page.url().split('/')
          const id = routeSegments.pop()

          // fetch the doc (need the date string from the DB)
          const { doc } = await client.findByID({ id, auth: true, slug: 'date-fields' })

          expect(doc.default).toEqual('2023-02-07T12:00:00.000Z')
        })
      })

      describe('PST', () => {
        test.use({
          geolocation: {
            latitude: 37.774929,
            longitude: -122.419416,
          },
          timezoneId: 'America/Los_Angeles',
        })

        test('create PDT day only date', async () => {
          await page.goto(url.create)
          const dateField = page.locator('#field-default input')

          // enter date in default date field
          await dateField.fill('02/07/2023')
          await page.locator('#action-save').click()

          // wait for navigation to update route
          await wait(500)

          // get the ID of the doc
          const routeSegments = page.url().split('/')
          const id = routeSegments.pop()

          // fetch the doc (need the date string from the DB)
          const { doc } = await client.findByID({ id, auth: true, slug: 'date-fields' })

          expect(doc.default).toEqual('2023-02-07T12:00:00.000Z')
        })
      })

      describe('ST', () => {
        test.use({
          geolocation: {
            latitude: -14.5994,
            longitude: -171.857,
          },
          timezoneId: 'Pacific/Apia',
        })

        test('create ST day only date', async () => {
          await page.goto(url.create)
          const dateField = page.locator('#field-default input')

          // enter date in default date field
          await dateField.fill('02/07/2023')
          await page.locator('#action-save').click()

          // wait for navigation to update route
          await wait(500)

          // get the ID of the doc
          const routeSegments = page.url().split('/')
          const id = routeSegments.pop()

          // fetch the doc (need the date string from the DB)
          const { doc } = await client.findByID({ id, auth: true, slug: 'date-fields' })

          expect(doc.default).toEqual('2023-02-07T12:00:00.000Z')
        })
      })
    })
  })

  describe('relationship', () => {
    let url: AdminUrlUtil
    const tableRowLocator = 'table > tbody > tr'

    beforeAll(async () => {
      url = new AdminUrlUtil(serverURL, 'relationship-fields')
    })

    afterEach(async () => {
      // delete all existing relationship documents
      await payload.delete({
        collection: relationshipFieldsSlug,
        where: { id: { exists: true } },
      })
    })

    test('should create inline relationship within field with many relations', async () => {
      await page.goto(url.create)

      const button = page.locator('#relationship-add-new .relationship-add-new__add-button')
      await button.click()
      await page
        .locator('#field-relationship .relationship-add-new__relation-button--text-fields')
        .click()

      const textField = page.locator('.drawer__content #field-text')
      const textValue = 'hello'

      await textField.fill(textValue)

      await page.locator('[id^=doc-drawer_text-fields_1_] #action-save').click()
      await expect(page.locator('.Toastify')).toContainText('successfully')
      await page.locator('[id^=close-drawer__doc-drawer_text-fields_1_]').click()

      await expect(
        page.locator('#field-relationship .relationship--single-value__text'),
      ).toContainText(textValue)

      await page.locator('#action-save').click()
      await expect(page.locator('.Toastify')).toContainText('successfully')
    })

    test('should create nested inline relationships', async () => {
      await page.goto(url.create)

      // Open first modal
      await page.locator('#relationToSelf-add-new .relationship-add-new__add-button').click()

      // Fill first modal's required relationship field
      await page.locator('[id^=doc-drawer_relationship-fields_1_] #field-relationship').click()
      await page
        .locator(
          '[id^=doc-drawer_relationship-fields_1_] .rs__option:has-text("Seeded text document")',
        )
        .click()

      // Open second modal
      await page
        .locator('[id^=doc-drawer_relationship-fields_1_] #relationToSelf-add-new button')
        .click()

      // Fill second modal's required relationship field
      await page.locator('[id^=doc-drawer_relationship-fields_2_] #field-relationship').click()
      await page
        .locator(
          '[id^=doc-drawer_relationship-fields_2_] .rs__option:has-text("Seeded text document")',
        )
        .click()

      // Save then close the second modal
      await page.locator('[id^=doc-drawer_relationship-fields_2_] #action-save').click()
      await wait(200)
      await page.locator('[id^=close-drawer__doc-drawer_relationship-fields_2_]').click()

      // Assert that the first modal is still open and the value matches
      await expect(page.locator('[id^=doc-drawer_relationship-fields_1_]')).toBeVisible()
      await expect(
        page.locator(
          '[id^=doc-drawer_relationship-fields_1_] #field-relationToSelf .relationship--single-value__text',
        ),
      ).toBeVisible() // TODO: use '.toContainText('doc_id')' with the doc in the second modal

      // Save then close the first modal
      await page.locator('[id^=doc-drawer_relationship-fields_1_] #action-save').click()
      await wait(200)
      await page.locator('[id^=close-drawer__doc-drawer_relationship-fields_1_]').click()

      // Expect the original field to have a value filled
      await expect(
        page.locator('#field-relationToSelf .relationship--single-value__text'),
      ).toBeVisible()

      // Fill the required field
      await page.locator('#field-relationship').click()
      await page.locator('.rs__option:has-text("Seeded text document")').click()

      await page.locator('#action-save').click()

      await expect(page.locator('.Toastify')).toContainText('successfully')
    })

    test('should hide relationship add new button', async () => {
      await page.goto(url.create)
      // expect the button to not exist in the field
      await expect(
        await page
          .locator('#relationToSelfSelectOnly-add-new .relationship-add-new__add-button')
          .count(),
      ).toEqual(0)
    })

    test('should clear relationship values', async () => {
      await page.goto(url.create)

      const field = page.locator('#field-relationship')
      await field.click()
      await page.locator('.rs__option:has-text("Seeded text document")').click()
      await field.locator('.clear-indicator').click()
      await expect(field.locator('.rs__placeholder')).toBeVisible()
    })

    test('should display `hasMany` polymorphic relationships', async () => {
      await page.goto(url.create)
      const field = page.locator('#field-relationHasManyPolymorphic')
      await field.click()

      await page
        .locator('.rs__option', {
          hasText: exactText('Seeded text document'),
        })
        .click()

      await expect(
        page
          .locator('#field-relationHasManyPolymorphic .relationship--multi-value-label__text', {
            hasText: exactText('Seeded text document'),
          })
          .first(),
      ).toBeVisible()

      // await fill the required fields then save the document and check again
      await page.locator('#field-relationship').click()
      await page.locator('#field-relationship .rs__option:has-text("Seeded text document")').click()
      await saveDocAndAssert(page)

      const valueAfterSave = page.locator('#field-relationHasManyPolymorphic .multi-value').first()

      await expect(
        valueAfterSave
          .locator('.relationship--multi-value-label__text', {
            hasText: exactText('Seeded text document'),
          })
          .first(),
      ).toBeVisible()
    })

    test('should populate relationship dynamic default value', async () => {
      await page.goto(url.create)
      await expect(
        page.locator('#field-relationWithDynamicDefault .relationship--single-value__text'),
      ).toContainText('dev@payloadcms.com')
      await expect(
        page.locator('#field-relationHasManyWithDynamicDefault .relationship--single-value__text'),
      ).toContainText('dev@payloadcms.com')
    })

    test('should filter relationship options', async () => {
      await page.goto(url.create)
      await page.locator('#field-relationship .rs__control').click()
      await page.keyboard.type('seeded')
      await page.locator('.rs__option:has-text("Seeded text document")').click()
      await saveDocAndAssert(page)
    })

    // Related issue: https://github.com/payloadcms/payload/issues/2815
    test('should modify fields in relationship drawer', async () => {
      await page.goto(url.create)

      // First fill out the relationship field, as it's required
      await page.locator('#relationship-add-new .relationship-add-new__add-button').click()
      await page
        .locator('#field-relationship .relationship-add-new__relation-button--text-fields')
        .click()

      await page.locator('.drawer__content #field-text').fill('something')

      await page.locator('[id^=doc-drawer_text-fields_1_] #action-save').click()
      await expect(page.locator('.Toastify')).toContainText('successfully')
      await page.locator('[id^=close-drawer__doc-drawer_text-fields_1_]').click()
      await page.locator('#action-save').click()
      await expect(page.locator('.Toastify')).toContainText('successfully')

      // Create a new doc for the `relationshipHasMany` field
      await page
        .locator('#field-relationshipHasMany button.relationship-add-new__add-button')
        .click()
      const textField2 = page.locator('[id^=doc-drawer_text-fields_1_] #field-text')
      const value = 'Hello, world!'
      await textField2.fill(value)

      // Save and close the drawer
      await page.locator('[id^=doc-drawer_text-fields_1_] #action-save').click()
      await expect(page.locator('.Toastify')).toContainText('successfully')
      await page.locator('[id^=close-drawer__doc-drawer_text-fields_1_]').click()

      // Now open the drawer again to edit the `text` field _using the keyboard_
      // Mimic real user behavior by typing into the field with spaces and backspaces
      // Explicitly use both `down` and `type` to cover edge cases
      await page
        .locator(
          '#field-relationshipHasMany button.relationship--multi-value-label__drawer-toggler',
        )
        .click()
      await page.locator('[id^=doc-drawer_text-fields_1_] #field-text').click()
      await page.keyboard.down('1')
      await page.keyboard.type('23')
      await expect(page.locator('[id^=doc-drawer_text-fields_1_] #field-text')).toHaveValue(
        `${value}123`,
      )
      await page.keyboard.type('4567')
      await page.keyboard.press('Backspace')
      await expect(page.locator('[id^=doc-drawer_text-fields_1_] #field-text')).toHaveValue(
        `${value}123456`,
      )

      // save drawer
      await page.locator('[id^=doc-drawer_text-fields_1_] #action-save').click()
      await expect(page.locator('.Toastify')).toContainText('successfully')
      // close drawer
      await page.locator('[id^=close-drawer__doc-drawer_text-fields_1_]').click()
      // save document and reload
      await page.locator('#action-save').click()
      await expect(page.locator('.Toastify')).toContainText('successfully')
      await page.reload()

      // check if the value is saved
      await expect(
        page.locator('#field-relationshipHasMany .relationship--multi-value-label__text'),
      ).toHaveText(`${value}123456`)
    })

    // Drawers opened through the edit button are prone to issues due to the use of stopPropagation for certain
    // events - specifically for drawers opened through the edit button. This test is to ensure that drawers
    // opened through the edit button can be saved using the hotkey.
    test('should save using hotkey in edit document drawer', async () => {
      await page.goto(url.create)

      // First fill out the relationship field, as it's required
      await page.locator('#relationship-add-new .relationship-add-new__add-button').click()
      await page.locator('#field-relationship .value-container').click()
      // Select "Seeded text document" relationship
      await page.getByText('Seeded text document', { exact: true }).click()

      // Click edit button which opens drawer
      await page.getByRole('button', { name: 'Edit Seeded text document' }).click()

      // Fill 'text' field of 'Seeded text document'
      await page.locator('.drawer__content #field-text').fill('some updated text value')

      // Save drawer (not parent page) with hotkey
      await saveDocHotkeyAndAssert(page)

      const seededTextDocument = await payload.find({
        collection: textFieldsSlug,
        where: {
          text: {
            equals: 'some updated text value',
          },
        },
      })
      const relationshipDocuments = await payload.find({
        collection: relationshipFieldsSlug,
      })

      // The Seeded text document should now have a text field with value 'some updated text value',
      expect(seededTextDocument.docs.length).toEqual(1)
      // but the relationship document should NOT exist, as the hotkey should have saved the drawer and not the parent page
      expect(relationshipDocuments.docs.length).toEqual(0)
    })

    test('should bypass min rows validation when no rows present and field is not required', async () => {
      await page.goto(url.create)
      // First fill out the relationship field, as it's required
      await page.locator('#relationship-add-new .relationship-add-new__add-button').click()
      await page.locator('#field-relationship .value-container').click()
      await page.getByText('Seeded text document', { exact: true }).click()

      await saveDocAndAssert(page)
      await expect(page.locator('.Toastify')).toContainText('successfully')
    })

    test('should fail min rows validation when rows are present', async () => {
      await page.goto(url.create)

      // First fill out the relationship field, as it's required
      await page.locator('#relationship-add-new .relationship-add-new__add-button').click()
      await page.locator('#field-relationship .value-container').click()
      await page.getByText('Seeded text document', { exact: true }).click()

      await page.locator('#field-relationshipWithMinRows .value-container').click()
      await page
        .locator('#field-relationshipWithMinRows .rs__option:has-text("Seeded text document")')
        .click()

      await page.click('#action-save', { delay: 100 })
      await expect(page.locator('.Toastify')).toContainText('Please correct invalid fields')
    })

    test('should sort relationship options by sortOptions property (ID in ascending order)', async () => {
      await page.goto(url.create)

      const field = page.locator('#field-relationship')
      await field.click()

      const firstOption = page.locator('.rs__option').first()
      await expect(firstOption).toBeVisible()
      const firstOptionText = await firstOption.textContent()
      expect(firstOptionText.trim()).toBe('Another text document')
    })

    test('should sort relationHasManyPolymorphic options by sortOptions property: text-fields collection (items in descending order)', async () => {
      await page.goto(url.create)

      const field = page.locator('#field-relationHasManyPolymorphic')
      await field.click()

      const firstOption = page.locator('.rs__option').first()
      await expect(firstOption).toBeVisible()
      const firstOptionText = await firstOption.textContent()
      expect(firstOptionText.trim()).toBe('Seeded text document')
    })

    test('should allow filtering by relationship field / equals', async () => {
      const textDoc = await createTextFieldDoc()
      await createRelationshipFieldDoc({ value: textDoc.id, relationTo: 'text-fields' })

      await page.goto(url.list)

      await page.locator('.list-controls__toggle-columns').click()
      await page.locator('.list-controls__toggle-where').click()
      await page.waitForSelector('.list-controls__where.rah-static--height-auto')
      await page.locator('.where-builder__add-first-filter').click()

      const conditionField = page.locator('.condition__field')
      await conditionField.click()

      const dropdownFieldOptions = conditionField.locator('.rs__option')
      await dropdownFieldOptions.locator('text=Relationship').nth(0).click()

      const operatorField = page.locator('.condition__operator')
      await operatorField.click()

      const dropdownOperatorOptions = operatorField.locator('.rs__option')
      await dropdownOperatorOptions.locator('text=equals').click()

      const valueField = page.locator('.condition__value')
      await valueField.click()
      const dropdownValueOptions = valueField.locator('.rs__option')
      await dropdownValueOptions.locator('text=some text').click()

      await expect(page.locator(tableRowLocator)).toHaveCount(1)
    })

    // TODO: properly handle polymorphic relationship handling with the postgres adapter
    test('should allow filtering by relationship field / is_in', async () => {
      const textDoc = await createTextFieldDoc()
      await createRelationshipFieldDoc({ value: textDoc.id, relationTo: 'text-fields' })

      await page.goto(url.list)

      await page.locator('.list-controls__toggle-columns').click()
      await page.locator('.list-controls__toggle-where').click()
      await page.waitForSelector('.list-controls__where.rah-static--height-auto')
      await page.locator('.where-builder__add-first-filter').click()

      const conditionField = page.locator('.condition__field')
      await conditionField.click()

      const dropdownFieldOptions = conditionField.locator('.rs__option')
      await dropdownFieldOptions.locator('text=Relationship').nth(0).click()

      const operatorField = page.locator('.condition__operator')
      await operatorField.click()

      const dropdownOperatorOptions = operatorField.locator('.rs__option')
      await dropdownOperatorOptions.locator('text=is in').click()

      const valueField = page.locator('.condition__value')
      await valueField.click()
      const dropdownValueOptions = valueField.locator('.rs__option')
      await dropdownValueOptions.locator('text=some text').click()

      await expect(page.locator(tableRowLocator)).toHaveCount(1)
    })

    test('should allow filtering by relationship field / not_in', async () => {
      const textDoc = await createTextFieldDoc()
      await createRelationshipFieldDoc({ value: textDoc.id, relationTo: 'text-fields' })

      await page.goto(url.list)

      await page.locator('.list-controls__toggle-columns').click()
      await page.locator('.list-controls__toggle-where').click()
      await page.waitForSelector('.list-controls__where.rah-static--height-auto')
      await page.locator('.where-builder__add-first-filter').click()

      const conditionField = page.locator('.condition__field')
      await conditionField.click()

      const dropdownFieldOptions = conditionField.locator('.rs__option')
      await dropdownFieldOptions.locator('text=Relationship').nth(0).click()

      const operatorField = page.locator('.condition__operator')
      await operatorField.click()

      const dropdownOperatorOptions = operatorField.locator('.rs__option')
      await dropdownOperatorOptions.locator('text=is not in').click()

      const valueField = page.locator('.condition__value')
      await valueField.click()
      const dropdownValueOptions = valueField.locator('.rs__option')
      await dropdownValueOptions.locator('text=some text').click()

      await expect(page.locator(tableRowLocator)).toHaveCount(0)
    })
  })

  describe('upload', () => {
    let url: AdminUrlUtil
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, 'uploads')
    })

    async function uploadImage() {
      await page.goto(url.create)

      // create a jpg upload
      await page
        .locator('.file-field__upload input[type="file"]')
        .setInputFiles(path.resolve(__dirname, './collections/Upload/payload.jpg'))
      await expect(page.locator('.file-field .file-field__filename')).toHaveValue('payload.jpg')
      await page.locator('#action-save').click()
      await wait(200)
      await expect(page.locator('.Toastify')).toContainText('successfully')
    }

    test('should upload files', async () => {
      await uploadImage()
    })

    test('should upload files from remote URL', async () => {
      await uploadImage()

      await page.goto(url.create)

      const pasteURLButton = page.locator('.file-field__upload .dropzone__file-button', {
        hasText: 'Paste URL',
      })
      await pasteURLButton.click()

      const remoteImage = 'https://payloadcms.com/images/og-image.jpg'

      const inputField = page.locator('.file-field__upload .file-field__remote-file')
      await inputField.fill(remoteImage)

      const addFileButton = page.locator('.file-field__add-file')
      await addFileButton.click()

      await expect(page.locator('.file-field .file-field__filename')).toHaveValue('og-image.jpg')

      await saveDocAndAssert(page)

      await expect(page.locator('.file-field .file-details img')).toHaveAttribute(
        'src',
        /\/uploads\/og-image\.jpg(\?.*)?$/,
      )
    })

    // test that the image renders
    test('should render uploaded image', async () => {
      await uploadImage()
      await expect(page.locator('.file-field .file-details img')).toHaveAttribute(
        'src',
        /\/uploads\/payload-1\.jpg(\?.*)?$/,
      )
    })

    test('should upload using the document drawer', async () => {
      await uploadImage()
      // Open the media drawer and create a png upload
      await page.locator('.field-type.upload .upload__toggler.doc-drawer__toggler').click()
      await page
        .locator('[id^=doc-drawer_uploads_1_] .file-field__upload input[type="file"]')
        .setInputFiles(path.resolve(__dirname, './uploads/payload.png'))
      await page.locator('[id^=doc-drawer_uploads_1_] #action-save').click()
      await wait(200)
      await expect(page.locator('.Toastify')).toContainText('successfully')

      // Assert that the media field has the png upload
      await expect(
        page.locator('.field-type.upload .file-details .file-meta__url a'),
      ).toHaveAttribute('href', '/uploads/payload-1.png')
      await expect(
        page.locator('.field-type.upload .file-details .file-meta__url a'),
      ).toContainText('payload-1.png')
      await expect(page.locator('.field-type.upload .file-details img')).toHaveAttribute(
        'src',
        '/uploads/payload-1.png',
      )
      await page.locator('#action-save').click()
      await wait(200)
      await expect(page.locator('.Toastify')).toContainText('successfully')
    })

    test('should upload after editing image inside a document drawer', async () => {
      await uploadImage()
      await wait(1000)
      // Open the media drawer and create a png upload

      await page.locator('.field-type.upload .upload__toggler.doc-drawer__toggler').click()

      await page
        .locator('[id^=doc-drawer_uploads_1_] .file-field__upload input[type="file"]')
        .setInputFiles(path.resolve(__dirname, './uploads/payload.png'))
      await expect(
        page.locator('[id^=doc-drawer_uploads_1_] .file-field__upload .file-field__filename'),
      ).toHaveValue('payload.png')
      await page.locator('[id^=doc-drawer_uploads_1_] .file-field__edit').click()
      await page
        .locator('[id^=edit-upload] .edit-upload__input input[name="Width (px)"]')
        .nth(1)
        .fill('200')
      await page
        .locator('[id^=edit-upload] .edit-upload__input input[name="Height (px)"]')
        .nth(1)
        .fill('200')
      await page.locator('[id^=edit-upload] button:has-text("Apply Changes")').nth(1).click()
      await page.locator('[id^=doc-drawer_uploads_1_] #action-save').click()
      await expect(page.locator('.Toastify')).toContainText('successfully')

      // Assert that the media field has the png upload
      await expect(
        page.locator('.field-type.upload .file-details .file-meta__url a'),
      ).toHaveAttribute('href', '/uploads/payload-1.png')
      await expect(
        page.locator('.field-type.upload .file-details .file-meta__url a'),
      ).toContainText('payload-1.png')
      await expect(page.locator('.field-type.upload .file-details img')).toHaveAttribute(
        'src',
        '/uploads/payload-1.png',
      )
      await saveDocAndAssert(page)
    })

    test('should clear selected upload', async () => {
      await uploadImage()
      await page.locator('.field-type.upload .upload__toggler.doc-drawer__toggler').click()
      await page
        .locator('[id^=doc-drawer_uploads_1_] .file-field__upload input[type="file"]')
        .setInputFiles(path.resolve(__dirname, './uploads/payload.png'))
      await page.locator('[id^=doc-drawer_uploads_1_] #action-save').click()
      await wait(200)
      await expect(page.locator('.Toastify')).toContainText('successfully')
      await page.locator('.field-type.upload .file-details__remove').click()
    })

    test('should select using the list drawer and restrict mimetype based on filterOptions', async () => {
      await uploadImage()

      await page.locator('.field-type.upload .upload__toggler.list-drawer__toggler').click()
      await wait(200)
      const jpgImages = page.locator('[id^=list-drawer_1_] .upload-gallery img[src$=".jpg"]')
      expect(await jpgImages.count()).toEqual(0)
    })

    test.skip('should show drawer for input field when enableRichText is false', async () => {
      const uploads3URL = new AdminUrlUtil(serverURL, 'uploads3')
      await page.goto(uploads3URL.create)

      // create file in uploads 3 collection
      await page
        .locator('.file-field__upload input[type="file"]')
        .setInputFiles(path.resolve(__dirname, './collections/Upload/payload.jpg'))
      await expect(page.locator('.file-field .file-field__filename')).toContainText('payload.jpg')
      await page.locator('#action-save').click()

      await wait(200)

      // open drawer
      await page.locator('.field-type.upload .list-drawer__toggler').click()
      // check title
      await expect(page.locator('.list-drawer__header-text')).toContainText('Uploads 3')
    })
  })

  describe('row', () => {
    let url: AdminUrlUtil
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, 'row-fields')
    })

    test('should not display field in list view column selector if admin.disableListColumn is true', async () => {
      await page.goto(url.create)
      const idInput = page.locator('input#field-id')
      await idInput.fill('000')
      const titleInput = page.locator('input#field-title')
      await titleInput.fill('Row 000')
      const disableListColumnText = page.locator('input#field-disableListColumnText')
      await disableListColumnText.fill('Disable List Column Text')
      await page.locator('#action-save').click()
      await wait(200)
      await expect(page.locator('.Toastify')).toContainText('successfully')

      await page.goto(url.list)
      await page.locator('.list-controls__toggle-columns').click()

      await expect(page.locator('.column-selector')).toBeVisible()

      // Check if "Disable List Column Text" is not present in the column options
      await expect(
        page.locator(`.column-selector .column-selector__column`, {
          hasText: exactText('Disable List Column Text'),
        }),
      ).toBeHidden()
    })

    test('should show row fields as table columns', async () => {
      await page.goto(url.create)

      // fill the required fields, including the row field
      const idInput = page.locator('input#field-id')
      await idInput.fill('123')
      const titleInput = page.locator('input#field-title')
      await titleInput.fill('Row 123')
      await page.locator('#action-save').click()
      await wait(200)
      await expect(page.locator('.Toastify')).toContainText('successfully')

      // ensure the 'title' field is visible in the table header
      await page.goto(url.list)
      const titleHeading = page.locator('th#heading-title')
      await expect(titleHeading).toBeVisible()

      // ensure the 'title' field shows the correct value in the table cell
      const titleCell = page.locator('.row-1 td.cell-title')
      await expect(titleCell).toBeVisible()
      await expect(titleCell).toContainText('Row 123')
    })

    test('should not show duplicative ID field', async () => {
      await page.goto(url.create)
      // fill the required fields, including the custom ID field
      const idInput = page.locator('input#field-id')
      await idInput.fill('456')
      const titleInput = page.locator('input#field-title')
      await titleInput.fill('Row 456')
      await page.locator('#action-save').click()
      await wait(200)
      await expect(page.locator('.Toastify')).toContainText('successfully')

      // ensure there are not two ID fields in the table header
      await page.goto(url.list)
      const idHeadings = page.locator('th#heading-id')
      await expect(idHeadings).toBeVisible()
      await expect(idHeadings).toHaveCount(1)
    })

    test('should render row fields inline and with explicit widths', async () => {
      await page.goto(url.create)
      const fieldA = page.locator('input#field-field_with_width_a')
      await expect(fieldA).toBeVisible()
      const fieldB = page.locator('input#field-field_with_width_b')
      await expect(fieldB).toBeVisible()
      const fieldABox = await fieldA.boundingBox()
      const fieldBBox = await fieldB.boundingBox()

      // Check that the top value of the fields are the same
      // Give it some wiggle room of like 2px to account for differences in rendering
      const tolerance = 2
      expect(fieldABox.y).toBeLessThanOrEqual(fieldBBox.y + tolerance)

      // Check that the widths of the fields are the same
      const difference = Math.abs(fieldABox.width - fieldBBox.width)
      expect(difference).toBeLessThanOrEqual(tolerance)
    })

    test('should render nested row fields in the correct position ', async () => {
      await page.goto(url.create)

      // These fields are not given explicit `width` values
      await page.goto(url.create)
      const fieldA = page.locator('input#field-field_within_collapsible_a')
      await expect(fieldA).toBeVisible()
      const fieldB = page.locator('input#field-field_within_collapsible_b')
      await expect(fieldB).toBeVisible()
      const fieldABox = await fieldA.boundingBox()
      const fieldBBox = await fieldB.boundingBox()

      // Check that the top value of the fields are the same
      // Give it some wiggle room of like 2px to account for differences in rendering
      const tolerance = 2
      expect(fieldABox.y).toBeLessThanOrEqual(fieldBBox.y + tolerance)

      // Check that the widths of the fields are the same
      const collapsibleDifference = Math.abs(fieldABox.width - fieldBBox.width)

      expect(collapsibleDifference).toBeLessThanOrEqual(tolerance)
    })
  })

  describe('conditional logic', () => {
    let url: AdminUrlUtil
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, 'conditional-logic')
    })

    test('should toggle conditional field when data changes', async () => {
      await page.goto(url.create)
      const toggleField = page.locator('label[for=field-toggleField]')
      await toggleField.click()

      const fieldToToggle = page.locator('input#field-fieldToToggle')

      await expect(fieldToToggle).toBeVisible()
    })

    test('should show conditional field based on user data', async () => {
      await page.goto(url.create)
      const userConditional = page.locator('input#field-userConditional')
      await expect(userConditional).toBeVisible()
    })

    test('should show conditional field based on fields nested within data', async () => {
      await page.goto(url.create)

      const parentGroupFields = page.locator(
        'div#field-parentGroup > .group-field__wrap > .render-fields',
      )
      await expect(parentGroupFields).toHaveCount(1)

      const toggle = page.locator('label[for=field-parentGroup__enableParentGroupFields]')
      await toggle.click()

      const toggledField = page.locator('input#field-parentGroup__siblingField')

      await expect(toggledField).toBeVisible()
    })

    test('should show conditional field based on fields nested within siblingData', async () => {
      await page.goto(url.create)

      const toggle = page.locator('label[for=field-parentGroup__enableParentGroupFields]')
      await toggle.click()

      const fieldRelyingOnSiblingData = page.locator('input#field-reliesOnParentGroup')
      await expect(fieldRelyingOnSiblingData).toBeVisible()
    })
  })
})

async function createTextFieldDoc(overrides?: Partial<TextField>): Promise<TextField> {
  return payload.create({
    collection: 'text-fields',
    data: {
      text: 'some text',
      localizedText: 'some localized text',
      ...overrides,
    },
  }) as unknown as Promise<TextField>
}

async function createRelationshipFieldDoc(
  relationship: RelationshipField['relationship'],
  overrides?: Partial<RelationshipField>,
): Promise<RelationshipField> {
  return payload.create({
    collection: 'relationship-fields',
    data: {
      relationship,
      ...overrides,
    },
  }) as unknown as Promise<RelationshipField>
}
