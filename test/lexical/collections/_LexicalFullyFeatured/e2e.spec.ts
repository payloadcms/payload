import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../helpers/sdk/index.js'
import type { Config } from '../../payload-types.js'

import { ensureCompilationIsDone } from '../../../helpers.js'
import { AdminUrlUtil } from '../../../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../helpers/initPayloadE2ENoConfig.js'
import { lexicalFullyFeaturedSlug } from '../../../lexical/slugs.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { LexicalHelpers } from '../utils.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

let payload: PayloadTestSDK<Config>
let serverURL: string

const { beforeAll, beforeEach, describe } = test

// Unlike the other suites, this one runs in parallel, as they run on the `lexical-fully-featured/create` URL and are "pure" tests
// PLEASE do not reset the database or perform any operations that modify it in this file.
test.describe.configure({ mode: 'parallel' })

describe('Lexical Fully Featured', () => {
  let lexical: LexicalHelpers
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))

    await ensureCompilationIsDone({ serverURL, browser })
  })
  beforeEach(async ({ page }) => {
    const url = new AdminUrlUtil(serverURL, lexicalFullyFeaturedSlug)
    lexical = new LexicalHelpers(page)
    await page.goto(url.create)
    await lexical.editor.first().focus()
  })
  test('prevent extra paragraph when inserting decorator blocks like blocks or upload node', async () => {
    await lexical.slashCommand('myblock')
    await expect(lexical.editor.locator('.LexicalEditorTheme__block')).toBeVisible()
    await lexical.slashCommand('relationship', true, 'Relationship')
    await lexical.drawer.locator('.list-drawer__header').getByText('Create New').click()
    await lexical.save('drawer')
    await expect(lexical.decorator).toHaveCount(2)
    await lexical.slashCommand('upload')
    await lexical.drawer.locator('.list-drawer__header').getByText('Create New').click()
    await lexical.drawer.getByText('Paste URL').click()
    await lexical.drawer
      .locator('.file-field__remote-file')
      .fill(
        'https://raw.githubusercontent.com/payloadcms/website/refs/heads/main/public/images/universal-truth.jpg',
      )
    await lexical.drawer.getByText('Add file').click()
    await lexical.save('drawer')
    await expect(lexical.decorator).toHaveCount(3)
    const paragraph = lexical.editor.locator('> p')
    await expect(paragraph).toHaveText('')
  })

  test('ensure upload node can be aligned', async ({ page }) => {
    await lexical.slashCommand('upload')
    await lexical.drawer.locator('.list-drawer__header').getByText('Create New').click()
    await lexical.drawer.getByText('Paste URL').click()
    const url =
      'https://raw.githubusercontent.com/payloadcms/website/refs/heads/main/public/images/universal-truth.jpg'
    await lexical.drawer.locator('.file-field__remote-file').fill(url)
    await lexical.drawer.getByText('Add file').click()
    await lexical.save('drawer')
    const img = lexical.editor.locator('img').first()
    await img.click()
    const imgBoxBeforeCenter = await img.boundingBox()
    await expect(() => {
      expect(imgBoxBeforeCenter?.x).toBeLessThan(150)
    }).toPass({ timeout: 100 })
    await page.getByLabel('align dropdown').click()
    await page.getByLabel('Align Center').click()
    const imgBoxAfterCenter = await img.boundingBox()
    await expect(() => {
      expect(imgBoxAfterCenter?.x).toBeGreaterThan(150)
    }).toPass({ timeout: 100 })
  })

  test('ControlOrMeta+A inside input should select all the text inside the input', async ({
    page,
  }) => {
    await lexical.editor.first().focus()
    await page.keyboard.type('Hello')
    await page.keyboard.press('Enter')
    await lexical.slashCommand('myblock')
    await page.locator('#field-someText').first().focus()
    await page.keyboard.type('World')
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.press('Backspace')
    const paragraph = lexical.editor.locator('> p').first()
    await expect(paragraph).toHaveText('Hello')
    await expect(page.getByText('World')).toHaveCount(0)
  })

  test('text state feature', async ({ page }) => {
    await page.keyboard.type('Hello')
    await page.keyboard.press('ControlOrMeta+A')

    await lexical.clickInlineToolbarButton({
      dropdownKey: 'textState',
      buttonKey: 'bg-red',
    })

    const colored = page.locator('span').filter({ hasText: 'Hello' })
    await expect(colored).toHaveCSS('background-color', 'oklch(0.704 0.191 22.216)')
    await expect(colored).toHaveAttribute('data-background-color', 'bg-red')
    await lexical.clickInlineToolbarButton({
      dropdownKey: 'textState',
      buttonKey: 'clear-style',
    })

    await expect(colored).toBeVisible()
    await expect(colored).not.toHaveCSS('background-color', 'oklch(0.704 0.191 22.216)')
    await expect(colored).not.toHaveAttribute('data-background-color', 'bg-red')
  })

  test('ensure inline toolbar items are updated when selecting word by double-clicking', async ({
    page,
  }) => {
    await page.keyboard.type('Hello')
    await page.getByText('Hello').first().dblclick()

    const { dropdownItems } = await lexical.clickInlineToolbarButton({
      dropdownKey: 'textState',
    })

    const someButton = dropdownItems!.locator(`[data-item-key="bg-red"]`)
    await expect(someButton).toHaveAttribute('aria-disabled', 'false')
  })

  test('ensure fixed toolbar items are updated when selecting word by double-clicking', async ({
    page,
  }) => {
    await page.keyboard.type('Hello')
    await page.getByText('Hello').first().dblclick()

    const { dropdownItems } = await lexical.clickFixedToolbarButton({
      dropdownKey: 'textState',
    })

    const someButton = dropdownItems!.locator(`[data-item-key="bg-red"]`)
    await expect(someButton).toHaveAttribute('aria-disabled', 'false')
  })

  test('ensure opening relationship field with appearance: "drawer" inside rich text inline block does not close drawer', async ({
    page,
  }) => {
    // https://github.com/payloadcms/payload/pull/13830

    await lexical.slashCommand('inlineblockwithrelationship')

    await expect(lexical.drawer).toBeVisible()

    await lexical.drawer.locator('.react-select').click()
    // At this point, the drawer would close if the issue is not fixed

    await page.getByText('Seeded text document').click()

    await expect(
      lexical.drawer.locator('.react-select .relationship--single-value__text'),
    ).toHaveText('Seeded text document')

    await lexical.drawer.getByText('Save changes').click()
    await expect(lexical.drawer).toBeHidden()
  })

  test('ensure code block can be created using slash commands', async ({ page }) => {
    await lexical.slashCommand('code')
    const codeBlock = lexical.editor.locator('.LexicalEditorTheme__block-Code')
    await expect(codeBlock).toHaveCount(1)
    await expect(codeBlock).toBeVisible()

    await expect(codeBlock.locator('.monaco-editor')).toBeVisible()

    await expect(
      codeBlock.locator('.payload-richtext-code-block__language-selector-button'),
    ).toHaveAttribute('data-selected-language', 'abap')

    // Does not contain payload types. However, since this is JavaScript and not TypeScript, there should be no errors.
    await codeBlock.locator('.monaco-editor .view-line').first().click()
    await page.keyboard.type("import { APIError } from 'payload'")
    await expect(codeBlock.locator('.monaco-editor .view-overlays .squiggly-error')).toHaveCount(0)
  })

  test('ensure code block can be created using client-side markdown shortcuts', async ({
    page,
  }) => {
    await page.keyboard.type('```ts ')
    const codeBlock = lexical.editor.locator('.LexicalEditorTheme__block-Code')
    await expect(codeBlock).toHaveCount(1)
    await expect(codeBlock).toBeVisible()

    await expect(codeBlock.locator('.monaco-editor')).toBeVisible()
    await expect(
      codeBlock.locator('.payload-richtext-code-block__language-selector-button'),
    ).toHaveAttribute('data-selected-language', 'ts')

    // Ensure it does not contain payload types
    await codeBlock.locator('.monaco-editor .view-line').first().click()
    await page.keyboard.type("import { APIError } from 'payload'")
    await expect(codeBlock.locator('.monaco-editor .view-overlays .squiggly-error')).toHaveCount(1)
  })

  test('ensure payload code block can be created using slash commands and it contains payload types', async ({
    page,
  }) => {
    await lexical.slashCommand('payloadcode')
    const codeBlock = lexical.editor.locator('.LexicalEditorTheme__block-PayloadCode')
    await expect(codeBlock).toHaveCount(1)
    await expect(codeBlock).toBeVisible()

    await expect(codeBlock.locator('.monaco-editor')).toBeVisible()
    await expect(
      codeBlock.locator('.payload-richtext-code-block__language-selector-button'),
    ).toHaveAttribute('data-selected-language', 'ts')

    // Ensure it contains payload types
    await codeBlock.locator('.monaco-editor .view-line').first().click()
    await page.keyboard.type("import { APIError } from 'payload'")
    await expect(codeBlock.locator('.monaco-editor .view-overlays .squiggly-error')).toHaveCount(0)
  })

  test('copy pasting a inline block within range selection should not duplicate the inline block id', async ({
    page,
  }) => {
    await page.keyboard.type('Hello ')
    await lexical.slashCommand('inline')
    await lexical.drawer.locator('input').first().fill('World')
    await lexical.drawer.getByText('Save changes').click()
    await expect(lexical.drawer).toBeHidden()
    const inlineBlock = lexical.editor.locator('.LexicalEditorTheme__inlineBlock')
    await expect(inlineBlock).toHaveCount(1)

    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.press('ControlOrMeta+C')
    // needed for some reason
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(1000)
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ControlOrMeta+V')
    await expect(inlineBlock).toHaveCount(2)
    await inlineBlock.nth(1).locator('button').first().click()
    await expect(lexical.drawer).toBeVisible()
    await expect(lexical.drawer.locator('input').first()).toHaveValue('World')
    await lexical.drawer.locator('input').first().fill('World changed')
    await expect(lexical.drawer.locator('input').first()).toHaveValue('World changed')
    await lexical.drawer.getByText('Save changes').click()
    await inlineBlock.nth(0).locator('button').first().click()
    await expect(lexical.drawer.locator('input').first()).toHaveValue('World')
    await lexical.drawer.getByLabel('Close').click()
    await expect(lexical.drawer).toBeHidden()
    await inlineBlock.nth(1).locator('button').first().click()
    await expect(lexical.drawer.locator('input').first()).toHaveValue('World changed')
  })

  test('copy pasting a inline block within node selection should not duplicate the inline block id', async ({
    page,
  }) => {
    await page.keyboard.type('Hello ')
    await lexical.slashCommand('inline')
    await lexical.drawer.locator('input').first().fill('World')
    await lexical.drawer.getByText('Save changes').click()
    await expect(lexical.drawer).toBeHidden()
    const inlineBlock = lexical.editor.locator('.LexicalEditorTheme__inlineBlock')
    await expect(inlineBlock).toHaveCount(1)
    await inlineBlock.click()
    await expect(lexical.drawer).toBeHidden()
    await page.keyboard.press('ControlOrMeta+C')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ControlOrMeta+V')
    await expect(inlineBlock).toHaveCount(2)
    await inlineBlock.nth(1).locator('button').first().click()
    await expect(lexical.drawer).toBeVisible()
    await expect(lexical.drawer.locator('input').first()).toHaveValue('World')
    await lexical.drawer.locator('input').first().fill('World changed')
    await expect(lexical.drawer.locator('input').first()).toHaveValue('World changed')
    await lexical.drawer.getByText('Save changes').click()
    await expect(lexical.drawer).toBeHidden()
    await inlineBlock.nth(0).locator('button').first().click()
    await expect(lexical.drawer.locator('input').first()).toHaveValue('World')
    await lexical.drawer.getByLabel('Close').click()
    await expect(lexical.drawer).toBeHidden()
    await inlineBlock.nth(1).locator('button').first().click()
    await expect(lexical.drawer.locator('input').first()).toHaveValue('World changed')
  })
})

describe('Lexical Fully Featured, admin panel in RTL', () => {
  let lexical: LexicalHelpers
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))

    await ensureCompilationIsDone({ browser, serverURL })
  })
  beforeEach(async ({ page }) => {
    const url = new AdminUrlUtil(serverURL, lexicalFullyFeaturedSlug)
    lexical = new LexicalHelpers(page)
    await page.goto(url.account)
    await page.locator('.payload-settings__language .react-select').click()
    const options = page.locator('.rs__option')
    await options.locator('text=עברית').click()
    await expect(page.getByText('משתמשים').first()).toBeVisible()
    await page.goto(url.create)
    await lexical.editor.first().focus()
  })
  test('slash menu should be positioned correctly in RTL', async ({ page }) => {
    await page.keyboard.type('/')
    const menu = page.locator('#slash-menu .slash-menu-popup')
    await expect(menu).toBeVisible()

    // left edge (0 indents)
    const menuBox = (await menu.boundingBox())!
    const slashBox = (await lexical.paragraph.getByText('/', { exact: true }).boundingBox())!
    await expect(() => {
      expect(menuBox.x).toBeGreaterThan(0)
      expect(menuBox.x).toBeLessThan(slashBox.x)
    }).toPass({ timeout: 100 })
    await page.keyboard.press('Backspace')
    await expect(menu).toBeHidden()

    // A bit separated (3 tabs)
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Tab')
    }
    await page.keyboard.type('/')
    await expect(menu).toBeVisible()
    const menuBox2 = (await menu.boundingBox())!
    const slashBox2 = (await lexical.paragraph.getByText('/', { exact: true }).boundingBox())!
    await expect(() => {
      expect(menuBox2.x).toBe(menuBox.x)
      // indents should allways be 40px. Please don't change this! https://github.com/payloadcms/payload/pull/13274
      expect(slashBox2.x).toBe(slashBox.x + 40 * 3)
    }).toPass({ timeout: 100 })
    await page.keyboard.press('Backspace')
    await expect(menu).toBeHidden()

    // middle approx (13 tabs)
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab')
    }
    await page.keyboard.type('/')
    await expect(menu).toBeVisible()
    const menuBox3 = (await menu.boundingBox())!
    const slashBox3 = (await lexical.paragraph.getByText('/', { exact: true }).boundingBox())!
    await expect(() => {
      // The right edge of the menu should be approximately the same as the left edge of the slash
      expect(menuBox3.x + menuBox3.width).toBeLessThan(slashBox3.x + 15)
      expect(menuBox3.x + menuBox3.width).toBeGreaterThan(slashBox3.x - 15)
      // indents should allways be 40px. Please don't change this! https://github.com/payloadcms/payload/pull/13274
      expect(slashBox3.x).toBe(slashBox.x + 40 * 13)
    }).toPass({ timeout: 100 })
    await page.keyboard.press('Backspace')
    await expect(menu).toBeHidden()

    // right edge (27 tabs)
    for (let i = 0; i < 14; i++) {
      await page.keyboard.press('Tab')
    }
    await page.keyboard.type('/')
    await expect(menu).toBeVisible()
    const menuBox4 = (await menu.boundingBox())!
    const slashBox4 = (await lexical.paragraph.getByText('/', { exact: true }).boundingBox())!
    await expect(() => {
      // The right edge of the menu should be approximately the same as the left edge of the slash
      expect(menuBox4.x + menuBox4.width).toBeLessThan(slashBox4.x + 15)
      expect(menuBox4.x + menuBox4.width).toBeGreaterThan(slashBox4.x - 15)
      // indents should allways be 40px. Please don't change this! https://github.com/payloadcms/payload/pull/13274
      expect(slashBox4.x).toBe(slashBox.x + 40 * 27)
    }).toPass({ timeout: 100 })
  })
})
