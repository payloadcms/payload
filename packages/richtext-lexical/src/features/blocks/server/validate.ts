import type { Block } from 'payload'

import { fieldSchemasToFormState } from '@payloadcms/ui/forms/fieldSchemasToFormState'

import type { NodeValidation } from '../../typesServer.js'
import type { BlockFields, SerializedBlockNode } from './nodes/BlocksNode.js'
import type { SerializedInlineBlockNode } from './nodes/InlineBlocksNode.js'

/**
 * Runs validation for blocks. This function will determine if the rich text field itself is valid. It does not handle
 * block field error paths - this is done by the `beforeChangeTraverseFields` call in the `beforeChange` hook, called from the
 * rich text adapter.
 */
export const blockValidationHOC = (
  blocks: Block[],
): NodeValidation<SerializedBlockNode | SerializedInlineBlockNode> => {
  return async ({ node, validation }) => {
    const blockFieldData = node.fields ?? ({} as BlockFields)

    const {
      options: { id, collectionSlug, data, operation, preferences, req },
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
      documentData: data,
      fields: block.fields,
      fieldSchemaMap: undefined,
      initialBlockData: blockFieldData,
      operation: operation === 'create' || operation === 'update' ? operation : 'update',
      permissions: {},
      preferences,
      renderAllFields: false,
      req,
      schemaPath: '',
    })

    const errorPathsSet = new Set<string>()
    for (const fieldKey in result) {
      const fieldState = result[fieldKey]
      if (fieldState?.errorPaths?.length) {
        for (const errorPath of fieldState.errorPaths) {
          errorPathsSet.add(errorPath)
        }
      }
    }
    const errorPaths = Array.from(errorPathsSet)

    if (errorPaths.length) {
      return 'The following fields are invalid: ' + errorPaths.join(', ')
    }

    return true
  }
}
