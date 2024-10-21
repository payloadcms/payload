import type { JsonObject } from 'payload'

import type { BlockFields } from '../../../../../../features/blocks/server/nodes/BlocksNode.js'
import type { InlineBlockFields } from '../../../../../../features/blocks/server/nodes/InlineBlocksNode.js'
import type { SerializedBlockNode, SerializedInlineBlockNode } from '../../../../../../nodeTypes.js'
import type { JSXConverters } from '../types.js'

export const BlocksJSXConverter: (args: {
  blocks?: {
    [blockSlug: string]: <TBlockData extends JsonObject>(args: {
      fields: BlockFields<TBlockData>
    }) => React.ReactNode
  }
  inlineBlocks?: {
    [blockSlug: string]: <TBlockData extends JsonObject>(args: {
      fields: InlineBlockFields<TBlockData>
    }) => React.ReactNode
  }
}) => JSXConverters<SerializedBlockNode | SerializedInlineBlockNode> = ({
  blocks,
  inlineBlocks,
}) => ({
  block: ({ node }) => {
    const foundBlock = blocks?.[node.fields.blockType]
    if (!foundBlock) {
      console.error(
        `Lexical => JSX converter: Blocks converter: found ${node.fields.type} block, but no converter is provided`,
      )
      return <p>Unknown block ({node.fields.blockType})</p>
    }

    return foundBlock({ fields: node.fields })
  },
  inlineBlock: ({ node }) => {
    const foundInlineBlock = inlineBlocks?.[node.fields.blockType]
    if (!foundInlineBlock) {
      console.error(
        `Lexical => JSX converter: Blocks converter: found ${node.fields.type} inline block, but no converter is provided`,
      )
      return <span>Unknown inline block ({node.fields.blockType})</span>
    }

    return foundInlineBlock({ fields: node.fields })
  },
})
