import type { CollectionSlug } from '../../index.js'
import type { PayloadRequest } from '../../types/index.js'
import type { GetTreeViewDataResult, TreeViewItem } from '../types.js'

import { formatTreeViewDocumentItem } from './formatTreeViewDocumentItem.js'

type GetTreeViewDataArgs = {
  collectionSlug: CollectionSlug
  expandedItemIDs?: (number | string)[]
  fullTitleFieldName: string
  parentFieldName: string
  req: PayloadRequest
  search?: string
  sort: any
}

export const getTreeViewData = async ({
  collectionSlug,
  expandedItemIDs,
  fullTitleFieldName,
  parentFieldName,
  req,
  search,
  sort,
}: GetTreeViewDataArgs): Promise<GetTreeViewDataResult> => {
  const results = await req.payload.find({
    collection: collectionSlug,
    depth: 0,
    limit: 100,
    overrideAccess: false,
    req,
    sort,
    user: req.user,
    where: {
      or: [
        {
          [parentFieldName]: {
            exists: false,
          },
        },
        {
          [parentFieldName]: {
            equals: null,
          },
        },
        {
          [parentFieldName]: {
            in: expandedItemIDs,
          },
        },
      ],
    },
  })

  // format documents into TreeViewItem type
  const result: TreeViewItem[] = results.docs.map((doc) =>
    formatTreeViewDocumentItem({
      relationTo: collectionSlug,
      useAsTitle: fullTitleFieldName,
      value: doc,
    }),
  )

  // Identify parent IDs and potential leaf nodes
  const parentIDsInResult = new Set<number | string>()
  const potentialLeafNodeIDs: (number | string)[] = []

  for (const doc of result) {
    if (doc.value.parentID) {
      parentIDsInResult.add(doc.value.parentID)
    }
  }

  for (const doc of result) {
    if (!parentIDsInResult.has(doc.value.id)) {
      potentialLeafNodeIDs.push(doc.value.id)
    }
  }

  // Query the database to get all distinct parent IDs to determine which nodes actually have children
  if (potentialLeafNodeIDs.length > 0) {
    const distinctParents = await req.payload.findDistinct({
      collection: collectionSlug,
      field: parentFieldName,
      where: {
        [parentFieldName]: {
          in: potentialLeafNodeIDs,
        },
      },
    })

    // Create a Set of IDs that actually have children in the database
    const idsWithChildren = new Set(distinctParents.values.map((doc) => doc[parentFieldName]))

    // Mark documents that have no children as leaf nodes
    result.forEach((doc) => {
      if (potentialLeafNodeIDs.includes(doc.value.id) && !idsWithChildren.has(doc.value.id)) {
        doc.hasChildren = false
      }
    })
  }

  return {
    items: result,
  }
}
