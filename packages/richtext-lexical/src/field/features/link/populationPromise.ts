import { sanitizeFields } from 'payload/config'
import { deepCopyObject } from 'payload/utilities'

import type { PopulationPromise } from '../types.js'
import type { LinkFeatureServerProps } from './feature.server.js'
import type { SerializedLinkNode } from './nodes/types.js'

import { recurseNestedFields } from '../../../populate/recurseNestedFields.js'
import { transformExtraFields } from './plugins/floatingLinkEditor/utilities.js'

export const linkPopulationPromiseHOC = (
  props: LinkFeatureServerProps,
): PopulationPromise<SerializedLinkNode> => {
  return ({
    context,
    currentDepth,
    depth,
    editorPopulationPromises,
    fieldPromises,
    findMany,
    flattenLocales,
    node,
    overrideAccess,
    populationPromises,
    req,
    showHiddenFields,
  }) => {
    // Sanitize link's fields here. This is done here and not in the feature, because the payload config is available here
    const payloadConfig = req.payload.config
    const validRelationships = payloadConfig.collections.map((c) => c.slug) || []

    const transformedFields = transformExtraFields(
      deepCopyObject(props.fields),
      payloadConfig,
      req.i18n,
      props.enabledCollections,
      props.disabledCollections,
    )

    // TODO: Sanitize & transform ahead of time! On startup!
    const sanitizedFields = sanitizeFields({
      config: payloadConfig,
      fields: transformedFields,
      requireFieldLevelRichTextEditor: true,
      validRelationships,
    })

    if (!sanitizedFields?.length) {
      return
    }

    /**
     * Should populate all fields, including the doc field (for internal links), as it's treated like a normal field
     */
    if (Array.isArray(sanitizedFields)) {
      recurseNestedFields({
        context,
        currentDepth,
        data: {
          fields: node.fields,
        },
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
        siblingDoc: {
          fields: node.fields,
        },
      })
    }
  }
}
