import type { UploadFeatureProps } from '.'
import type { PopulationPromise } from '../types'
import type { SerializedUploadNode } from './nodes/UploadNode'

import { populate } from '../../../populate/populate'
import { recurseNestedFields } from '../../../populate/recurseNestedFields'

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
        const populateDepth =
          props?.maxDepth !== undefined && props?.maxDepth < depth ? props?.maxDepth : depth

        promises.push(
          populate({
            id: node?.value?.id,
            collection,
            currentDepth,
            data: node,
            depth: populateDepth,
            draft: false,
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
          draft: false,
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
