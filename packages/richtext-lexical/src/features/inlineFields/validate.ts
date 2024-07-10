import { buildStateFromSchema } from '@payloadcms/ui/forms/buildStateFromSchema'

import type { NodeValidation } from '../typesServer.js'
import type { InlineFieldsFeatureProps } from './feature.server.js'
import type { SerializedInlineFieldsNode } from './nodes/InlineFieldsNode.js'

export const inlineFieldsValidationHOC = (
  props: InlineFieldsFeatureProps,
): NodeValidation<SerializedInlineFieldsNode> => {
  return async ({ node, validation }) => {
    const inlineFieldsData = node.fields ?? {}

    const {
      options: { id, operation, preferences, req },
    } = validation

    // find inlineFields
    const inlineFields = props.inlineFields.find((inlineFields) => inlineFields.key === node.key)

    // validate inlineFields
    if (!inlineFields) {
      return `InlineFields ${node.key} not found`
    }

    /**
     * Run buildStateFromSchema as that properly validates inlineFields and inlineFields sub-fields
     */

    const result = await buildStateFromSchema({
      id,
      data: inlineFieldsData,
      fieldSchema: inlineFields.fields,
      operation: operation === 'create' || operation === 'update' ? operation : 'update',
      preferences,
      req,
      siblingData: inlineFieldsData,
    })

    let errorPaths = []
    for (const fieldKey in result) {
      if (result[fieldKey].errorPaths) {
        errorPaths = errorPaths.concat(result[fieldKey].errorPaths)
      }
    }

    if (errorPaths.length) {
      return 'The following fields are invalid: ' + errorPaths.join(', ')
    }

    return true
  }
}
