import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { assertToastErrors } from 'helpers/assertToastErrors.js'
import { addListFilter } from 'helpers/e2e/addListFilter.js'
import { openDocControls } from 'helpers/e2e/openDocControls.js'
import { openCreateDocDrawer, openDocDrawer } from 'helpers/e2e/toggleDocDrawer.js'
import path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../helpers/sdk/index.js'
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

import { ensureCompilationIsDone, initPageConsoleErrorCatch, saveDocAndAssert } from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { assertNetworkRequests } from '../helpers/e2e/assertNetworkRequests.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../playwright.config.js'
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
  let page: Page
  let collectionOneDoc: Collection1
  let relationOneDoc: RelationOne
  let anotherRelationOneDoc: RelationOne
  let relationTwoDoc: RelationTwo

  let docWithExistingRelations: CollectionWithRelationships
  let restrictedRelation: RelationRestricted
  let relationWithTitle: RelationWithTitle
  let serverURL: string

  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))

    url = new AdminUrlUtil(serverURL, slug)
    versionedRelationshipFieldURL = new AdminUrlUtil(serverURL, versionedRelationshipFieldSlug)

    const context = await browser.newContext()
    page = await context.newPage()

    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL })
  })

  beforeEach(async () => {
    await ensureCompilationIsDone({ page, serverURL })

    await clearAllDocs()

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
    await page.goto(url.create)
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
    await page.goto(url.create)
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
    await page.goto(url.create)

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
    await page.goto(url.create)
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
    await page.goto(url.create)

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

  test('should duplicate document with relationships', async () => {
    await page.goto(url.edit(docWithExistingRelations.id))

    await openDocControls(page)
    await page.locator('#action-duplicate').click()
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
    const field = page.locator('#field-relationship .relationship--single-value__text')

    await expect(field).toHaveText(relationOneDoc.id)
  })

  async function runFilterOptionsTest(fieldName: string, fieldLabel: string) {
    await page.reload()
    await page.goto(url.edit(docWithExistingRelations.id))
    const field = page.locator('#field-relationship')
    await expect(field.locator('input')).toBeEnabled()
    await field.click({ delay: 100 })
    const options = page.locator('.rs__option')
    await options.nth(0).click()
    await expect(field).toContainText(relationOneDoc.id)
    let filteredField = page.locator(`#field-${fieldName} .react-select`)
    await filteredField.click({ delay: 100 })
    let filteredOptions = filteredField.locator('.rs__option')
    await expect(filteredOptions).toHaveCount(1) // one doc
    await filteredOptions.nth(0).click()
    await expect(filteredField).toContainText(relationOneDoc.id)
    await field.click({ delay: 100 })
    await options.nth(1).click()
    await expect(field).toContainText(anotherRelationOneDoc.id)
    await wait(2000) // Need to wait form state to come back before clicking save
    await page.locator('#action-save').click()
    await assertToastErrors({
      page,
      errors: [fieldLabel],
    })
    filteredField = page.locator(`#field-${fieldName} .react-select`)
    await filteredField.click({ delay: 100 })
    filteredOptions = filteredField.locator('.rs__option')
    await expect(filteredOptions).toHaveCount(2) // two options because the currently selected option is still there
    await filteredOptions.nth(1).click()
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
      const field = page.locator('#field-relationshipFilteredByField')
      await field.click({ delay: 100 })
      const options = field.locator('.rs__option')
      await expect(options).toHaveCount(1)
      await expect(options).toContainText(idToInclude)

      // now ensure that the same filter options are applied in the list view
      await page.goto(url.list)

      const { whereBuilder } = await addListFilter({
        page,
        fieldLabel: 'Relationship Filtered By Field',
        operatorLabel: 'equals',
        skipValueInput: true,
      })

      const valueInput = page.locator('.condition__value input')
      await valueInput.click()
      const valueOptions = whereBuilder.locator('.condition__value .rs__option')

      await expect(valueOptions).toHaveCount(2)
      await expect(valueOptions.locator(`text=None`)).toBeVisible()
      await expect(valueOptions.locator(`text=${idToInclude}`)).toBeVisible()
    })

    test('should apply filter options of nested fields to list view filter controls', async () => {
      const { id: idToInclude } = await payload.create({
        collection: slug,
        data: {
          filter: 'Include me',
        },
      })

      // first ensure that filter options are applied in the edit view
      await page.goto(url.edit(idToInclude))
      const field = page.locator('#field-nestedRelationshipFilteredByField')
      await field.click({ delay: 100 })
      const options = field.locator('.rs__option')
      await expect(options).toHaveCount(1)
      await expect(options).toContainText(idToInclude)

      // now ensure that the same filter options are applied in the list view
      await page.goto(url.list)

      const { whereBuilder } = await addListFilter({
        page,
        fieldLabel: 'Collapsible > Nested Relationship Filtered By Field',
        operatorLabel: 'equals',
        skipValueInput: true,
      })

      const valueInput = page.locator('.condition__value input')
      await valueInput.click()
      const valueOptions = whereBuilder.locator('.condition__value .rs__option')

      await expect(valueOptions).toHaveCount(2)
      await expect(valueOptions.locator(`text=None`)).toBeVisible()
      await expect(valueOptions.locator(`text=${idToInclude}`)).toBeVisible()
    })

    test('should allow usage of relationTo in filterOptions', async () => {
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

      await page.goto(url.create)

      // select relationshipMany field that relies on siblingData field above
      await page.locator('#field-relationshipManyFiltered .rs__control').click()

      const options = page.locator('#field-relationshipManyFiltered .rs__menu')
      await expect(options).toContainText(include)
      await expect(options).not.toContainText(exclude)
    })

    test('should allow usage of siblingData in filterOptions', async () => {
      await payload.create({
        collection: relationWithTitleSlug,
        data: {
          name: 'exclude',
        },
      })

      await page.goto(url.create)

      // enter a filter for relationshipManyFiltered to use
      await page.locator('#field-filter').fill('include')

      // select relationshipMany field that relies on siblingData field above
      await page.locator('#field-relationshipManyFiltered .rs__control').click()

      const options = page.locator('#field-relationshipManyFiltered .rs__menu')
      await expect(options).not.toContainText('exclude')
    })

    // TODO: Flaky test in CI - fix. https://github.com/payloadcms/payload/actions/runs/8559547748/job/23456806365
    test.skip('should not query for a relationship when filterOptions returns false', async () => {
      await payload.create({
        collection: relationFalseFilterOptionSlug,
        data: {
          name: 'whatever',
        },
      })

      await page.goto(url.create)

      // select relationshipMany field that relies on siblingData field above
      await page.locator('#field-relationshipManyFiltered .rs__control').click()

      const options = page.locator('#field-relationshipManyFiltered .rs__menu')
      await expect(options).toContainText('Relation With Titles')
      await expect(options).not.toContainText('whatever')
    })

    // TODO: Flaky test in CI - fix.
    test('should show a relationship when filterOptions returns true', async () => {
      await payload.create({
        collection: relationTrueFilterOptionSlug,
        data: {
          name: 'truth',
        },
      })

      await page.goto(url.create)
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

    await openDocDrawer({
      page,
      selector:
        '#field-relationshipReadOnly button.relationship--single-value__drawer-toggler.doc-drawer__toggler',
    })

    const documentDrawer = page.locator('[id^=doc-drawer_relation-one_1_]')
    await expect(documentDrawer).toBeVisible()
  })

  test('should open document drawer and append newly created docs onto the parent field', async () => {
    await page.goto(url.edit(docWithExistingRelations.id))
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
    await expect(page.locator('.payload-toast-container')).toContainText('Updated successfully')
    await page.locator('.doc-drawer__header-close').click()
    await expect(
      page.locator('#field-relationshipHasMany .value-container .rs__multi-value'),
    ).toHaveCount(1)
  })

  test('should update relationship from drawer without enabling save in main doc', async () => {
    await page.goto(url.edit(docWithExistingRelations.id))

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
      const field = page.locator('#field-relationship')
      await expect(field.locator('input')).toBeEnabled()
      await field.click({ delay: 100 })
      await expect(page.locator('.rs__option--is-selected')).toHaveCount(1)
      await expect(page.locator('.rs__option--is-selected')).toHaveText(relationOneDoc.id)
    })

    test('should show untitled ID on restricted relation', async () => {
      await page.goto(url.edit(docWithExistingRelations.id))

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
      const input = page.locator('#field-relationshipWithTitle input')
      await input.fill('title')
      const options = page.locator('#field-relationshipWithTitle .rs__menu .rs__option')
      await expect(options).toHaveCount(1)

      await input.fill('non-occurring-string')
      await expect(options).toHaveCount(0)
    })

    test('should search using word boundaries within the relationship field', async () => {
      await page.goto(url.edit(docWithExistingRelations.id))
      const input = page.locator('#field-relationshipWithTitle input')
      await input.fill('word search')
      const options = page.locator('#field-relationshipWithTitle .rs__menu .rs__option')
      await expect(options).toHaveCount(1)
    })

    test('should show useAsTitle on relation', async () => {
      await page.goto(url.edit(docWithExistingRelations.id))

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
      await wait(110)
      const relationship = page.locator('.row-1 .cell-relationship')
      await expect(relationship).toHaveText(relationOneDoc.id)
    })

    test('should show Untitled ID on restricted relation in list view', async () => {
      await page.goto(url.list)
      await wait(110)
      const relationship = page.locator('.row-1 .cell-relationshipRestricted')
      await expect(relationship).toContainText('Untitled - ID: ')
    })

    test('x in list view', async () => {
      await page.goto(url.list)
      await wait(110)
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

      // check first doc on first page
      const relationship = page.locator('.row-1 .cell-relationshipHasManyMultiple')
      await expect(relationship).toHaveText(relationTwoDoc.id)

      const paginator = page.locator('.clickable-arrow--right')
      await paginator.click()
      await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('page=2')

      // check first doc on second page (should be different)
      await expect(relationship).toContainText(relationOneDoc.id)
    })
  })

  describe('externally update relationship field', () => {
    beforeEach(async () => {
      const externalRelationURL = new AdminUrlUtil(serverURL, relationUpdatedExternallySlug)
      await page.goto(externalRelationURL.create)
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
})

async function clearAllDocs(): Promise<void> {
  await clearCollectionDocs(slug)
  await clearCollectionDocs(relationOneSlug)
  await clearCollectionDocs(relationTwoSlug)
  await clearCollectionDocs(relationRestrictedSlug)
  await clearCollectionDocs(relationWithTitleSlug)
  await clearCollectionDocs(versionedRelationshipFieldSlug)
}

async function clearCollectionDocs(collectionSlug: string): Promise<void> {
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
