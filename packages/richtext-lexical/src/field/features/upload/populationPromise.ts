import type { PopulationPromise } from '../types.js'
import type { UploadFeatureProps } from './feature.server.js'
import type { SerializedUploadNode } from './nodes/UploadNode.js'

import { populate } from '../../../populate/populate.js'
import { recurseNestedFields } from '../../../populate/recurseNestedFields.js'

export const uploadPopulationPromiseHOC = (
  props?: UploadFeatureProps,
): PopulationPromise<SerializedUploadNode> => {
  return ({
    context,
    currentDepth,
    depth,
    draft,
    editorPopulationPromises,
    field,
    fieldPromises,
    findMany,
    flattenLocales,
    node,
    overrideAccess,
    populationPromises,
    req,
    showHiddenFields,
  }) => {
    if (node?.value) {
      const collection = req.payload.collections[node?.relationTo]

      if (collection) {
        // @ts-expect-error
        const id = node?.value?.id || node?.value // for backwards-compatibility

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
            field,
            key: 'value',
            overrideAccess,
            req,
            showHiddenFields,
          }),
        )
      }
      if (Array.isArray(props?.collections?.[node?.relationTo]?.fields)) {
        if (!props?.collections?.[node?.relationTo]?.fields?.length) {
          return
        }
        recurseNestedFields({
          context,
          currentDepth,
          data: node.fields || {},
          depth,
          draft,
          editorPopulationPromises,
          fieldPromises,
          fields: props?.collections?.[node?.relationTo]?.fields,
          findMany,
          flattenLocales: false, // Disable localization handling which does not work properly yet. Once we fully support hooks, this can be enabled (pass through flattenLocales again)
          overrideAccess,
          populationPromises,
          req,
          showHiddenFields,
          siblingDoc: node.fields || {},
        })
      }
    }
  }
}
