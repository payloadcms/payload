import type {
  SerializedTableCellNode as _SerializedTableCellNode,
  SerializedTableNode as _SerializedTableNode,
  SerializedTableRowNode as _SerializedTableRowNode,
} from '@lexical/table'
import type { SerializedLexicalNode } from 'lexical'

import type { StronglyTypedElementNode } from '../../../types/nodeTypes.js'
import type { JSONSchemaFn } from '../../typesServer.js'

export type SerializedTableCellNode<
  TChildren extends SerializedLexicalNode = SerializedLexicalNode,
> = StronglyTypedElementNode<_SerializedTableCellNode, 'tablecell', TChildren>

export type SerializedTableNode<TChildren extends SerializedLexicalNode = SerializedLexicalNode> =
  StronglyTypedElementNode<_SerializedTableNode, 'table', TChildren>

export type SerializedTableRowNode<
  TChildren extends SerializedLexicalNode = SerializedLexicalNode,
> = StronglyTypedElementNode<_SerializedTableRowNode, 'tablerow', TChildren>

const TABLE_NODES_TS = `export interface SerializedTableNode<TChildren> extends SerializedLexicalElementBase<TChildren> {
  type: 'table';
  colWidths?: number[];
  frozenColumnCount?: number;
  frozenRowCount?: number;
  rowStriping?: boolean;
}
export interface SerializedTableRowNode<TChildren> extends SerializedLexicalElementBase<TChildren> {
  type: 'tablerow';
  height?: number;
}
export interface SerializedTableCellNode<TChildren> extends SerializedLexicalElementBase<TChildren> {
  type: 'tablecell';
  backgroundColor?: string | null;
  colSpan?: number;
  headerState: number;
  rowSpan?: number;
  verticalAlign?: string;
  width?: number;
}`

export const tableNodeJSONSchema: JSONSchemaFn = ({
  elementNodeSchema,
  nodeUnionName,
  typeStringDefinitions,
}) => {
  typeStringDefinitions.add(TABLE_NODES_TS)
  return elementNodeSchema({
    nodeType: 'table',
    properties: {
      colWidths: { type: 'array', items: { type: 'number' } },
      frozenColumnCount: { type: 'integer' },
      frozenRowCount: { type: 'integer' },
      rowStriping: { type: 'boolean' },
    },
    tsType: `SerializedTableNode<${nodeUnionName}>`,
  })
}

export const tableCellNodeJSONSchema: JSONSchemaFn = ({
  elementNodeSchema,
  nodeUnionName,
  typeStringDefinitions,
}) => {
  typeStringDefinitions.add(TABLE_NODES_TS)
  return elementNodeSchema({
    nodeType: 'tablecell',
    properties: {
      backgroundColor: { oneOf: [{ type: 'string' }, { type: 'null' }] },
      colSpan: { type: 'integer' },
      headerState: { type: 'integer' },
      rowSpan: { type: 'integer' },
      verticalAlign: { type: 'string' },
      width: { type: 'integer' },
    },
    required: ['headerState'],
    tsType: `SerializedTableCellNode<${nodeUnionName}>`,
  })
}

export const tableRowNodeJSONSchema: JSONSchemaFn = ({
  elementNodeSchema,
  nodeUnionName,
  typeStringDefinitions,
}) => {
  typeStringDefinitions.add(TABLE_NODES_TS)
  return elementNodeSchema({
    nodeType: 'tablerow',
    properties: { height: { type: 'integer' } },
    tsType: `SerializedTableRowNode<${nodeUnionName}>`,
  })
}
