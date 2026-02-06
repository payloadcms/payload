import type {
  SerializedLineBreakNode as _SerializedLineBreakNode,
  SerializedTabNode as _SerializedTabNode,
  SerializedTextNode as _SerializedTextNode,
  SerializedEditorState,
  SerializedElementNode,
  SerializedLexicalNode,
} from 'lexical'

import type { SerializedQuoteNode } from './features/blockquote/server/index.js'
import type { SerializedBlockNode } from './features/blocks/server/nodes/BlocksNode.js'
import type { SerializedInlineBlockNode } from './features/blocks/server/nodes/InlineBlocksNode.js'
import type {
  SerializedTableCellNode,
  SerializedTableNode,
  SerializedTableRowNode,
} from './features/experimental_table/server/index.js'
import type { SerializedHeadingNode } from './features/heading/server/index.js'
import type { SerializedHorizontalRuleNode } from './features/horizontalRule/server/nodes/HorizontalRuleNode.js'
import type { SerializedAutoLinkNode, SerializedLinkNode } from './features/link/nodes/types.js'
import type { SerializedListItemNode, SerializedListNode } from './features/lists/plugin/index.js'
import type { SerializedRelationshipNode } from './features/relationship/server/nodes/RelationshipNode.js'
import type { SerializedUploadNode } from './features/upload/server/nodes/UploadNode.js'

/**
 * Helper type to create strongly typed serialized nodes with flexible children types.
 * Omits 'children' and 'type' from the base node type and redeclares them with proper typing.
 *
 * @param TBase - The base Lexical node type (e.g., _SerializedHeadingNode)
 * @param TType - The node type string (e.g., 'heading')
 * @param TChildren - The type for children (defaults to SerializedLexicalNode)
 */
export type StronglyTypedElementNode<
  TBase,
  TType extends string,
  TChildren extends SerializedLexicalNode = SerializedLexicalNode,
> = {
  children: TChildren[]
  type: TType
} & Omit<TBase, 'children' | 'type'>

/**
 * Helper type to create strongly typed leaf nodes (nodes without children).
 * Omits 'children' and 'type' from the base node type and redeclares 'type' with a literal.
 *
 * @param TBase - The base Lexical node type (e.g., _SerializedTextNode)
 * @param TType - The node type string (e.g., 'text')
 */
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

export type SerializedParagraphNode<T extends SerializedLexicalNode = SerializedLexicalNode> = {
  textFormat: number
} & StronglyTypedElementNode<SerializedElementNode, 'paragraph', T>

export type SerializedTextNode = StronglyTypedLeafNode<_SerializedTextNode, 'text'>

export type SerializedTabNode = StronglyTypedLeafNode<_SerializedTabNode, 'tab'>

export type SerializedLineBreakNode = StronglyTypedLeafNode<_SerializedLineBreakNode, 'linebreak'>

/**
 * Recursively adds typed children to nodes up to a specified depth.
 *
 * Key behaviors:
 * - `T extends any`: Distributive - processes each union member individually
 * - `OriginalUnion`: Preserves full union so nested children accept all node types, not just parent's type. If we just used `T`, the type would be narrowed to the parent's type and the children would only consist of the parent's type.
 * - `'children' extends keyof T`: Only adds children to container nodes; respects leaf nodes that use `Omit<_, 'children'>`
 * - `Depth`: Limits recursion to prevent infinite types (default: 4 levels)
 *
 * @internal - this type may change or be removed in a minor release
 */
export type RecursiveNodes<
  T extends SerializedLexicalNode,
  Depth extends number = 4,
  OriginalUnion extends SerializedLexicalNode = T,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
> = T extends any // Make distributive over unions
  ? Depth extends 0
    ? T
    : 'children' extends keyof T
      ? { children?: RecursiveNodes<OriginalUnion, DecrementDepth<Depth>, OriginalUnion>[] } & T
      : T // Skip leaf nodes
  : never

/** Decrements depth: 4→3, 3→2, 2→1, 1→0, 0→0 */
type DecrementDepth<N extends number> = [0, 0, 1, 2, 3, 4][N]

/**
 * Alternative type to `SerializedEditorState` that automatically types your nodes
 * more strictly, narrowing down nodes based on the `type` without having to manually
 * type-cast.
 */
export type TypedEditorState<T extends SerializedLexicalNode = SerializedLexicalNode> = {
  [k: string]: unknown
} & SerializedEditorState<RecursiveNodes<T>>

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
