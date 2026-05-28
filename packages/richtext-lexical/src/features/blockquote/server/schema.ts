import type { SerializedQuoteNode as _SerializedQuoteNode } from '@lexical/rich-text'
import type { SerializedLexicalNode } from 'lexical'

import type { StronglyTypedElementNode } from '../../../types/nodeTypes.js'
import type { JSONSchemaFn } from '../../typesServer.js'

export type SerializedQuoteNode<TChildren extends SerializedLexicalNode = SerializedLexicalNode> =
  StronglyTypedElementNode<_SerializedQuoteNode, 'quote', TChildren>

const SERIALIZED_QUOTE_NODE_TS = `export interface SerializedQuoteNode<TChildren> extends SerializedLexicalElementBase<TChildren> {
  type: 'quote';
}`

export const quoteNodeJSONSchema: JSONSchemaFn = ({
  elementNodeSchema,
  nodeUnionName,
  typeStringDefinitions,
}) => {
  typeStringDefinitions.add(SERIALIZED_QUOTE_NODE_TS)
  return elementNodeSchema({
    nodeType: 'quote',
    tsType: `SerializedQuoteNode<${nodeUnionName}>`,
  })
}
