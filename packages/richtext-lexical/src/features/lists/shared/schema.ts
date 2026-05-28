import type {
  SerializedListItemNode as _SerializedListItemNode,
  SerializedListNode as _SerializedListNode,
} from '@lexical/list'
import type { SerializedLexicalNode } from 'lexical'

import type { StronglyTypedElementNode } from '../../../types/nodeTypes.js'
import type { JSONSchemaFn } from '../../typesServer.js'

export type SerializedListItemNode<
  TChildren extends SerializedLexicalNode = SerializedLexicalNode,
> = {
  checked?: boolean
} & StronglyTypedElementNode<_SerializedListItemNode, 'listitem', TChildren>

export type SerializedListNode<TChildren extends SerializedLexicalNode = SerializedLexicalNode> = {
  checked?: boolean
} & StronglyTypedElementNode<_SerializedListNode, 'list', TChildren>

const SERIALIZED_LIST_NODE_TS = `export interface SerializedListNode<TChildren> extends SerializedLexicalElementBase<TChildren> {
  type: 'list';
  checked?: boolean;
  listType: 'number' | 'bullet' | 'check';
  start: number;
  tag: 'ul' | 'ol';
}`

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
