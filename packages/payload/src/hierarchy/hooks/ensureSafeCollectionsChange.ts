import {
  APIError,
  type CollectionBeforeValidateHook,
  type CollectionSlug,
  type Where,
} from '../../index.js'
import { extractID } from '../../utilities/extractID.js'
import { getTranslatedLabel } from '../../utilities/getTranslatedLabel.js'

export const ensureSafeCollectionsChange =
  ({
    folderFieldName,
    foldersSlug,
    parentFieldName = 'folder',
    typeFieldName = 'hierarchyType',
  }: {
    folderFieldName: string
    foldersSlug: CollectionSlug
    parentFieldName?: string
    typeFieldName?: string
  }): CollectionBeforeValidateHook =>
  async ({ data, originalDoc, req }) => {
    const currentParentDocID = extractID(originalDoc || {})
    const hasSubmittedParent = Object.hasOwn(data ?? {}, parentFieldName)
    const hasSubmittedTypes = Object.hasOwn(data ?? {}, typeFieldName)
    const parentValue = hasSubmittedParent
      ? data?.[parentFieldName]
      : originalDoc?.[parentFieldName]
    const newParentDocID = extractID(parentValue || {})
    const originalParentDocID = extractID(originalDoc?.[parentFieldName] || {})
    const typeValue = hasSubmittedTypes ? data?.[typeFieldName] : originalDoc?.[typeFieldName]
    const types = getStringValues(typeValue)
    const originalTypes = getStringValues(originalDoc?.[typeFieldName])

    const hasParentChange = originalDoc
      ? newParentDocID !== originalParentDocID
      : hasSubmittedParent
    const hasTypeChange = originalDoc
      ? !haveSameValues({ first: types, second: originalTypes })
      : hasSubmittedTypes

    const hierarchyConfig = req.payload.collections[foldersSlug]?.config.hierarchy
    const configuredTypes =
      hierarchyConfig && typeof hierarchyConfig === 'object'
        ? Object.keys(hierarchyConfig.relatedCollections)
        : []

    if ((hasParentChange || hasTypeChange) && newParentDocID) {
      // Scope inheritance is an integrity constraint, so validate against the parent even when the
      // requester cannot read it. Only select scope data to avoid exposing inaccessible metadata.
      const parentFolder = await req.payload.findByID({
        id: newParentDocID,
        collection: foldersSlug,
        overrideAccess: true,
        req,
        select: {
          [typeFieldName]: true,
        },
        user: req.user,
      })

      const parentTypes = Array.isArray(parentFolder[typeFieldName])
        ? (parentFolder[typeFieldName] as unknown[]).filter(
            (collectionSlug): collectionSlug is string => typeof collectionSlug === 'string',
          )
        : []

      const parentAllowsEveryConfiguredType =
        configuredTypes.length > 0 &&
        configuredTypes.every((collectionSlug) => parentTypes.includes(collectionSlug))

      if (parentTypes.length > 0 && !parentAllowsEveryConfiguredType) {
        if (types.length === 0) {
          throw new APIError(
            `The folder "${data?.name || originalDoc.name}" must have folder-type set since its parent folder has a folder-type set.`,
            400,
          )
        }

        const disallowedTypes = types.filter(
          (collectionSlug) => !parentTypes.includes(collectionSlug),
        )

        if (disallowedTypes.length > 0) {
          throw new APIError(
            `The folder "${data?.name || originalDoc.name}" cannot allow collection types that its parent does not allow: ${disallowedTypes.join(', ')}`,
            400,
          )
        }
      }
    }

    if (Array.isArray(data?.[typeFieldName]) && data[typeFieldName].length > 0) {
      const typeFieldValue = data[typeFieldName] as string[]

      const currentlyAssignedCollections =
        Array.isArray(originalDoc?.[typeFieldName]) && originalDoc[typeFieldName].length > 0
          ? originalDoc[typeFieldName]
          : configuredTypes

      /**
       * Check if the assigned collections have changed.
       * example:
       * - originalAssignedCollections: ['posts', 'pages']
       * - folderType: ['posts']
       *
       * The user is narrowing the types of documents that can be associated with this folder.
       * If the user is only expanding the types of documents that can be associated with this folder,
       * we do not need to do anything.
       */
      const newCollections = currentlyAssignedCollections.filter(
        (collectionSlug) => !typeFieldValue.includes(collectionSlug),
      )

      if (newCollections && newCollections.length > 0) {
        let dependentCollection: null | string = null

        if (typeof currentParentDocID === 'string' || typeof currentParentDocID === 'number') {
          // Check each collection being removed for dependent documents
          for (const collectionSlug of newCollections) {
            const result = await req.payload.find({
              collection: collectionSlug,
              limit: 1,
              overrideAccess: true,
              req,
              where: {
                [folderFieldName]: { equals: currentParentDocID },
              },
            })

            if (result.totalDocs > 0) {
              dependentCollection = collectionSlug
              break
            }
          }

          // Also check for child folders whose effective scope is broader than the new scope.
          if (!dependentCollection) {
            const childScopeConditions: Where[] = [{ [typeFieldName]: { in: newCollections } }]
            const newScopeAllowsEveryConfiguredType = configuredTypes.every((collectionSlug) =>
              typeFieldValue.includes(collectionSlug),
            )

            if (!newScopeAllowsEveryConfiguredType) {
              childScopeConditions.push(
                { [typeFieldName]: { exists: false } },
                { [typeFieldName]: { not_in: configuredTypes } },
              )
            }

            const childFoldersResult = await req.payload.find({
              collection: foldersSlug,
              limit: 1,
              overrideAccess: true,
              req,
              where: {
                and: [
                  { [parentFieldName]: { equals: currentParentDocID } },
                  { or: childScopeConditions },
                ],
              },
            })

            if (childFoldersResult.totalDocs > 0) {
              dependentCollection = foldersSlug
            }
          }
        }

        if (dependentCollection) {
          const translatedLabels = newCollections.map((collectionSlug) => {
            if (req.payload.collections[collectionSlug]?.config.labels.singular) {
              return getTranslatedLabel(
                req.payload.collections[collectionSlug]?.config.labels.plural,
                req.i18n,
              )
            }
            return collectionSlug
          })

          const isFolder = dependentCollection === foldersSlug
          throw new APIError(
            `The folder "${data.name || originalDoc.name}" contains ${isFolder ? 'folders' : 'documents'} that still belong to the following collections: ${translatedLabels.join(', ')}`,
            400,
          )
        }

        return data
      }
    }

    return data
  }

function getStringValues(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

function haveSameValues({ first, second }: { first: string[]; second: string[] }): boolean {
  return first.length === second.length && first.every((value) => second.includes(value))
}
