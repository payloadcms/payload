import type { PopulationPromise } from '../types.js'
import type { RelationshipFeatureProps } from './feature.server.js'
import type { SerializedRelationshipNode } from './nodes/RelationshipNode.js'

import { populate } from '../../../populateGraphQL/populate.js'

export const relationshipPopulationPromiseHOC = (
  props: RelationshipFeatureProps,
): PopulationPromise<SerializedRelationshipNode> => {
  const relationshipPopulationPromise: PopulationPromise<SerializedRelationshipNode> = ({
    currentDepth,
    depth,
    draft,
    node,
    overrideAccess,
    populationPromises,
    req,
    showHiddenFields,
  }) => {
    if (node?.value) {
      // @ts-expect-error
      const id = node?.value?.id || node?.value // for backwards-compatibility

      const collection = req.payload.collections[node?.relationTo]

      if (collection) {
        const populateDepth =
          props?.maxDepth !== undefined && props?.maxDepth < depth ? props?.maxDepth : depth

        populationPromises.push(
          populate({
            id,
            collection,
            currentDepth,
            data: node,
            depth: populateDepth,
            draft,
            key: 'value',
            overrideAccess,
            req,
            showHiddenFields,
          }),
        )
      }
    }
  }

  return relationshipPopulationPromise
}
