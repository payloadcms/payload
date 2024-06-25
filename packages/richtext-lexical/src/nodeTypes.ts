import type {
  SerializedEditorState,
  SerializedElementNode,
  SerializedLexicalNode,
  Spread,
  TextModeType,
} from 'lexical'
export type { SerializedQuoteNode } from './features/blockquote/feature.server.js'
export type { SerializedBlockNode } from './features/blocks/nodes/BlocksNode.js'
export type { SerializedHorizontalRuleNode } from './features/horizontalRule/nodes/HorizontalRuleNode.js'

export type { SerializedAutoLinkNode, SerializedLinkNode } from './features/link/nodes/types.js'

export type { SerializedListItemNode, SerializedListNode } from './features/lists/plugin/index.js'

export type { SerializedRelationshipNode } from './features/relationship/nodes/RelationshipNode.js'

export type { SerializedUploadNode } from './features/upload/nodes/UploadNode.js'

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
    detail: number
    format: number
    mode: TextModeType
    style: string
    text: string
    type: 'text'
  },
  SerializedLexicalNode
>

type RecursiveNodes<T extends SerializedLexicalNode, Depth extends number = 4> = Depth extends 0
  ? T
  : { children?: RecursiveNodes<T, DecrementDepth<Depth>>[] } & T

type DecrementDepth<N extends number> = [0, 0, 1, 2, 3, 4][N]

export type TypedEditorState<T extends SerializedLexicalNode = SerializedLexicalNode> =
  SerializedEditorState<RecursiveNodes<T>>
