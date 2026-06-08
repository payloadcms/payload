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

export interface SerializedParagraphNode<
  TChildren extends SerializedLexicalNode = SerializedLexicalNode,
> extends SerializedLexicalElementBase<TChildren> {
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
 * The node union of a generated `richText` field. Pass the field type — e.g.
 * `RichTextNodes<Post['richText']>` — to type an individual node you build for that editor (for
 * example a single block, or a `.map()` of nodes). To build a whole editor state, prefer passing
 * the field type straight to {@link buildEditorState}.
 */
export type RichTextNodes<TRichText> =
  NonNullable<TRichText> extends LexicalRichText<infer TNode> ? TNode : never

/**
 * All node types included by default in a lexical editor. Self-recursive —
 * each element node's `children` is `DefaultNodeTypes` again, no depth limit.
 * To compose your own union including the defaults, see {@link WithDefaultNodes}.
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
 * The built-in lexical nodes, plus your own - with your nodes threaded into every container's
 * `children`, not just the top level. Pass your custom node(s) as the generic:
 *
 * ```ts
 * type MyNodes = WithDefaultNodes<SerializedBlockNode<MyBlockData>>
 * ```
 *
 * Built by flattening {@link DefaultNodeRegistry} (`Registry[keyof Registry]`); see that interface
 * for why the node set lives in a registry instead of being written as a plain union type.
 */
export type WithDefaultNodes<TCustom extends SerializedLexicalNode = never> =
  DefaultNodeRegistry<TCustom>[keyof DefaultNodeRegistry<TCustom>]

/** @internal Re-types an element node's `children` to the recursive node union. */
type WithRecursiveChildren<TNode, TCustom extends SerializedLexicalNode> = {
  children: WithDefaultNodes<TCustom>[]
} & Omit<TNode, 'children'>

/**
 * @internal The set of default nodes, generic over the user's custom node(s). {@link WithDefaultNodes}
 * flattens it into the node union with `Registry[keyof Registry]`.
 *
 * Why a registry interface instead of writing the union directly? The union has to be self-referential:
 * every element node's `children` is the same node union (so custom nodes nest inside containers too).
 * A generic *type alias* can't reference itself that way - `type N<T> = SerializedParagraphNode<N<T>> | ...`
 * is a `TS2456` circular reference, because instantiating a type alias resolves its type argument
 * eagerly. An *interface* resolves its members lazily, so the self-reference inside `children: ...[]`
 * is allowed - the recursion is legal precisely because it lives inside this interface. Reusing the
 * real node interfaces (re-typing only `children`) keeps each entry in sync with its node's real shape.
 */
interface DefaultNodeRegistry<TCustom extends SerializedLexicalNode> {
  autolink: WithRecursiveChildren<SerializedAutoLinkNode<SerializedLexicalNode>, TCustom>
  custom: TCustom
  heading: WithRecursiveChildren<SerializedHeadingNode<SerializedLexicalNode>, TCustom>
  horizontalrule: SerializedHorizontalRuleNode
  linebreak: SerializedLineBreakNode
  link: WithRecursiveChildren<SerializedLinkNode<SerializedLexicalNode>, TCustom>
  list: WithRecursiveChildren<SerializedListNode<SerializedLexicalNode>, TCustom>
  listitem: WithRecursiveChildren<SerializedListItemNode<SerializedLexicalNode>, TCustom>
  paragraph: WithRecursiveChildren<SerializedParagraphNode<SerializedLexicalNode>, TCustom>
  quote: WithRecursiveChildren<SerializedQuoteNode<SerializedLexicalNode>, TCustom>
  relationship: SerializedRelationshipNode
  tab: SerializedTabNode
  text: SerializedTextNode
  upload: SerializedUploadNode
}

/**
 * Like `TypedEditorState`, but pre-filled with every default node type. Pass extra node types as a
 * generic to add your own; they're threaded into every container's `children` (via
 * {@link WithDefaultNodes}), not just allowed at the top level.
 */
export type DefaultTypedEditorState<
  TAdditionalNodeTypes extends null | SerializedLexicalNode = null,
> = TypedEditorState<WithDefaultNodes<NonNullable<TAdditionalNodeTypes>>>
