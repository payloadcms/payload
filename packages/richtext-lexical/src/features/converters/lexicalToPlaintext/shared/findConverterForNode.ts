import type { SerializedLexicalNode } from 'lexical'

import type { SerializedBlockNode, SerializedInlineBlockNode } from '../../../../nodeTypes.js'
import type { PlaintextConverter, PlaintextConverters } from '../sync/types.js'

export function findConverterForNode<
  TConverters extends PlaintextConverters,
  TConverter extends PlaintextConverter<any>,
>({
  converters,

  node,
}: {
  converters: TConverters
  node: SerializedLexicalNode
}): TConverter | undefined {
  let converterForNode: TConverter | undefined
  if (node.type === 'block') {
    converterForNode = converters?.blocks?.[
      (node as SerializedBlockNode)?.fields?.blockType
    ] as TConverter
  } else if (node.type === 'inlineBlock') {
    converterForNode = converters?.inlineBlocks?.[
      (node as SerializedInlineBlockNode)?.fields?.blockType
    ] as TConverter
  } else {
    converterForNode = converters[node.type] as TConverter
  }

  return converterForNode
}
