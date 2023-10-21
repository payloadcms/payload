import type { UploadFeatureProps } from '.'
import type { PopulationPromise } from '../types'
import type { SerializedUploadNode } from './nodes/UploadNode'

import { populate } from '../../../populate/populate'
import { recurseNestedFields } from '../../../populate/recurseNestedFields'

export const uploadPopulationPromiseHOC = (
  props?: UploadFeatureProps,
): PopulationPromise<SerializedUploadNode> => {
  const uploadPopulationPromise: PopulationPromise<SerializedUploadNode> = ({
    currentDepth,
    depth,
    field,
    node,
    overrideAccess,
    populationPromises,
    req,
    showHiddenFields,
  }) => {
    const promises: Promise<void>[] = []

    if (node?.value?.id) {
      const collection = req.payload.collections[node?.relationTo]

      if (collection) {
        promises.push(
          populate({
            id: node?.value?.id,
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
      if (Array.isArray(props?.collections?.[node?.relationTo]?.fields)) {
        recurseNestedFields({
          currentDepth,
          data: node.fields || {},
          depth,
          fields: props?.collections?.[node?.relationTo]?.fields,
          overrideAccess,
          populationPromises,
          promises,
          req,
          showHiddenFields,
          siblingDoc: node.fields || {},
        })
      }
    }

    return promises
  }

  return uploadPopulationPromise
}
