import { buildStateFromSchema } from '@payloadcms/ui/forms/buildStateFromSchema'

import type { NodeValidation } from '../types.js'
import type { BlocksFeatureProps } from './feature.server.js'
import type { BlockFields, SerializedBlockNode } from './nodes/BlocksNode.js'

export const blockValidationHOC = (
  props: BlocksFeatureProps,
): NodeValidation<SerializedBlockNode> => {
  return async ({ node, validation }) => {
    const blockFieldData = node.fields ?? ({} as BlockFields)

    const {
      options: { id, operation, preferences, req },
    } = validation

    // find block
    const block = props.blocks.find((block) => block.slug === blockFieldData.blockType)

    // validate block
    if (!block) {
      return 'Block not found'
    }

    /**
     * Run buildStateFromSchema as that properly validates block and block sub-fields
     */

    const result = await buildStateFromSchema({
      id,
      data: blockFieldData,
      fieldSchema: block.fields,
      operation: operation === 'create' || operation === 'update' ? operation : 'update',
      preferences,
      req,
      siblingData: blockFieldData,
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
