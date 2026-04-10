import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'
import { wait } from 'payload/shared'

import { selectInput } from '../../selectInput.js'

/**
 * Opens a list drawer for a relationship field with appearance="drawer"
 * and optionally selects a specific collection type for polymorphic relationships.
 *
 * @param page - Playwright Page object
 * @param fieldName - Name of the relationship field (e.g., 'relationship', 'relationshipHasMany')
 * @param selectRelation - Optional: Collection slug to select for polymorphic relationships (e.g., 'posts', 'users')
 *
 * @example
 * // Open list drawer for a non-polymorphic relationship
 * await openRelationshipFieldDrawer({ page, fieldName: 'relationship' })
 *
 * @example
 * // Open list drawer and select a specific collection for polymorphic relationship
 * await openRelationshipFieldDrawer({
 *   page,
 *   fieldName: 'polymorphicRelationship',
 *   selectRelation: 'tenants'
 * })
 */
export async function openRelationshipFieldDrawer({
  fieldName,
  page,
  selectRelation,
}: {
  fieldName: string
  page: Page
  selectRelation?: string
}): Promise<void> {
  await wait(300)

  // Click the relationship field to open the list drawer
  const relationshipField = page.locator(`#field-${fieldName}`)
  await relationshipField.click()

  // Wait for list drawer to be visible
  const listDrawerContent = page.locator('.list-drawer').locator('.drawer__content')
  await expect(listDrawerContent).toBeVisible()

  // If a specific relation type should be selected (for polymorphic relationships)
  if (selectRelation) {
    const relationToSelector = page.locator('.list-header__select-collection')
    await expect(relationToSelector).toBeVisible()

    await selectInput({
      selectLocator: relationToSelector,
      option: selectRelation,
      multiSelect: false,
      selectType: 'select',
    })
  }
}
