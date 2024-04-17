import { sanitizeFields } from 'payload/config'

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
    const payloadConfig = req.payload.config

    if (node?.value) {
      const collection = req.payload.collections[node?.relationTo]

      if (collection) {
        // @ts-expect-error
        const id = node?.value?.id || node?.value // for backwards-compatibility

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
      if (Array.isArray(props?.collections?.[node?.relationTo]?.fields)) {
        const validRelationships = payloadConfig.collections.map((c) => c.slug) || []

        // TODO: Sanitize & transform ahead of time! On startup!
        const sanitizedFields = sanitizeFields({
          config: payloadConfig,
          fields: props?.collections?.[node?.relationTo]?.fields,
          requireFieldLevelRichTextEditor: true,
          validRelationships,
        })

        if (!sanitizedFields?.length) {
          return
        }
        recurseNestedFields({
          context,
          currentDepth,
          data: node.fields || {},
          depth,
          editorPopulationPromises,
          fieldPromises,
          fields: sanitizedFields,
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
