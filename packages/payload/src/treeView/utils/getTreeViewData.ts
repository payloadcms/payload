import type { CollectionSlug } from '../../index.js'
import type { PayloadRequest } from '../../types/index.js'
import type { GetTreeViewDataResult, TreeViewDocument } from '../types.js'

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
    sort,
    where: {
      or: [
        {
          [parentFieldName]: {
            exists: false,
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

  // format documents into TreeViewDocument type
  const result: TreeViewDocument[] = results.docs.map((doc) =>
    formatTreeViewDocumentItem({
      relationTo: collectionSlug,
      useAsTitle: fullTitleFieldName,
      value: doc,
    }),
  )

  return {
    documents: result,
  }
}
