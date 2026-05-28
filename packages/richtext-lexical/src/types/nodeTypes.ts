import type {
  SerializedLineBreakNode as _SerializedLineBreakNode,
  SerializedTabNode as _SerializedTabNode,
  SerializedTextNode as _SerializedTextNode,
  SerializedEditorState,
  SerializedElementNode,
  SerializedLexicalNode,
} from 'lexical'

import type { SerializedQuoteNode } from '../features/blockquote/server/index.js'
import type { SerializedBlockNode } from '../features/blocks/server/nodes/BlocksNode.js'
import type { SerializedInlineBlockNode } from '../features/blocks/server/nodes/InlineBlocksNode.js'
import type {
  SerializedTableCellNode,
  SerializedTableNode,
  SerializedTableRowNode,
} from '../features/experimental_table/server/index.js'
import type { SerializedHeadingNode } from '../features/heading/server/index.js'
import type { SerializedHorizontalRuleNode } from '../features/horizontalRule/server/nodes/HorizontalRuleNode.js'
import type { SerializedAutoLinkNode, SerializedLinkNode } from '../features/link/nodes/types.js'
import type { SerializedListItemNode, SerializedListNode } from '../features/lists/plugin/index.js'
import type { SerializedRelationshipNode } from '../features/relationship/server/nodes/RelationshipNode.js'
import type { SerializedUploadNode } from '../features/upload/server/nodes/UploadNode.js'

/** Strongly-typed serialized element node with `children` and `type` re-declared. */
export type StronglyTypedElementNode<
  TBase,
  TType extends string,
  TChildren extends SerializedLexicalNode = SerializedLexicalNode,
> = {
  children: TChildren[]
  type: TType
} & Omit<TBase, 'children' | 'type'>

/** Strongly-typed serialized leaf node — no `children`, `type` re-declared. */
export type StronglyTypedLeafNode<TBase, TType extends string> = {
  type: TType
} & Omit<TBase, 'children' | 'type'>

export type {
  SerializedAutoLinkNode,
  SerializedBlockNode,
  SerializedHeadingNode,
  SerializedHorizontalRuleNode,
  SerializedInlineBlockNode,
  SerializedLinkNode,
  SerializedListItemNode,
  SerializedListNode,
  SerializedQuoteNode,
  SerializedRelationshipNode,
  SerializedTableCellNode,
  SerializedTableNode,
  SerializedTableRowNode,
  SerializedUploadNode,
}

export type SerializedParagraphNode<
  TChildren extends SerializedLexicalNode = SerializedLexicalNode,
> = {
  textFormat: number
} & StronglyTypedElementNode<SerializedElementNode, 'paragraph', TChildren>

export type SerializedTextNode = StronglyTypedLeafNode<_SerializedTextNode, 'text'>

export type SerializedTabNode = StronglyTypedLeafNode<_SerializedTabNode, 'tab'>

export type SerializedLineBreakNode = StronglyTypedLeafNode<_SerializedLineBreakNode, 'linebreak'>

/**
 * Recursively adds typed children to nodes up to `TDepth` levels (default 4).
 * Distributive over `TNode`; `TOriginalNode` preserves the full union so
 * nested children accept all node types, not just the parent's.
 *
 * @internal — may change or be removed in a minor release.
 */
export type RecursiveNodes<
  TNode extends SerializedLexicalNode,
  TDepth extends number = 4,
  TOriginalNode extends SerializedLexicalNode = TNode,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
> = TNode extends any
  ? TDepth extends 0
    ? TNode
    : 'children' extends keyof TNode
      ? { children?: RecursiveNodes<TOriginalNode, DecrementDepth<TDepth>, TOriginalNode>[] } & TNode
      : TNode
  : never

/** 4→3, 3→2, 2→1, 1→0, 0→0 */
type DecrementDepth<TN extends number> = [0, 0, 1, 2, 3, 4][TN]

/**
 * `SerializedEditorState` with nodes narrowed by `type`. No type-casting needed.
 */
export type TypedEditorState<TNode extends SerializedLexicalNode = SerializedLexicalNode> = {
  [k: string]: unknown
} & SerializedEditorState<RecursiveNodes<TNode>>

/**
 * All node types included by default in a lexical editor without configuration.
 */
export type DefaultNodeTypes =
  | SerializedAutoLinkNode
  //| SerializedBlockNode // Not included by default
  | SerializedHeadingNode
  | SerializedHorizontalRuleNode
  | SerializedLineBreakNode
  | SerializedLinkNode
  | SerializedListItemNode
  | SerializedListNode
  | SerializedParagraphNode
  | SerializedQuoteNode
  | SerializedRelationshipNode
  | SerializedTabNode
  | SerializedTextNode
  | SerializedUploadNode

/**
 * Like `TypedEditorState` but includes all default node types.
 * You can pass *additional* node types as a generic parameter.
 */
export type DefaultTypedEditorState<
  TAdditionalNodeTypes extends null | SerializedLexicalNode = null,
> = [TAdditionalNodeTypes] extends null
  ? TypedEditorState<DefaultNodeTypes>
  : TypedEditorState<DefaultNodeTypes | NonNullable<TAdditionalNodeTypes>>
