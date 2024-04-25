import type { Block } from 'payload/types'

import { buildStateFromSchema } from '@payloadcms/ui/forms/buildStateFromSchema'
import { sanitizeFields } from 'payload/config'

import type { NodeValidation } from '../types.js'
import type { BlocksFeatureProps } from './feature.server.js'
import type { SerializedBlockNode } from './nodes/BlocksNode.js'

export const blockValidationHOC = (
  props: BlocksFeatureProps,
): NodeValidation<SerializedBlockNode> => {
  return async ({ node, validation }) => {
    const blockFieldData = node.fields
    const blocks: Block[] = props.blocks

    const {
      options: {
        id,
        operation,
        preferences,
        req,
        req: {
          payload: { config },
        },
      },
    } = validation

    // Sanitize block's fields here. This is done here and not in the feature, because the payload config is available here
    const validRelationships = config.collections.map((c) => c.slug) || []
    blocks.forEach((block) => {
      block.fields = sanitizeFields({
        config,
        fields: block.fields,
        requireFieldLevelRichTextEditor: true,
        validRelationships,
      })
    })

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
      return 'Block validation failed: ' + errorPaths.join(', ')
    }

    return true
  }
}
