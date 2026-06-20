import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import { ensureCompilationIsDone, waitForFormReady } from '../../../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../../../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { lexicalLinkAutosaveSlug } from '../../slugs.js'
import { LexicalHelpers } from '../utils.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, beforeEach, describe } = test

const { serverURL } = await initPayloadE2ENoConfig({
  dirname,
})

// Regression test for https://github.com/payloadcms/payload/issues/15719
//
// The parent collection has autosave enabled. Opening the link drawer immediately
// creates a link node, which dirties the form and schedules an autosave. While the
// drawer is still open the user switches the link type from "Custom URL" to
// "Internal Link". When the pending autosave fires it triggers a lexical state
// update, which re-runs `$updateLinkEditor` and overwrites the drawer's in-progress
// form state with the link node's committed fields — reverting the link type back
// to "Custom URL".
describe('Lexical: autosave overwrites in-progress link drawer edits', () => {
  let lexical: LexicalHelpers

  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false'

    await ensureCompilationIsDone({ browser, serverURL })
  })

  beforeEach(async ({ page }) => {
    const url = new AdminUrlUtil(serverURL, lexicalLinkAutosaveSlug)
    lexical = new LexicalHelpers(page)
    await page.goto(url.create)
    await waitForFormReady(page)
    await lexical.editor.first().focus()
  })

  test('keeps the selected link type after autosave fires while the drawer is open', async ({
    page,
  }) => {
    await lexical.editor.fill('link')
    await lexical.editor.selectText()

    // Opening the drawer creates the link node, dirtying the form and scheduling
    // an autosave (interval: 2000ms) that will fire while the drawer is still open.
    const linkButton = page
      .locator('.rich-text-lexical__wrap .fixed-toolbar .toolbar-popup__button-link')
      .first()
    await linkButton.click()

    const linkDrawer = page.locator('dialog[id^=drawer_1_lexical-rich-text-link-]').first()
    await expect(linkDrawer).toBeVisible()

    // Default link type is "Custom URL" -> the URL field is shown.
    await expect(linkDrawer.locator('#field-url')).toBeVisible()

    // Switch the link type to "Internal Link". The internal-link relationship
    // field replaces the URL field, confirming the change took effect.
    const internalLinkRadio = linkDrawer.locator('.radio-input').nth(1)
    await expect(internalLinkRadio).toContainText('Internal Link')
    await internalLinkRadio.locator('.radio-input__styled-radio').click()
    await expect(linkDrawer.locator('#field-doc')).toBeVisible()
    await expect(internalLinkRadio).toHaveClass(/radio-input--is-selected/)

    // Wait for the pending autosave to fire (> interval) while the drawer is open.
    await page.waitForTimeout(3000)

    // The link type selection must survive the autosave-triggered re-render.
    await expect(internalLinkRadio).toHaveClass(/radio-input--is-selected/)
    await expect(linkDrawer.locator('#field-doc')).toBeVisible()
    await expect(linkDrawer.locator('#field-url')).toBeHidden()
  })
})
