import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../__helpers/shared/sdk/index.js'
import type { Config } from '../../payload-types.js'

import { ensureCompilationIsDone } from '../../../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../../../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { lexicalSlugFieldNameCollisionSlug } from '../../slugs.js'
import { LexicalHelpers } from '../utils.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

let payload: PayloadTestSDK<Config>
let serverURL: string

const { beforeAll, beforeEach, describe } = test

// Repro: dropping an image mounts two bulk upload drawers for the same slug,
// one blank, when a top-level rich text field name equals the collection slug.
describe('Lexical: collection slug equals top-level field name', () => {
  let lexical: LexicalHelpers

  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false'
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))

    const page = await browser.newPage()
    await ensureCompilationIsDone({ page, serverURL })
    await page.close()
  })

  beforeEach(async ({ page }) => {
    const url = new AdminUrlUtil(serverURL, lexicalSlugFieldNameCollisionSlug)
    lexical = new LexicalHelpers(page)
    await page.goto(url.create)
    await lexical.editor.first().focus()
  })

  test('drag/drop image opens exactly one bulk upload drawer when a field name matches the collection slug', async ({
    page,
  }) => {
    const filePath = path.resolve(dirname, './collections/Upload/payload.jpg')

    await lexical.dropFile({ filePath })

    await expect(page.locator('.bulk-upload--actions-bar')).toBeVisible()

    // Two providers compute the same drawer slug and both mount a drawer; the
    // empty one is what the user sees as the blank drawer. Should be exactly 1.
    const bulkDrawers = page.locator(
      'dialog[aria-label*="bulk-upload-drawer-slug"][open], dialog[id*="bulk-upload-drawer-slug"][open]',
    )
    await expect(bulkDrawers).toHaveCount(1)
  })
})
