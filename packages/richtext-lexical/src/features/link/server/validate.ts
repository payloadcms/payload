import type { Field } from 'payload'

import { fieldSchemasToFormState } from '@payloadcms/ui/forms/fieldSchemasToFormState'

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
     * Run fieldSchemasToFormState as that properly validates link fields and link sub-fields
     */

    const result = await fieldSchemasToFormState({
      id,
      collectionSlug,
      data: node.fields,
      fields: sanitizedFieldsWithoutText, // Sanitized in feature.server.ts
      fieldSchemaMap: undefined,
      operation: operation === 'create' || operation === 'update' ? operation : 'update',
      permissions: {},
      preferences,
      renderAllFields: false,
      req,
      schemaPath: '',
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
