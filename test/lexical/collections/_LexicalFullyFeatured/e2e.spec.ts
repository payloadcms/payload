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

    const page = await browser.newPage()
    await ensureCompilationIsDone({ page, serverURL })
    await page.close()
  })
  beforeEach(async ({ page }) => {
    const url = new AdminUrlUtil(serverURL, lexicalFullyFeaturedSlug)
    lexical = new LexicalHelpers(page)
    await page.goto(url.create)
    await lexical.editor.first().focus()
  })
  test('prevent extra paragraph when inserting decorator blocks like blocks or upload node', async () => {
    await lexical.slashCommand('block')
    await expect(lexical.editor.locator('.lexical-block')).toBeVisible()
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

  test('ControlOrMeta+A inside input should select all the text inside the input', async ({
    page,
  }) => {
    await lexical.editor.first().focus()
    await page.keyboard.type('Hello')
    await page.keyboard.press('Enter')
    await lexical.slashCommand('block')
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
})
