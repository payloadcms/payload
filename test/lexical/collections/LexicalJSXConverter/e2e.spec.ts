import type { Locator, Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { AdminUrlUtil } from '../../../helpers/shared/adminUrlUtil.js'
import { reInitializeDB } from 'helpers/shared/clearAndSeed/reInitializeDB.js'
import { lexicalJSXConverterSlug } from 'lexical/slugs.js'
import path from 'path'
import { fileURLToPath } from 'url'

import { ensureCompilationIsDone } from '../../../__helpers/e2e/helpers.js'
import { initPayloadE2ENoConfig } from '../../../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { LexicalHelpers } from '../utils.js'
const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, beforeEach, describe } = test

// Unlike other suites, this one runs in parallel, as they run on the `/create` URL and are "pure" tests
// PLEASE do not reset the database or perform any operations that modify it in this file.
// TODO: Enable parallel mode again when ensureCompilationIsDone is extracted into a playwright hook. Otherwise,
// it runs multiple times in parallel, for each single test, which causes the tests to fail occasionally in CI.
// test.describe.configure({ mode: 'parallel' })

const { serverURL } = await initPayloadE2ENoConfig({
  dirname,
})

describe('Lexical JSX Converter', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    const page = await browser.newPage()
    await ensureCompilationIsDone({ page, serverURL })
    await page.close()
  })
  beforeEach(async ({ page }) => {
    const url = new AdminUrlUtil(serverURL, lexicalJSXConverterSlug)
    const lexical = new LexicalHelpers(page)
    await page.goto(url.create)
    await lexical.editor.first().focus()
  })

  // See rationale in https://github.com/payloadcms/payload/issues/13130#issuecomment-3058348085
  test('indents should be 40px in the editor and in the jsx converter', async ({ page }) => {
    const lexical = new LexicalHelpers(page)
    // 40px
    await lexical.addLine('ordered', 'HelloA0', 1, false)
    await lexical.addLine('paragraph', 'HelloA1', 1)
    await lexical.addLine('unordered', 'HelloA2', 1)
    await lexical.addLine('h1', 'HelloA3', 1)
    await lexical.addLine('check', 'HelloA4', 1)

    // 80px
    await lexical.addLine('ordered', 'HelloB0', 2)
    await lexical.addLine('paragraph', 'HelloB1', 2)
    await lexical.addLine('unordered', 'HelloB2', 2)
    await lexical.addLine('h1', 'HelloB3', 2)
    await lexical.addLine('check', 'HelloB4', 2)

    const [offsetA0_ed, offsetA0_jsx] = await getIndentOffset(page, 'HelloA0')
    const [offsetA1_ed, offsetA1_jsx] = await getIndentOffset(page, 'HelloA1')
    const [offsetA2_ed, offsetA2_jsx] = await getIndentOffset(page, 'HelloA2')
    const [offsetA3_ed, offsetA3_jsx] = await getIndentOffset(page, 'HelloA3')
    const [offsetA4_ed, offsetA4_jsx] = await getIndentOffset(page, 'HelloA4')

    const [offsetB0_ed, offsetB0_jsx] = await getIndentOffset(page, 'HelloB0')
    const [offsetB1_ed, offsetB1_jsx] = await getIndentOffset(page, 'HelloB1')
    const [offsetB2_ed, offsetB2_jsx] = await getIndentOffset(page, 'HelloB2')
    const [offsetB3_ed, offsetB3_jsx] = await getIndentOffset(page, 'HelloB3')
    const [offsetB4_ed, offsetB4_jsx] = await getIndentOffset(page, 'HelloB4')

    await expect(() => {
      expect(offsetA0_ed).toBe(offsetB0_ed - 40)
      expect(offsetA1_ed).toBe(offsetB1_ed - 40)
      expect(offsetA2_ed).toBe(offsetB2_ed - 40)
      expect(offsetA3_ed).toBe(offsetB3_ed - 40)
      expect(offsetA4_ed).toBe(offsetB4_ed - 40)
      expect(offsetA0_jsx).toBe(offsetB0_jsx - 40)
      expect(offsetA1_jsx).toBe(offsetB1_jsx - 40)
      expect(offsetA2_jsx).toBe(offsetB2_jsx - 40)
      expect(offsetA3_jsx).toBe(offsetB3_jsx - 40)
      // TODO: Checklist item in JSX needs more thought
      // expect(offsetA4_jsx).toBe(offsetB4_jsx - 40)
    }).toPass()

    // HTML in JSX converter should contain as few inline styles as possible
    await expect(async () => {
      const innerHTML = await page.locator('.payload-richtext').innerHTML()
      const normalized = normalizeCheckboxUUIDs(innerHTML)
      expect(normalized).toBe(
        `<ol class="list-number"><li class="" value="1">HelloA0</li></ol><p style="padding-inline-start: 40px;">HelloA1</p><ul class="list-bullet"><li class="" value="1">HelloA2</li></ul><h1 style="padding-inline-start: 40px;">HelloA3</h1><ol class="list-number"><li class="" value="1">HelloA4</li><li class="nestedListItem" value="2" style="list-style-type: none;"><ol class="list-number"><li class="" value="1">HelloB0</li></ol></li></ol><p style="padding-inline-start: 80px;">HelloB1</p><ul class="list-bullet"><li class="nestedListItem" value="1" style="list-style-type: none;"><ul class="list-bullet"><li class="" value="1">HelloB2</li></ul></li></ul><h1 style="padding-inline-start: 80px;">HelloB3</h1><ul class="list-check"><li aria-checked="false" class="list-item-checkbox list-item-checkbox-unchecked nestedListItem" role="checkbox" tabindex="-1" value="1" style="list-style-type: none;"><ul class="list-check"><li aria-checked="false" class="list-item-checkbox list-item-checkbox-unchecked" role="checkbox" tabindex="-1" value="1" style="list-style-type: none;"><input id="DETERMINISTIC_UUID" readonly="" type="checkbox"><label for="DETERMINISTIC_UUID">HelloB4</label><br></li></ul></li></ul>`,
      )
    }).toPass()
  })
})

async function getIndentOffset(page: Page, text: string): Promise<[number, number]> {
  const textElement = page.getByText(text)
  await expect(textElement).toHaveCount(2)
  const startLeft = (locator: Locator) =>
    locator.evaluate((el) => {
      const leftRect = el.getBoundingClientRect().left
      const paddingLeft = getComputedStyle(el).paddingLeft
      return leftRect + parseFloat(paddingLeft)
    })
  return [await startLeft(textElement.first()), await startLeft(textElement.last())]
}

function normalizeCheckboxUUIDs(html: string): string {
  return html
    .replace(/id="[a-f0-9-]{36}"/g, 'id="DETERMINISTIC_UUID"')
    .replace(/for="[a-f0-9-]{36}"/g, 'for="DETERMINISTIC_UUID"')
}
