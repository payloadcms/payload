import type { BrowserContext, Page } from '@playwright/test'
import type { CollectionSlug, Document } from 'payload'

import { expect, test } from '@playwright/test'
import path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type {
  Collection1,
  FieldsRelationship as CollectionWithRelationships,
  Config,
  RelationOne,
  RelationRestricted,
  RelationTwo,
  RelationWithTitle,
  VersionedRelationshipField,
} from './payload-types.js'

import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
  // throttleTest,
} from '../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { assertToastErrors } from '../__helpers/shared/assertToastErrors.js'
import { assertNetworkRequests } from '../__helpers/e2e/assertNetworkRequests.js'
import { addArrayRow } from '../__helpers/e2e/fields/array/addArrayRow.js'
import { openCreateDocDrawer } from '../__helpers/e2e/fields/relationship/openCreateDocDrawer.js'
import { addListFilter } from '../__helpers/e2e/filters/index.js'
import { goToNextPage } from '../__helpers/e2e/goToNextPage.js'
import { openDocControls } from '../__helpers/e2e/openDocControls.js'
import { openDocDrawer } from '../__helpers/e2e/toggleDocDrawer.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import {
  collection1Slug,
  mixedMediaCollectionSlug,
  relationFalseFilterOptionSlug,
  relationOneSlug,
  relationRestrictedSlug,
  relationTrueFilterOptionSlug,
  relationTwoSlug,
  relationUpdatedExternallySlug,
  relationWithTitleSlug,
  slug,
  versionedRelationshipFieldSlug,
} from './slugs.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const { beforeAll, beforeEach, describe } = test

let payload: PayloadTestSDK<Config>

describe('Relationship Field', () => {
  let url: AdminUrlUtil
  let versionedRelationshipFieldURL: AdminUrlUtil
  let context: BrowserContext
  let page: Page
  let collectionOneDoc: Collection1
  let relationOneDoc: RelationOne
  let anotherRelationOneDoc: RelationOne
  let relationTwoDoc: RelationTwo

  let docWithExistingRelations: CollectionWithRelationships
  let restrictedRelation: RelationRestricted
  let relationWithTitle: RelationWithTitle
  let serverURL: string

  async function loadCreatePage() {
    await page.goto(url.create)
    //ensure page is loaded
    await wait(100)
    await expect(page.locator('.shimmer-effect')).toHaveCount(0)
    await wait(100)
  }

  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))

    url = new AdminUrlUtil(serverURL, slug)
    versionedRelationshipFieldURL = new AdminUrlUtil(serverURL, versionedRelationshipFieldSlug)

    context = await browser.newContext()
    page = await context.newPage()

    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL })
  })

  beforeEach(async () => {
    await ensureCompilationIsDone({ page, serverURL })

    await clearAllDocs()

    /*await throttleTest({
      page,
      context,
      delay: 'Slow 4G',
    })*/

    // Create docs to relate to
    relationOneDoc = (await payload.create({
      collection: relationOneSlug,
      data: {
        name: 'relation',
      },
    })) as any

    anotherRelationOneDoc = (await payload.create({
      collection: relationOneSlug,
      data: {
        name: 'relation',
      },
    })) as any

    relationTwoDoc = (await payload.create({
      collection: relationTwoSlug,
      data: {
        name: 'second-relation',
      },
    })) as any

    // Create restricted doc
    restrictedRelation = (await payload.create({
      collection: relationRestrictedSlug,
      data: {
        name: 'restricted',
      },
    })) as any

    // Doc with useAsTitle
    relationWithTitle = (await payload.create({
      collection: relationWithTitleSlug,
      data: {
        name: 'relation-title',
        meta: {
          title: 'relation-title',
        },
      },
    })) as any

    // Doc with useAsTitle for word boundary test
    await payload.create({
      collection: relationWithTitleSlug,
      data: {
        name: 'word boundary search',
        meta: {
          title: 'word boundary search',
        },
      },
    })

    // Collection 1 Doc
    collectionOneDoc = (await payload.create({
      collection: collection1Slug,
      data: {
        name: 'One',
      },
    })) as any

    // Add restricted doc as relation
    docWithExistingRelations = (await payload.create({
      collection: slug,
      data: {
        name: 'with-existing-relations',
        relationship: relationOneDoc.id,
        relationshipReadOnly: relationOneDoc.id,
        relationshipRestricted: restrictedRelation.id,
        relationshipWithTitle: relationWithTitle.id,
      },
    })) as any
  })

  const tableRowLocator = 'table > tbody > tr'

  test('should create relationship', async () => {
    await loadCreatePage()
    const field = page.locator('#field-relationship')
    await expect(field.locator('input')).toBeEnabled()
    await field.click({ delay: 100 })
    const options = page.locator('.rs__option')
    await expect(options).toHaveCount(2) // two docs
    await options.nth(0).click()
    await expect(field).toContainText(relationOneDoc.id)
    await saveDocAndAssert(page)
  })

  test('should only make a single request for relationship values', async () => {
    await loadCreatePage()

    const field = page.locator('#field-relationship')
    await expect(field.locator('input')).toBeEnabled()
    await field.click({ delay: 100 })
    const options = page.locator('.rs__option')
    await expect(options).toHaveCount(2) // two docs
    await options.nth(0).click()
    await expect(field).toContainText(relationOneDoc.id)
    await assertNetworkRequests(page, `/api/${relationOneSlug}`, async () => {
      await saveDocAndAssert(page)
      await wait(200)
    })
  })

  // TODO: Flaky test in CI - fix this. https://github.com/payloadcms/payload/actions/runs/8559547748/job/23456806365
  test.skip('should create relations to multiple collections', async () => {
    await loadCreatePage()

    const field = page.locator('#field-relationshipMultiple')
    const value = page.locator('#field-relationshipMultiple .relationship--single-value__text')

    await field.click({ delay: 100 })

    const options = page.locator('.rs__option')

    await expect(options).toHaveCount(3) // 3 docs

    // Add one relationship
    await options.locator(`text=${relationOneDoc.id}`).click()
    await expect(value).toContainText(relationOneDoc.id)

    // Add relationship of different collection
    await field.click({ delay: 100 })
    await options.locator(`text=${relationTwoDoc.id}`).click()
    await expect(value).toContainText(relationTwoDoc.id)

    await saveDocAndAssert(page)
    await wait(200)
    await expect(value).toContainText(relationTwoDoc.id)
  })

  test('should create hasMany relationship', async () => {
    await loadCreatePage()

    const field = page.locator('#field-relationshipHasMany')
    await expect(field.locator('input')).toBeEnabled()
    await field.click({ delay: 100 })
    const options = page.locator('.rs__option')
    await expect(options).toHaveCount(2) // Two relationship options
    const values = page.locator('#field-relationshipHasMany .relationship--multi-value-label__text')
    await options.locator(`text=${relationOneDoc.id}`).click()
    await expect(values).toHaveText([relationOneDoc.id])
    await expect(values).not.toHaveText([anotherRelationOneDoc.id])
    await field.click({ delay: 100 })
    await options.locator(`text=${anotherRelationOneDoc.id}`).click()
    await expect(values).toHaveText([relationOneDoc.id, anotherRelationOneDoc.id])
    await field.locator('.rs__input').click({ delay: 100 })
    await expect(page.locator('.rs__menu')).toHaveText('No options')
    await saveDocAndAssert(page)
    await wait(200)
    await expect(values).toHaveText([relationOneDoc.id, anotherRelationOneDoc.id])
  })

  // TODO: Flaky test. Fix this! (This is an actual issue not just an e2e flake)
  test.skip('should create many relations to multiple collections', async () => {
    await loadCreatePage()

    const field = page.locator('#field-relationshipHasManyMultiple')
    await field.click({ delay: 100 })

    const options = page.locator('.rs__option')
    await expect(options).toHaveCount(3)

    const values = page.locator(
      '#field-relationshipHasManyMultiple .relationship--multi-value-label__text',
    )

    // Add one relationship
    await options.locator(`text=${relationOneDoc.id}`).click()
    await expect(values).toHaveText([relationOneDoc.id])

    // Add second relationship
    await field.click({ delay: 100 })
    await options.locator(`text=${relationTwoDoc.id}`).click()
    await expect(values).toHaveText([relationOneDoc.id, relationTwoDoc.id])

    await saveDocAndAssert(page)
    await wait(200)
    await expect(values).toHaveText([relationOneDoc.id, relationTwoDoc.id])
  })

  test('should paginate polymorphic relationship correctly and not send NaN page parameter', async () => {
    const relationOneIDs: string[] = []
    const relationTwoIDs: string[] = []

    // Create 15 relationOne docs to simulate pagination in the dropdown
    for (let i = 0; i < 15; i++) {
      const doc = await payload.create({
        collection: relationOneSlug,
        data: {
          name: `relation-one-${i}`,
        },
      })
      relationOneIDs.push(doc.id)
    }

    // Create 15 relationOne docs to simulate pagination in the dropdown
    for (let i = 0; i < 15; i++) {
      const doc = await payload.create({
        collection: relationTwoSlug,
        data: {
          name: `relation-two-${i}`,
        },
      })
      relationTwoIDs.push(doc.id)
    }

    await loadCreatePage()

    const field = page.locator('#field-relationshipHasManyMultiple')

    await field.click({ delay: 100 })

    const menu = page.locator('.rs__menu-list')
    await expect(menu).toBeVisible()
    await wait(300)

    const options = page.locator('.rs__option')
    await expect(options.first()).toBeVisible()

    // Hover over the menu and use mouse wheel to scroll and trigger pagination
    await menu.hover()

    // Scroll down multiple times using mouse wheel to trigger onMenuScrollToBottom
    for (let i = 0; i < 5; i++) {
      await menu.hover()
      await page.mouse.wheel(0, 500)
      await wait(300)
    }

    // Check that we can see the 14th doc from relationTwo (which would be on page 2)
    // Before the fix, page 2 of relationTwo wouldn't load because page parameter was NaN
    const fourteenthRelationTwoDoc = relationTwoIDs[13] // Index 13 = 14th doc (page 2, item 4)

    // The 14th relationTwo doc should be visible in the dropdown
    await expect(options.locator(`text=${fourteenthRelationTwoDoc}`)).toBeVisible()
  })

  test('should duplicate document with relationships', async () => {
    await page.goto(url.edit(docWithExistingRelations.id))
    await wait(300)

    await openDocControls(page)
    await page.locator('#action-duplicate').click()
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
    const field = page.locator('#field-relationship .relationship--single-value__text')

    await expect(field).toHaveText(relationOneDoc.id)
  })

  async function runFilterOptionsTest(fieldName: string, fieldLabel: string) {
    await page.reload()
    await page.goto(url.edit(docWithExistingRelations.id))
    await wait(300)
    const field = page.locator('#field-relationship')
    await expect(field.locator('input')).toBeEnabled()
    await field.click({ delay: 100 })
    await wait(200)

    const options = page.locator('.rs__option')
    await expect(options).toHaveCount(2)
    await options.getByText(relationOneDoc.id).click()
    await expect(field).toContainText(relationOneDoc.id)
    await wait(200)

    let filteredField = page.locator(`#field-${fieldName} .react-select`)
    await filteredField.click({ delay: 100 })
    let filteredOptions = filteredField.locator('.rs__option')
    await expect(filteredOptions).toHaveCount(1) // one doc
    await wait(200)

    await filteredOptions.getByText(relationOneDoc.id).click()
    await expect(filteredField).toContainText(relationOneDoc.id)
    await wait(200)

    await field.click({ delay: 100 })
    await expect(options).toHaveCount(2)
    await wait(200)

    await options.getByText(anotherRelationOneDoc.id).click()
    await expect(field).toContainText(anotherRelationOneDoc.id)
    await wait(1000) // Need to wait form state to come back before clicking save
    await page.locator('#action-save').click()
    await wait(200)
    await assertToastErrors({
      page,
      errors: [fieldLabel],
    })
    await wait(1000)

    filteredField = page.locator(`#field-${fieldName} .react-select`)
    await filteredField.click({ delay: 100 })
    filteredOptions = filteredField.locator('.rs__option')
    await expect(filteredOptions).toHaveCount(2) // two options because the currently selected option is still there
    await wait(200)

    await filteredOptions.getByText(anotherRelationOneDoc.id).click()
    await expect(filteredField).toContainText(anotherRelationOneDoc.id)
    await saveDocAndAssert(page)
  }

  describe('filterOptions', () => {
    // TODO: Flaky test. Fix this! (This is an actual issue not just an e2e flake)
    test('should allow dynamic filterOptions', async () => {
      await runFilterOptionsTest('relationshipFilteredByID', 'Relationship Filtered By ID')
    })

    // TODO: Flaky test. Fix this! (This is an actual issue not just an e2e flake)
    test('should allow dynamic async filterOptions', async () => {
      await runFilterOptionsTest('relationshipFilteredAsync', 'Relationship Filtered Async')
    })

    test('should apply filter options within list view filter controls', async () => {
      const { id: idToInclude } = await payload.create({
        collection: slug,
        data: {
          filter: 'Include me',
        },
      })

      // first ensure that filter options are applied in the edit view
      await page.goto(url.edit(idToInclude))
      await wait(300)
      const field = page.locator('#field-relationshipFilteredByField')
      await field.click({ delay: 100 })
      const options = field.locator('.rs__option')
      await expect(options).toHaveCount(1)
      await expect(options).toContainText(idToInclude)

      // now ensure that the same filter options are applied in the list view
      await page.goto(url.list)
      await wait(300)
      const { whereBuilder } = await addListFilter({
        page,
        fieldLabel: 'Relationship Filtered By Field',
        operatorLabel: 'equals',
      })

      const valueInput = page.locator('.condition__value input')
      await valueInput.click()
      const valueOptions = whereBuilder.locator('.condition__value .rs__option')

      await expect(valueOptions).toHaveCount(2)
      await expect(valueOptions.locator(`text=None`)).toBeVisible()
      await expect(valueOptions.locator(`text=${idToInclude}`)).toBeVisible()
    })

    test('should apply `filterOptions` of nested fields to list view filter controls', async () => {
      const { id: idToInclude } = await payload.create({
        collection: slug,
        data: {
          filter: 'Include me',
        },
      })

      // First ensure that filter options are applied to the Edit View
      await page.goto(url.edit(idToInclude))
      await wait(300)

      const fieldInCollapsible = page.locator('#field-filteredByFieldInCollapsible')
      await fieldInCollapsible.click({ delay: 100 })
      const optionsInCollapsible = fieldInCollapsible.locator('.rs__option')
      await expect(optionsInCollapsible).toHaveCount(1)
      await expect(optionsInCollapsible).toContainText(idToInclude)

      await addArrayRow(page, { fieldName: 'array' })

      const fieldInArray = page.locator('#field-array__0__filteredByFieldInArray')
      await fieldInArray.click({ delay: 100 })
      const optionsInArray = fieldInArray.locator('.rs__option')
      await expect(optionsInArray).toHaveCount(1)
      await expect(optionsInArray).toContainText(idToInclude)

      // Now ensure that the same filter options are applied in the list view
      await page.goto(url.list)
      await wait(300)

      const { condition: condition1 } = await addListFilter({
        page,
        fieldLabel: 'Collapsible > Filtered By Field In Collapsible',
        operatorLabel: 'equals',
      })

      const valueInput = condition1.locator('.condition__value input')
      await valueInput.click()
      const valueOptions = condition1.locator('.condition__value .rs__option')

      await expect(valueOptions).toHaveCount(2)
      await expect(valueOptions.locator(`text=None`)).toBeVisible()
      await expect(valueOptions.locator(`text=${idToInclude}`)).toBeVisible()

      const { condition: condition2 } = await addListFilter({
        page,
        fieldLabel: 'Array > Filtered By Field In Array',
        operatorLabel: 'equals',
      })

      const valueInput2 = condition2.locator('.condition__value input')
      await valueInput2.click()
      const valueOptions2 = condition2.locator('.condition__value .rs__option')

      await expect(valueOptions2).toHaveCount(2)
      await expect(valueOptions2.locator(`text=None`)).toBeVisible()
      await expect(valueOptions2.locator(`text=${idToInclude}`)).toBeVisible()
    })

    test('should allow usage of relationTo in `filterOptions`', async () => {
      const { id: include } = (await payload.create({
        collection: relationOneSlug,
        data: {
          name: 'include',
        },
      })) as any

      const { id: exclude } = (await payload.create({
        collection: relationOneSlug,
        data: {
          name: 'exclude',
        },
      })) as any

      await loadCreatePage()

      // select relationshipMany field that relies on siblingData field above
      await page.locator('#field-relationshipManyFiltered .rs__control').click()

      const options = page.locator('#field-relationshipManyFiltered .rs__menu')
      await expect(options).toContainText(include)
      await expect(options).not.toContainText(exclude)
    })

    test('should allow usage of siblingData in `filterOptions`', async () => {
      await payload.create({
        collection: relationWithTitleSlug,
        data: {
          name: 'exclude',
        },
      })

      await loadCreatePage()

      // enter a filter for relationshipManyFiltered to use
      await page.locator('#field-filter').fill('include')

      // select relationshipMany field that relies on siblingData field above
      await page.locator('#field-relationshipManyFiltered .rs__control').click()

      const options = page.locator('#field-relationshipManyFiltered .rs__menu')
      await expect(options).not.toContainText('exclude')
    })

    // TODO: Flaky test in CI - fix. https://github.com/payloadcms/payload/actions/runs/8559547748/job/23456806365
    test.skip('should not query for a relationship when `filterOptions` returns false', async () => {
      await payload.create({
        collection: relationFalseFilterOptionSlug,
        data: {
          name: 'whatever',
        },
      })

      await loadCreatePage()

      // select relationshipMany field that relies on siblingData field above
      await page.locator('#field-relationshipManyFiltered .rs__control').click()

      const options = page.locator('#field-relationshipManyFiltered .rs__menu')
      await expect(options).toContainText('Relation With Titles')
      await expect(options).not.toContainText('whatever')
    })

    // TODO: Flaky test in CI - fix.
    test('should show a relationship when `filterOptions` returns true', async () => {
      await payload.create({
        collection: relationTrueFilterOptionSlug,
        data: {
          name: 'truth',
        },
      })

      await loadCreatePage()

      // wait for relationship options to load
      const relationFilterOptionsReq = page.waitForResponse(/api\/relation-filter-true/)
      // select relationshipMany field that relies on siblingData field above
      await page.locator('#field-relationshipManyFiltered .rs__control').click()
      await relationFilterOptionsReq

      const options = page.locator('#field-relationshipManyFiltered .rs__menu')
      await expect(options).toContainText('truth')
    })
  })

  test('should allow docs with same ID but different collections to be selectable', async () => {
    const mixedMedia = new AdminUrlUtil(serverURL, mixedMediaCollectionSlug)
    await page.goto(mixedMedia.create)
    // wait for relationship options to load
    const podcastsFilterOptionsReq = page.waitForResponse(/api\/podcasts/)
    const videosFilterOptionsReq = page.waitForResponse(/api\/videos/)
    await wait(300)
    // select relationshipMany field that relies on siblingData field above
    await page.locator('#field-relatedMedia .rs__control').click()
    await podcastsFilterOptionsReq
    await videosFilterOptionsReq

    const options = page.locator('.rs__option')
    await expect(options).toHaveCount(4) // 4 docs
    await options.locator(`text=Video 0`).click()

    await page.locator('#field-relatedMedia .rs__control').click()
    const remainingOptions = page.locator('.rs__option')
    await expect(remainingOptions).toHaveCount(3) // 3 docs
  })

  // TODO: Flaky test in CI - fix.
  test.skip('should open document drawer from read-only relationships', async () => {
    const editURL = url.edit(docWithExistingRelations.id)
    await page.goto(editURL)
    await wait(300)
    await openDocDrawer({
      page,
      selector:
        '#field-relationshipReadOnly button.relationship--single-value__drawer-toggler.doc-drawer__toggler',
    })

    const documentDrawer = page.locator('[id^=doc-drawer_relation-one_1_]')
    await expect(documentDrawer).toBeVisible()
  })

  test('should open document from drawer by clicking on ID Label', async () => {
    const relatedDoc = await payload.create({
      collection: relationOneSlug,
      data: {
        name: 'Drawer ID Label',
      },
    })
    const doc = await payload.create({
      collection: slug,
      data: {
        relationship: relatedDoc.id,
      },
    })
    await payload.update({
      collection: slug,
      id: doc.id,
      data: {
        relationToSelf: doc.id,
      },
    })

    await page.goto(url.edit(doc.id))
    // open first drawer (self-relation)
    const selfRelationTrigger = page.locator(
      '#field-relationToSelf button.relationship--single-value__drawer-toggler',
    )
    await expect(selfRelationTrigger).toBeVisible()
    await selfRelationTrigger.click()

    const drawer1 = page.locator('[id^=doc-drawer_fields-relationship_1_]')
    await expect(drawer1).toBeVisible()

    // open nested drawer (relation field inside self-relation)
    const relationshipDrawerTrigger = drawer1.locator(
      '#field-relationship button.relationship--single-value__drawer-toggler',
    )
    await expect(relationshipDrawerTrigger).toBeVisible()
    await relationshipDrawerTrigger.click()

    const drawer2 = page.locator('[id^=doc-drawer_relation-one_2_]')
    await expect(drawer2).toBeVisible()

    const idLabel = drawer2.locator('.id-label')
    await expect(idLabel).toBeVisible()
    await idLabel.locator('a').click()

    const closedModalLocator = page.locator(
      '.payload__modal-container.payload__modal-container--exitDone',
    )

    await expect(closedModalLocator).toHaveCount(1)

    await Promise.all([
      payload.delete({
        collection: relationOneSlug,
        id: relatedDoc.id,
      }),
      payload.delete({
        collection: slug,
        id: doc.id,
      }),
    ])
  })

  test('should open document drawer and append newly created docs onto the parent field', async () => {
    await page.goto(url.edit(docWithExistingRelations.id))
    await wait(300)
    await openCreateDocDrawer({ page, fieldSelector: '#field-relationshipHasMany' })
    const documentDrawer = page.locator('[id^=doc-drawer_relation-one_1_]')
    await expect(documentDrawer).toBeVisible()
    const drawerField = documentDrawer.locator('#field-name')
    await drawerField.fill('Newly created document')
    const saveButton = documentDrawer.locator('#action-save')
    await saveButton.click()
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
    await expect(
      page.locator('#field-relationshipHasMany .value-container .rs__multi-value'),
    ).toHaveCount(1)
    await drawerField.fill('Updated document')
    await saveButton.click()
    await expect(page.locator('.payload-toast-container').first()).toContainText(
      'Updated successfully',
    )
    await page.locator('.doc-drawer__header-close').click()
    await expect(
      page.locator('#field-relationshipHasMany .value-container .rs__multi-value'),
    ).toHaveCount(1)
  })

  test('should update relationship from drawer without enabling save in main doc', async () => {
    await page.goto(url.edit(docWithExistingRelations.id))
    await wait(300)
    const saveButton = page.locator('#action-save')
    await expect(saveButton).toBeDisabled()

    await openDocDrawer({
      page,
      selector: '#field-relationship button.relationship--single-value__drawer-toggler',
    })

    const field = page.locator('#field-name')
    await field.fill('Updated')

    await saveButton.nth(1).click()
    await expect(page.locator('.payload-toast-container')).toContainText('Updated successfully')
    await page.locator('.doc-drawer__header-close').click()

    await expect(saveButton).toBeDisabled()
  })

  test('should allow filtering by polymorphic relationships with version drafts enabled', async () => {
    await createVersionedRelationshipFieldDoc('Without relationship')
    await createVersionedRelationshipFieldDoc('with relationship', [
      {
        value: collectionOneDoc.id,
        relationTo: collection1Slug,
      },
    ])

    await page.goto(versionedRelationshipFieldURL.list)
    await wait(300)
    await page.locator('.list-controls__toggle-columns').click()

    await addListFilter({
      page,
      fieldLabel: 'Relationship Field',
      operatorLabel: 'exists',
      value: 'True',
    })

    await expect(page.locator(tableRowLocator)).toHaveCount(1)
  })

  describe('existing relationships', () => {
    test('should highlight existing relationship', async () => {
      await page.goto(url.edit(docWithExistingRelations.id))
      await wait(300)
      const field = page.locator('#field-relationship')
      await expect(field.locator('input')).toBeEnabled()
      await field.click({ delay: 100 })
      await expect(page.locator('.rs__option--is-selected')).toHaveCount(1)
      await expect(page.locator('.rs__option--is-selected')).toHaveText(relationOneDoc.id)
    })

    test('should show untitled ID on restricted relation', async () => {
      await page.goto(url.edit(docWithExistingRelations.id))
      await wait(300)
      const field = page.locator('#field-relationshipRestricted')

      // Check existing relationship has untitled ID
      await expect(field).toContainText(`Untitled - ID: ${restrictedRelation.id}`)

      // Check dropdown options
      await field.click({ delay: 100 })
      const options = page.locator('.rs__option')

      await expect(options).toHaveCount(1) // None + 1 Unitled ID
    })

    // test.todo('should paginate within the dropdown');

    test('should search within the relationship field', async () => {
      await page.goto(url.edit(docWithExistingRelations.id))
      await wait(300)
      const input = page.locator('#field-relationshipWithTitle input')
      await input.fill('title')
      const options = page.locator('#field-relationshipWithTitle .rs__menu .rs__option')
      await expect(options).toHaveCount(1)

      await input.fill('non-occurring-string')
      await expect(options).toHaveCount(0)
    })

    test('should search using word boundaries within the relationship field', async () => {
      await page.goto(url.edit(docWithExistingRelations.id))
      await wait(300)
      const input = page.locator('#field-relationshipWithTitle input')
      await input.fill('word search')
      const options = page.locator('#field-relationshipWithTitle .rs__menu .rs__option')
      await expect(options).toHaveCount(1)
    })

    test('should show useAsTitle on relation', async () => {
      await page.goto(url.edit(docWithExistingRelations.id))
      await wait(300)
      const field = page.locator('#field-relationshipWithTitle')
      const value = field.locator('.relationship--single-value__text')

      // Check existing relationship for correct title
      await expect(value).toHaveText(relationWithTitle.name)

      await field.click({ delay: 100 })
      const options = field.locator('.rs__option')

      await expect(options).toHaveCount(2)
    })

    test('should show id on relation in list view', async () => {
      await page.goto(url.list)
      await wait(300)
      const relationship = page.locator('.row-1 .cell-relationship')
      await expect(relationship).toHaveText(relationOneDoc.id)
    })

    test('should show Untitled ID on restricted relation in list view', async () => {
      await page.goto(url.list)
      await wait(300)
      const relationship = page.locator('.row-1 .cell-relationshipRestricted')
      await expect(relationship).toContainText('Untitled - ID: ')
    })

    test('x in list view', async () => {
      await page.goto(url.list)
      await wait(300)
      const relationship = page.locator('.row-1 .cell-relationshipWithTitle')
      await expect(relationship).toHaveText(relationWithTitle.name)
    })

    test('should update relationship values on page change in list view', async () => {
      await clearCollectionDocs(slug)
      // create new docs to paginate to
      for (let i = 0; i < 10; i++) {
        await payload.create({
          collection: slug,
          data: {
            relationshipHasManyMultiple: [
              {
                relationTo: relationOneSlug,
                value: relationOneDoc.id,
              },
            ],
          },
        })
      }

      for (let i = 0; i < 10; i++) {
        await payload.create({
          collection: slug,
          data: {
            relationshipHasManyMultiple: [
              {
                relationTo: relationTwoSlug,
                value: relationTwoDoc.id,
              },
            ],
          },
        })
      }

      await page.goto(url.list)
      await wait(300)
      // check first doc on first page
      const relationship = page.locator('.row-1 .cell-relationshipHasManyMultiple')
      await expect(relationship).toHaveText(relationTwoDoc.id)

      await goToNextPage(page)

      // check first doc on second page (should be different)
      await expect(relationship).toContainText(relationOneDoc.id)
    })
  })

  describe('externally update relationship field', () => {
    beforeEach(async () => {
      const externalRelationURL = new AdminUrlUtil(serverURL, relationUpdatedExternallySlug)
      await page.goto(externalRelationURL.create)
      await wait(300)
    })

    test('has many, one collection', async () => {
      await page.locator('#field-relationHasMany + .pre-populate-field-ui button').click()
      await wait(300)
      await expect(
        page.locator('#field-relationHasMany .rs__value-container > .rs__multi-value'),
      ).toHaveCount(15)
    })

    test('has many, many collections', async () => {
      await page.locator('#field-relationToManyHasMany + .pre-populate-field-ui button').click()
      await wait(300)
      await expect(
        page.locator('#field-relationToManyHasMany .rs__value-container > .rs__multi-value'),
      ).toHaveCount(15)
    })
  })

  describe('field relationship with many items', () => {
    beforeEach(async () => {
      const relations: string[] = []
      const batchSize = 10
      const totalRelations = 300
      const totalBatches = Math.ceil(totalRelations / batchSize)
      for (let i = 0; i < totalBatches; i++) {
        const batchPromises: Promise<RelationOne>[] = []
        const start = i * batchSize
        const end = Math.min(start + batchSize, totalRelations)

        for (let j = start; j < end; j++) {
          batchPromises.push(
            payload.create({
              collection: relationOneSlug,
              data: {
                name: 'relation',
              },
            }),
          )
        }

        const batchRelations = await Promise.all(batchPromises)
        relations.push(...batchRelations.map((doc) => doc.id))
      }

      await payload.update({
        id: docWithExistingRelations.id,
        collection: slug,
        data: {
          relationshipHasMany: relations,
        },
      })
    })

    test('should update with new relationship', async () => {
      await page.goto(url.edit(docWithExistingRelations.id))
      await wait(300)
      const field = page.locator('#field-relationshipHasMany')
      const dropdownIndicator = field.locator('.dropdown-indicator')
      await dropdownIndicator.click({ delay: 100 })

      const options = page.locator('.rs__option')
      await expect(options).toHaveCount(2)

      await options.nth(0).click()
      await expect(field).toContainText(relationOneDoc.id)

      await saveDocAndAssert(page)
    })
  })

  describe('relationship field in where builder', () => {
    async function createRelatedDoc(): Promise<{
      cleanup: () => Promise<void>
      relatedDoc: Document
    }> {
      const relatedDoc = await payload.create({
        collection: relationOneSlug,
        data: {
          name: 'Doc to filter on',
        },
      })

      await payload.create({
        collection: slug,
        data: {
          relationship: relatedDoc.id,
          relationshipHasMany: [relatedDoc.id],
          relationshipMultiple: {
            relationTo: relationOneSlug,
            value: relatedDoc.id,
          },
          relationshipHasManyMultiple: [
            {
              relationTo: relationOneSlug,
              value: relatedDoc.id,
            },
          ],
        },
      })

      const cleanup = async () => {
        await payload.delete({
          collection: slug,
          id: relatedDoc.id,
        })
        await payload.delete({
          collection: relationOneSlug,
          id: relatedDoc.id,
        })
      }

      return {
        relatedDoc,
        cleanup,
      }
    }

    test('should filter on polymorphic hasMany=true relationship field', async () => {
      const { relatedDoc, cleanup } = await createRelatedDoc()
      await page.goto(url.list)
      await addListFilter({
        page,
        fieldLabel: 'Relationship Has Many Multiple',
        operatorLabel: 'equals',
        value: relatedDoc.id,
      })
      const tableRow = page.locator(tableRowLocator)
      await expect(tableRow).toHaveCount(1)
      await cleanup()
    })
    test('should filter on polymorphic hasMany=false relationship field', async () => {
      const { relatedDoc, cleanup } = await createRelatedDoc()
      await page.goto(url.list)
      await addListFilter({
        page,
        fieldLabel: 'Relationship Multiple',
        operatorLabel: 'equals',
        value: relatedDoc.id,
      })
      const tableRow = page.locator(tableRowLocator)
      await expect(tableRow).toHaveCount(1)
      await cleanup()
    })
    test('should filter on monomorphic hasMany=true relationship field', async () => {
      const { relatedDoc, cleanup } = await createRelatedDoc()
      await page.goto(url.list)
      await addListFilter({
        page,
        fieldLabel: 'Relationship Has Many',
        operatorLabel: 'is in',
        value: relatedDoc.id,
        multiSelect: true,
      })
      const tableRow = page.locator(tableRowLocator)
      await expect(tableRow).toHaveCount(1)
      await cleanup()
    })
  })
})

async function clearAllDocs(): Promise<void> {
  await clearCollectionDocs(slug)
  await clearCollectionDocs(relationOneSlug)
  await clearCollectionDocs(relationTwoSlug)
  await clearCollectionDocs(relationRestrictedSlug)
  await clearCollectionDocs(relationWithTitleSlug)
  await clearCollectionDocs(versionedRelationshipFieldSlug)
}

async function clearCollectionDocs(collectionSlug: CollectionSlug): Promise<void> {
  await payload.delete({
    collection: collectionSlug,
    where: {
      id: { exists: true },
    },
  })
}

async function createVersionedRelationshipFieldDoc(
  title: VersionedRelationshipField['title'],
  relationshipField?: VersionedRelationshipField['relationshipField'],
  overrides?: Partial<VersionedRelationshipField>,
): Promise<VersionedRelationshipField> {
  return payload.create({
    collection: versionedRelationshipFieldSlug,
    data: {
      title,
      relationshipField,
      ...overrides,
    },
  }) as unknown as Promise<VersionedRelationshipField>
}
