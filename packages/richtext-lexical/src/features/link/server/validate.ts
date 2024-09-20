import type { Field } from 'payload'

import { buildStateFromSchema } from '@payloadcms/ui/forms/buildStateFromSchema'

import type { NodeValidation } from '../../typesServer.js'
import type { SerializedAutoLinkNode, SerializedLinkNode } from '../nodes/types.js'
import type { LinkFeatureServerProps } from './index.js'

export const linkValidation = (
  props: LinkFeatureServerProps,
  sanitizedFieldsWithoutText: Field[],
): NodeValidation<SerializedAutoLinkNode | SerializedLinkNode> => {
  return async ({
    node,
    validation: {
      options: { id, collectionSlug, operation, preferences, req },
    },
  }) => {
    /**
     * Run buildStateFromSchema as that properly validates link fields and link sub-fields
     */

    const result = await buildStateFromSchema({
      id,
      collectionSlug,
      data: node.fields,
      fieldSchema: sanitizedFieldsWithoutText, // Sanitized in feature.server.ts
      operation: operation === 'create' || operation === 'update' ? operation : 'update',
      preferences,
      req,
      siblingData: node.fields,
    })

    let errorPaths: string[] = []
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
