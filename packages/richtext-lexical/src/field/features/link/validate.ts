import type { Field } from 'payload/types'

import { buildStateFromSchema } from '@payloadcms/ui/forms/buildStateFromSchema'

import type { NodeValidation } from '../types.js'
import type { LinkFeatureServerProps } from './feature.server.js'
import type { SerializedAutoLinkNode, SerializedLinkNode } from './nodes/types.js'

export const linkValidation = (
  props: LinkFeatureServerProps,
  // eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents
): NodeValidation<SerializedAutoLinkNode | SerializedLinkNode> => {
  return async ({
    node,
    validation: {
      options: { id, operation, preferences, req },
    },
  }) => {
    /**
     * Run buildStateFromSchema as that properly validates link fields and link sub-fields
     */

    const data = {
      ...node.fields,
      text: 'ignored',
    }

    const result = await buildStateFromSchema({
      id,
      data,
      fieldSchema: props.fields as Field[], // Sanitized in feature.server.ts
      operation: operation === 'create' || operation === 'update' ? operation : 'update',
      preferences,
      req,
      siblingData: data,
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
