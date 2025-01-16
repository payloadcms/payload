import type { Block } from 'payload'

import { fieldSchemasToFormState } from '@payloadcms/ui/forms/fieldSchemasToFormState'

import type { NodeValidation } from '../../typesServer.js'
import type { BlockFields, SerializedBlockNode } from './nodes/BlocksNode.js'
import type { SerializedInlineBlockNode } from './nodes/InlineBlocksNode.js'

export const blockValidationHOC = (
  blocks: Block[],
): NodeValidation<SerializedBlockNode | SerializedInlineBlockNode> => {
  return async ({ node, validation }) => {
    const blockFieldData = node.fields ?? ({} as BlockFields)

    const {
      options: { id, collectionSlug, operation, preferences, req },
    } = validation

    // find block
    const block = blocks.find((block) => block.slug === blockFieldData.blockType)

    // validate block
    if (!block) {
      return `Block ${blockFieldData.blockType} not found`
    }

    /**
     * Run fieldSchemasToFormState as that properly validates block and block sub-fields
     */

    const result = await fieldSchemasToFormState({
      id,
      collectionSlug,
      data: blockFieldData,
      fields: block.fields,
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
