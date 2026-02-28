import type { CollectionConfig } from '../collections/config/types.js'

/**
 * Injects the HierarchyButton component into a collection's BeforeDocumentMeta slot.
 *
 * The HierarchyButton provides a header UI for selecting parent hierarchy items
 * via miller columns, replacing the standard relationship field input.
 */
export const injectHierarchyButton = ({
  collection,
  fieldName,
  hierarchyCollectionSlug,
  parentFieldName,
}: {
  collection: CollectionConfig
  fieldName: string
  hierarchyCollectionSlug: string
  parentFieldName: string
}): void => {
  collection.admin = collection.admin || {}
  collection.admin.components = collection.admin.components || {}
  collection.admin.components.edit = collection.admin.components.edit || {}

  const hierarchyComponent = {
    path: '@payloadcms/ui/rsc#HierarchyButton',
    serverProps: {
      collectionSlug: hierarchyCollectionSlug,
      fieldName,
      parentFieldName,
    },
  }

  const existingComponents = collection.admin.components.edit.BeforeDocumentMeta || []
  const componentPath = '@payloadcms/ui/rsc#HierarchyButton'

  const alreadyInjected = existingComponents.some((c) => {
    if (typeof c === 'string') {
      return c === componentPath
    }
    if (c && typeof c === 'object' && 'path' in c) {
      return c.path === componentPath
    }
    return false
  })

  if (!alreadyInjected) {
    collection.admin.components.edit.BeforeDocumentMeta = [
      hierarchyComponent,
      ...existingComponents,
    ]
  }
}
