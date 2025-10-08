import type {
  SerializedLineBreakNode as _SerializedLineBreakNode,
  SerializedTabNode as _SerializedTabNode,
  SerializedTextNode as _SerializedTextNode,
  SerializedEditorState,
  SerializedElementNode,
  SerializedLexicalNode,
  Spread,
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

import { buildEditorState } from './utilities/buildEditorState.js'

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

export type SerializedParagraphNode<T extends SerializedLexicalNode = SerializedLexicalNode> =
  Spread<
    {
      textFormat: number
      type: 'paragraph'
    },
    Omit<SerializedElementNode<T>, 'type'>
  >
export type SerializedTextNode = Omit<
  Spread<
    {
      type: 'text'
    },
    Omit<_SerializedTextNode, 'type'>
  >,
  'children'
>

export type SerializedTabNode = Omit<
  Spread<
    {
      type: 'tab'
    },
    Omit<_SerializedTabNode, 'type'>
  >,
  'children'
>

export type SerializedLineBreakNode = Omit<
  Spread<
    {
      type: 'linebreak'
    },
    Omit<_SerializedLineBreakNode, 'type'>
  >,
  'children'
>

/**
 * Recursively adds typed children to nodes up to a specified depth.
 *
 * Key behaviors:
 * - `T extends any`: Distributive - processes each union member individually
 * - `OriginalUnion`: Preserves full union so nested children accept all node types, not just parent's type. If we just used `T`, the type would be narrowed to the parent's type and the children would only consist of the parent's type.
 * - `'children' extends keyof T`: Only adds children to container nodes; respects leaf nodes that use `Omit<_, 'children'>`
 * - `Depth`: Limits recursion to prevent infinite types (default: 4 levels)
 */
type RecursiveNodes<
  T extends SerializedLexicalNode,
  Depth extends number = 4,
  OriginalUnion extends SerializedLexicalNode = T,
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

const a: DefaultNodeTypes = {
  type: 'text',
  detail: 0,
  format: 0,
  mode: 'normal',
  style: '',
  version: 0,
  // Has text type suggestion
}

const b: DefaultTypedEditorState['root']['children'][number] = {
  type: 'text',
  detail: 0,
  format: 0,
  mode: 'normal',
  style: '',
  version: 1,
  // Has text type suggestion
}

const c = buildEditorState({
  nodes: [
    {
      type: 'text',
      detail: 0,
      format: 0,
      mode: 'normal',
      style: '',
      version: 1,
      // Does not have text type suggestion unless I remove version property
    },
  ],
})

const d = buildEditorState<DefaultNodeTypes | SerializedBlockNode>({
  nodes: [
    {
      type: 'text',
      detail: 0,
      format: 0,
      mode: 'normal',
      style: '',
      text: 'hello',
      version: 1,
      // Does not have text type suggestion unless I remove version property
    },
    {
      type: 'block',
      fields: {
        id: 'id',
        blockName: 'Cool block',
        blockType: 'myBlock',
      },
      format: 'left',
      version: 1,
    },
  ],
})
