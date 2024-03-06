import type { PopulationPromise } from '../types.js'
import type { UploadFeatureProps } from './feature.server.js'
import type { SerializedUploadNode } from './nodes/UploadNode.js'

import { populate } from '../../../populate/populate.js'
import { recurseNestedFields } from '../../../populate/recurseNestedFields.js'

export const uploadPopulationPromiseHOC = (
  props?: UploadFeatureProps,
): PopulationPromise<SerializedUploadNode> => {
  const uploadPopulationPromise: PopulationPromise<SerializedUploadNode> = ({
    context,
    currentDepth,
    depth,
    editorPopulationPromises,
    field,
    findMany,
    flattenLocales,
    node,
    overrideAccess,
    populationPromises,
    req,
    showHiddenFields,
    siblingDoc,
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
          context,
          currentDepth,
          data: node.fields || {},
          depth,
          editorPopulationPromises,
          fields: props?.collections?.[node?.relationTo]?.fields,
          findMany,
          flattenLocales,
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
