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
    SerializedElementNode<T>
  >
export type SerializedTextNode = Spread<
  {
    children?: never // required so that our typed editor state doesn't automatically add children
    type: 'text'
  },
  _SerializedTextNode
>

export type SerializedTabNode = Spread<
  {
    children?: never // required so that our typed editor state doesn't automatically add children
    type: 'tab'
  },
  _SerializedTabNode
>

export type SerializedLineBreakNode = Spread<
  {
    children?: never // required so that our typed editor state doesn't automatically add children
    type: 'linebreak'
  },
  _SerializedLineBreakNode
>

type RecursiveNodes<T extends SerializedLexicalNode, Depth extends number = 4> = Depth extends 0
  ? T
  : { children?: RecursiveNodes<T, DecrementDepth<Depth>>[] } & T

type DecrementDepth<N extends number> = [0, 0, 1, 2, 3, 4][N]

export type TypedEditorState<T extends SerializedLexicalNode = SerializedLexicalNode> =
  SerializedEditorState<RecursiveNodes<T>>

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

export type DefaultTypedEditorState<T extends SerializedLexicalNode = SerializedLexicalNode> =
  TypedEditorState<DefaultNodeTypes | T>
