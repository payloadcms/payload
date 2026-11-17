import type { SelectionDocument } from '../../../providers/DocumentSelection/types.js'
import type { HierarchyContentsTreeState } from './state.js'
import type { ParentID } from './useHierarchyContentsTree.js'

import { allSourcesKey, branchKey } from './useHierarchyContentsTree.js'

export function getVisibleDocuments({
  branches,
  collectionSlug,
  collectionSpecificFieldName,
  expanded,
  isGroupExpanded,
  parentID,
  selectedTypes,
}: {
  branches: HierarchyContentsTreeState['branches']
  collectionSlug: string
  collectionSpecificFieldName?: string
  expanded: Set<string>
  isGroupExpanded: (args: { parentID: ParentID; source: string }) => boolean
  parentID: ParentID
  selectedTypes: string[]
}): SelectionDocument[] {
  const documents = new Map<string, SelectionDocument>()
  const selected = new Set(selectedTypes)
  const visit = ({ id, ancestors }: { ancestors: string[]; id: ParentID }) => {
    const branch = branches[branchKey({ id })]

    if (
      !branch ||
      branch.pending.includes(allSourcesKey) ||
      branch.errors.includes(allSourcesKey)
    ) {
      return
    }
    for (const source of branch.sources) {
      const isContainer = source.collectionSlug === collectionSlug

      if (
        !isContainer &&
        (!selected.has(source.collectionSlug) ||
          !isGroupExpanded({ parentID: id, source: source.collectionSlug }))
      ) {
        continue
      }
      for (const doc of source.docs) {
        const owner: unknown = doc._userEditing
        const ownerID = owner && typeof owner === 'object' && 'id' in owner ? owner.id : undefined
        const allowed: unknown =
          isContainer && collectionSpecificFieldName ? doc[collectionSpecificFieldName] : undefined

        documents.set(JSON.stringify([source.collectionSlug, doc.id]), {
          collectionSlug: source.collectionSlug,
          document: {
            id: doc.id,
            _isLocked: doc._isLocked === true,
            ...(typeof ownerID === 'string' || typeof ownerID === 'number'
              ? { _userEditing: { id: String(ownerID) } }
              : {}),
          },
          ...(Array.isArray(allowed)
            ? {
                metadata: {
                  allowedCollections: allowed.filter(
                    (value): value is string => typeof value === 'string',
                  ),
                },
              }
            : {}),
        })
        if (
          isContainer &&
          !ancestors.includes(String(doc.id)) &&
          expanded.has(branchKey({ id: doc.id }))
        ) {
          visit({ id: doc.id, ancestors: [...ancestors, String(doc.id)] })
        }
      }
    }
  }

  visit({ id: parentID, ancestors: parentID === null ? [] : [String(parentID)] })

  return [...documents.values()]
}
