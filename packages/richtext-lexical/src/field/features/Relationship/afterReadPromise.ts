import type { AfterReadPromise } from '../types'
import type { SerializedRelationshipNode } from './nodes/RelationshipNode'

import { populate } from '../../../populate/populate'

export const relationshipAfterReadPromise: AfterReadPromise<SerializedRelationshipNode> = ({
  currentDepth,
  depth,
  field,
  node,
  overrideAccess,
  req,
  showHiddenFields,
}) => {
  const promises: Promise<void>[] = []

  if (node?.fields?.id) {
    const collection = req.payload.collections[node?.fields?.relationTo]

    if (collection) {
      promises.push(
        populate({
          id: node?.fields?.id,
          collection,
          currentDepth,
          data: node,
          depth,
          field,
          key: 'value',
          overrideAccess,
          req,
          showHiddenFields,
        }),
      )
    }
  }

  return promises
}
