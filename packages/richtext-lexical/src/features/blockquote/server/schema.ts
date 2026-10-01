import type { SerializedLexicalNode } from 'lexical'

import type { SerializedLexicalElementBase } from '../../../types/nodeTypes.js'
import type { JSONSchemaFn } from '../../typesServer.js'

export interface SerializedQuoteNode<
  TChildren extends SerializedLexicalNode = SerializedLexicalNode,
> extends SerializedLexicalElementBase<TChildren> {
  type: 'quote'
}

/** MUST stay byte-for-byte in sync with the runtime `SerializedQuoteNode` declared above. */
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
