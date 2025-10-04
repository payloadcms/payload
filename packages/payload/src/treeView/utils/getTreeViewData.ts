import type { CollectionSlug } from '../../index.js'
import type { PayloadRequest } from '../../types/index.js'
import type { GetTreeViewDataResult } from '../types.js'

type GetTreeViewDataArgs = {
  collectionSlug: CollectionSlug
  parentFieldName: string
  req: PayloadRequest
  search?: string
  sort: any
}

export const getTreeViewData = async ({
  collectionSlug,
  parentFieldName,
  req,
  search,
  sort,
}: GetTreeViewDataArgs): Promise<GetTreeViewDataResult> => {
  const results = await req.payload.find({
    collection: collectionSlug,
    depth: 0,
    where: {
      [parentFieldName]: {
        exists: false,
      },
    },
  })

  return {
    documents: results.docs,
  }
}
