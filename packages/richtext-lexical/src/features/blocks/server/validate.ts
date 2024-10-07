import type { Block } from 'payload'

import { buildStateFromSchema } from '@payloadcms/ui/forms/buildStateFromSchema'

import type { NodeValidation } from '../../typesServer.js'
import type { SerializedInlineBlockNode } from '../client/nodes/InlineBlocksNode.js'
import type { BlockFields, SerializedBlockNode } from './nodes/BlocksNode.js'

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
      return 'Block not found'
    }

    /**
     * Run buildStateFromSchema as that properly validates block and block sub-fields
     */

    const result = await buildStateFromSchema({
      id,
      collectionSlug,
      data: blockFieldData,
      fieldSchema: block.fields,
      operation: operation === 'create' || operation === 'update' ? operation : 'update',
      preferences,
      req,
      siblingData: blockFieldData,
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
