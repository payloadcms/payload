import type { SerializedLexicalNode } from 'lexical'

import type { SerializedQuoteNode } from '../features/blockquote/server/schema.js'
import type {
  SerializedBlockNode,
  SerializedInlineBlockNode,
} from '../features/blocks/server/schema.js'
import type {
  SerializedTableCellNode,
  SerializedTableNode,
  SerializedTableRowNode,
} from '../features/experimental_table/server/schema.js'
import type { SerializedHeadingNode } from '../features/heading/server/schema.js'
import type { SerializedHorizontalRuleNode } from '../features/horizontalRule/server/schema.js'
import type { SerializedAutoLinkNode, SerializedLinkNode } from '../features/link/server/schema.js'
import type { SerializedListItemNode, SerializedListNode } from '../features/lists/shared/schema.js'
import type { SerializedRelationshipNode } from '../features/relationship/server/schema.js'
import type { SerializedUploadNode } from '../features/upload/server/schema.js'

// The declarations below must stay byte-for-byte aligned with the TS source
// strings Payload appends to `payload-types.ts` — twins live in
// `types/builtInNodes.ts` and per-feature `schema.ts`.

/** @internal Core Lexical types — see @payloadcms/richtext-lexical. */
export type LexicalElementFormat = '' | 'center' | 'end' | 'justify' | 'left' | 'right' | 'start'
export type LexicalElementDirection = ('ltr' | 'rtl') | null

export interface SerializedLexicalElementBase<TChildren> {
  children: TChildren[]
  direction: LexicalElementDirection
  format: LexicalElementFormat
  indent: number
  textFormat?: number
  textStyle?: string
  version: number
}

export type LexicalTextMode = 'normal' | 'segmented' | 'token'

export interface SerializedTextNode {
  detail: number
  format: number
  mode: LexicalTextMode
  style: string
  text: string
  type: 'text'
  version: number
}

export interface SerializedTabNode {
  detail: number
  format: number
  mode: LexicalTextMode
  style: string
  text: string
  type: 'tab'
  version: number
}

export interface SerializedLineBreakNode {
  type: 'linebreak'
  version: number
}

export interface SerializedParagraphNode<TChildren>
  extends SerializedLexicalElementBase<TChildren> {
  textFormat: number
  textStyle: string
  type: 'paragraph'
}

/** Shape of a Lexical `richText` field. */
export interface LexicalRichText<TNode> {
  root: {
    children: TNode[]
    direction: LexicalElementDirection
    format: LexicalElementFormat
    indent: number
    type: 'root'
    version: number
  }
}

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

/** `SerializedEditorState` with nodes narrowed by `type`. No type-casting needed. */
export type TypedEditorState<TNode extends SerializedLexicalNode = SerializedLexicalNode> =
  LexicalRichText<TNode>

/**
 * All node types included by default in a lexical editor. Self-recursive —
 * each element node's `children` is `DefaultNodeTypes` again, no depth limit.
 * To compose your own union including the defaults, see {@link DefaultNodeTypesOf}.
 */
export type DefaultNodeTypes =
  | SerializedAutoLinkNode<DefaultNodeTypes>
  //| SerializedBlockNode // Not included by default
  | SerializedHeadingNode<DefaultNodeTypes>
  | SerializedHorizontalRuleNode
  | SerializedLineBreakNode
  | SerializedLinkNode<DefaultNodeTypes>
  | SerializedListItemNode<DefaultNodeTypes>
  | SerializedListNode<DefaultNodeTypes>
  | SerializedParagraphNode<DefaultNodeTypes>
  | SerializedQuoteNode<DefaultNodeTypes>
  | SerializedRelationshipNode
  | SerializedTabNode
  | SerializedTextNode
  | SerializedUploadNode

/**
 * Default node types, parameterised by the union to use for element children.
 * Use to mix custom nodes with the defaults:
 *
 * ```ts
 * type MyNodes = DefaultNodeTypesOf<MyNodes> | SerializedBlockNode<MyNodes>
 * ```
 */
export type DefaultNodeTypesOf<TNodes extends SerializedLexicalNode> =
  | SerializedAutoLinkNode<TNodes>
  | SerializedHeadingNode<TNodes>
  | SerializedHorizontalRuleNode
  | SerializedLineBreakNode
  | SerializedLinkNode<TNodes>
  | SerializedListItemNode<TNodes>
  | SerializedListNode<TNodes>
  | SerializedParagraphNode<TNodes>
  | SerializedQuoteNode<TNodes>
  | SerializedRelationshipNode
  | SerializedTabNode
  | SerializedTextNode
  | SerializedUploadNode

/**
 * Like `TypedEditorState` but includes all default node types. Pass extra
 * node types as a generic to union them at the top level; for nodes that
 * should also nest inside default containers, use {@link DefaultNodeTypesOf}.
 */
export type DefaultTypedEditorState<
  TAdditionalNodeTypes extends null | SerializedLexicalNode = null,
> = [TAdditionalNodeTypes] extends null
  ? TypedEditorState<DefaultNodeTypes>
  : TypedEditorState<DefaultNodeTypes | NonNullable<TAdditionalNodeTypes>>
