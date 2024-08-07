import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'

import type {
  Collection1,
  FieldsRelationship as CollectionWithRelationships,
  RelationOne,
  RelationRestricted,
  RelationTwo,
  RelationWithTitle,
  VersionedRelationshipField,
} from './payload-types'

import payload from '../../packages/payload/src'
import wait from '../../packages/payload/src/utilities/wait'
import { initPageConsoleErrorCatch, openDocControls, saveDocAndAssert } from '../helpers'
import { AdminUrlUtil } from '../helpers/adminUrlUtil'
import { initPayloadE2E } from '../helpers/configHelpers'
import {
  collection1Slug,
  relationFalseFilterOptionSlug,
  relationOneSlug,
  relationRestrictedSlug,
  relationTrueFilterOptionSlug,
  relationTwoSlug,
  relationUpdatedExternallySlug,
  relationWithTitleSlug,
  slug,
  versionedRelationshipFieldSlug,
} from './collectionSlugs'

const { beforeAll, beforeEach, describe } = test

describe('fields - relationship', () => {
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

  beforeAll(async ({ browser }) => {
    const { serverURL: serverURLFromConfig } = await initPayloadE2E(__dirname)
    serverURL = serverURLFromConfig

    url = new AdminUrlUtil(serverURL, slug)
    versionedRelationshipFieldURL = new AdminUrlUtil(serverURL, versionedRelationshipFieldSlug)

    const context = await browser.newContext()
    page = await context.newPage()

    initPageConsoleErrorCatch(page)
  })

  beforeEach(async () => {
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

    await field.click({ delay: 100 })

    const options = page.locator('.rs__option')

    await expect(options).toHaveCount(2) // two docs

    // Select a relationship
    await options.nth(0).click()
    await expect(field).toContainText(relationOneDoc.id)

    await saveDocAndAssert(page)
  })

  test('should create relations to multiple collections', async () => {
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
    await field.click({ delay: 100 })

    const options = page.locator('.rs__option')

    await expect(options).toHaveCount(2) // Two relationship options

    const values = page.locator('#field-relationshipHasMany .relationship--multi-value-label__text')

    // Add one relationship
    await options.locator(`text=${relationOneDoc.id}`).click()
    await expect(values).toHaveText([relationOneDoc.id])
    await expect(values).not.toHaveText([anotherRelationOneDoc.id])

    // Add second relationship
    await field.click({ delay: 100 })
    await options.locator(`text=${anotherRelationOneDoc.id}`).click()
    await expect(values).toHaveText([relationOneDoc.id, anotherRelationOneDoc.id])

    // No options left
    await field.locator('.rs__input').click({ delay: 100 })
    await expect(page.locator('.rs__menu')).toHaveText('No options')

    await saveDocAndAssert(page)
    await wait(200)
    await expect(values).toHaveText([relationOneDoc.id, anotherRelationOneDoc.id])
  })

  test('should create many relations to multiple collections', async () => {
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
    await expect(page.locator('.Toastify')).toContainText('successfully')
    const field = page.locator('#field-relationship .relationship--single-value__text')

    await expect(field).toHaveText(relationOneDoc.id)
  })

  async function runFilterOptionsTest(fieldName: string) {
    await page.goto(url.edit(docWithExistingRelations.id))

    // fill the first relation field
    const field = page.locator('#field-relationship')
    await field.click({ delay: 100 })
    const options = page.locator('.rs__option')
    await options.nth(0).click()
    await expect(field).toContainText(relationOneDoc.id)

    // then verify that the filtered field's options match
    let filteredField = page.locator(`#field-${fieldName} .react-select`)
    await filteredField.click({ delay: 100 })
    const filteredOptions = filteredField.locator('.rs__option')
    await expect(filteredOptions).toHaveCount(1) // one doc
    await filteredOptions.nth(0).click()
    await expect(filteredField).toContainText(relationOneDoc.id)

    // change the first relation field
    await field.click({ delay: 100 })
    await options.nth(1).click()
    await expect(field).toContainText(anotherRelationOneDoc.id)

    // Now, save the document. This should fail, as the filitered field doesn't match the selected relationship value
    await page.locator('#action-save').click()
    await expect(page.locator('.Toastify')).toContainText(`is invalid: ${fieldName}`)

    // then verify that the filtered field's options match
    filteredField = page.locator(`#field-${fieldName} .react-select`)
    await filteredField.click({ delay: 100 })
    await expect(filteredOptions).toHaveCount(2) // two options because the currently selected option is still there
    await filteredOptions.nth(1).click()
    await expect(filteredField).toContainText(anotherRelationOneDoc.id)

    // Now, saving the document should succeed
    await saveDocAndAssert(page)
  }

  test('should allow dynamic filterOptions', async () => {
    await runFilterOptionsTest('relationshipFiltered')
  })

  test('should allow dynamic async filterOptions', async () => {
    await runFilterOptionsTest('relationshipFilteredAsync')
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

  test('should not query for a relationship when filterOptions returns false', async () => {
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

  test('should show a relationship when filterOptions returns true', async () => {
    await payload.create({
      collection: relationTrueFilterOptionSlug,
      data: {
        name: 'truth',
      },
    })

    await page.goto(url.create)

    // select relationshipMany field that relies on siblingData field above
    await page.locator('#field-relationshipManyFiltered .rs__control').click()

    const options = page.locator('#field-relationshipManyFiltered .rs__menu')
    await expect(options).toContainText('truth')
  })

  test('should use filterOptions in the list view where builder', async () => {
    const relationOneDoc = await payload.create({
      collection: relationOneSlug,
      data: {
        name: 'include',
      },
    })
    const relationOneMiss = await payload.create({
      collection: relationOneSlug,
      data: {
        name: 'ignored',
      },
    })

    await page.goto(url.list)

    // expand the filter options
    await page.locator('.list-controls__toggle-where').click()

    // click add filter
    await page.locator('.where-builder__add-first-filter').click()

    // select the "Relationship Many Filtered" field
    await page.locator('.condition__field .rs__control').click()
    const options = page.locator('.rs__option')
    await options.locator('text=Relationship Many Filtered').click()

    // select the equals operator
    await page.locator('.condition__operator .rs__control').click()
    const operatorOptions = page.locator('.rs__option')
    await operatorOptions.locator('text=equals').click()

    // open the value dropdown
    await page.locator('.condition__value .rs__control').click()

    // expect that relation-one has the option of the document id
    const valueOptions = page.locator('.rs__option')

    await expect(valueOptions.locator(`text=${relationOneDoc.id}`)).toHaveCount(1)
    await expect(valueOptions.locator(`text=${relationOneMiss.id}`)).toHaveCount(0)

    // enter something in search
    await page
      .locator('.condition__value .rs__input')
      .fill(relationOneDoc.id.toString().slice(0, 5))

    // remove focus
    await page.locator('.condition__value .rs__input').blur()

    // open the value dropdown
    await page.locator('.condition__value .rs__control').click()

    // expect that relation-one has the option of the document id
    const valueOptionsWithSearch = page.locator('.rs__option')

    await expect(valueOptionsWithSearch.locator(`text=${relationOneDoc.id}`)).toHaveCount(1)
    await expect(valueOptionsWithSearch.locator(`text=${relationOneMiss.id}`)).toHaveCount(0)
  })

  test('should open document drawer from read-only relationships', async () => {
    await page.goto(url.edit(docWithExistingRelations.id))

    const field = page.locator('#field-relationshipReadOnly')

    const button = field.locator(
      'button.relationship--single-value__drawer-toggler.doc-drawer__toggler',
    )
    await button.click()

    const documentDrawer = page.locator('[id^=doc-drawer_relation-one_1_]')
    await expect(documentDrawer).toBeVisible()
  })

  test('should open document drawer and append newly created docs onto the parent field', async () => {
    await page.goto(url.edit(docWithExistingRelations.id))

    const field = page.locator('#field-relationshipHasMany')

    // open the document drawer
    const addNewButton = field.locator(
      'button.relationship-add-new__add-button.doc-drawer__toggler',
    )
    await addNewButton.click()
    const documentDrawer = page.locator('[id^=doc-drawer_relation-one_1_]')
    await expect(documentDrawer).toBeVisible()

    // fill in the field and save the document, keep the drawer open for further testing
    const drawerField = documentDrawer.locator('#field-name')
    await drawerField.fill('Newly created document')
    const saveButton = documentDrawer.locator('#action-save')
    await saveButton.click()
    await expect(page.locator('.Toastify')).toContainText('successfully')

    // count the number of values in the field to ensure only one was added
    await expect(
      page.locator('#field-relationshipHasMany .value-container .rs__multi-value'),
    ).toHaveCount(1)

    // save the same document again to ensure the relationship field doesn't receive duplicative values
    await saveButton.click()
    await expect(page.locator('.Toastify')).toContainText('successfully')
    await expect(
      page.locator('#field-relationshipHasMany .value-container .rs__multi-value'),
    ).toHaveCount(1)
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
    await page.locator('.list-controls__toggle-where').click()
    await page.waitForSelector('.list-controls__where.rah-static--height-auto')
    await page.locator('.where-builder__add-first-filter').click()

    const conditionField = page.locator('.condition__field')
    await conditionField.click()

    const dropdownFieldOptions = conditionField.locator('.rs__option')
    await dropdownFieldOptions.locator('text=Relationship Field').nth(0).click()

    const operatorField = page.locator('.condition__operator')
    await operatorField.click()

    const dropdownOperatorOptions = operatorField.locator('.rs__option')
    await dropdownOperatorOptions.locator('text=exists').click()

    const valueField = page.locator('.condition__value')
    await valueField.click()
    const dropdownValueOptions = valueField.locator('.rs__option')
    await dropdownValueOptions.locator('text=True').click()

    await expect(page.locator(tableRowLocator)).toHaveCount(1)
  })

  describe('existing relationships', () => {
    test('should highlight existing relationship', async () => {
      await page.goto(url.edit(docWithExistingRelations.id))

      const field = page.locator('#field-relationship')

      // Check dropdown options
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
  })

  describe('externally update relationship field', () => {
    beforeAll(async () => {
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
