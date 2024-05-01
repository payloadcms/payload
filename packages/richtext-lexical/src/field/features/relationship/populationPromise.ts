import type { PopulationPromise } from '../types.js'
import type { SerializedRelationshipNode } from './nodes/RelationshipNode.js'

import { populate } from '../../../populate/populate.js'

export const relationshipPopulationPromise: PopulationPromise<SerializedRelationshipNode> = ({
  currentDepth,
  depth,
  field,
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
      populationPromises.push(
        populate({
          id,
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
}
