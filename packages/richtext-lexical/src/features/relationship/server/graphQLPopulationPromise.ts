import type { PopulationPromise } from '../../typesServer.js'
import type { RelationshipFeatureProps } from './index.js'
import type { SerializedRelationshipNode } from './schema.js'

import { populate } from '../../../populateGraphQL/populate.js'

export const relationshipPopulationPromiseHOC = (
  props: RelationshipFeatureProps,
): PopulationPromise<SerializedRelationshipNode> => {
  const relationshipPopulationPromise: PopulationPromise<SerializedRelationshipNode> = ({
    currentDepth,
    depth,
    node,
    overrideAccess,
    populationPromises,
    req,
    showHiddenFields,
    version,
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
            collectionSlug: collection.config.slug,
            currentDepth,
            data: node,
            depth: populateDepth,
            key: 'value',
            overrideAccess,
            req,
            showHiddenFields,
            version,
          }),
        )
      }
    }
  }

  return relationshipPopulationPromise
}
