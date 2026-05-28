import type { SerializedLexicalNode } from 'lexical'

import type { SerializedLexicalElementBase } from '../../../types/nodeTypes.js'
import type { JSONSchemaFn } from '../../typesServer.js'

export interface SerializedListItemNode<
  TChildren extends SerializedLexicalNode = SerializedLexicalNode,
> extends SerializedLexicalElementBase<TChildren> {
  checked?: boolean
  type: 'listitem'
  value: number
}

export interface SerializedListNode<TChildren extends SerializedLexicalNode = SerializedLexicalNode>
  extends SerializedLexicalElementBase<TChildren> {
  checked?: boolean
  listType: 'bullet' | 'check' | 'number'
  start: number
  tag: 'ol' | 'ul'
  type: 'list'
}

/** MUST stay byte-for-byte in sync with the runtime `SerializedListNode` declared above. */
const SERIALIZED_LIST_NODE_TS = `export interface SerializedListNode<TChildren> extends SerializedLexicalElementBase<TChildren> {
  type: 'list';
  checked?: boolean;
  listType: 'number' | 'bullet' | 'check';
  start: number;
  tag: 'ul' | 'ol';
}`

/** MUST stay byte-for-byte in sync with the runtime `SerializedListItemNode` declared above. */
const SERIALIZED_LIST_ITEM_NODE_TS = `export interface SerializedListItemNode<TChildren> extends SerializedLexicalElementBase<TChildren> {
  type: 'listitem';
  checked?: boolean;
  value: number;
}`

export const listNodeJSONSchema: JSONSchemaFn = ({
  elementNodeSchema,
  nodeUnionName,
  typeStringDefinitions,
}) => {
  typeStringDefinitions.add(SERIALIZED_LIST_NODE_TS)
  return elementNodeSchema({
    nodeType: 'list',
    properties: {
      checked: { type: 'boolean' },
      listType: { type: 'string', enum: ['number', 'bullet', 'check'] },
      start: { type: 'integer' },
      tag: { type: 'string', enum: ['ul', 'ol'] },
    },
    required: ['listType', 'start', 'tag'],
    tsType: `SerializedListNode<${nodeUnionName}>`,
  })
}

export const listItemNodeJSONSchema: JSONSchemaFn = ({
  elementNodeSchema,
  nodeUnionName,
  typeStringDefinitions,
}) => {
  typeStringDefinitions.add(SERIALIZED_LIST_ITEM_NODE_TS)
  return elementNodeSchema({
    nodeType: 'listitem',
    properties: {
      checked: { type: 'boolean' },
      value: { type: 'integer' },
    },
    required: ['value'],
    tsType: `SerializedListItemNode<${nodeUnionName}>`,
  })
}
