import { type Block, flattenAllFields } from 'payload'

import type { TraverseNodeData } from '../../typesServer.js'
import type { SerializedBlockNode } from './nodes/BlocksNode.js'
import type { SerializedInlineBlockNode } from './nodes/InlineBlocksNode.js'

export const traverseNodeDataHOC = (
  blocks: Block[],
): TraverseNodeData<SerializedBlockNode | SerializedInlineBlockNode> => {
  const traverseNodeData: TraverseNodeData<SerializedBlockNode | SerializedInlineBlockNode> = ({
    node,
    onFields,
  }) => {
    const blockFieldData = node.fields

    // find block used in this node
    const block = blocks.find((block) => block.slug === blockFieldData.blockType)
    if (!block || !block?.fields?.length || !blockFieldData) {
      return
    }

    if (onFields) {
      onFields({ data: blockFieldData, fields: flattenAllFields({ fields: block.fields }) })
    }
  }

  return traverseNodeData
}
