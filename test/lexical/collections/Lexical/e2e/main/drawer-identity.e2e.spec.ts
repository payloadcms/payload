import type { Page, Request } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { PayloadTestSDK } from '../../../../../__helpers/shared/sdk/index.js'
import type { Config } from '../../../../payload-types.js'

import {
  saveDocAndAssert,
  waitForFormReady,
  waitForLexicalReady,
} from '../../../../../__helpers/e2e/helpers.js'
import { currentFramework } from '../../../../../__helpers/e2e/playwright.js'
import { AdminUrlUtil } from '../../../../../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../../../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../../../../../__setup/e2e/initPage.js'
import { lexicalFieldsSlug } from '../../../../slugs.js'

const dirname = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../')

test.describe('Lexical drawer request identity', () => {
  let payload: PayloadTestSDK<Config>
  let serverURL: string
  const releases = new Set<() => void>()

  test.beforeAll(async () => {
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))
  })

  test.afterEach(async ({ page }) => {
    releases.forEach((release) => release())
    releases.clear()
    if (!page.isClosed()) {
      await page.unrouteAll({ behavior: 'ignoreErrors' })
    }
  })

  test('should finish saving a link when document permissions refresh during drawer validation', async ({
    page,
  }) => {
    const editorState = {
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: 'Link',
                version: 1,
              },
            ],
            direction: null,
            format: '',
            indent: 0,
            textFormat: 0,
            textStyle: '',
            version: 1,
          },
        ],
        direction: null,
        format: '',
        indent: 0,
        version: 1,
      },
    }

    const doc = await payload.create({
      collection: lexicalFieldsSlug,
      data: {
        lexicalRootEditor: editorState,
        lexicalWithBlocks: editorState,
        title: 'Drawer identity',
      },
      overrideAccess: true,
    })

    expect(doc.id).toBeDefined()

    try {
      await initPage({ page, serverURL })
      await page.goto(new AdminUrlUtil(serverURL, lexicalFieldsSlug).edit(doc.id))
      await waitForFormReady(page)

      const richText = page.locator('.rich-text-lexical[data-field-path="lexicalRootEditor"]')

      await waitForLexicalReady(richText)

      const permissions = Promise.withResolvers<void>()
      const permissionsCaptured = Promise.withResolvers<void>()

      releases.add(permissions.resolve)
      let isFirstPermission = true

      await page.route(`**/api/${lexicalFieldsSlug}/access/${doc.id}**`, async (route) => {
        const response = await route.fetch()

        if (!isFirstPermission) {
          return route.fulfill({ response })
        }

        isFirstPermission = false
        const json = await response.json()

        json.fields.title = { ...json.fields.title, read: true, update: false }
        permissionsCaptured.resolve()
        await permissions.promise
        await route.fulfill({ json, response })
      })

      await page.locator('#field-title').fill('Saved drawer identity')
      await saveDocAndAssert(page)
      await permissionsCaptured.promise
      await expect(page.locator('#field-title')).toBeEnabled()
      await richText.locator('.LexicalEditorTheme__paragraph').first().click()
      await page.keyboard.press('End')

      for (let index = 0; index < 4; index++) {
        await page.keyboard.press('Shift+ArrowLeft')
      }

      await page.locator('.inline-toolbar-popup .toolbar-popup__button-link').click()

      const drawer = page.locator('dialog[id^="drawer_1_lexical-rich-text-link-"]').first()
      const linkURL = 'https://example.com/drawer-identity'
      let hasChanged = false
      const changed = page
        .waitForResponse(
          (response) =>
            isDrawerState(response.request(), page) &&
            Boolean(response.request().postData()?.includes(linkURL)),
        )
        .then(() => {
          hasChanged = true
        })

      await expect(drawer).toBeVisible()
      await expect(async () => {
        await drawer.locator('#field-url').fill(linkURL)
        await expect.poll(() => hasChanged, { timeout: 1000 }).toBe(true)
      }).toPass({ timeout: 10000 })
      await changed

      const validation = Promise.withResolvers<void>()
      const validationCaptured = Promise.withResolvers<void>()

      releases.add(validation.resolve)
      await page.route('**/*', async (route) => {
        if (!isDrawerState(route.request(), page)) {
          return route.fallback()
        }

        const response = await route.fetch()

        validationCaptured.resolve()
        await validation.promise
        await route.fulfill({ response })
      })

      await drawer.getByRole('button', { name: 'Save changes', exact: true }).click()
      await validationCaptured.promise
      const permissionResponse = page.waitForResponse(
        (response) => response.request().method() === 'POST' && response.url().includes('/access/'),
      )
      permissions.resolve()
      await permissionResponse
      await expect(page.locator('#field-title')).not.toBeEditable()
      validation.resolve()
      await expect(drawer).toBeHidden()
      await expect(richText.locator(`[data-lexical-editor] a[href="${linkURL}"]`)).toHaveText(
        'Link',
      )
    } finally {
      releases.forEach((release) => release())
      if (!page.isClosed()) {
        await page.unrouteAll({ behavior: 'ignoreErrors' })
      }
      await payload.delete({ id: doc.id, collection: lexicalFieldsSlug })
    }
  })
})

function isDrawerState(request: Request, page: Page) {
  return (
    request.method() === 'POST' &&
    (currentFramework === 'tanstack-start'
      ? request.url().includes('/_serverFn/')
      : request.url() === page.url()) &&
    Boolean(request.postData()?.includes('lexical_internal_feature.link'))
  )
}
