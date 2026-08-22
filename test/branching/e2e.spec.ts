import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { Config } from './payload-types.js'

import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../__setup/e2e/initPage.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import {
  branchChangesSlug,
  branchMergesSlug,
  headerGlobalSlug,
  pagesSlug,
  postsSlug,
} from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/** Seeded by the suite's `onInit`. */
const branchName = 'Halloween Updates'
const branchSlug = 'halloween-updates'

let payload: PayloadTestSDK<Config>
let serverURL: string

/**
 * Switches the admin panel onto a branch through the header switcher, and waits
 * for the preference write the server reads the branch back from.
 *
 * Returns early when the panel is already on `name`: selecting the active branch
 * is a no-op in the provider, so waiting for a preference write there would hang
 * until the test timed out.
 */
async function switchBranch({ name, page }: { name: string; page: Page }): Promise<void> {
  const label = page.locator('.branch-selector__trigger-name')
  await expect(label).toBeVisible()

  if ((await label.innerText()) === name) {
    return
  }

  await page.locator('.branch-selector__trigger').click()

  const preferenceUpdate = page.waitForResponse(
    (response) =>
      response.url().includes('/api/payload-preferences/admin') &&
      response.request().method() === 'POST' &&
      response.ok(),
  )

  await page.locator('.branch-selector__popup .combobox__entry', { hasText: name }).first().click()
  await preferenceUpdate

  await expect(label).toHaveText(name)
}

test.describe('Branching', () => {
  let page: Page
  let pagesURL: AdminUrlUtil
  let postsURL: AdminUrlUtil

  async function gotoBranchView() {
    const branch = await payload.find({
      collection: 'payload-branches',
      pagination: false,
      where: { slug: { equals: branchSlug } },
    })

    await page.goto(`${serverURL}/admin/collections/payload-branches/${branch.docs[0]!.id}`)
  }

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    const { payload: payloadFromInit, serverURL: serverFromInit } =
      await initPayloadE2ENoConfig<Config>({ dirname })

    payload = payloadFromInit
    serverURL = serverFromInit
    pagesURL = new AdminUrlUtil(serverURL, pagesSlug)
    postsURL = new AdminUrlUtil(serverURL, postsSlug)

    const context = await browser.newContext()
    ;({ page } = await initPage({ context, serverURL }))
  })

  test.afterEach(async () => {
    // Shadow rows are addressed by their real primary key, so these deletes
    // bypass branch resolution rather than writing tombstones.
    const posts = await payload.find({ branch: false, collection: postsSlug, pagination: false })

    for (const post of posts.docs) {
      await payload.delete({ id: post.id, branch: false, collection: postsSlug }).catch(() => {})
    }

    const changes = await payload.find({ collection: branchChangesSlug, pagination: false })

    for (const change of changes.docs) {
      await payload.delete({ id: change.id, collection: branchChangesSlug }).catch(() => {})
    }

    // The ledger is append-only and survives the branch being reset to `open`, so
    // without this a merge in one test puts a "last merged on…" line in every test
    // after it.
    const merges = await payload.find({ collection: branchMergesSlug, pagination: false })

    for (const merge of merges.docs) {
      await payload.delete({ id: merge.id, collection: branchMergesSlug }).catch(() => {})
    }

    // Reset the stored selection server-side rather than clicking back to main:
    // the panel is sometimes already on main, where a UI switch does nothing.
    const preferences = await payload.find({
      collection: 'payload-preferences',
      pagination: false,
      where: { key: { equals: 'admin' } },
    })

    for (const preference of preferences.docs) {
      await payload.delete({ id: preference.id, collection: 'payload-preferences' }).catch(() => {})
    }
  })

  test.describe('Canonical document identity', () => {
    test('should keep the main document ID after editing the document on a branch', async () => {
      const post = await payload.create({
        collection: postsSlug,
        data: { title: 'Autumn Sale' },
      })

      await page.goto(postsURL.list)
      await switchBranch({ name: branchName, page })

      await page.goto(postsURL.edit(post.id))
      await page.locator('#field-title').fill('Halloween Sale')
      await page.locator('#action-save').click()
      await expect(page.locator('.payload-toast-item')).toContainText('Updated successfully')

      // The edit view stays on the canonical ID rather than hopping to the
      // shadow row's primary key.
      expect(page.url()).toContain(String(post.id))

      await page.goto(postsURL.list)

      const row = page.locator('.table .row-1')
      await expect(row.locator('.cell-title')).toContainText('Halloween Sale')

      // The row links to the canonical ID, not to the shadow row that holds the
      // branch's copy of the document.
      await expect(row.locator('a').first()).toHaveAttribute(
        'href',
        new RegExp(`/${postsSlug}/${post.id}$`),
      )
    })

    test('should open the edit view of a document edited on a branch', async () => {
      const post = await payload.create({
        collection: postsSlug,
        data: { title: 'Autumn Sale' },
      })

      await payload.update({
        id: post.id,
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'Halloween Sale' },
      })

      await page.goto(postsURL.list)
      await switchBranch({ name: branchName, page })

      await page.locator('.table .row-1 a').first().click()

      // A shadow-row ID in the list link used to send the edit view looking for a
      // document that no ID resolves to. That redirects back to the list with a
      // "could not be found" banner rather than erroring in place, so the absence
      // of the banner is the assertion that matters here.
      await expect(page.locator('.list-view__not-found-banner')).toBeHidden()
      await expect(page.locator('#field-title')).toHaveValue('Halloween Sale')
      expect(page.url()).toContain(String(post.id))
    })

    test('should show main content for the same ID after switching back to main', async () => {
      const post = await payload.create({
        collection: postsSlug,
        data: { title: 'Autumn Sale' },
      })

      await payload.update({
        id: post.id,
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'Halloween Sale' },
      })

      await page.goto(postsURL.list)
      await switchBranch({ name: branchName, page })
      await expect(page.locator('.table .row-1 .cell-title')).toContainText('Halloween Sale')

      await switchBranch({ name: 'main', page })

      await expect(page.locator('.table .row-1 .cell-title')).toContainText('Autumn Sale')
      await expect(page.locator('.table .row-1 .cell-title a')).toHaveAttribute(
        'href',
        new RegExp(`/${postsSlug}/${post.id}$`),
      )
    })
  })

  test.describe('Changed documents', () => {
    /** Everything a branch can do to a document, in one branch. */
    async function seedChanges() {
      const [updated, doomed] = await Promise.all([
        payload.create({ collection: postsSlug, data: { order: 1, title: 'Autumn Sale' } }),
        payload.create({ collection: postsSlug, data: { title: 'Doomed Post' } }),
      ])

      await payload.update({
        id: updated.id,
        branch: branchSlug,
        collection: postsSlug,
        data: { order: 99, title: 'Halloween Sale' },
      })

      await payload.delete({ id: doomed.id, branch: branchSlug, collection: postsSlug })

      const created = await payload.create({
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'Spooky Exclusive' },
      })

      return { created, doomed, updated }
    }

    test('should name the view in the trail only when it is not the branch default', async () => {
      await gotoBranchView()

      // Scoped past the hidden copy of the trail that StepNav keeps for measuring
      // how much of it fits.
      const crumbs = page.locator('.app-header__step-nav > .step-nav__item')

      // The branch opens to its changed documents, so naming that view would
      // repeat the branch crumb directly beside it.
      await expect(crumbs).toHaveText(['Dashboard', 'Branches', branchName])

      await page.locator('.doc-tab').last().click()

      // Scoped to the view: the create-branch modal keeps a `name` field of its
      // own mounted in the header.
      await expect(page.locator('.collection-edit #field-name')).toBeVisible()
      await expect(crumbs).toHaveText(['Dashboard', 'Branches', branchName, 'Edit'])

      // The branch crumb goes back to what the branch opens to.
      await crumbs.filter({ hasText: branchName }).click()
      await expect(page.locator('.changed-docs, .branch-changes__empty')).toBeVisible()
      await expect(crumbs).toHaveText(['Dashboard', 'Branches', branchName])
    })

    test('should list every changed document with its operation, selected by default', async () => {
      await seedChanges()
      await gotoBranchView()

      const rows = page.locator('.changed-docs__row')
      await expect(rows).toHaveCount(3)

      const rowFor = (title: string) => rows.filter({ hasText: title })

      await expect(rowFor('Halloween Sale').locator('.changed-docs__operation')).toContainText(
        'Updated',
      )
      await expect(rowFor('Spooky Exclusive').locator('.changed-docs__operation')).toContainText(
        'Created',
      )
      await expect(rowFor('Doomed Post').locator('.changed-docs__operation')).toContainText(
        'Deleted',
      )

      // Merging the whole branch is the common intent, so the work left to the
      // user is deselecting exceptions rather than selecting the rule.
      const checkboxes = page.locator('.changed-docs__row input[type="checkbox"]')

      for (let i = 0; i < 3; i++) {
        await expect(checkboxes.nth(i)).toBeChecked()
      }
    })

    test('should render only the changed fields when a document is expanded', async () => {
      await seedChanges()
      await gotoBranchView()

      const row = page.locator('.changed-docs__row').filter({ hasText: 'Halloween Sale' })
      await row.locator('.changed-docs__toggle').click()

      const diff = row.locator('.changed-docs__diff')
      await expect(diff.locator('.field-diff-label', { hasText: 'Title' })).toBeVisible()
      await expect(diff.locator('.field-diff-label', { hasText: 'Order' })).toBeVisible()

      // Both sides of the change, from main and from the branch.
      await expect(diff).toContainText('Autumn')
      await expect(diff).toContainText('Hallowee')

      // `updatedAt` differs on every branched document, so it is excluded rather
      // than shown as the one row present in every diff.
      await expect(diff.locator('.field-diff-label', { hasText: 'Updated At' })).toBeHidden()
    })

    test('should expand from anywhere in the row without the checkbox toggling it', async () => {
      await seedChanges()
      await gotoBranchView()

      const row = page.locator('.changed-docs__row').filter({ hasText: 'Halloween Sale' })
      const toggle = row.locator('.changed-docs__toggle')

      // Anywhere in the header, not just the chevron. The overlay covering the
      // header is what the click lands on.
      await row.locator('.changed-docs__header').click({ position: { x: 300, y: 12 } })
      await expect(toggle).toHaveAttribute('aria-expanded', 'true')
      await expect(row.locator('.changed-docs__diff')).toBeVisible()

      const collapsed = page.locator('.changed-docs__row').filter({ hasText: 'Spooky Exclusive' })

      await collapsed.locator('input[type="checkbox"]').uncheck()
      await expect(collapsed.locator('.changed-docs__toggle')).toHaveAttribute(
        'aria-expanded',
        'false',
      )
    })

    test('should offer the active branch its own actions at the top of the switcher', async () => {
      await gotoBranchView()
      await switchBranch({ name: branchName, page })
      await page.locator('.branch-selector__trigger').click()

      const current = page.locator('.branch-selector__current')
      await expect(current).toContainText(branchName)

      // The name itself is the way into the manage view, so there is no separate
      // "Manage" link beside it — only the merge action.
      const branch = await payload.find({
        collection: 'payload-branches',
        pagination: false,
        where: { slug: { equals: branchSlug } },
      })

      await expect(current.locator('a')).toHaveAttribute(
        'href',
        new RegExp(`/payload-branches/${branch.docs[0]!.id}$`),
      )
      await expect(current.locator('.btn')).toContainText('Merge')

      // Pinned above the list, and no longer offered as somewhere to switch to.
      await expect(
        page.locator('.branch-selector__popup .combobox__entry', { hasText: branchName }),
      ).toHaveCount(0)
      await expect(
        page.locator('.branch-selector__popup .combobox__entry', { hasText: 'main' }),
      ).toHaveCount(1)
    })

    test('should not render branch slugs anywhere in the switcher', async () => {
      await gotoBranchView()
      await switchBranch({ name: branchName, page })
      await page.locator('.branch-selector__trigger').click()

      // Searchable but not shown: the slug restates the name in kebab-case.
      await expect(page.locator('.branch-selector__popup')).not.toContainText(branchSlug)
      await expect(page.locator('.branch-selector__current')).not.toContainText(branchSlug)
    })

    test('should lead each row with its operation', async () => {
      await seedChanges()
      await gotoBranchView()

      const row = page.locator('.changed-docs__row').filter({ hasText: 'Spooky Exclusive' })
      const content = row.locator('.changed-docs__header-content')

      // Operation, then entity, then title — the row reads as a sentence, and a
      // long changeset can be scanned down one column of verbs.
      await expect(content.locator('.pill').first()).toContainText('Created')
      await expect(content.locator('.pill').nth(1)).toContainText('Post')
    })

    test('should deselect a single document without affecting the others', async () => {
      await seedChanges()
      await gotoBranchView()

      const rows = page.locator('.changed-docs__row')
      await expect(rows).toHaveCount(3)

      await rows.first().locator('input[type="checkbox"]').uncheck()

      await expect(rows.first().locator('input[type="checkbox"]')).not.toBeChecked()
      await expect(rows.nth(1).locator('input[type="checkbox"]')).toBeChecked()
      await expect(rows.nth(2).locator('input[type="checkbox"]')).toBeChecked()
    })
  })

  test.describe('Merging from the panel', () => {
    // Emptying a branch's changeset marks it merged, which drops it from the
    // switcher — and every later test that switches onto the seeded branch would
    // then hang waiting for a branch that is no longer listed.
    test.afterEach(async () => {
      const branch = await payload.find({
        collection: 'payload-branches',
        pagination: false,
        where: { slug: { equals: branchSlug } },
      })

      if (branch.docs[0]?.status !== 'open') {
        await payload.update({
          id: branch.docs[0]!.id,
          collection: 'payload-branches',
          data: { mergedAt: null, status: 'open' },
        })
      }
    })

    // Discard sits beside merge in the same bar, so the merge button is named by
    // its style rather than by being the only one there.
    async function openMergeModal() {
      await page.locator('.branch-changes__actions .btn--style-primary').click()

      await expect(page.locator('.merge-branch-modal')).toBeVisible()
    }

    /** Clicked by label rather than id, which the radio derives from edit depth. */
    const mergeMode = (label: string) =>
      page.locator('.merge-branch-modal__modes label').filter({ hasText: label })

    test('should require a date before a merge can be scheduled', async () => {
      await payload.create({ branch: branchSlug, collection: postsSlug, data: { title: 'Treat' } })
      await gotoBranchView()
      await openMergeModal()

      const confirm = page.locator('.merge-branch-modal .btn--style-primary')

      await expect(confirm).toBeEnabled()

      await mergeMode('Schedule merge').click()

      // A schedule with no date is not a decision yet.
      await expect(page.locator('.merge-branch-modal__schedule')).toBeVisible()
      await expect(confirm).toBeDisabled()
      await expect(confirm).toContainText('Schedule merge')

      await mergeMode('Merge now').click()
      await expect(confirm).toBeEnabled()
      await expect(confirm).toContainText('Merge')
    })

    test('should queue a job when a merge is scheduled', async () => {
      const post = await payload.create({
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'Treat' },
      })

      await gotoBranchView()
      await openMergeModal()
      await mergeMode('Schedule merge').click()

      // The picker writes through its text input, which is the stable handle.
      await page.locator('.merge-branch-modal__schedule input').first().fill('12/31/2030 9:00 AM')
      await page.locator('.merge-branch-modal__schedule input').first().press('Enter')

      await page.locator('.merge-branch-modal .btn--style-primary').click()
      await expect(page.locator('.payload-toast-item')).toContainText('scheduled')

      const jobs = await payload.find({
        collection: 'payload-jobs',
        pagination: false,
        where: { taskSlug: { equals: 'scheduleMerge' } },
      })

      expect(jobs.docs).toHaveLength(1)
      expect((jobs.docs[0]!.input as { branch?: string })?.branch).toBe(branchSlug)

      // Queued, not applied: the branch still holds its change.
      const onMain = await payload.find({
        collection: postsSlug,
        pagination: false,
        where: { id: { equals: post.id } },
      })

      expect(onMain.docs).toHaveLength(0)

      for (const job of jobs.docs) {
        await payload.delete({ id: job.id, collection: 'payload-jobs' })
      }
    })

    test('should state how many documents the branch changed', async () => {
      await payload.create({ branch: branchSlug, collection: postsSlug, data: { title: 'Treat' } })
      await payload.create({ branch: branchSlug, collection: postsSlug, data: { title: 'Trick' } })

      await gotoBranchView()
      await openMergeModal()

      const summary = page.locator('.merge-branch-modal__summary')

      await expect(summary).toContainText('2')

      // The ledger says what the count is made of, by collection and by operation.
      const ledger = page.locator('.merge-branch-modal .change-summary')

      await expect(ledger).toContainText('2 Posts')
      await expect(ledger.locator('.change-summary__operations')).toContainText('2 Created')

      // Already on the page that offers the choice, so no link back to it.
      await expect(page.locator('.merge-branch-modal__review')).toHaveCount(0)
    })

    test('should describe the merge by collection when the changes span several', async () => {
      await payload.create({ branch: branchSlug, collection: postsSlug, data: { title: 'Treat' } })
      await payload.create({ branch: branchSlug, collection: postsSlug, data: { title: 'Trick' } })

      const page1 = await payload.create({ collection: pagesSlug, data: { title: 'About' } })

      await payload.update({
        id: page1.id,
        branch: branchSlug,
        collection: pagesSlug,
        data: { title: 'About us' },
      })

      await gotoBranchView()
      await openMergeModal()

      // Biggest group first, joined by the locale's own conjunction rather than a
      // hand-built ", and".
      await expect(page.locator('.merge-branch-modal .change-summary__sentence')).toHaveText(
        'Changes to 2 Posts and 1 Page',
      )
      await expect(page.locator('.merge-branch-modal .change-summary__operations')).toContainText(
        '2 Created · 1 Updated',
      )

      // Both rows: the page on main and the branch's shadow copy of it. The suite's
      // `afterEach` sweeps posts, not pages.
      const pages = await payload.find({ branch: false, collection: pagesSlug, pagination: false })

      for (const doc of pages.docs) {
        await payload.delete({ id: doc.id, branch: false, collection: pagesSlug }).catch(() => {})
      }
    })

    test('should count the changes and link to the review page when opened from the switcher', async () => {
      await payload.create({ branch: branchSlug, collection: postsSlug, data: { title: 'Treat' } })
      await payload.create({ branch: branchSlug, collection: postsSlug, data: { title: 'Trick' } })

      // From the switcher there is no selection to make, so the count has to be
      // fetched and the way to narrow it has to be offered.
      await page.goto(postsURL.list)
      await switchBranch({ name: branchName, page })
      await page.locator('.branch-selector__trigger').click()
      await page.locator('.branch-selector__current .btn').click()

      await expect(page.locator('.merge-branch-modal')).toBeVisible()
      await expect(page.locator('.merge-branch-modal__summary')).toContainText('2')

      const branch = await payload.find({
        collection: 'payload-branches',
        pagination: false,
        where: { slug: { equals: branchSlug } },
      })

      await expect(page.locator('.merge-branch-modal__review')).toHaveAttribute(
        'href',
        new RegExp(`/payload-branches/${branch.docs[0]!.id}$`),
      )
    })

    test('should merge every change and report progress', async () => {
      const main = await payload.create({ collection: postsSlug, data: { title: 'Autumn Sale' } })

      await payload.update({
        id: main.id,
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'Halloween Sale' },
      })

      await payload.create({
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'Spooky Exclusive' },
      })

      await gotoBranchView()
      await expect(page.locator('.changed-docs__row')).toHaveCount(2)

      await openMergeModal()
      await page.locator('.merge-branch-modal .btn--style-primary').click()

      await expect(page.locator('.payload-toast-item')).toContainText('merged')

      // Both changes landed on main, and the branch's changeset is empty.
      const onMain = await payload.find({
        collection: postsSlug,
        pagination: false,
        where: { id: { equals: main.id } },
      })
      const changes = await payload.find({ collection: branchChangesSlug, pagination: false })

      expect(onMain.docs[0]?.title).toBe('Halloween Sale')
      expect(changes.docs).toHaveLength(0)
    })

    test('should raise exactly one merge modal from the compare view', async () => {
      await payload.create({ branch: branchSlug, collection: postsSlug, data: { title: 'Treat' } })
      await gotoBranchView()
      await openMergeModal()

      // The switcher lives in the app header, above this view, and can raise the same
      // modal — so mounting one per entry point stacked two dialogs on one slug, and
      // only the top one showed progress once merging began.
      await expect(page.locator('.merge-branch-modal')).toHaveCount(1)

      await page.locator('.merge-branch-modal .btn--style-primary').click()
      await expect(page.locator('.merge-branch-modal__progress-fill--complete')).toBeVisible()
      await expect(page.locator('.merge-branch-modal')).toHaveCount(1)
    })

    test('should raise exactly one merge modal from the branch switcher', async () => {
      await payload.create({ branch: branchSlug, collection: postsSlug, data: { title: 'Treat' } })

      await page.goto(postsURL.list)
      await switchBranch({ name: branchName, page })
      await page.locator('.branch-selector__trigger').click()
      await page.locator('.branch-selector__current .btn').click()

      await expect(page.locator('.merge-branch-modal')).toHaveCount(1)
      // Raised from the switcher, so it offers the way to narrow the selection.
      await expect(page.locator('.merge-branch-modal__review')).toBeVisible()
    })

    test('should hold the modal open on a completed merge until dismissed', async () => {
      await payload.create({ branch: branchSlug, collection: postsSlug, data: { title: 'Treat' } })
      await gotoBranchView()
      await openMergeModal()
      await page.locator('.merge-branch-modal .btn--style-primary').click()

      // A small branch merges faster than the bar can be read, so the receipt is
      // what tells the reader it happened at all.
      await expect(page.locator('.merge-branch-modal__progress-fill--complete')).toBeVisible()
      await expect(page.locator('.merge-branch-modal__progress-label')).toContainText('1 of 1')
      await expect(page.locator('.merge-branch-modal')).toBeVisible()

      await page.locator('.merge-branch-modal .btn--style-primary').click()
      await expect(page.locator('.merge-branch-modal')).toBeHidden()
    })

    test('should diff a merged document from the branch history', async () => {
      const main = await payload.create({
        collection: postsSlug,
        data: { order: 1, title: 'Autumn Sale' },
      })

      await payload.update({
        id: main.id,
        branch: branchSlug,
        collection: postsSlug,
        data: { order: 99, title: 'Halloween Sale' },
      })

      await gotoBranchView()
      await openMergeModal()
      await page.locator('.merge-branch-modal .btn--style-primary').click()
      await expect(page.locator('.merge-branch-modal__progress-fill--complete')).toBeVisible()
      await page.locator('.merge-branch-modal .btn--style-primary').click()

      await gotoBranchView()

      const row = page.locator('.merge-ledger__row').filter({ hasText: 'Halloween Sale' })

      // Clicked at the row's leading edge: the title is a real link to the document
      // on main, so aiming at the middle would follow it instead of expanding.
      await row.locator('.merge-ledger__row-header').click({ position: { x: 8, y: 12 } })

      // Both sides come from the snapshots taken either side of the merge write —
      // the live document alone could not produce this, since the branch's copy is
      // gone and main has moved on.
      const diff = row.locator('.merge-ledger__diff')

      await expect(diff.locator('.field-diff-label', { hasText: 'Title' })).toBeVisible()
      await expect(diff).toContainText('Autumn')
      await expect(diff).toContainText('Halloween')
      await expect(diff.locator('.field-diff-label', { hasText: 'Order' })).toBeVisible()
    })

    /** Schedules from the open modal, which is the only way to create one. */
    async function scheduleFromModal(when: string) {
      await mergeMode('Schedule merge').click()
      await page.locator('.merge-branch-modal__schedule input').first().fill(when)
      await page.locator('.merge-branch-modal__schedule input').first().press('Enter')
      await page.locator('.merge-branch-modal .btn--style-primary').click()
      await expect(page.locator('.payload-toast-item')).toContainText('scheduled')
    }

    async function deleteScheduledJobs() {
      const jobs = await payload.find({
        collection: 'payload-jobs',
        pagination: false,
        where: { taskSlug: { equals: 'scheduleMerge' } },
      })

      for (const job of jobs.docs) {
        await payload.delete({ id: job.id, collection: 'payload-jobs' })
      }
    }

    test('should announce a scheduled merge and list what it will apply', async () => {
      await payload.create({
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'Scheduled Exclusive' },
      })

      await gotoBranchView()
      await openMergeModal()
      await scheduleFromModal('12/31/2030 9:00 AM')

      // The banner changes what everything below it means, so it leads.
      await expect(page.locator('.scheduled-merges__banner')).toContainText(
        'This branch is scheduled to merge on',
      )

      // Below it, each schedule lists the documents it will apply.
      const scheduled = page.locator('.scheduled-merges__schedule')

      await expect(scheduled).toHaveCount(1)
      await expect(scheduled).toContainText('Scheduled Exclusive')
      // Read-only: what merges is already decided here.
      await expect(scheduled.locator('input[type="checkbox"]')).toHaveCount(0)

      // And the switcher says so too, without having to open the branch.
      await page.locator('.branch-selector__trigger').click()
      await expect(page.locator('.branch-selector__popup')).toContainText('Scheduled to merge')
      await page.keyboard.press('Escape')

      await deleteScheduledJobs()
    })

    test('should render every schedule on a branch', async () => {
      await payload.create({ branch: branchSlug, collection: postsSlug, data: { title: 'Treat' } })

      await gotoBranchView()
      await openMergeModal()
      await scheduleFromModal('12/31/2030 9:00 AM')

      // Scheduling does not end the branch, so a second one is a legitimate move:
      // schedule a merge, keep working, schedule another.
      await openMergeModal()
      await scheduleFromModal('01/31/2031 9:00 AM')

      await expect(page.locator('.scheduled-merges__schedule')).toHaveCount(2)
      // The banner names the soonest of them, and counts the rest.
      await expect(page.locator('.scheduled-merges__banner')).toContainText('December 31, 2030')
      await expect(page.locator('.scheduled-merges__banner .pill')).toContainText('2')

      await deleteScheduledJobs()
    })

    test('should cancel a scheduled merge from the branch view', async () => {
      await payload.create({ branch: branchSlug, collection: postsSlug, data: { title: 'Treat' } })

      await gotoBranchView()
      await openMergeModal()
      await scheduleFromModal('12/31/2030 9:00 AM')

      // Actions live in the modal rather than beside every row, so one schedule and
      // five are managed the same way.
      await page.locator('.scheduled-merges__banner .btn').click()

      const row = page.locator('.scheduled-merges__manage-row')

      await expect(row).toHaveCount(1)

      // The modal says what is merging, not just when: a date alone is not enough to
      // decide whether to cancel it.
      await expect(row.locator('.change-summary')).toContainText('1 Post')

      // Cancelling is why this modal exists, so it is the action on the row — and it
      // is destructive, so it looks it.
      const cancel = row.locator('.btn--style-destructive')

      await expect(cancel).toContainText('Cancel merge')
      await cancel.click()

      // Filtered: the toast confirming the schedule is still on screen behind it.
      await expect(
        page.locator('.payload-toast-item', { hasText: 'Scheduled merge cancelled' }),
      ).toBeVisible()
      await expect(page.locator('.scheduled-merges__banner')).toBeHidden()

      const jobs = await payload.find({
        collection: 'payload-jobs',
        pagination: false,
        where: { taskSlug: { equals: 'scheduleMerge' } },
      })

      expect(jobs.docs).toHaveLength(0)
    })

    test('should show current changes and the merge history together', async () => {
      await payload.create({
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'Merged Exclusive' },
      })

      await gotoBranchView()
      await openMergeModal()
      await page.locator('.merge-branch-modal .btn--style-primary').click()
      await expect(page.locator('.merge-branch-modal__progress-fill--complete')).toBeVisible()
      await page.locator('.merge-branch-modal .btn--style-primary').click()

      // Kept open, then worked on again — the case where replacing the history with
      // the new work hid everything the branch had already done.
      await payload.create({
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'Later Exclusive' },
      })

      await gotoBranchView()

      const sections = page.locator('.branch-changes__section')

      await expect(sections).toHaveCount(2)
      await expect(sections.nth(0).locator('.branch-changes__section-title')).toHaveText(
        'Current changes',
      )
      await expect(sections.nth(1).locator('.branch-changes__section-title')).toHaveText(
        'Merge history',
      )

      // The new work is pending above; what already merged is still recorded below.
      await expect(sections.nth(0).locator('.changed-docs__row')).toHaveCount(1)
      await expect(sections.nth(0)).toContainText('Later Exclusive')
      await expect(sections.nth(1).locator('.merge-ledger__row')).toHaveCount(1)
      await expect(sections.nth(1)).toContainText('Merged Exclusive')
    })

    test('should show what was merged once the branch has nothing pending', async () => {
      await payload.create({
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'Spooky Exclusive' },
      })

      await gotoBranchView()
      await openMergeModal()
      await page.locator('.merge-branch-modal .btn--style-primary').click()
      await expect(page.locator('.merge-branch-modal__progress-fill--complete')).toBeVisible()
      await page.locator('.merge-branch-modal .btn--style-primary').click()

      await gotoBranchView()

      // The archive replaces "no changes yet": the branch did something, and this
      // is the record of it.
      await expect(page.locator('.branch-changes__empty')).toHaveCount(0)

      const row = page.locator('.merge-ledger__row')

      await expect(row).toHaveCount(1)
      await expect(row.locator('.pill').first()).toContainText('Created')
      await expect(row.locator('.merge-ledger__title')).toContainText('Spooky Exclusive')

      // Merging is not terminal, so the branch is still offered as somewhere to work.
      const branch = await payload.find({
        collection: 'payload-branches',
        pagination: false,
        where: { slug: { equals: branchSlug } },
      })

      expect(branch.docs[0]?.status).toBe('merged')
    })

    test('should close the branch when asked, and stop offering to merge it', async () => {
      await payload.create({ branch: branchSlug, collection: postsSlug, data: { title: 'Treat' } })
      await gotoBranchView()
      await openMergeModal()

      await page.locator('#merge-close-branch').check()
      await page.locator('.merge-branch-modal .btn--style-primary').click()
      await expect(page.locator('.merge-branch-modal__progress-fill--complete')).toBeVisible()
      await page.locator('.merge-branch-modal .btn--style-primary').click()

      await gotoBranchView()

      await expect(page.locator('.branch-changes__closed')).toBeVisible()
      // Nothing further to take, so the action is withdrawn rather than disabled.
      await expect(page.locator('.branch-changes__controls .btn')).toHaveCount(0)

      const branch = await payload.find({
        collection: 'payload-branches',
        pagination: false,
        where: { slug: { equals: branchSlug } },
      })

      expect(branch.docs[0]?.status).toBe('closed')
    })

    test('should not offer to close the branch when only some changes are selected', async () => {
      const main = await payload.create({ collection: postsSlug, data: { title: 'Autumn Sale' } })

      await payload.update({
        id: main.id,
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'Halloween Sale' },
      })

      await payload.create({
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'Spooky Exclusive' },
      })

      await gotoBranchView()
      await openMergeModal()

      await expect(page.locator('#merge-close-branch')).toBeVisible()

      await page.locator('.merge-branch-modal .btn--style-secondary').click()
      await page
        .locator('.changed-docs__row')
        .filter({ hasText: 'Spooky Exclusive' })
        .locator('input[type="checkbox"]')
        .uncheck()
      await openMergeModal()

      // Work would be left on the branch, so closing it would abandon that work.
      await expect(page.locator('#merge-close-branch')).toHaveCount(0)
    })

    test('should discard every change when nothing is deselected', async () => {
      const main = await payload.create({ collection: postsSlug, data: { title: 'Autumn Sale' } })

      await payload.update({
        id: main.id,
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'Halloween Sale' },
      })

      await payload.create({
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'Spooky Exclusive' },
      })

      await gotoBranchView()
      await expect(page.locator('.changed-docs__row')).toHaveCount(2)

      await page.locator('.branch-changes__actions .btn--style-secondary').click()
      await page.locator('.discard-changes-modal [data-dialog-action="confirm"]').click()

      await expect(page.locator('.payload-toast-item')).toContainText('discarded')

      // The branch reads through to main again, and main never moved.
      const onBranch = await payload.find({
        branch: branchSlug,
        collection: postsSlug,
        pagination: false,
      })
      const changes = await payload.find({ collection: branchChangesSlug, pagination: false })

      expect(onBranch.docs.map((doc) => doc.title)).toEqual(['Autumn Sale'])
      expect(changes.docs).toHaveLength(0)
    })

    test('should discard only the selected changes', async () => {
      const main = await payload.create({ collection: postsSlug, data: { title: 'Autumn Sale' } })

      await payload.update({
        id: main.id,
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'Halloween Sale' },
      })

      await payload.create({
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'Spooky Exclusive' },
      })

      await gotoBranchView()

      // Deselect the create, so only the edit is discarded.
      await page
        .locator('.changed-docs__row')
        .filter({ hasText: 'Spooky Exclusive' })
        .locator('input[type="checkbox"]')
        .uncheck()

      const discard = page.locator('.branch-changes__actions .btn--style-secondary')

      // Scoped by the same checkboxes the merge button reads.
      await expect(discard).toContainText('1')

      await discard.click()
      await page.locator('.discard-changes-modal [data-dialog-action="confirm"]').click()
      await expect(page.locator('.payload-toast-item')).toContainText('discarded')

      const onBranch = await payload.find({
        branch: branchSlug,
        collection: postsSlug,
        pagination: false,
      })
      const changes = await payload.find({ collection: branchChangesSlug, pagination: false })

      expect(onBranch.docs.map((doc) => doc.title).sort()).toEqual([
        'Autumn Sale',
        'Spooky Exclusive',
      ])
      expect(changes.docs).toHaveLength(1)
    })

    test('should merge only the selected changes, leaving the rest on the branch', async () => {
      const main = await payload.create({ collection: postsSlug, data: { title: 'Autumn Sale' } })

      await payload.update({
        id: main.id,
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'Halloween Sale' },
      })

      await payload.create({
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'Spooky Exclusive' },
      })

      await gotoBranchView()

      const created = page.locator('.changed-docs__row').filter({ hasText: 'Spooky Exclusive' })
      await created.locator('input[type="checkbox"]').uncheck()

      await openMergeModal()
      await expect(page.locator('.merge-branch-modal__summary')).toContainText('1')
      await page.locator('.merge-branch-modal .btn--style-primary').click()

      await expect(page.locator('.payload-toast-item')).toContainText('merged')

      const onMain = await payload.find({
        collection: postsSlug,
        pagination: false,
        where: { id: { equals: main.id } },
      })
      const changes = await payload.find({ collection: branchChangesSlug, pagination: false })

      expect(onMain.docs[0]?.title).toBe('Halloween Sale')
      // The deselected create keeps the branch open.
      expect(changes.docs).toHaveLength(1)
      expect(changes.docs[0]!.operation).toBe('create')
    })
  })

  /**
   * Saving a draft goes through its own action URL rather than the form's, so the
   * branch has to be threaded onto it separately — these cover that it is.
   */
  test.describe('Globals in the changeset', () => {
    test.afterEach(async () => {
      const changes = await payload.find({ collection: branchChangesSlug, pagination: false })

      for (const change of changes.docs) {
        await payload.delete({ id: change.id, collection: branchChangesSlug }).catch(() => {})
      }

      const merges = await payload.find({ collection: branchMergesSlug, pagination: false })

      for (const merge of merges.docs) {
        await payload.delete({ id: merge.id, collection: branchMergesSlug }).catch(() => {})
      }
    })

    // A global edited on a branch used to be recorded and then dropped by the view, so it
    // was invisible in the changeset and unmergeable from the panel.
    test('should list a changed global and diff it against main', async () => {
      await payload.updateGlobal({
        slug: headerGlobalSlug,
        data: { navLabel: 'main label' },
      })

      await payload.updateGlobal({
        slug: headerGlobalSlug,
        branch: branchSlug,
        data: { navLabel: 'branch label' },
      })

      await gotoBranchView()

      const row = page.locator('.changed-docs__row').filter({ hasText: 'Header' })

      await expect(row).toHaveCount(1)
      await row.locator('.changed-docs__toggle').click()

      // The same diff renderer the documents use, against the global's own fields.
      const diff = row.locator('.changed-docs__diff')

      await expect(diff.locator('.field-diff-label', { hasText: 'Nav Label' })).toBeVisible()
      await expect(diff).toContainText('main label')
      await expect(diff).toContainText('branch label')
    })

    test('should diff a merged global in the branch history', async () => {
      await payload.updateGlobal({
        slug: headerGlobalSlug,
        data: { navLabel: 'main label' },
      })

      await payload.updateGlobal({
        slug: headerGlobalSlug,
        branch: branchSlug,
        data: { navLabel: 'branch label' },
      })

      await gotoBranchView()
      await page.locator('.branch-changes__actions .btn--style-primary').click()
      await page.locator('.merge-branch-modal .btn--style-primary').click()
      await expect(page.locator('.merge-branch-modal__progress-label')).toContainText('1 of 1')
      await page.locator('.merge-branch-modal .btn--style-primary').click()

      await gotoBranchView()

      const row = page.locator('.merge-ledger__row').filter({ hasText: 'Header' })

      await expect(row).toHaveCount(1)
      await row.locator('.merge-ledger__row-header').click({ position: { x: 8, y: 12 } })

      // Both sides come from the snapshots the ledger stored at merge time — the branch's
      // copy of the global is gone by now.
      const diff = row.locator('.merge-ledger__diff')

      await expect(diff.locator('.field-diff-label', { hasText: 'Nav Label' })).toBeVisible()
      await expect(diff).toContainText('main label')
      await expect(diff).toContainText('branch label')
    })
  })

  test.describe('API view', () => {
    test.afterEach(async () => {
      const pages = await payload.find({ branch: false, collection: pagesSlug, pagination: false })

      for (const doc of pages.docs) {
        await payload.delete({ id: doc.id, branch: false, collection: pagesSlug }).catch(() => {})
      }
    })

    // The tab showed `?branch=` in the URL it claimed to have requested, and then
    // rendered main's document: the request carried the param, but a by-ID read
    // narrowed the request before the branch was ever read off it.
    test('should load the branch copy of the document', async () => {
      const page1 = await payload.create({
        collection: pagesSlug,
        data: { _status: 'published', title: 'Autumn Page' },
      })

      await payload.update({
        id: page1.id,
        branch: branchSlug,
        collection: pagesSlug,
        data: { _status: 'published', title: 'Halloween Page' },
      })

      await page.goto(pagesURL.edit(page1.id))
      await switchBranch({ name: branchName, page })

      // Asserted on the response the tab actually renders, rather than on the Monaco
      // editor's virtualized text.
      const loaded = page.waitForResponse(
        (response) =>
          response.url().includes(`/api/${pagesSlug}/${page1.id}`) &&
          response.url().includes(`branch=${branchSlug}`) &&
          response.ok(),
      )

      await page.goto(`${pagesURL.edit(page1.id)}/api`)

      const json = (await (await loaded).json()) as { title?: string }

      expect(json.title).toBe('Halloween Page')

      // And the URL on screen is the one that was requested.
      await expect(page.locator('.query-inspector__api-url-input input')).toHaveValue(
        new RegExp(`branch=${branchSlug}`),
      )
    })
  })

  test.describe('Drafts saved from the admin panel', () => {
    test.afterEach(async () => {
      const pages = await payload.find({ branch: false, collection: pagesSlug, pagination: false })

      for (const doc of pages.docs) {
        await payload.delete({ id: doc.id, branch: false, collection: pagesSlug }).catch(() => {})
      }
    })

    async function saveDraftOnBranch(title: string) {
      await page.goto(pagesURL.create)
      await switchBranch({ name: branchName, page })

      await page.goto(pagesURL.create)
      await page.locator('#field-title').fill(title)

      const saved = page.waitForResponse(
        (response) =>
          response.url().includes(`/api/${pagesSlug}`) &&
          response.request().method() === 'POST' &&
          response.ok(),
      )

      await page.locator('#action-save-draft').click()
      await saved
    }

    test('should keep a draft saved on a branch off main', async () => {
      await saveDraftOnBranch('Spooky Draft')

      const onMain = await payload.find({ collection: pagesSlug, draft: true, pagination: false })
      const onBranch = await payload.find({
        branch: branchSlug,
        collection: pagesSlug,
        draft: true,
        pagination: false,
      })

      expect(onMain.docs).toHaveLength(0)
      expect(onBranch.docs.map((doc) => doc.title)).toEqual(['Spooky Draft'])
    })

    test('should list a draft saved on a branch among its changed documents', async () => {
      await saveDraftOnBranch('Spooky Draft')
      await gotoBranchView()

      const row = page.locator('.changed-docs__row').filter({ hasText: 'Spooky Draft' })

      await expect(row).toHaveCount(1)
      await expect(row.locator('.changed-docs__operation')).toContainText('Created')
    })

    // A draft edit never touches the document row, so a diff that reads published
    // state on both sides shows main's own values twice and renders nothing.
    test('should diff the draft values when a branch only drafted its edit', async () => {
      const existing = await payload.create({
        collection: pagesSlug,
        data: { _status: 'published', title: 'Autumn Landing' },
      })

      await payload.update({
        id: existing.id,
        branch: branchSlug,
        collection: pagesSlug,
        data: { title: 'Halloween Landing' },
        draft: true,
      })

      await gotoBranchView()

      const row = page.locator('.changed-docs__row').filter({ hasText: 'Landing' })
      await row.locator('.changed-docs__toggle').click()

      const diff = row.locator('.changed-docs__diff')

      await expect(diff.locator('.field-diff-label', { hasText: 'Title' })).toBeVisible()
      await expect(diff).toContainText('Autumn')
      await expect(diff).toContainText('Halloween')
    })
  })
})
