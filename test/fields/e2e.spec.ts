import type { Locator, Page } from '@playwright/test'
import type { Where } from 'payload'

import { expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { Config } from './payload-types.js'

import { expectScreenshot } from '../__helpers/e2e/expectScreenshot.js'
import { waitForFormReady } from '../__helpers/e2e/helpers.js'
import { test } from '../__helpers/e2e/playwright.js'
import { visual } from '../__helpers/e2e/visual.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { ensureCompilationIsDone } from '../__setup/e2e/ensureCompilationIsDone.js'
import { initPage } from '../__setup/e2e/initPage.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import {
  arrayFieldsSlug,
  blockFieldsSlug,
  checkboxFieldsSlug,
  codeFieldsSlug,
  collapsibleFieldsSlug,
  dateFieldsSlug,
  emailFieldsSlug,
  groupFieldsSlug,
  jsonFieldsSlug,
  numberFieldsSlug,
  pointFieldsSlug,
  radioFieldsSlug,
  relationshipFieldsSlug,
  rowFieldsSlug,
  selectFieldsSlug,
  tabsFieldsSlug,
  textareaFieldsSlug,
  textFieldsSlug,
  uploadsSlug,
} from './slugs.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const { beforeAll, describe } = test

type CollectionSlug = keyof Config['collections']

type FieldVisualCase = {
  collectionSlug: CollectionSlug
  name: string
  screenshotName: string
  targetSelector: string
}

const fieldVisualCases: FieldVisualCase[] = [
  {
    name: 'text',
    collectionSlug: textFieldsSlug,
    screenshotName: 'text-field.png',
    targetSelector: '.field-type.text:has(#field-text)',
  },
  {
    name: 'textarea',
    collectionSlug: textareaFieldsSlug,
    screenshotName: 'textarea-field.png',
    targetSelector: '.field-type.textarea:has(#field-text)',
  },
  {
    name: 'number',
    collectionSlug: numberFieldsSlug,
    screenshotName: 'number-field.png',
    targetSelector: '.field-type.number:has(#field-number)',
  },
  {
    name: 'email',
    collectionSlug: emailFieldsSlug,
    screenshotName: 'email-field.png',
    targetSelector: '.field-type.email:has(#field-email)',
  },
  {
    name: 'checkbox',
    collectionSlug: checkboxFieldsSlug,
    screenshotName: 'checkbox-field.png',
    targetSelector: '.field-type.checkbox:has(#field-checkbox)',
  },
  {
    name: 'select',
    collectionSlug: selectFieldsSlug,
    screenshotName: 'select-field.png',
    targetSelector: '#field-select.field-type.select',
  },
  {
    name: 'radio',
    collectionSlug: radioFieldsSlug,
    screenshotName: 'radio-field.png',
    targetSelector: '.field-type.radio-group:has(#field-radio)',
  },
  {
    name: 'date',
    collectionSlug: dateFieldsSlug,
    screenshotName: 'date-field.png',
    targetSelector: '.field-type.date-time-field:has(#field-default)',
  },
  {
    name: 'code',
    collectionSlug: codeFieldsSlug,
    screenshotName: 'code-field.png',
    targetSelector: '.field-type.code-field:has(#field-javascript)',
  },
  {
    name: 'JSON',
    collectionSlug: jsonFieldsSlug,
    screenshotName: 'json-field.png',
    targetSelector: '.field-type.json-field:has(#field-json)',
  },
  {
    name: 'point',
    collectionSlug: pointFieldsSlug,
    screenshotName: 'point-field.png',
    targetSelector: '.field-type.point:has(#field-longitude-point)',
  },
  {
    name: 'relationship',
    collectionSlug: relationshipFieldsSlug,
    screenshotName: 'relationship-field.png',
    targetSelector: '#field-relationship.field-type.relationship',
  },
]

describe('Core field visual regression', () => {
  let page: Page
  let payload: PayloadTestSDK<Config>
  let serverURL: string

  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))

    const context = await browser.newContext()
    ;({ page } = await initPage({ context, serverURL }))

    await ensureCompilationIsDone({ page, serverURL })
  })

  for (const fieldVisualCase of fieldVisualCases) {
    visual(`should render the ${fieldVisualCase.name} field`, async () => {
      await navigateToFirstDocument({
        collectionSlug: fieldVisualCase.collectionSlug,
        page,
        payload,
        serverURL,
      })

      const target = page.locator(fieldVisualCase.targetSelector)

      await expect(target).toBeVisible()
      await expectScreenshot({
        name: fieldVisualCase.screenshotName,
        page,
        target,
      })
    })
  }

  visual('should render the upload field', async () => {
    await navigateToFirstDocument({
      collectionSlug: uploadsSlug,
      page,
      payload,
      serverURL,
      where: {
        media: {
          exists: true,
        },
      },
    })

    const target = page.locator('#field-media.field-type.upload')

    await expect(target).toBeVisible()
    await expectScreenshot({ name: 'upload-field.png', page, target })
  })

  visual('should render the array field', async () => {
    await navigateToFirstDocument({
      collectionSlug: arrayFieldsSlug,
      page,
      payload,
      serverURL,
    })

    const target = page.locator('#field-items.field-type.array-field')
    const expandedRows = target.locator('button.collapsible__toggle--open:visible')

    await target.getByRole('button', { name: 'Collapse All: Items' }).click()
    await expect(expandedRows).toHaveCount(0)
    await expect(target.locator('.array-field__row')).toHaveCount(6)
    await expectScreenshot({ name: 'array-field.png', page, target })
  })

  visual('should render the blocks field', async () => {
    await navigateToFirstDocument({
      collectionSlug: blockFieldsSlug,
      page,
      payload,
      serverURL,
    })

    const target = page.locator('#field-blocks.field-type.blocks-field')

    await collapseExpandedRows({
      target,
      toggleSelector:
        ':scope > .blocks-field__rows > div > .collapsible > .collapsible__toggle-wrap > .collapsible__toggle--open',
    })
    await expect(
      target.locator(':scope > .blocks-field__rows > div > .blocks-field__row'),
    ).toHaveCount(4)
    await expectScreenshot({ name: 'blocks-field.png', page, target })
  })

  visual('should render the group field', async () => {
    await navigateToFirstDocument({
      collectionSlug: groupFieldsSlug,
      page,
      payload,
      serverURL,
    })

    const target = page.locator('#field-group.field-type.group-field')

    await collapseExpandedRows({ target })
    await expect(target).toBeVisible()
    await expectScreenshot({ name: 'group-field.png', page, target })
  })

  visual('should render the row field', async () => {
    const rowFieldsURL = new AdminUrlUtil(serverURL, rowFieldsSlug)

    await page.goto(rowFieldsURL.create)
    await waitForFormReady(page)

    const target = page.locator('.field-type.row:has(#field-field_with_width_a)')

    await expect(target).toBeVisible()
    await expectScreenshot({ name: 'row-field.png', page, target })
  })

  visual('should render the collapsible field', async () => {
    await navigateToFirstDocument({
      collectionSlug: collapsibleFieldsSlug,
      page,
      payload,
      serverURL,
    })

    const target = page.locator('.field-type.collapsible-field:has(#field-text)').first()

    await expect(target).toBeVisible()
    await expectScreenshot({ name: 'collapsible-field.png', page, target })
  })

  visual('should render the tabs field', async () => {
    await navigateToFirstDocument({
      collectionSlug: tabsFieldsSlug,
      page,
      payload,
      serverURL,
    })

    const target = page.locator('.field-type.tabs-field').first()

    await collapseExpandedRows({ target })
    await expect(target.locator('.tabs-field__tab-button')).toHaveCount(11)
    await expectScreenshot({ name: 'tabs-field.png', page, target })
  })
})

async function navigateToFirstDocument<TCollectionSlug extends CollectionSlug>({
  collectionSlug,
  page,
  payload,
  serverURL,
  where,
}: {
  collectionSlug: TCollectionSlug
  page: Page
  payload: PayloadTestSDK<Config>
  serverURL: string
  where?: Where
}): Promise<void> {
  const { docs } = await payload.find({
    collection: collectionSlug,
    limit: 1,
    overrideAccess: true,
    sort: 'createdAt',
    where,
  })
  const [document] = docs

  if (!document) {
    throw new Error(`Expected a seeded document in ${String(collectionSlug)}`)
  }

  const collectionURL = new AdminUrlUtil(serverURL, String(collectionSlug))

  await page.goto(collectionURL.edit(document.id))
  await waitForFormReady(page)
}

async function collapseExpandedRows({
  target,
  toggleSelector = 'button.collapsible__toggle--open:visible',
}: {
  target: Locator
  toggleSelector?: string
}): Promise<void> {
  const expandedRowToggles = target.locator(toggleSelector)

  while ((await expandedRowToggles.count()) > 0) {
    await expandedRowToggles.first().click({ force: true })
  }
}
