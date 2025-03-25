import type { PopulationPromise } from '../../typesServer.js'
import type { UploadFeatureProps } from './index.js'
import type { SerializedUploadNode } from './nodes/UploadNode.js'

import { populate } from '../../../populateGraphQL/populate.js'
import { recursivelyPopulateFieldsForGraphQL } from '../../../populateGraphQL/recursivelyPopulateFieldsForGraphQL.js'

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
    parentIsLocalized,
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
            collectionSlug: collection.config.slug,
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

        const collectionFieldSchema = props?.collections?.[node?.relationTo]?.fields

        if (Array.isArray(collectionFieldSchema)) {
          if (!collectionFieldSchema?.length) {
            return
          }
          recursivelyPopulateFieldsForGraphQL({
            context,
            currentDepth,
            data: node.fields || {},
            depth,
            parentIsLocalized: parentIsLocalized || field.localized || false,

            draft,
            editorPopulationPromises,
            fieldPromises,
            fields: collectionFieldSchema,
            findMany,
            flattenLocales,
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
}
