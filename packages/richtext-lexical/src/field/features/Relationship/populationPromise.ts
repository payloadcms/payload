import type { PopulationPromise } from '../types'
import type { RelationshipFeatureProps } from './index'
import type { SerializedRelationshipNode } from './nodes/RelationshipNode'

import { populate } from '../../../populate/populate'

export const relationshipPopulationPromiseHOC = (
  props: RelationshipFeatureProps,
): PopulationPromise<SerializedRelationshipNode> => {
  const relationshipPopulationPromise: PopulationPromise<SerializedRelationshipNode> = ({
    currentDepth,
    depth,
    draft,
    field,
    node,
    overrideAccess,
    req,
    showHiddenFields,
  }) => {
    const promises: Promise<void>[] = []

    if (node?.value?.id) {
      const collection = req.payload.collections[node?.relationTo]

      if (collection) {
        const populateDepth =
          props?.maxDepth !== undefined && props?.maxDepth < depth ? props?.maxDepth : depth

        promises.push(
          populate({
            id: node.value.id,
            collection,
            currentDepth,
            data: node,
            depth: populateDepth,
            draft,
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
  return relationshipPopulationPromise
}
