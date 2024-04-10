import type { Block } from 'payload/types'

import { sanitizeFields } from 'payload/config'

import type { NodeValidation } from '../types.js'
import type { BlocksFeatureProps } from './feature.server.js'
import type { SerializedBlockNode } from './nodes/BlocksNode.js'

export const blockValidationHOC = (
  props: BlocksFeatureProps,
): NodeValidation<SerializedBlockNode> => {
  const blockValidation: NodeValidation<SerializedBlockNode> = async ({ node, validation }) => {
    const blockFieldData = node.fields
    const blocks: Block[] = props.blocks

    const {
      options: {
        req,
        req: {
          payload: { config },
        },
      },
    } = validation

    // Sanitize block's fields here. This is done here and not in the feature, because the payload config is available here
    // TODO: Might need a deepCopy. Does it sanitize already-sanitized blocks?
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

    for (const field of block.fields) {
      if ('validate' in field && typeof field.validate === 'function' && field.validate) {
        const fieldValue = 'name' in field ? node?.fields?.[field.name] : null

        const passesCondition = field.admin?.condition
          ? Boolean(
              field.admin.condition(fieldValue, node.fields, {
                user: req?.user,
              }),
            )
          : true
        if (!passesCondition) {
          continue // Fixes https://github.com/payloadcms/payload/issues/4000
        }

        const validationResult = await field.validate(fieldValue, {
          ...field,
          id: validation.options.id,
          data: fieldValue,
          operation: validation.options.operation,
          req,
          siblingData: validation.options.siblingData,
        })

        if (validationResult !== true) {
          return validationResult
        }
      }
    }

    return true
  }

  return blockValidation
}
