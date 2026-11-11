import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { Config } from './payload-types.js'

import { openNav } from '../__helpers/e2e/toggleNav.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../__setup/e2e/initPage.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { branchesSlug, foldersSlug, tagsSlug } from './shared.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

let payload: PayloadTestSDK<Config>
let serverURL: string

async function switchBranch({ name, page }: { name: string; page: Page }) {
  await page.locator('.branch-selector__trigger').click()
  await page.locator('.branch-selector__popup .combobox__entry', { hasText: name }).click()
  await expect(page.locator('.branch-selector__trigger-name')).toHaveText(name)
}

test.describe('Branching hierarchy sidebar', () => {
  test.beforeAll(async () => {
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))
  })

  for (const { collection, label, parentField } of [
    { collection: foldersSlug, label: 'Folders', parentField: 'folder' },
    { collection: tagsSlug, label: 'Tags', parentField: '_h_tags' },
  ] as const) {
    test(`should update the ${label} sidebar when switching branches without refreshing`, async ({
      page,
    }, testInfo) => {
      testInfo.setTimeout(TEST_TIMEOUT_LONG)

      const branch = await payload.create({
        collection: branchesSlug,
        data: { name: `hierarchy-${collection}` },
      })
      const createdIDs: string[] = []

      try {
        const root = await payload.create({
          collection,
          data: { name: 'Main root' },
        })

        createdIDs.push(root.id)

        const child = await payload.create({
          collection,
          data: { name: 'Main child', [parentField]: root.id },
        })

        createdIDs.push(child.id)

        await payload.update({
          id: root.id,
          branch: branch.name,
          collection,
          data: { name: 'Branch root' },
        })
        await payload.update({
          id: child.id,
          branch: branch.name,
          collection,
          data: { name: 'Branch child' },
        })
        await payload.create({
          branch: branch.name,
          collection,
          data: { name: 'Branch-only root' },
        })

        await initPage({ page, serverURL })
        await page.goto(`${serverURL}/admin/collections/${collection}`)
        await openNav(page)
        await page.getByRole('tab', { name: label, exact: true }).click()

        const tree = page.getByRole('tabpanel').filter({ visible: true }).getByRole('tree')
        const mainRoot = tree.getByRole('treeitem', { name: 'Main root', exact: true })

        await expect(mainRoot).toBeVisible()
        await mainRoot.getByRole('button', { name: 'Open Main root', exact: true }).click()
        await expect(tree.getByRole('treeitem', { name: 'Main child', exact: true })).toBeVisible()

        await switchBranch({ name: branch.name, page })
        await expect(page).toHaveURL((url) => url.searchParams.get('branch') === branch.name)
        await expect(tree.getByRole('treeitem', { name: 'Branch root', exact: true })).toBeVisible()
        await expect(
          tree.getByRole('treeitem', { name: 'Branch child', exact: true }),
        ).toBeVisible()
        await expect(
          tree.getByRole('treeitem', { name: 'Branch-only root', exact: true }),
        ).toBeVisible()
        await expect(mainRoot).toHaveCount(0)
        await expect(tree.getByRole('treeitem', { name: 'Main child', exact: true })).toHaveCount(0)

        await switchBranch({ name: 'main', page })
        await expect(mainRoot).toBeVisible()
        await expect(tree.getByRole('treeitem', { name: 'Main child', exact: true })).toBeVisible()
        await expect(
          tree.getByRole('treeitem', { name: 'Branch-only root', exact: true }),
        ).toHaveCount(0)
        await expect(tree.getByRole('treeitem', { name: 'Branch root', exact: true })).toHaveCount(
          0,
        )
      } finally {
        await page.close()
        await payload.delete({ id: branch.id, collection: branchesSlug })

        for (const id of createdIDs.reverse()) {
          await payload.delete({ id, collection, branch: 'main' })
        }
      }
    })
  }
})
